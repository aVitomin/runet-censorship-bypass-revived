'use strict';

/* global rucbDomainBlockCodec, rucbAntifilterSource, rucbDomainCandidateStore, mv3Hash */

(function(exports) {

  function fail(code) {
    const error = new TypeError(code);
    error.code = code;
    throw error;
  }

  function validateCandidates(candidates) {
    // This API takes the explicit provider route, never credentials or Saved
    // settings. It does not infer permission to widen the scope of own proxies.
    if (!Array.isArray(candidates) || !candidates.length || candidates.length > 32) {
      fail('DOMAIN_PROVIDER_PROXY_REQUIRED');
    }
    return candidates.map((candidate) => {
      if (typeof candidate !== 'string' || candidate.length > 300) {
        fail('INVALID_DOMAIN_PROVIDER_PROXY');
      }
      const match = candidate.match(
          /^(PROXY|HTTPS|SOCKS|SOCKS4|SOCKS5) (\[[a-fA-F0-9:]+\]|[a-zA-Z0-9._-]+):([1-9][0-9]{0,4})$/,
      );
      if (!match || Number(match[3]) > 65535) {
        fail('INVALID_DOMAIN_PROVIDER_PROXY');
      }
      try {
        // Validate IPv6/IPv4 syntax with the platform parser. The preceding
        // grammar prevents credentials, paths and other URL syntax.
        const host = new URL(`http://${match[2]}:${match[3]}`).hostname;
        if (!host.startsWith('[') && (host.length > 253 ||
            !host.replace(/\.$/, '').split('.').every((label) =>
              /^[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?$/i.test(label)))) {
          fail('INVALID_DOMAIN_PROVIDER_PROXY');
        }
      } catch (_error) {
        fail('INVALID_DOMAIN_PROVIDER_PROXY');
      }
      return candidate;
    }).join('; ');
  }

  function createProviderPac(verification, proxyCandidates) {
    const dataset = verification && verification.dataset;
    if (!verification || !verification.ok || verification.status !== 'VERIFIED' ||
        verification.activationEligible !== true || !dataset ||
        !dataset.envelope || !dataset.identity ||
        dataset.identity.providerKey !== 'antifilter' ||
        dataset.envelope.providerKey !== 'antifilter' ||
        dataset.envelope.schemaVersion !== 2 || !dataset.payload ||
        dataset.payload.policy !== 'EXACT_HOST' ||
        dataset.payload.ruleCount !== dataset.envelope.ruleCount) {
      fail('INVALID_DOMAIN_PROVIDER_DATASET');
    }
    rucbDomainBlockCodec.validate(dataset.payload);
    const route = validateCandidates(proxyCandidates);
    // Only the package-owned factory is code. Untrusted input is validated JSON
    // with a bounded ASCII alphabet. It is never evaluated in the extension.
    const pac = [
      '// Package-generated exact-host provider; contains no downloaded code.',
      `var rucbDomainIndex = (${rucbDomainBlockCodec.factorySource})()`,
      `  .createLookup(${JSON.stringify(dataset.payload)});`,
      'function FindProxyForURL(url, host) {',
      `  return rucbDomainIndex.matches(host) ? ${JSON.stringify(route)} : "DIRECT";`,
      '}',
    ].join('\n');
    // All generated characters are ASCII. The normal cooker also checks its
    // final size after adding user rules; a near-full base must not bypass it.
    if (pac.length > 16 * 1024 * 1024) fail('DOMAIN_PROVIDER_PAC_TOO_LARGE');
    return pac;
  }

  async function download() {
    const store = rucbDomainCandidateStore.createStore();
    try {
      const result = await rucbAntifilterSource.createUpdater({store})
          .fetchAndStage({mode: 'QUARANTINE_INVALID_V1'});
      if (!result.ok) throw Object.assign(new Error(result.code), {code: result.code});
      const candidate = await store.loadCandidate();
      if (!candidate || candidate.candidate.envelope.artifactSha256 !== result.artifactSha256) {
        fail('ANTIFILTER_CANDIDATE_CHANGED');
      }
      const rawPacData = rucbAntifilterSource.serializeCandidate(candidate);
      return {ok: true, status: 'success', providerKey: 'antifilter',
        url: rucbAntifilterSource.SOURCE_URL, rawPacData,
        sha256: await mv3Hash.sha256Hex(rawPacData),
        contentLength: mv3Hash.getUtf8Length(rawPacData),
        lastModified: candidate.candidate.receipt.updatedAt, etag: null};
    } catch (failure) {
      const code = failure && /^ANTIFILTER_[A-Z_]+$/.test(failure.code) ?
        failure.code : 'ANTIFILTER_PREPARATION_FAILED';
      return {ok: false, status: 'error', providerKey: 'antifilter', error: {code, message: code}};
    } finally {
      store.close();
    }
  }

  exports.mv3DomainProviderPac = Object.freeze({createProviderPac, download});

})(self);
