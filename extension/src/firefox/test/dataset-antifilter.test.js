'use strict';

const Assert = require('node:assert/strict');
const Store = require('../background/dataset-store');
const Codec = require('../../shared/domain-block-codec');
const Source = require('../../shared/antifilter-source');
const Settings = require('../background/settings-control');
const Config = require('../background/product-config');
const Promotion = require('../background/dataset-promotion');
const Antifilter = require('../background/antifilter-updater');
const {Dataset, memoryBackend, httpsArtifact, sha256} = require('./dataset-test-helpers');

// Synthetic transport metadata: this tests durable trust binding, not HTTPS.
// Use the real minimum-sized payload so receipt validation is never bypassed.
function fixture(payload, day, sourceHash) {
  const artifactBytes = new TextEncoder().encode(JSON.stringify(payload));
  const updatedAt = `2026-10-${day}T00:00:00.000Z`;
  const source = {schemaVersion: 1, sourceId: Source.SOURCE_ID, sourceUrl: Source.SOURCE_URL,
    sourceSha256: sourceHash, sourceBytes: 30000000, updatedAt, checkedAt: updatedAt,
    ruleCount: payload.ruleCount, lines: payload.ruleCount, excludedRows: 0,
    policy: 'STRICT',
    rejections: {INVALID_DNS_HOSTNAME: 0, NON_HOST_SYNTAX: 0, IP_OR_PUBLIC_SUFFIX: 0}};
  return {artifactBytes, source, envelope: {schemaVersion: 2, providerKey: 'antifilter',
    datasetVersion: `source-${updatedAt.replace(/\D/g, '')}-${sourceHash}`, generatedAt: updatedAt,
    sourceRevisions: [{sourceId: Source.SOURCE_ID, revision: `sha256=${sourceHash}`}],
    ruleCount: payload.ruleCount, artifactByteCount: artifactBytes.byteLength,
    artifactSha256: sha256(artifactBytes), routeTableVersion: 1}};
}

function promotion(staged, currentDatasetIdentity = null) {
  return {providerKey: 'antifilter', channel: 'HTTPS', currentDatasetIdentity,
    stagedArtifactSha256: staged.verification.dataset.identity.artifactSha256,
    stagedSequence: staged.sequence, source: staged.source};
}

