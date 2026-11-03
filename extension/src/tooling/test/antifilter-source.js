'use strict';

const Assert = require('node:assert/strict');
const Crypto = require('node:crypto');
const Source = require('../../shared/antifilter-source');
const NOW = Date.parse('2026-10-29T12:00:00.000Z');
const UPDATED = '2026-10-29T11:40:00.000Z';
const sha256 = bytes => Crypto.createHash('sha256').update(bytes).digest('hex');
const BYTES = new TextEncoder().encode('example.com\n');

function metadata(overrides = {}) {
  const receipt = Object.assign({schemaVersion: 1, sourceId: Source.SOURCE_ID,
    sourceUrl: Source.SOURCE_URL, sourceSha256: 'a'.repeat(64), sourceBytes: 34000000,
    updatedAt: UPDATED, checkedAt: new Date(NOW).toISOString(), ruleCount: 1760000,
    lines: 1760100, excludedRows: 34, policy: 'QUARANTINE_INVALID_V1',
    rejections: {INVALID_DNS_HOSTNAME: 13, NON_HOST_SYNTAX: 12, IP_OR_PUBLIC_SUFFIX: 9}}, overrides);
  return {receipt, envelope: {schemaVersion: 2, providerKey: 'antifilter',
    datasetVersion: `source-${receipt.updatedAt.replace(/\D/g, '')}-${receipt.sourceSha256}`,
    generatedAt: receipt.updatedAt, sourceRevisions: [{sourceId: Source.SOURCE_ID,
      revision: `sha256=${receipt.sourceSha256}`}], ruleCount: receipt.ruleCount,
    artifactByteCount: 15000000, artifactSha256: 'b'.repeat(64), routeTableVersion: 1}};
}

function harness(options = {}) {
  const state = {reads: 0, cancel: 0, begin: 0, release: 0, stage: 0};
  const headers = new Map(Object.entries(Object.assign({
    'last-modified': 'Thu, 29 Oct 2026 11:40:00 GMT', 'content-length': String(BYTES.length),
  }, options.headers)));
  const reader = {
    async read() {
      state.reads++;
      if (options.hangBody) return new Promise(() => {});
      return state.reads === 1 ? {value: options.chunk || BYTES, done: false} : {done: true};
    },
    async cancel() {state.cancel++;}, releaseLock() {},
  };
  const response = Object.assign({url: Source.SOURCE_URL, status: 200,
    headers: {get: name => headers.has(name) ? headers.get(name) : null},
    body: {getReader: () => reader, cancel: () => reader.cancel()}}, options.response);
  const session = {floor: options.floor || null, async release() {state.release++;},
    async cleanup() {}, async stage(candidate, signal) {
      Assert.equal(signal.aborted, false);
      state.stage++; state.candidate = candidate;
      if (options.stageError) throw Object.assign(new Error(), {code: options.stageError});
      return {unchanged: false};
    }};
  const updater = Source.createUpdater({
    now: () => NOW, timeoutMs: options.timeoutMs || 1000, sha256,
    store: {async begin() {state.begin++; return session;}},
    async fetchImpl(url, args) {
      Assert.equal(url, Source.SOURCE_URL);
      Assert.equal(args.redirect, 'manual'); Assert.equal(args.credentials, 'omit');
      Assert.equal(args.referrerPolicy, 'no-referrer'); Assert.equal(args.cache, 'no-store');
      state.signal = args.signal;
      if (options.hangFetch) return new Promise(() => {});
      if (options.fetchError) throw new Error('Sensitive response detail must not escape');
      return response;
    },
    // Transport-boundary double only. Real import/store validation is covered
    // by codec tests and full-source browser QA; this is deliberately not a dataset.
    async importStream(chunks, store, config) {
      for await (const chunk of chunks) Assert.ok(chunk instanceof Uint8Array);
      state.mode = config.mode; state.previousRules = config.previousRules;
      return {payload: {transportTestOnly: true}, assessment: {accepted: !options.blocked},
        stats: {ruleCount: 1760000, lines: 1760100, rejectedLines: 0, rejected: {}}};
    },
  });
  return {state, updater};
}

