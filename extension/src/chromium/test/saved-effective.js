'use strict';

const Assert = require('node:assert/strict');
const Vm = require('node:vm');
const {createRuntimeHarness, CHANGED_RAW_PAC} = require('./runtime-performance-harness');

function proxy(password = 'synthetic-A') {

  return {enabled: true, type: 'HTTPS', host: 'proxy.example', port: 8443,
    username: 'synthetic-user', password, useAsDirectReplacement: false};

}

async function active() {

  const h = await createRuntimeHarness({pacMods: {ownProxies: [proxy()]}});
  Assert.equal((await h.audit.applyCookedPacAndPersist({})).ok, true);
  return h;

}

async function save(h, patch = {}) {

  const saved = await h.callRpc('getPacMods');
  await h.callRpc('setPacMods', {pacMods: Object.assign(saved, {ownProxies: [proxy('synthetic-B')]}, patch)});
  return h.getState().savedRevision;

}

function challenge(h, requestId, host = 'proxy.example') {

  return new Promise((resolve) => h.events.webAuth.dispatch({
    requestId, isProxy: true, challenger: {host, port: 8443},
  }, resolve));

}

function start(h, requestId) {

  h.events.webBeforeRequest.dispatch({requestId, url: 'https://synthetic.example/'});

}

async function effective(h) {

  return h.context.mv3Effective.current();

}

