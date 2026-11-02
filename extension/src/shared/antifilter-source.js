'use strict';
/* global require */

(function publish(root, factory) {
  const commonJs = typeof module === 'object' && module.exports;
  const api = factory(
      commonJs ? require('./provider-dataset') : root.mv3ProviderDataset,
      commonJs ? require('./domain-stream-import') : root.rucbDomainStreamImporter,
      commonJs ? require('./domain-source-policy') : root.rucbDomainSourcePolicy, root);
  if (commonJs) module.exports = api;
  else root.rucbAntifilterSource = api;
})(typeof globalThis === 'object' ? globalThis : this, function(Dataset, Importer, Policy, root) {
  const SOURCE_ID = 'antifilter-domains';
  const SOURCE_URL = 'https://antifilter.download/list/domains.lst';
  const LIMITS = Object.freeze({sourceBytes: 64 * 1024 * 1024, timeoutMs: 120000,
    maxAgeMs: 7 * 86400000, futureSkewMs: 86400000});
  const RECEIPT_FIELDS = ['schemaVersion', 'sourceId', 'sourceUrl', 'sourceSha256',
    'sourceBytes', 'updatedAt', 'checkedAt', 'ruleCount', 'lines', 'excludedRows',
    'policy', 'rejections'];
  const ROW_CODES = ['INVALID_DNS_HOSTNAME', 'NON_HOST_SYNTAX', 'IP_OR_PUBLIC_SUFFIX'];
  const ENVELOPE_FIELDS = ['schemaVersion', 'providerKey', 'datasetVersion', 'generatedAt',
    'sourceRevisions', 'ruleCount', 'artifactByteCount', 'artifactSha256', 'routeTableVersion'];

  function error(code) { return Object.assign(new Error(code), {code}); }
  function exact(value, fields) {
    return value && typeof value === 'object' && !Array.isArray(value) &&
      Object.keys(value).length === fields.length && fields.every(key =>
        Object.prototype.hasOwnProperty.call(value, key));
  }
  function hash(value) { return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value); }
  function timestamp(value) {
    return typeof value === 'string' && Number.isFinite(Date.parse(value)) &&
      new Date(Date.parse(value)).toISOString() === value;
  }
  function safeUrl(value) {
    // Exact spelling also excludes credentials, fragments, queries and aliases.
    if (value !== SOURCE_URL) throw error('ANTIFILTER_URL_REJECTED');
    return value;
  }
  function validateReceipt(value) {
    if (!exact(value, RECEIPT_FIELDS) || value.schemaVersion !== 1 ||
        value.sourceId !== SOURCE_ID || value.sourceUrl !== SOURCE_URL ||
        !hash(value.sourceSha256) || !timestamp(value.updatedAt) ||
        !timestamp(value.checkedAt) || !Number.isSafeInteger(value.sourceBytes) ||
        value.sourceBytes < 1 || value.sourceBytes > LIMITS.sourceBytes ||
        !Number.isSafeInteger(value.ruleCount) || value.ruleCount > 2000000 ||
        value.ruleCount < Policy.QUARANTINE.minimumRules ||
        !Number.isSafeInteger(value.lines) || value.lines > Importer.LIMITS.lines ||
        !Number.isSafeInteger(value.excludedRows) || value.excludedRows < 0 ||
        value.ruleCount + value.excludedRows > value.lines ||
        !['STRICT', 'QUARANTINE_INVALID_V1'].includes(value.policy) ||
        !exact(value.rejections, ROW_CODES) || ROW_CODES.some(key =>
          !Number.isSafeInteger(value.rejections[key]) || value.rejections[key] < 0) ||
        ROW_CODES.reduce((n, key) => n + value.rejections[key], 0) !== value.excludedRows ||
        Date.parse(value.updatedAt) > Date.parse(value.checkedAt) + LIMITS.futureSkewMs) {
      throw error('ANTIFILTER_RECEIPT_INVALID');
    }
    const assessment = Policy.assess({lines: value.lines, ruleCount: value.ruleCount,
      rejectedLines: value.excludedRows}, value.policy);
    if (!assessment.accepted) throw error('ANTIFILTER_QUALITY_REJECTED');
    return Object.freeze(Object.assign({}, value,
      {rejections: Object.freeze(Object.assign({}, value.rejections))}));
  }
  function validateBinding(envelope, receipt) {
    const source = validateReceipt(receipt);
    if (!exact(envelope, ENVELOPE_FIELDS) || envelope.schemaVersion !== 2 ||
        envelope.providerKey !== 'antifilter' || envelope.routeTableVersion !== 1 ||
        !Number.isSafeInteger(envelope.artifactByteCount) || envelope.artifactByteCount < 1 ||
        envelope.artifactByteCount > Dataset.LIMITS.MAX_ARTIFACT_BYTES ||
        envelope.datasetVersion !== `source-${source.updatedAt.replace(/\D/g, '')}-${source.sourceSha256}` ||
        envelope.ruleCount !== source.ruleCount || envelope.generatedAt !== source.updatedAt ||
        !Array.isArray(envelope.sourceRevisions) || envelope.sourceRevisions.length !== 1 ||
        !exact(envelope.sourceRevisions[0], ['sourceId', 'revision']) ||
        envelope.sourceRevisions[0].sourceId !== SOURCE_ID ||
        envelope.sourceRevisions[0].revision !== `sha256=${source.sourceSha256}` ||
        !hash(envelope.artifactSha256)) throw error('ANTIFILTER_RECEIPT_MISMATCH');
    return source;
  }
  function checkContinuity(candidate, previous) {
    const next = validateBinding(candidate.envelope, candidate.receipt);
    if (!previous) return;
    const old = validateBinding(previous.envelope, previous.receipt);
    if (next.checkedAt < old.checkedAt || next.updatedAt < old.updatedAt) {
      throw error('ANTIFILTER_ROLLBACK_REJECTED');
    }
    if ((next.updatedAt === old.updatedAt && next.sourceSha256 !== old.sourceSha256) ||
        (next.sourceSha256 === old.sourceSha256 && (next.updatedAt !== old.updatedAt ||
          candidate.envelope.artifactSha256 !== previous.envelope.artifactSha256))) {
      throw error('ANTIFILTER_SOURCE_CONFLICT');
    }
    if (next.ruleCount / old.ruleCount < Policy.QUARANTINE.minimumRetainedRatio) {
      throw error('ANTIFILTER_RULE_LOSS');
    }
  }
  async function sha256Bytes(bytes) {
    const digest = await root.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
  }
  async function verifyCandidate(candidate, sha256 = sha256Bytes) {
    const receipt = validateBinding(candidate && candidate.envelope, candidate && candidate.receipt);
    if (!(candidate.artifactBytes instanceof Uint8Array) ||
        candidate.artifactBytes.length > Dataset.LIMITS.MAX_ARTIFACT_BYTES) {
      throw error('ANTIFILTER_ARTIFACT_INVALID');
    }
    const artifactBytes = candidate.artifactBytes.slice();
    const verification = await Dataset.verifyProviderDataset({envelope: candidate.envelope,
      artifactBytes, sha256, trust: Dataset.TRUST.REMOTE_HTTPS_VALIDATED});
    if (!verification.ok) throw error('ANTIFILTER_ARTIFACT_INVALID');
    // This channel authenticates transport only; it never asserts an author signature.
    return {candidate: {envelope: verification.dataset.envelope, artifactBytes, receipt}, verification};
  }

  // Chromium's immutable raw-artifact store holds this data document, not a
  // downloaded PAC. Reverification binds all bytes and the receipt on every cook.
  function serializeCandidate(verified) {
    if (!verified || !verified.verification || !verified.verification.ok) {
      throw error('ANTIFILTER_ARTIFACT_INVALID');
    }
    const {envelope, receipt, artifactBytes} = verified.candidate;
    validateBinding(envelope, receipt);
    return JSON.stringify({envelope, receipt,
      artifact: new TextDecoder('utf-8', {fatal: true}).decode(artifactBytes)});
  }
  async function deserializeCandidate(text, sha256 = sha256Bytes) {
    // Escaping a JSON artifact can at most double its bytes, plus fixed metadata.
    if (typeof text !== 'string' || text.length > 2 * Dataset.LIMITS.MAX_ARTIFACT_BYTES + 8192) {
      throw error('ANTIFILTER_ARTIFACT_INVALID');
    }
    let value;
    try { value = JSON.parse(text); } catch (_error) { throw error('ANTIFILTER_ARTIFACT_INVALID'); }
    if (!exact(value, ['envelope', 'receipt', 'artifact']) || typeof value.artifact !== 'string' ||
        value.artifact.length > Dataset.LIMITS.MAX_ARTIFACT_BYTES) {
      throw error('ANTIFILTER_ARTIFACT_INVALID');
    }
    return verifyCandidate({envelope: value.envelope, receipt: value.receipt,
      artifactBytes: new TextEncoder().encode(value.artifact)}, sha256);
  }

  function createUpdater(options = {}) {
    const fetchImpl = options.fetchImpl || root.fetch.bind(root);
    const sha256 = options.sha256 || sha256Bytes;
    const importStream = options.importStream || Importer.importStream;
    const now = options.now || Date.now;
    const store = options.store;
    const timeoutMs = options.timeoutMs === undefined ? LIMITS.timeoutMs : options.timeoutMs;
    if (!store || typeof store.begin !== 'function' || !Number.isSafeInteger(timeoutMs) ||
        timeoutMs < 1 || timeoutMs > LIMITS.timeoutMs) throw error('ANTIFILTER_UPDATER_INVALID');

    async function fetchAndStage({mode = 'STRICT', signal} = {}) {
      if (!['STRICT', 'QUARANTINE_INVALID_V1'].includes(mode)) {
        return {ok: false, code: 'ANTIFILTER_POLICY_INVALID'};
      }
      const controller = new root.AbortController();
      let reason;
      let rejectAbort;
      let reader;
      let response;
      let session;
      const aborted = new Promise((resolve, reject) => { rejectAbort = reject; });
      // Handle a pre-aborted signal without an unhandled rejection.
      aborted.catch(() => {});
      const abort = code => {
        if (reason) return;
        reason = code;
        controller.abort();
        if (reader) Promise.resolve(reader.cancel()).catch(() => {});
        rejectAbort(error(code));
      };
      const externalAbort = () => abort('ANTIFILTER_CANCELLED');
      if (signal) signal.addEventListener('abort', externalAbort, {once: true});
      if (signal && signal.aborted) externalAbort();
      const timer = setTimeout(() => abort('ANTIFILTER_TIMEOUT'), timeoutMs);
      const wait = promise => Promise.race([promise, aborted]);
      const check = () => { if (reason) throw error(reason); };
      try {
        check();
        session = await store.begin();
        check();
        response = await wait(fetchImpl(SOURCE_URL, {method: 'GET', redirect: 'manual',
          credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
          signal: controller.signal}));
        check();
        // There is only one approved address. No redirect is needed or followed,
        // including opaque redirects, even if Location points back to the source.
        safeUrl(response.url);
        if (response.redirected || response.type === 'opaqueredirect' || response.status !== 200) {
          throw error('ANTIFILTER_HTTP_REJECTED');
        }
        const header = name => response.headers && response.headers.get(name);
        const length = header('content-length');
        if (length !== null && length !== undefined && (!/^\d+$/.test(length) ||
            !Number.isSafeInteger(Number(length)) || Number(length) < 1 ||
            Number(length) > LIMITS.sourceBytes)) throw error('ANTIFILTER_SIZE_REJECTED');
        const modified = header('last-modified');
        const modifiedMs = modified ? Date.parse(modified) : NaN;
        const checkedMs = now();
        if (!Number.isSafeInteger(checkedMs) || !Number.isFinite(modifiedMs) ||
            modifiedMs > checkedMs + LIMITS.futureSkewMs ||
            checkedMs - modifiedMs > LIMITS.maxAgeMs) throw error('ANTIFILTER_DATE_REJECTED');
        if (!response.body || typeof response.body.getReader !== 'function') {
          throw error('ANTIFILTER_STREAM_REQUIRED');
        }
        reader = response.body.getReader();
        let sourceBytes = 0;
        let sourceSha256;
        // WebCrypto has no streaming SHA256. One capped byte buffer avoids
        // retained text/chunk arrays. Hash and release it before sorting merges.
        let hashInput = new Uint8Array(LIMITS.sourceBytes);
        async function* chunks() {
          try {
            while (true) {
              const part = await wait(reader.read());
              check();
              if (part.done) break;
              if (!(part.value instanceof Uint8Array) ||
                  sourceBytes + part.value.byteLength > LIMITS.sourceBytes) {
                throw error('ANTIFILTER_SIZE_REJECTED');
              }
              hashInput.set(part.value, sourceBytes);
              sourceBytes += part.value.byteLength;
              yield part.value;
            }
            if (!sourceBytes || (length && !header('content-encoding') &&
                sourceBytes !== Number(length))) throw error('ANTIFILTER_SIZE_REJECTED');
            sourceSha256 = await wait(sha256(hashInput.subarray(0, sourceBytes)));
          } finally { hashInput = null; }
        }
        const imported = await importStream(chunks(), session, {mode,
          previousRules: session.floor ? session.floor.receipt.ruleCount : undefined,
          signal: controller.signal});
        check();
        if (!imported.payload || !imported.assessment.accepted) {
          throw error('ANTIFILTER_QUALITY_REJECTED');
        }
        const receipt = validateReceipt({schemaVersion: 1, sourceId: SOURCE_ID,
          sourceUrl: SOURCE_URL, sourceSha256, sourceBytes,
          updatedAt: new Date(modifiedMs).toISOString(), checkedAt: new Date(checkedMs).toISOString(),
          ruleCount: imported.stats.ruleCount, lines: imported.stats.lines,
          excludedRows: imported.stats.rejectedLines, policy: mode,
          rejections: Object.fromEntries(ROW_CODES.map(key => [key, imported.stats.rejected[key] || 0]))});
        const artifactBytes = new TextEncoder().encode(JSON.stringify(imported.payload));
        const artifactSha256 = await wait(sha256(artifactBytes));
        const envelope = {schemaVersion: 2, providerKey: 'antifilter',
          datasetVersion: `source-${receipt.updatedAt.replace(/\D/g, '')}-${sourceSha256}`,
          generatedAt: receipt.updatedAt, sourceRevisions: [{sourceId: SOURCE_ID,
            revision: `sha256=${sourceSha256}`}], ruleCount: receipt.ruleCount,
          artifactByteCount: artifactBytes.byteLength, artifactSha256, routeTableVersion: 1};
        const candidate = {envelope, artifactBytes, receipt};
        checkContinuity(candidate, session.floor);
        check();
        const result = await session.stage(candidate, controller.signal);
        return {ok: true, status: 'PREPARED_INACTIVE', activationEligible: false,
          receipt, artifactSha256, unchanged: result.unchanged};
      } catch (failure) {
        const code = reason || (failure && /^ANTIFILTER_[A-Z_]+$/.test(failure.code) && failure.code) ||
          'ANTIFILTER_PREPARATION_FAILED';
        return {ok: false, status: 'REJECTED', code};
      } finally {
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', externalAbort);
        controller.abort();
        if (reader) {
          try { Promise.resolve(reader.cancel()).catch(() => {}); }
          catch (_error) { /* Preserve the preparation result. */ }
          try { reader.releaseLock(); } catch (_error) { /* Already released. */ }
        } else if (response && response.body) {
          try { Promise.resolve(response.body.cancel()).catch(() => {}); }
          catch (_error) { /* No accepted body. */ }
        }
        if (session) {
          try { await session.release(); }
          catch (_error) { /* Next lease claim clears scratch after context/storage recovery. */ }
        }
      }
    }
    return Object.freeze({fetchAndStage});
  }
  return Object.freeze({SOURCE_ID, SOURCE_URL, LIMITS, validateReceipt, validateBinding,
    checkContinuity, sha256Bytes, verifyCandidate, serializeCandidate, deserializeCandidate, createUpdater});
});