describe('Antifilter HTTPS download and source receipts', function() {
  it('binds source metadata, exclusions and compact identity without asserting a signature', function() {
    const good = metadata();
    Assert.equal(Source.validateBinding(good.envelope, good.receipt).excludedRows, 34);
    for (const overrides of [{sourceUrl: Source.SOURCE_URL + '?token=x'}, {sourceId: 'anticensority-pac'},
      {sourceBytes: Source.LIMITS.sourceBytes + 1}, {policy: 'STRICT'}, {ruleCount: 1499999},
      {excludedRows: 35}, {rejections: {INVALID_DNS_HOSTNAME: 34}}, {updatedAt: 'invalid'}]) {
      Assert.throws(() => Source.validateReceipt(Object.assign({}, good.receipt, overrides)));
    }
    Assert.throws(() => Source.validateBinding(Object.assign({}, good.envelope,
      {providerKey: 'anticensority'}), good.receipt));
    Assert.throws(() => Source.validateBinding(Object.assign({}, good.envelope,
      {sourceRevisions: [{sourceId: Source.SOURCE_ID, revision: 'sha256=' + 'c'.repeat(64)}]}),
    good.receipt));
  });

  it('rejects rollback, timestamp conflicts, reinterpretation and large rule loss', function() {
    const old = metadata({updatedAt: '2026-10-28T11:40:00.000Z', checkedAt: '2026-10-28T12:00:00.000Z'});
    Assert.doesNotThrow(() => Source.checkContinuity(metadata({sourceSha256: 'c'.repeat(64)}), old));
    Assert.doesNotThrow(() => Source.checkContinuity(old, old));
    for (const receipt of [
      {updatedAt: '2026-10-27T00:00:00.000Z'},
      {updatedAt: old.receipt.updatedAt, sourceSha256: 'c'.repeat(64)},
      {updatedAt: UPDATED},
      {updatedAt: UPDATED, sourceSha256: 'c'.repeat(64), ruleCount: 1500000},
    ]) Assert.throws(() => Source.checkContinuity(metadata(receipt), old));
    const conflicting = metadata(Object.assign({}, old.receipt));
    conflicting.envelope.artifactSha256 = 'd'.repeat(64);
    Assert.throws(() => Source.checkContinuity(conflicting, old), /ANTIFILTER_SOURCE_CONFLICT/);
  });

  it('hashes bounded bytes and stages without changing any active state', async function() {
    const {state, updater} = harness();
    const result = await updater.fetchAndStage();
    Assert.equal(result.ok, true, result.code);
    Assert.equal(state.mode, 'STRICT');
    Assert.equal(result.status, 'PREPARED_INACTIVE');
    Assert.equal(result.activationEligible, false);
    Assert.equal(result.receipt.sourceSha256, sha256(BYTES));
    Assert.equal(result.receipt.sourceBytes, BYTES.length);
    Assert.equal(state.stage, 1); Assert.equal(state.release, 1);
    Assert.equal(state.signal.aborted, true);
    Assert.equal(state.candidate.envelope.artifactSha256, sha256(state.candidate.artifactBytes));
  });

  it('requires explicit quarantine and passes prior rule count to the importer', async function() {
    const floor = metadata({updatedAt: '2026-10-28T11:40:00.000Z',
      checkedAt: '2026-10-28T12:00:00.000Z'});
    const {state, updater} = harness({floor});
    const result = await updater.fetchAndStage({mode: 'QUARANTINE_INVALID_V1'});
    Assert.equal(result.ok, true, result.code);
    Assert.equal(state.mode, 'QUARANTINE_INVALID_V1');
    Assert.equal(state.previousRules, floor.receipt.ruleCount);
  });

  it('rejects redirects, alternate URLs, status, size and date before accepting data', async function() {
    const cases = [
      {response: {status: 302}}, {response: {status: 304}}, {response: {redirected: true}},
      {response: {type: 'opaqueredirect', url: ''}},
      {response: {url: 'https://untrusted.example/list'}},
      {response: {url: 'https://user:password@antifilter.download/list/domains.lst'}},
      {headers: {'content-length': String(Source.LIMITS.sourceBytes + 1)}},
      {headers: {'content-length': 'invalid'}}, {headers: {'last-modified': null}},
      {headers: {'last-modified': 'Sat, 31 Oct 2026 12:00:00 GMT'}},
      {headers: {'last-modified': 'Thu, 01 Oct 2026 12:00:00 GMT'}},
    ];
    for (const options of cases) {
      const {state, updater} = harness(options);
      const result = await updater.fetchAndStage();
      Assert.equal(result.ok, false);
      Assert.equal(state.reads, 0); Assert.equal(state.stage, 0); Assert.equal(state.release, 1);
      Assert.doesNotMatch(JSON.stringify(result), /password|untrusted\.example/);
    }
  });

  it('catches truncated, oversized, blocked and storage-failed preparations', async function() {
    for (const options of [{headers: {'content-length': String(BYTES.length + 1)}},
      {chunk: new Uint8Array(Source.LIMITS.sourceBytes + 1)}, {blocked: true},
      {fetchError: true}, {stageError: 'ANTIFILTER_STORE_FAILED'}]) {
      const {state, updater} = harness(options);
      const result = await updater.fetchAndStage();
      Assert.equal(result.ok, false); Assert.equal(state.release, 1);
      Assert.doesNotMatch(JSON.stringify(result), /Sensitive/);
    }
  });

  it('bounds fetch/body hangs and observes cancellation without staging', async function() {
    for (const options of [{hangFetch: true}, {hangBody: true}]) {
      const {state, updater} = harness(Object.assign({timeoutMs: 10}, options));
      const result = await updater.fetchAndStage();
      Assert.equal(result.code, 'ANTIFILTER_TIMEOUT');
      Assert.equal(state.stage, 0); Assert.equal(state.release, 1);
    }
    const controller = new AbortController(); controller.abort();
    const {state, updater} = harness();
    Assert.equal((await updater.fetchAndStage({signal: controller.signal})).code, 'ANTIFILTER_CANCELLED');
    Assert.equal(state.begin, 0);
    Assert.equal((await updater.fetchAndStage({mode: 'UNKNOWN'})).code, 'ANTIFILTER_POLICY_INVALID');
  });
});
