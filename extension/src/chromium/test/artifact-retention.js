'use strict';

const Assert = require('node:assert/strict');
const {createRuntimeHarness, CHANGED_RAW_PAC} = require('./runtime-performance-harness');

async function refresh(h, sequence) {

  h.setDownloadResult(h.createDownloadResult(`// revision ${sequence}\n${CHANGED_RAW_PAC}`));
  Assert.equal((await h.callRpc('downloadPac')).ok, true);
  Assert.equal((await h.callRpc('cookPac')).ok, true);

}

function refs(state) {

  return [state.pacCache.artifactRef, state.cookedPacCache.artifactRef].sort();

}

describe('Chromium PAC body retention', function() {
  it('bounds repeated OFF updates to Saved and retained Effective bodies without enabling control', async function() {
    const h = await createRuntimeHarness();
    await h.callRpc('clearProxy');
    const effective = await h.context.mv3Effective.retained();
    for (let i = 0; i < 12; ++i) await refresh(h, i);
    const expected = new Set(refs(h.getState()).concat(effective ? refs(effective) : []));
    Assert.deepEqual(h.getArtifactRefs(), [...expected].sort());
    Assert.equal((await h.callRpc('getConfigurationStatus')).active, false);
  });

  it('keeps pending Saved, Effective and an older generation still bound to a request', async function() {
    const h = await createRuntimeHarness({pacMods: {ownProxies: [{enabled: true,
      type: 'HTTPS', host: 'synthetic.example', port: 8443,
      username: 'synthetic', password: 'test-only', useAsDirectReplacement: false}]}});
    Assert.equal((await h.callRpc('applyCookedPac')).ok, true);
    const original = await h.context.mv3Effective.current();
    await h.context.mv3Effective.bindRequest({requestId: 'old-request'});
    await refresh(h, 1);
    for (const ref of refs(original).concat(refs(h.getState()))) {
      Assert.ok(h.getArtifactRefs().includes(ref));
    }
    Assert.equal((await h.callRpc('applyCookedPac')).ok, true);
    const current = await h.context.mv3Effective.current();
    await refresh(h, 2);
    await h.context.mv3Effective.collectArtifacts(() => true);
    for (const ref of refs(original).concat(refs(current), refs(h.getState()))) {
      Assert.ok(h.getArtifactRefs().includes(ref));
    }
    await h.context.mv3Effective.releaseRequest({requestId: 'old-request'});
    await h.context.mv3Effective.collectArtifacts(() => true);
    for (const ref of refs(original)) Assert.ok(!h.getArtifactRefs().includes(ref));
    for (const ref of refs(current).concat(refs(h.getState()))) {
      Assert.ok(h.getArtifactRefs().includes(ref));
    }
  });

  it('defers collection while a publisher or a promotion journal is unresolved', async function() {
    const h = await createRuntimeHarness();
    const before = h.getArtifactRefs();
    Assert.equal((await h.context.mv3Effective.collectArtifacts(() => false)).status, 'busy');
    Assert.deepEqual(h.getArtifactRefs(), before);
    const candidate = await h.context.mv3Effective.prepare(h.getState());
    Assert.equal((await h.context.mv3Effective.collectArtifacts(() => true)).status, 'pending');
    Assert.deepEqual(h.getArtifactRefs(), before);
    await h.context.mv3Effective.abortPrepared(candidate);
  });

  it('keeps a successful update successful when optional collection fails', async function() {
    const h = await createRuntimeHarness({artifactCollectionError: true});
    await refresh(h, 1);
    for (const ref of refs(h.getState())) Assert.ok(h.getArtifactRefs().includes(ref));
  });

  it('clears Saved cache pointers without deleting active bodies or releasing proxy control', async function() {
    const h = await createRuntimeHarness();
    Assert.equal((await h.callRpc('applyCookedPac')).ok, true);
    const current = await h.context.mv3Effective.current();
    await refresh(h, 1);
    await h.callRpc('clearPacCache');
    await h.callRpc('clearCookedPacCache');
    Assert.equal((await h.context.mv3Effective.current()).id, current.id);
    Assert.deepEqual(h.getArtifactRefs(), refs(current));
    Assert.equal((await h.callRpc('getConfigurationStatus')).active, true);
  });

  it('serializes a new publisher behind the marked Saved/Effective snapshot', async function() {
    let release;
    let started;
    let collecting = false;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const ready = new Promise((resolve) => {
      started = resolve;
    });
    const h = await createRuntimeHarness({onArtifactCollection: async () => {
      if (collecting) {
        started(); await gate;
      }
    }});
    collecting = true;
    const sweep = h.context.mv3Effective.collectArtifacts(() => true);
    await ready;
    h.setDownloadResult(h.createDownloadResult(`// concurrent\n${CHANGED_RAW_PAC}`));
    let finished = false;
    const publish = h.callRpc('downloadPac').then((value) => {
      finished = true; return value;
    });
    await new Promise((resolve) => setImmediate(resolve));
    Assert.equal(finished, false);
    collecting = false;
    release();
    await sweep;
    Assert.equal((await publish).ok, true);
    Assert.ok(h.getArtifactRefs().includes(h.getState().pacCache.artifactRef));
  });
});