describe('Firefox independent Antifilter source lifecycle', function() {
  let first;
  let second;
  before(function() {
    const encoder = Codec.createEncoder();
    for (let index = 0; index < 1500000; index++) {
      encoder.addReversed('elpmaxe.' + String(index).padStart(7, '0'));
    }
    const payload = encoder.finish();
    first = fixture(payload, '29', 'a'.repeat(64));
    const changed = structuredClone(payload);
    // Change only the final host, preserving global sort order and rule count.
    changed.blocks[changed.blocks.length - 1] = changed.blocks.at(-1).slice(0, -1) + 'a';
    Codec.validate(changed);
    second = fixture(changed, '30', 'b'.repeat(64));
  });

  it('stages the first receipt without a fake baseline, then promotes exact identities and retains recovery', async function() {
    const backend = memoryBackend();
    let store = Store.createStore({backend, sha256});
    const staged = await store.stageHttpsCandidate(first);
    Assert.equal(staged.status, 'STAGED');
    Assert.equal(staged.verification.trust, Dataset.TRUST.REMOTE_HTTPS_VALIDATED);
    let saved = await store.loadVerifications('antifilter');
    Assert.equal(saved.active, null);
    Assert.equal(saved.packagedBaseline, null);
    Assert.deepEqual((await store.loadStaged('antifilter')).source, first.source);
    const request = promotion(staged);
    const incompleteSource = {sourceId: first.source.sourceId,
      sourceSha256: first.source.sourceSha256, updatedAt: first.source.updatedAt};
    Assert.equal((await store.promoteStagedExact(Object.assign({}, request,
        {source: incompleteSource}))).code, 'PROMOTION_STATE_MISMATCH');
    Assert.equal((await store.promoteStagedExact(Object.assign({}, request,
        {stagedSequence: 2}))).ok, false);
    Assert.equal((await Antifilter.publishFirstCandidate(store)).status, 'PREPARED');
    store = Store.createStore({backend, sha256});
    saved = await store.loadVerifications('antifilter');
    const oldIdentity = saved.active.dataset.identity;
    Assert.equal(oldIdentity.artifactSha256, first.envelope.artifactSha256);
    Assert.equal(saved.packagedBaseline, null);
    Assert.deepEqual(saved.active.source, first.source);
    const next = await store.stageHttpsCandidate(second);
    Assert.equal(next.status, 'STAGED');
    Assert.equal((await store.promoteStagedExact(promotion(next))).code, 'CURRENT_DATASET_UNAVAILABLE');
    Assert.equal((await store.promoteStagedExact(promotion(next, oldIdentity))).status, 'PROMOTED');
    saved = await store.loadVerifications('antifilter');
    Assert.equal(saved.active.dataset.identity.artifactSha256, second.envelope.artifactSha256);
    Assert.equal(saved.previousLkg.dataset.identity.artifactSha256, first.envelope.artifactSha256);
    Assert.equal(saved.packagedBaseline, null);
    const commits = backend.commits.length;
    Assert.equal((await store.stageHttpsCandidate(first)).ok, false);
    Assert.equal(backend.commits.length, commits);
    // Provider identity remains isolated from Anticensority's pointers.
    Assert.equal((await store.loadVerifications('anticensority')).active, null);
  });

  it('matches every persisted Antifilter receipt field rather than only the old PAC receipt', function() {
    const pointers = {httpsState: {sequence: 1, artifactSha256: first.envelope.artifactSha256,
      source: first.source}};
    const matches = (source) => Store.matchesCandidateState(pointers, 'HTTPS', 1,
        first.envelope.artifactSha256, source);
    Assert.equal(matches(structuredClone(first.source)), true);
    for (const change of [
      {checkedAt: '2026-10-30T00:00:00.000Z'}, {sourceBytes: first.source.sourceBytes + 1},
      {lines: first.source.lines + 1}, {policy: 'QUARANTINE_INVALID_V1'},
      {sourceUrl: Source.SOURCE_URL + '?changed'},
    ]) Assert.equal(matches(Object.assign({}, first.source, change)), false);
  });

  it('cooks only explicitly authorized proxies from an immutable verified Chromium data artifact', async function() {
    const {loadBackgroundModules} = require('../../chromium/test/background-modules');
    const vm = require('node:vm');
    loadBackgroundModules();
    const input = {envelope: first.envelope,
      artifactBytes: first.artifactBytes, receipt: first.source};
    const verified = await Source.verifyCandidate(input, sha256);
    const text = Source.serializeCandidate(verified);
    const decoded = await Source.deserializeCandidate(text, sha256);
    Assert.deepEqual(decoded.candidate.receipt, first.source);
    const cook = (mods) => global.mv3PacCook.cookPac({rawPacData: text, provider: {key: 'antifilter'},
      sourceRawPacSha256: sha256(text), pacMods: mods});
    const own = {enabled: true, type: 'HTTPS', host: 'proxy.example', port: 8443,
      username: 'private-user', password: 'private-password'};
    Assert.equal((await cook({ownProxies: [own]})).error.code, 'ANTIFILTER_PROXY_REQUIRED');
    const mods = {ownProxies: [own], useProxyRulesForAntifilter: true,
      rules: [{pattern: '0000001.example', action: 'DIRECT', enabled: true}]};
    const cooked = await cook(mods);
    Assert.equal(cooked.ok, true, JSON.stringify(cooked.error));
    Assert.equal(cooked.cookedPacData.includes('private-'), false);
    const context = {};
    vm.runInNewContext(cooked.cookedPacData, context);
    for (const [host, expected] of [['0000000.example', 'HTTPS proxy.example:8443'],
      ['child.0000000.example', 'DIRECT'], ['unlisted.example', 'DIRECT'], ['0000001.example', 'DIRECT']]) {
      const route = context.FindProxyForURL;
      Assert.equal(route('https://' + host + '/', host), expected);
    }
    const changed = await cook(Object.assign({}, mods,
        {ownProxies: [Object.assign({}, own, {port: 9443})]}));
    Assert.notEqual(changed.cookedPacSha256, cooked.cookedPacSha256);
    Assert.notEqual(changed.pacModsSha256, cooked.pacModsSha256);
    const damaged = JSON.parse(text);
    damaged.receipt.sourceUrl += '?unexpected';
    await Assert.rejects(Source.deserializeCandidate(JSON.stringify(damaged), sha256));
    damaged.receipt = first.source;
    damaged.artifact = damaged.artifact.replace('elpmaxe', 'elpmaye');
    await Assert.rejects(Source.deserializeCandidate(JSON.stringify(damaged), sha256));
  });

  it('promotes Antifilter data through the recovery journal while retaining the saved route and credentials', async function() {
    const store = Store.createStore({backend: memoryBackend(), sha256});
    const initial = await store.stageHttpsCandidate(first);
    await store.promoteStagedExact(promotion(initial));
    await store.stageHttpsCandidate(second);
    const settings = Settings.createDefaultSettings();
    settings.source = 'antifilter';
    settings.flags.useProxyRulesForAntifilter = true;
    settings.localTor.useForProxyRules = true;
    const built = Settings.buildRoutingSnapshot(settings);
    const config = await Config.createProductConfig({configurationKey: 'test', configurationVersion: '1',
      datasetIdentity: initial.verification.dataset.identity, providerKey: 'antifilter',
      routingConfig: built.routingConfig, sha256});
    const values = {[Config.CONFIG_STORAGE_KEY]: config,
      [Config.CREDENTIALS_STORAGE_KEY]: {schemaVersion: 1,
        routingDescriptor: config.routingDescriptor, entries: []}};
    const credentials = structuredClone(values[Config.CREDENTIALS_STORAGE_KEY]);
    let journal;
    const storageArea = {async get(keys) {
      return Object.fromEntries((Array.isArray(keys) ? keys : [keys]).filter((key) => key in values)
          .map((key) => [key, structuredClone(values[key])]));
    }, async set(patch) {
      if (patch[Config.DATASET_PROMOTION_STORAGE_KEY]) {
        journal = structuredClone(patch[Config.DATASET_PROMOTION_STORAGE_KEY]);
      }
      Object.assign(values, structuredClone(patch));
    }, async remove(key) {
      delete values[key];
    }};
    const controller = Promotion.createController({storageArea, datasetStore: store, sha256,
      providerKey: 'antifilter', activationSnapshot: () => ({active: false, durableIntent: 'OFF', runtimeState: 'OFF'})});
    Assert.equal((await controller.install()).status, 'INSTALLED');
    Assert.deepEqual(journal.source, second.source);
    Assert.equal(values[Config.CONFIG_STORAGE_KEY].datasetIdentity.artifactSha256,
        second.envelope.artifactSha256);
    Assert.deepEqual(values[Config.CONFIG_STORAGE_KEY].routingDescriptor, config.routingDescriptor);
    Assert.deepEqual(values[Config.CREDENTIALS_STORAGE_KEY], credentials);
    // Simulate interruption after pointer/config publication but before journal removal.
    values[Config.DATASET_PROMOTION_STORAGE_KEY] = journal;
    Assert.equal((await controller.initialize()).ok, true);
    values[Config.DATASET_PROMOTION_STORAGE_KEY] = structuredClone(journal);
    values[Config.DATASET_PROMOTION_STORAGE_KEY].source.sourceBytes++;
    Assert.equal((await controller.initialize()).ok, false);
  });

  it('requires the full fixed-source receipt, rejects mislabeled sources and keeps the old baseline requirement', async function() {
    const backend = memoryBackend();
    const store = Store.createStore({backend, sha256});
    for (const source of [
      {sourceId: Source.SOURCE_ID, sourceSha256: first.source.sourceSha256,
        updatedAt: first.source.updatedAt},
      Object.assign({}, first.source, {sourceUrl: Source.SOURCE_URL + '?changed'}),
      Object.assign({}, first.source, {ruleCount: 1499999}),
      Object.assign({}, first.source, {excludedRows: 1}),
    ]) {
      Assert.equal((await store.stageHttpsCandidate(Object.assign({}, first, {source}))).ok, false);
    }
    Assert.equal((await store.stageHttpsCandidate(Object.assign({}, first, {
      envelope: Object.assign({}, first.envelope, {providerKey: 'anticensority'}),
    }))).ok, false);
    Assert.equal((await store.stageHttpsCandidate(httpsArtifact())).code, 'HTTPS_BASELINE_REQUIRED');
    Assert.equal(backend.commits.length, 0);
  });

  it('preserves the first source and staged pointer when a replacement transaction aborts', async function() {
    const backend = memoryBackend();
    const store = Store.createStore({backend, sha256});
    const staged = await store.stageHttpsCandidate(first);
    await store.promoteStagedExact(promotion(staged));
    const original = structuredClone(backend.pointers.get('antifilter'));
    backend.commit = async () => {
      throw new Error('synthetic transaction abort');
    };
    await Assert.rejects(store.stageHttpsCandidate(second), /synthetic transaction abort/);
    Assert.deepEqual(backend.pointers.get('antifilter'), original);
    Assert.equal(backend.artifacts.size, 1);
    const restored = await Store.createStore({backend, sha256}).loadVerifications('antifilter');
    Assert.equal(restored.active.dataset.identity.artifactSha256, first.envelope.artifactSha256);
    Assert.deepEqual(restored.active.source, first.source);
  });
});