describe('Chromium Saved and Effective generations', function() {
  it('imports Antizapret as data and applies only the displayed Saved revision', async function() {
    const h = await active();
    const before = await effective(h);
    const downloads = h.counts.pacDownloads;
    const writes = h.counts.proxySettingsWrites;
    const text = [
      '// ProstoVPN.AntiZapret PAC-host File',
      'domains = {"test":{3:3}};',
      'var d_ipaddr = "1".split(" ");',
      'var special = [["192.0.2.0", "255.255.255.0"]];',
      'var domains_lzp = "bad";',
      'var mask_lzp = "!==";',
      'var patterns = {\'!A\': \'foo\'};',
      'var patterns = {\'AA\': \'!\'};',
      '  fbtw = ["known.test"];',
      'if (/\\.(co)\\.[^.]+$/.test(host)) {}',
      'throw new Error("synthetic input code");',
    ].join('\n');
    const imported = await h.callRpc('importLocalAntizapret', {
      text, expectedRevision: h.getState().savedRevision,
    });
    const saved = h.getState();
    Assert.equal(saved.currentPacProviderKey, 'antizapret-local');
    Assert.ok(saved.localAntizapretCache.artifactRef);
    Assert.equal((await effective(h)).id, before.id);
    Assert.equal(h.counts.proxySettingsWrites, writes);
    Assert.equal(h.counts.pacDownloads, downloads);
    Assert.equal((await h.callRpc('checkRoutingSource', {providerKey: 'antizapret-local'})).code, 'manual');
    const invalid = await h.callRpcRaw('importLocalAntizapret', {
      text: '<html>Forbidden</html>', expectedRevision: imported.savedRevision,
    });
    Assert.equal(invalid.error.code, 'ANTIZAPRET_INVALID_PAC');
    Assert.equal(h.getState().savedRevision, imported.savedRevision);
    const applied = await h.callRpc('applySavedConfiguration', {
      expectedRevision: imported.savedRevision, expectedEffectiveId: before.id,
    });
    Assert.equal(applied.ok, true);
    const next = await effective(h);
    Assert.equal(next.pacCache.artifactRef, saved.localAntizapretCache.artifactRef);
    const cooked = h.getProxyDetails().value.pacScript.data;
    Assert.doesNotMatch(cooked, /input code|known\.test|synthetic-A/);
    const pac = Vm.createContext({});
    Vm.runInContext(cooked, pac);
    const route = pac.FindProxyForURL;
    Assert.equal(route('https://ordinary.example/', 'ordinary.example'), 'HTTPS proxy.example:8443');
    Assert.equal(route('https://192.0.2.10/', '192.0.2.10'), 'HTTPS proxy.example:8443');
    Assert.equal(route('https://198.51.100.1/', '198.51.100.1'), 'DIRECT');
    const popup = await h.callRpc('getPopupState', {tabUrl: ''});
    Assert.equal(popup.routingData.source, 'antizapret-local');
    Assert.equal(popup.routingData.canCheck, false);
    start(h, 'imported-pac');
    Assert.equal((await challenge(h, 'imported-pac')).authCredentials.password, 'synthetic-A');
  });

  it('popup routing update uses Effective source and credentials without applying pending Saved', async function() {
    const h = await active();
    const before = await effective(h);
    await save(h);
    await h.callRpc('setCurrentPacProvider', {providerKey: 'Антицензорити'});
    const revision = h.getState().savedRevision;
    h.setDownloadResult(h.createDownloadResult(CHANGED_RAW_PAC));
    const downloads = h.counts.pacDownloads;
    const results = await Promise.all([h.callRpc('refreshRoutingData'), h.callRpc('refreshRoutingData')]);
    Assert.equal(results[0].status, 'APPLIED');
    Assert.equal(results[1].status, 'APPLIED');
    Assert.equal(h.counts.pacDownloads, downloads + 1);
    const after = await effective(h);
    Assert.equal(after.config.currentPacProviderKey, before.config.currentPacProviderKey);
    Assert.equal(h.getState().savedRevision, revision);
    Assert.equal(h.getState().currentPacProviderKey, 'Антицензорити');
    start(h, 'popup-update');
    Assert.equal((await challenge(h, 'popup-update')).authCredentials.password, 'synthetic-A');
    Assert.equal(h.counts.proxySettingsClears, 0);
    const popup = await h.callRpc('getPopupState', {tabUrl: ''});
    Assert.equal(popup.routingData.source, 'antizapret');
    Assert.equal(popup.configuration.pending, true);
    Assert.doesNotMatch(JSON.stringify(popup.routingData), /synthetic|password|url|proxy\.example/);
  });

  it('popup routing update stays OFF and reports failed downloads without discarding Effective', async function() {
    const h = await active();
    const before = await effective(h);
    h.setDownloadResult({ok: false, status: 'error', error: {code: 'PAC_DOWNLOAD_FAILED',
      message: 'synthetic-private-query'}});
    Assert.equal((await h.callRpc('refreshRoutingData')).status, 'FAILED');
    Assert.equal((await effective(h)).id, before.id);
    await h.callRpc('clearProxy');
    h.setDownloadResult(h.createDownloadResult(CHANGED_RAW_PAC));
    const sets = h.counts.proxySettingsWrites;
    Assert.equal((await h.callRpc('refreshRoutingData')).status, 'PREPARED');
    Assert.equal(h.counts.proxySettingsWrites, sets);
    Assert.equal((await h.callRpc('getConfigurationStatus')).active, false);
    await h.callRpc('setCurrentPacProvider', {providerKey: 'onlyOwnSites'});
    const downloads = h.counts.pacDownloads;
    Assert.equal((await h.callRpc('refreshRoutingData')).status, 'UNAVAILABLE');
    Assert.equal(h.counts.pacDownloads, downloads);
  });

  it('projects clean and pending categories independently of storage object-key order', async function() {

    const h = await active();
    const storage = h.getLocalStorage();
    const store = storage[h.context.mv3Effective.STORAGE_KEY];
    for (const record of store.records) {
      record.config = JSON.parse(JSON.stringify(record.config, (_key, item) =>
        item && typeof item === 'object' && !Array.isArray(item) ?
          Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item));
    }
    const resumed = await createRuntimeHarness({initialLocalStorage: storage,
      pacMods: h.getState().pacMods, initialProxyDetails: h.getProxyDetails()});
    Assert.equal((await resumed.callRpc('getConfigurationStatus')).pending, false);
    const mods = await resumed.callRpc('getPacMods');
    mods.rules.push({pattern: 'new.example', action: 'DIRECT', enabled: true});
    await resumed.callRpc('setPacMods', {pacMods: mods});
    Assert.deepEqual(Array.from((await resumed.callRpc('getConfigurationStatus')).pendingCategories), ['siteRules']);

  });

  it('projects credential-only pending changes without credential material', async function() {

    const h = await active();
    const before = await h.callRpc('getConfigurationStatus');
    Assert.equal(before.pending, false);
    await save(h);
    const status = await h.callRpc('getConfigurationStatus');
    Assert.equal(status.active, true);
    Assert.equal(status.pending, true);
    Assert.equal(status.effectiveId, before.effectiveId);
    Assert.ok(status.pendingCategories.includes('proxyConnections'));
    Assert.doesNotMatch(JSON.stringify(status), /synthetic-|proxy\.example|username|password/);

  });

  it('serializes two UI Saves from one revision and rejects the second', async function() {

    const h = await active();
    const status = await h.callRpc('getConfigurationStatus');
    const mods = await h.callRpc('getPacMods');
    const results = await Promise.all([false, true].map((noDirect) => h.callRpcRaw('setPacMods', {
      expectedRevision: status.savedRevision,
      pacMods: Object.assign({}, mods, {ownProxies: [proxy('changed')], noDirect}),
    })));
    Assert.equal(results.filter((value) => value.ok).length, 1);
    Assert.equal(results.find((value) => !value.ok).error.code, 'SAVED_REVISION_CHANGED');
    Assert.equal((await effective(h)).id, status.effectiveId);

  });

  it('rejects stale Options Apply without promoting latest Saved', async function() {

    const h = await active();
    const status = await h.callRpc('getConfigurationStatus');
    await save(h);
    const result = await h.callRpcRaw('applySavedConfiguration', {
      expectedRevision: status.savedRevision, expectedEffectiveId: status.effectiveId,
    });
    Assert.equal(result.error.code, 'SAVED_REVISION_CHANGED');
    Assert.equal((await effective(h)).id, status.effectiveId);

  });

  it('requires explicit popup confirmation before saving or applying pending settings', async function() {

    const h = await active();
    await save(h);
    const status = await h.callRpc('getConfigurationStatus');
    const result = await h.callRpcRaw('applySiteConfiguration', {
      expectedRevision: status.savedRevision, expectedEffectiveId: status.effectiveId,
      tabUrl: 'https://sub.example.com/', mode: 'direct', scope: 'domain', applyAll: false,
    });
    Assert.equal(result.error.code, 'PENDING_CONFIRMATION_REQUIRED');
    Assert.equal(h.getState().savedRevision, status.savedRevision);
    Assert.equal((await effective(h)).id, status.effectiveId);

  });

  it('popup confirmation promotes the exact patched revision without Clear', async function() {

    const h = await active();
    await save(h);
    const status = await h.callRpc('getConfigurationStatus');
    const result = await h.callRpc('applySiteConfiguration', {
      expectedRevision: status.savedRevision, expectedEffectiveId: status.effectiveId,
      tabUrl: 'https://sub.example.com/', mode: 'direct', scope: 'domain', applyAll: true,
    });
    Assert.equal(result.ok, true);
    Assert.equal((await effective(h)).savedRevision, status.savedRevision + 1);
    Assert.equal((await h.callRpc('getConfigurationStatus')).pending, false);
    Assert.equal(h.counts.proxySettingsClears, 0);
    start(h, 'confirmed');
    Assert.equal((await challenge(h, 'confirmed')).authCredentials.password, 'synthetic-B');
    Assert.equal((await h.callRpc('getPopupState', {tabUrl: 'https://sub.example.com/'})).mode, 'direct');

  });

  it('rejects confirmation when a provider refresh changed Effective identity', async function() {

    const h = await active();
    const status = await h.callRpc('getConfigurationStatus');
    await h.audit.applyCookedPacAndPersist({});
    const result = await h.callRpcRaw('applySiteConfiguration', {
      expectedRevision: status.savedRevision, expectedEffectiveId: status.effectiveId,
      tabUrl: 'https://example.com/', mode: 'direct', scope: 'host', applyAll: true,
    });
    Assert.equal(result.error.code, 'SAVED_REVISION_CHANGED');
    Assert.equal(h.getState().savedRevision, status.savedRevision);

  });

  it('keeps a successfully Saved site patch when candidate cooking fails', async function() {

    const h = await active();
    const status = await h.callRpc('getConfigurationStatus');
    h.context.mv3PacCook = Object.assign({}, h.context.mv3PacCook, {
      cookPac: async () => {
        throw new Error('synthetic cooking failure');
      },
    });
    const result = await h.callRpc('applySiteConfiguration', {
      expectedRevision: status.savedRevision, expectedEffectiveId: status.effectiveId,
      tabUrl: 'https://example.com/', mode: 'direct', scope: 'host', applyAll: false,
    });
    Assert.equal(result.ok, false);
    Assert.equal(result.saved, true);
    Assert.equal(result.previousActive, true);
    Assert.equal((await effective(h)).id, status.effectiveId);
    Assert.equal(h.getState().savedRevision, status.savedRevision + 1);

  });
  it('Save-only password changes preserve Effective and active authentication', async function() {

    const h = await active();
    const before = await effective(h);
    const revision = await save(h);
    const after = await effective(h);
    Assert.ok(revision > before.savedRevision);
    Assert.deepEqual(after, before);
    start(h, 'after-save');
    Assert.equal((await challenge(h, 'after-save')).authCredentials.password, 'synthetic-A');

  });

  it('collects completed request generations using the bindings just persisted in the queue', async function() {

    const h = await active();
    const api = h.context.mv3Effective;
    const old = await effective(h);
    await api.bindRequest({requestId: 'old-first'});
    await api.bindRequest({requestId: 'old-last'});
    await save(h);
    Assert.equal((await h.audit.applyCookedPacAndPersist({})).ok, true);
    const current = await effective(h);
    await api.bindRequest({requestId: 'current'});
    h.resetCounts();

    await api.releaseRequest({requestId: 'old-first'});
    Assert.equal(h.counts.storageGets, 2);
    Assert.equal(h.counts.storageSets, 1);
    Assert.ok(h.getLocalStorage()[api.STORAGE_KEY].records.some((record) => record.id === old.id));
    Assert.equal((await challenge(h, 'old-last')).authCredentials.password, 'synthetic-A');
    await api.releaseRequest({requestId: 'old-last'});
    Assert.deepEqual(h.getLocalStorage()[api.STORAGE_KEY].records.map((record) => record.id),
        [current.id]);
    Assert.equal((await challenge(h, 'current')).authCredentials.password, 'synthetic-B');

  });

  it('keeps retained generations when persisting completed request bindings fails', async function() {

    const h = await active();
    const api = h.context.mv3Effective;
    const old = await effective(h);
    await api.bindRequest({requestId: 'old-last'});
    await save(h);
    Assert.equal((await h.audit.applyCookedPacAndPersist({})).ok, true);
    h.failNextSessionStorageSet('Synthetic completion storage failure');

    await Assert.rejects(api.releaseRequest({requestId: 'old-last'}));
    Assert.ok(h.getLocalStorage()[api.STORAGE_KEY].records.some((record) => record.id === old.id));
    Assert.equal((await challenge(h, 'old-last')).authCredentials.password, 'synthetic-A');
    await api.releaseRequest({requestId: 'old-last'});
    Assert.ok(!h.getLocalStorage()[api.STORAGE_KEY].records.some((record) => record.id === old.id));

  });

  it('promotes password-only changes with an identical PAC and a distinct generation', async function() {

    const h = await active();
    const before = await effective(h);
    await save(h);
    const applied = await h.audit.applyCookedPacAndPersist({
      expectedRevision: h.getState().savedRevision,
    });
    Assert.equal(applied.ok, true);
    const after = await effective(h);
    Assert.notEqual(after.id, before.id);
    Assert.equal(after.cookedPacCache.cookedPacSha256, before.cookedPacCache.cookedPacSha256);
    start(h, 'new');
    Assert.equal((await challenge(h, 'new')).authCredentials.password, 'synthetic-B');
    Assert.equal(h.counts.proxySettingsClears, 0);

  });

  it('binds matching routing and credentials for a PAC-changing Apply', async function() {

    const h = await active();
    const before = await effective(h);
    await save(h, {exceptions: [{pattern: 'synthetic.example', action: 'PROXY', enabled: true}]});
    Assert.equal((await h.audit.cookPacAndPersist({})).ok, true);
    Assert.equal((await h.audit.applyCookedPacAndPersist({})).ok, true);
    const after = await effective(h);
    Assert.notEqual(after.cookedPacCache.cookedPacSha256, before.cookedPacCache.cookedPacSha256);
    start(h, 'new-route');
    Assert.equal((await challenge(h, 'new-route')).authCredentials.password, 'synthetic-B');

  });

  it('rejects an explicit stale Saved revision without a proxy write', async function() {

    const h = await active();
    const before = await effective(h);
    await save(h);
    h.resetCounts();
    Assert.equal((await h.audit.applyCookedPacAndPersist({expectedRevision: before.savedRevision})).status, 'stale');
    Assert.equal(h.counts.proxySettingsWrites, 0);
    Assert.equal((await effective(h)).id, before.id);

  });

  it('does not switch to latest Saved after preparing an older revision', async function() {

    const h = await active();
    const before = await effective(h);
    const gate = h.blockCookedArtifactRead();
    const applying = h.audit.applyCookedPacAndPersist({});
    await gate.started;
    await save(h);
    gate.release();
    Assert.equal((await applying).status, 'stale');
    Assert.equal((await effective(h)).id, before.id);

  });

  it('keeps old Effective serving when candidate validation fails', async function() {

    const h = await active();
    const before = await effective(h);
    await save(h, {noDirect: true});
    Assert.equal((await h.audit.applyCookedPacAndPersist({})).ok, false);
    Assert.equal((await effective(h)).id, before.id);
    start(h, 'after-failure');
    Assert.equal((await challenge(h, 'after-failure')).authCredentials.password, 'synthetic-A');

  });

  it('keeps request-start generation A through same-endpoint B and repeated challenges', async function() {

    const h = await active();
    start(h, 'A-request');
    await save(h);
    await h.audit.applyCookedPacAndPersist({});
    Assert.equal((await challenge(h, 'A-request')).authCredentials.password, 'synthetic-A');
    start(h, 'A-request'); // redirect: same request ID, never rebind
    Assert.equal((await challenge(h, 'A-request')).authCredentials.password, 'synthetic-A');
    Assert.equal((await challenge(h, 'A-request')).cancel, true);
    start(h, 'B-request');
    Assert.equal((await challenge(h, 'B-request')).authCredentials.password, 'synthetic-B');

  });

  it('denies requests starting inside the PAC promotion boundary', async function() {

    const h = await active();
    await save(h);
    const gate = h.blockProxySettingsSetCallback();
    const applying = h.audit.applyCookedPacAndPersist({});
    await gate.started;
    start(h, 'ambiguous');
    Assert.equal((await challenge(h, 'ambiguous')).cancel, true);
    gate.release();
    Assert.equal((await applying).ok, true);
    Assert.equal((await challenge(h, 'ambiguous')).cancel, true);

  });

  for (const event of ['webCompleted', 'webError']) {
    it(`${event} releases old generation bindings and credentials`, async function() {

      const h = await active();
      const before = await effective(h);
      start(h, 'old');
      await challenge(h, 'old');
      await save(h);
      await h.audit.applyCookedPacAndPersist({});
      const api = h.context.mv3Effective;
      Assert.ok(h.getLocalStorage()[api.STORAGE_KEY].records.some((r) => r.id === before.id));
      h.events[event].dispatch({requestId: 'old', error: 'net::ERR_ABORTED'});
      await effective(h); // queue barrier
      Assert.ok(!h.getLocalStorage()[api.STORAGE_KEY].records.some((r) => r.id === before.id));
      Assert.equal((await challenge(h, 'old')).cancel, true);

    });
  }

  it('recovers old Effective with newer Saved after worker/browser recreation', async function() {

    const h = await active();
    const before = await effective(h);
    await save(h);
    const restarted = await createRuntimeHarness({
      pacMods: h.getState().pacMods, initialLocalStorage: h.getLocalStorage(),
      initialProxyDetails: h.getProxyDetails(),
    });
    Assert.equal((await effective(restarted)).id, before.id);
    start(restarted, 'restart');
    Assert.equal((await challenge(restarted, 'restart')).authCredentials.password, 'synthetic-A');

  });

  it('preserves request generation and retry budget across worker recreation', async function() {

    const h = await active();
    start(h, 'old');
    await challenge(h, 'old');
    await save(h);
    await h.audit.applyCookedPacAndPersist({});
    const restarted = await createRuntimeHarness({
      pacMods: h.getState().pacMods, initialLocalStorage: h.getLocalStorage(),
      initialProxyDetails: h.getProxyDetails(), initialSessionStorage: h.getSessionStorage(),
    });
    Assert.equal((await challenge(restarted, 'old')).authCredentials.password, 'synthetic-A');
    Assert.equal((await challenge(restarted, 'old')).cancel, true);
    start(restarted, 'fresh');
    Assert.equal((await challenge(restarted, 'fresh')).authCredentials.password, 'synthetic-B');

  });

  it('refreshes Effective provider data without promoting pending Saved edits', async function() {

    const h = await active();
    const before = await effective(h);
    await save(h, {noDirect: true});
    const saved = h.getState();
    h.setDownloadResult(h.createDownloadResult(CHANGED_RAW_PAC));
    const result = await h.audit.executePeriodicUpdatePipeline({trigger: 'test', applyIfSafe: true});
    Assert.equal(result.ok, true);
    const after = await effective(h);
    Assert.notEqual(after.cookedPacCache.cookedPacSha256, before.cookedPacCache.cookedPacSha256);
    Assert.equal(after.savedRevision, before.savedRevision);
    Assert.deepEqual(after.config, before.config);
    Assert.deepEqual(h.getState().pacMods, saved.pacMods);
    Assert.equal((await h.callRpc('getConfigurationStatus')).pending, true);
    Assert.equal((await h.callRpc('getConfigurationStatus')).savedRevision, saved.savedRevision);
    start(h, 'refresh');
    Assert.equal((await challenge(h, 'refresh')).authCredentials.password, 'synthetic-A');

  });

  it('does not infer a generation from mismatched browser PAC or latest Saved', async function() {

    const h = await active();
    await save(h);
    const restarted = await createRuntimeHarness({initialLocalStorage: h.getLocalStorage(),
      initialProxyDetails: {levelOfControl: 'controlled_by_this_extension',
        value: {mode: 'pac_script', pacScript: {data: 'unproven PAC'}}}});
    Assert.equal(await effective(restarted), null);
    Assert.equal(restarted.getState().proxyApply.status, 'error');
    start(restarted, 'unknown');
    Assert.equal((await challenge(restarted, 'unknown')).cancel, true);

  });

  it('keeps an interrupted identical-PAC credential promotion ambiguous after restart', async function() {

    const h = await active();
    await save(h);
    const candidate = await h.context.mv3Effective.prepare(h.getState());
    await h.context.mv3Effective.beginSwitch(candidate);
    const restarted = await createRuntimeHarness({initialLocalStorage: h.getLocalStorage(),
      pacMods: h.getState().pacMods, initialProxyDetails: h.getProxyDetails()});
    Assert.equal(await effective(restarted), null);
    Assert.equal(restarted.getState().proxyApply.error.code, 'EFFECTIVE_GENERATION_UNPROVEN');
    start(restarted, 'unknown');
    Assert.equal((await challenge(restarted, 'unknown')).cancel, true);
    Assert.equal((await restarted.audit.applyCookedPacAndPersist({})).ok, true);

  });

  it('migrates provable credential-free legacy PAC, but never guesses legacy passwords', async function() {

    const safe = await createRuntimeHarness();
    Assert.ok(await effective(safe));
    const ambiguous = await createRuntimeHarness({pacMods: {ownProxies: [proxy()]}});
    Assert.equal(await effective(ambiguous), null);
    start(ambiguous, 'legacy');
    Assert.equal((await challenge(ambiguous, 'legacy')).cancel, true);
    Assert.equal(ambiguous.counts.proxySettingsClears, 0);
    Assert.equal((await ambiguous.audit.applyCookedPacAndPersist({})).ok, true);

  });

  it('never supplies generation credentials to an unknown endpoint or unbound request', async function() {

    const h = await active();
    await save(h, {ownProxies: [proxy(),
      Object.assign(proxy('saved-only'), {host: 'other.example'})]});
    start(h, 'known');
    Assert.equal((await challenge(h, 'known', 'other.example')).cancel, true);
    const status = await h.callRpc('getProxyAuthStatus');
    const rejection = status.lastEvents.find((event) => event.requestId === 'known');
    Assert.equal(rejection.type, 'error');
    Assert.equal(rejection.isProxy, true);
    Assert.equal(rejection.host, 'other.example');
    Assert.equal(rejection.port, '8443');
    Assert.equal((await challenge(h, 'missing')).cancel, true);

  });

  it('restores the exact retained generation from system mode while Saved is newer', async function() {

    const h = await active();
    const before = await effective(h);
    await save(h);
    const restored = await createRuntimeHarness({initialLocalStorage: h.getLocalStorage(),
      pacMods: h.getState().pacMods, initialProxyDetails: {
        levelOfControl: 'controllable_by_this_extension', value: {mode: 'system'},
      }});
    Assert.equal((await effective(restored)).id, before.id);
    start(restored, 'restored');
    Assert.equal((await challenge(restored, 'restored')).authCredentials.password, 'synthetic-A');
    Assert.equal(restored.counts.proxySettingsClears, 0);

  });

  it('restores a retained v4 PAC without accepting it for an ordinary Apply', async function() {

    const h = await active();
    const before = await effective(h);
    const live = h.getProxyDetails();
    await save(h);
    const storage = h.getLocalStorage();
    const saved = storage[h.context.mv3State.STORAGE_KEY];
    const journal = storage[h.context.mv3Effective.STORAGE_KEY];
    const retained = journal.records.find((record) => record.id === before.id);
    const v4 = await h.context.mv3PacCook.hashPacMods(retained.config.pacMods, 4);
    Assert.notEqual(v4, retained.cookedPacCache.pacModsSha256);
    Assert.equal(v4, await h.context.mv3PacCook.hashPacMods(saved.pacMods, 4));
    const artifact = await h.context.mv3PacArtifacts.getCookedPacArtifact({
      providerKey: retained.cookedPacCache.providerKey,
      sha256: retained.cookedPacCache.cookedPacSha256,
    });
    const v4Artifact = Object.assign({}, artifact, {pacModsSha256: v4});
    retained.cookedPacCache.pacModsSha256 = v4;
    saved.cookedPacCache.pacModsSha256 = v4;
    saved.pacCook.pacModsSha256 = v4;
    const restored = await createRuntimeHarness({initialLocalStorage: storage,
      pacMods: saved.pacMods, initialProxyDetails: {
        levelOfControl: 'controllable_by_this_extension', value: {mode: 'system'},
      }, onCookedArtifactRead(context) {
        return context.mv3PacArtifacts.putCookedPacArtifact(v4Artifact);
      }});
    Assert.equal((await effective(restored)).id, before.id);
    Assert.equal(restored.getProxyDetails().value.pacScript.data, live.value.pacScript.data);
    Assert.equal((await restored.callRpc('getConfigurationStatus')).pending, true);
    Assert.equal(restored.getState().savedRevision, saved.savedRevision);
    start(restored, 'restored-v4');
    Assert.equal((await challenge(restored, 'restored-v4')).authCredentials.password, 'synthetic-A');
    const writes = restored.counts.proxySettingsWrites;
    const ordinary = await restored.callRpc('applyCookedPac');
    Assert.equal(ordinary.error.code, 'COOKED_PAC_STALE');
    Assert.equal(restored.counts.proxySettingsWrites, writes);
    Assert.equal((await effective(restored)).id, before.id);

  });

  it('recovers old Effective after interrupted preparation, ignoring its retained candidate', async function() {

    const h = await active();
    const before = await effective(h);
    await save(h);
    await h.context.mv3Effective.prepare(h.getState());
    const restarted = await createRuntimeHarness({initialLocalStorage: h.getLocalStorage(),
      pacMods: h.getState().pacMods, initialProxyDetails: h.getProxyDetails()});
    Assert.equal((await effective(restarted)).id, before.id);

  });

  it('does not acknowledge a Save racing the native set callback as applied', async function() {

    const h = await active();
    await save(h);
    const gate = h.blockProxySettingsSetCallback();
    const applying = h.audit.applyCookedPacAndPersist({});
    await gate.started;
    await save(h, {ownProxies: [proxy('synthetic-C')]});
    gate.release();
    Assert.equal((await applying).ok, false);
    Assert.equal(await effective(h), null);
    start(h, 'uncertain');
    Assert.equal((await challenge(h, 'uncertain')).cancel, true);

  });

  it('does not let a pending provider selection replace the Effective refresh source', async function() {

    const h = await active();
    const before = await effective(h);
    await h.callRpc('setCurrentPacProvider', {providerKey: 'Антицензорити'});
    h.setDownloadResult(h.createDownloadResult(CHANGED_RAW_PAC));
    const result = await h.audit.executePeriodicUpdatePipeline({trigger: 'test', applyIfSafe: true});
    Assert.equal(result.ok, true);
    Assert.equal((await effective(h)).config.currentPacProviderKey,
        before.config.currentPacProviderKey);
    Assert.equal(h.getState().currentPacProviderKey, 'Антицензорити');

  });

  it('keeps immutable credentials out of public status, diagnostics and RPC state', async function() {

    const h = await active();
    await save(h);
    const status = JSON.stringify(await h.callRpc('getState'));
    Assert.ok(!status.includes('synthetic-A') && !status.includes('synthetic-B'));
    Assert.ok(!status.includes('mv3EffectiveConfigurations'));

  });

  it('reconciles status after Effective committed but the status write was interrupted', async function() {

    const h = await active();
    await save(h);
    const candidate = await h.context.mv3Effective.prepare(h.getState());
    await h.context.mv3Effective.beginSwitch(candidate);
    await h.context.mv3Effective.commit(candidate);
    await h.context.mv3State.saveStatePatch({proxyApply: {status: 'error'}});
    const resumed = await createRuntimeHarness({initialLocalStorage: h.getLocalStorage(),
      pacMods: h.getState().pacMods, initialProxyDetails: h.getProxyDetails()});
    Assert.equal((await effective(resumed)).id, candidate.id);
    Assert.equal(resumed.getState().proxyApply.status, 'applied');
    start(resumed, 'committed');
    Assert.equal((await challenge(resumed, 'committed')).authCredentials.password, 'synthetic-B');

  });

  it('never rebinds a redirect after its original binding could not be persisted', async function() {

    const h = await active();
    Assert.equal((await h.context.mv3Effective.getBindingStatus()).status, 'available');
    const area = h.context.chrome.storage.session;
    const original = area.set;
    area.set = (_value, callback) => {
      area.set = original;
      h.context.chrome.runtime.lastError = {message: 'Synthetic storage failure'};
      callback();
      h.context.chrome.runtime.lastError = null;
    };
    start(h, 'unpersisted');
    await effective(h);
    await save(h);
    await h.audit.applyCookedPacAndPersist({});
    Assert.equal((await h.context.mv3Effective.getBindingStatus()).reason, 'storage_unavailable');
    start(h, 'unpersisted');
    Assert.equal((await challenge(h, 'unpersisted')).cancel, true);
    Assert.equal(h.getSessionStorage()[h.context.mv3Effective.SESSION_KEY].saturated, true);
    const resumed = await createRuntimeHarness({initialLocalStorage: h.getLocalStorage(),
      initialProxyDetails: h.getProxyDetails(), pacMods: h.getState().pacMods,
      initialSessionStorage: h.getSessionStorage()});
    Assert.equal((await resumed.context.mv3Effective.getBindingStatus()).reason, 'session_blocked');
    const newSession = await createRuntimeHarness({initialLocalStorage: h.getLocalStorage(),
      initialProxyDetails: h.getProxyDetails(), pacMods: h.getState().pacMods});
    Assert.equal((await newSession.context.mv3Effective.getBindingStatus()).status, 'available');

  });

  it('never reports proxy sign-in as available when session storage status cannot be read', async function() {

    const h = await active();
    const area = h.context.chrome.storage.session;
    const original = area.get;
    area.get = (_value, callback) => {
      area.get = original;
      h.context.chrome.runtime.lastError = {message: 'Synthetic storage failure'};
      callback();
      h.context.chrome.runtime.lastError = null;
    };
    const status = await h.context.mv3Effective.getBindingStatus();
    Assert.equal(status.status, 'unavailable');
    Assert.equal(status.reason, 'storage_unavailable');

  });

  it('keeps a no-credential request unbound across Apply and skips its generation cleanup', async function() {

    const h = await createRuntimeHarness({pacMods: {ownProxies: []}});
    Assert.equal((await h.audit.applyCookedPacAndPersist({})).ok, true);
    const api = h.context.mv3Effective;
    const initialProxyReads = h.counts.proxySettingsReads;
    start(h, 'no-credential-request');
    Assert.equal((await challenge(h, 'no-credential-request')).cancel, true);
    Assert.equal(h.counts.proxySettingsReads, initialProxyReads);
    Assert.equal(h.getSessionStorage()[api.SESSION_KEY].entries[0].generationId, null);

    await save(h);
    const status = await h.callRpc('getConfigurationStatus');
    const applied = await h.callRpc('applySavedConfiguration', {
      expectedRevision: status.savedRevision, expectedEffectiveId: status.effectiveId,
    });
    Assert.equal(applied.ok, true);
    start(h, 'no-credential-request');
    Assert.equal((await challenge(h, 'no-credential-request')).cancel, true);
    Assert.equal(h.getSessionStorage()[api.SESSION_KEY].entries[0].generationId, null);

    Assert.equal(h.getSessionStorage()[api.SESSION_KEY].entries.find((entry) =>
      entry.requestId === 'no-credential-request').generationId, null);
    await api.releaseRequest({requestId: 'no-credential-request'});
    Assert.equal(h.getSessionStorage()[api.SESSION_KEY].entries.some((entry) =>
      entry.requestId === 'no-credential-request'), false);

  });

  it('bounds retained generations and preserves live auth when promotion hits the limit', async function() {

    const h = await active();
    const api = h.context.mv3Effective;
    for (let i = 1; i < api.MAX_GENERATIONS; i += 1) {
      start(h, String(i));
      await challenge(h, String(i));
      await save(h, {ownProxies: [proxy('synthetic-' + i)]});
      Assert.equal((await h.audit.applyCookedPacAndPersist({})).ok, true);
    }
    const before = await effective(h);
    start(h, 'last');
    await challenge(h, 'last');
    await save(h);
    Assert.equal((await h.audit.applyCookedPacAndPersist({})).error.code, 'GENERATION_RETENTION_LIMIT');
    Assert.equal((await effective(h)).id, before.id);
    Assert.equal(h.getLocalStorage()[api.STORAGE_KEY].records.length, api.MAX_GENERATIONS);

  });

  it('bounds request storage without evicting or rebinding existing requests', async function() {

    const h = await active();
    const api = h.context.mv3Effective;
    const generation = await effective(h);
    const entries = Array.from({length: api.MAX_REQUESTS}, (_, i) => ({
      requestId: String(i), generationId: generation.id,
    }));
    const resumed = await createRuntimeHarness({initialLocalStorage: h.getLocalStorage(),
      initialProxyDetails: h.getProxyDetails(), pacMods: h.getState().pacMods,
      initialSessionStorage: {[api.SESSION_KEY]: {entries, saturated: false}}});
    Assert.equal((await resumed.context.mv3Effective.getBindingStatus()).status, 'available');
    start(resumed, 'overflow');
    Assert.equal((await challenge(resumed, 'overflow')).cancel, true);
    Assert.equal((await resumed.context.mv3Effective.getBindingStatus()).reason, 'session_blocked');
    Assert.equal(resumed.getSessionStorage()[api.SESSION_KEY].entries.length, api.MAX_REQUESTS);
    Assert.equal(resumed.getSessionStorage()[api.SESSION_KEY].saturated, true);
    const popup = await resumed.callRpc('getPopupState', {tabUrl: 'https://synthetic.example/'});
    Assert.equal(popup.proxyAuthBinding.status, 'unavailable');
    Assert.equal(popup.configuration.active, true);
    Assert.doesNotMatch(JSON.stringify(popup.proxyAuthBinding), /synthetic|requestId|password/);

  });
});
