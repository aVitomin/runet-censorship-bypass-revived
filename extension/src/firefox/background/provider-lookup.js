'use strict';
/* global require */

(function publishFirefoxProviderLookup(root, factory) {

  const codec = typeof module === 'object' && module.exports ?
    require('../../shared/domain-block-codec') : root.rucbDomainBlockCodec;
  const api = factory(codec);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
    return;
  }
  root.rucbFirefoxProviderLookup = api;

})(typeof globalThis === 'object' ? globalThis : this, function(Codec) {

  const KINDS = Object.freeze({
    PROVIDER_PROXY: 'PROVIDER_PROXY',
    PROVIDER_DIRECT: 'PROVIDER_DIRECT',
    MISS: 'MISS',
    FAILURE: 'FAILURE',
  });

  function lookupError(code) {

    const error = new TypeError(code);
    error.code = code;
    return error;

  }

  function normalizeHostname(value) {

    if (typeof value !== 'string') {
      throw lookupError('INVALID_LOOKUP_HOSTNAME');
    }
    let hostname = value.trim().toLowerCase();
    while (hostname.endsWith('.')) {
      hostname = hostname.slice(0, -1);
    }
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      hostname = hostname.slice(1, -1);
    }
    if (!hostname || hostname.length > 253 ||
        /[/\\?#@]/.test(hostname) ||
        Array.from(hostname).some((character) => character.charCodeAt(0) <= 32)) {
      throw lookupError('INVALID_LOOKUP_HOSTNAME');
    }
    return hostname;

  }

  function fixedBucketContains(hosts, width, target) {

    if (typeof hosts !== 'string' || !Number.isSafeInteger(width) ||
        width < 1 || hosts.length % width !== 0 || target.length !== width) {
      throw lookupError('MALFORMED_LOOKUP_INDEX');
    }
    let low = 0;
    let high = hosts.length / width;
    while (low < high) {
      const middle = (low + high) >>> 1;
      const candidate = hosts.slice(middle * width, (middle + 1) * width);
      if (candidate < target) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    return low < hosts.length / width &&
      hosts.slice(low * width, (low + 1) * width) === target;

  }

  function buildLookup(verification) {

    if (!verification || verification.ok !== true ||
        verification.status !== 'VERIFIED' ||
        !verification.dataset || !verification.dataset.payload) {
      throw lookupError('INVALID_VERIFIED_DATASET');
    }
    const payload = verification.dataset.payload;
    if (payload.format === Codec.FORMAT) {
      if (!verification.dataset.envelope ||
          verification.dataset.envelope.schemaVersion !== 2 ||
          verification.dataset.envelope.providerKey !== 'antifilter' ||
          payload.policy !== 'EXACT_HOST') {
        throw lookupError('INVALID_VERIFIED_DATASET');
      }
      const index = Codec.createLookup(payload);
      return Object.freeze({
        blockCount: payload.blocks.length,
        lookup(rawHostname) {
          try {
            normalizeHostname(rawHostname);
            // Use the codec's exact canonicalization in both browsers. Legacy
            // suffix lookup strips all trailing dots; compact data strips one.
            return Object.freeze({kind: index.matches(rawHostname) ?
              KINDS.PROVIDER_PROXY : KINDS.MISS});
          } catch (error) {
            return Object.freeze({kind: KINDS.FAILURE,
              code: error.code || 'PROVIDER_LOOKUP_FAILED'});
          }
        },
      });
    }
    if (payload.format !== 'HOST_BUCKETS_V1' || !Array.isArray(payload.buckets)) {
      throw lookupError('INVALID_VERIFIED_DATASET');
    }
    const byWidth = new Map();
    for (const bucket of verification.dataset.payload.buckets) {
      if (!bucket || !Number.isSafeInteger(bucket.width) ||
          bucket.width < 1 || typeof bucket.hosts !== 'string' ||
          !bucket.hosts.length ||
          bucket.hosts.length % bucket.width !== 0 ||
          ![KINDS.PROVIDER_PROXY, KINDS.PROVIDER_DIRECT].includes(
              bucket.routeRef,
          )) {
        throw lookupError('MALFORMED_LOOKUP_INDEX');
      }
      const entries = byWidth.get(bucket.width) || [];
      entries.push(Object.freeze({
        width: bucket.width,
        routeRef: bucket.routeRef,
        hosts: bucket.hosts,
      }));
      byWidth.set(bucket.width, entries);
    }

    function lookup(rawHostname) {

      try {
        let hostname = normalizeHostname(rawHostname);
        while (hostname && hostname.includes('.')) {
          const buckets = byWidth.get(hostname.length) || [];
          for (const bucket of buckets) {
            if (fixedBucketContains(
                bucket.hosts,
                bucket.width,
                hostname,
            )) {
              return Object.freeze({kind: bucket.routeRef});
            }
          }
          hostname = hostname.slice(hostname.indexOf('.') + 1);
        }
        return Object.freeze({kind: KINDS.MISS});
      } catch (error) {
        return Object.freeze({
          kind: KINDS.FAILURE,
          code: error && error.code ? error.code : 'PROVIDER_LOOKUP_FAILED',
        });
      }

    }

    return Object.freeze({
      bucketCount: verification.dataset.payload.buckets.length,
      lookup,
    });

  }

  return Object.freeze({
    KINDS,
    buildLookup,
    fixedBucketContains,
    normalizeHostname,
  });

});
