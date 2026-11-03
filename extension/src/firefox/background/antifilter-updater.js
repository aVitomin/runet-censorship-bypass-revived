'use strict';
/* global require */

(function publish(root, factory) {
  const commonJs = typeof module === 'object' && module.exports;
  const api = factory(
      commonJs ? require('../../shared/antifilter-source') : root.rucbAntifilterSource,
      commonJs ? require('../../shared/domain-candidate-store') : root.rucbDomainCandidateStore);
  if (commonJs) module.exports = api;
  else root.rucbFirefoxAntifilterUpdater = api;
})(typeof globalThis === 'object' ? globalThis : this, function(Source, Candidates) {
  function createUpdater(options) {
    return Object.freeze({async fetchAndStage() {
      const candidates = options.candidateStore || Candidates.createStore({sha256: options.sha256});
      try {
        const downloaded = await Source.createUpdater({store: candidates,
          fetchImpl: options.fetchImpl, sha256: options.sha256})
            .fetchAndStage({mode: 'QUARANTINE_INVALID_V1'});
        if (!downloaded.ok) return downloaded;
        const verified = await candidates.loadCandidate();
        if (!verified || verified.candidate.envelope.artifactSha256 !== downloaded.artifactSha256) {
          return {ok: false, code: 'ANTIFILTER_CANDIDATE_CHANGED'};
        }
        const {envelope, artifactBytes, receipt} = verified.candidate;
        // Runtime staging is still inactive: configuration, proxy ownership and
        // Effective credentials are exclusively controlled by Save/Apply.
        return await options.store.stageHttpsCandidate({envelope, artifactBytes, source: receipt});
      } catch (_error) {
        return {ok: false, code: 'SOURCE_STORAGE_FAILED'};
      } finally {
        candidates.close();
      }
    }});
  }
  async function publishFirstCandidate(store) {
    const loaded = await store.loadVerifications('antifilter');
    if (loaded.active && loaded.active.ok || loaded.previousLkg && loaded.previousLkg.ok) {
      return {ok: true, status: 'PREPARED'};
    }
    if (loaded.active || loaded.previousLkg || loaded.packagedBaseline) {
      return {ok: false, code: 'ANTIFILTER_PREPARATION_REQUIRED'};
    }
    const staged = await store.loadStaged('antifilter');
    if (!staged || !staged.ok || !staged.verification || !staged.verification.ok) {
      return {ok: false, code: 'ANTIFILTER_PREPARATION_REQUIRED'};
    }
    // This empty namespace has no older Effective identity. The store commits
    // the exact candidate and pointers atomically, without a settings journal.
    // Existing/corrupt pointer state must never be mistaken for first setup.
    const promoted = await store.promoteStagedExact({providerKey: 'antifilter', channel: 'HTTPS',
      currentDatasetIdentity: null, stagedSequence: staged.sequence, source: staged.source,
      stagedArtifactSha256: staged.verification.dataset.identity.artifactSha256});
    return promoted.ok ? {ok: true, status: 'PREPARED'} :
      {ok: false, code: 'ANTIFILTER_PREPARATION_REQUIRED'};
  }
  return Object.freeze({createUpdater, publishFirstCandidate});
});
