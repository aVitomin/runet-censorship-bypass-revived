'use strict';

function createDomainSourcePolicy(tldts) {
  const QUARANTINE = Object.freeze({maxRejected: 100, maxRejectedRatio: 0.0001,
    minimumRules: 1500000, minimumRetainedRatio: 0.9});

  function reject(code) {
    const error = new TypeError(code);
    error.code = code;
    throw error;
  }

  function normalizeDomain(line) {
    if (!line || /[\s/@:#?%\\*]/u.test(line)) reject('NON_HOST_SYNTAX');
    let host;
    try {
      host = new URL('https://' + line).hostname.toLowerCase().replace(/\.$/, '');
    } catch (error) {
      reject('INVALID_DNS_HOSTNAME');
    }
    // URL hosts may include underscores. Do not silently turn these into a
    // hyphen or drop a working exact-host rule. Retain bounded label lengths.
    if (host.length > 253 ||
        !/^(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?\.)+[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?$/.test(host)) {
      reject('INVALID_DNS_HOSTNAME');
    }
    const parsed = tldts.parse(host, {allowPrivateDomains: true});
    if (parsed.isIp || !parsed.domain) reject('IP_OR_PUBLIC_SUFFIX');
    return host;
  }

  function assess(stats, mode = 'STRICT', previousRules) {
    if (!['STRICT', 'QUARANTINE_INVALID_V1'].includes(mode)) reject('INVALID_POLICY');
    const blockers = [];
    if (!Number.isSafeInteger(stats.lines) || stats.lines < 1 ||
        !Number.isSafeInteger(stats.ruleCount) || stats.ruleCount < 1 ||
        !Number.isSafeInteger(stats.rejectedLines) || stats.rejectedLines < 0 ||
        stats.ruleCount + stats.rejectedLines > stats.lines) reject('INVALID_COUNTS');
    if (mode === 'STRICT' && stats.rejectedLines) blockers.push('REJECTED_SOURCE_ROWS');
    if (mode === 'QUARANTINE_INVALID_V1') {
      if (stats.rejectedLines > QUARANTINE.maxRejected ||
          stats.rejectedLines / stats.lines > QUARANTINE.maxRejectedRatio) {
        blockers.push('QUARANTINE_LIMIT');
      }
      if (stats.ruleCount < QUARANTINE.minimumRules) blockers.push('TOO_FEW_RULES');
      if (previousRules !== undefined) {
        if (!Number.isSafeInteger(previousRules) || previousRules < 1) {
          reject('INVALID_PREVIOUS_RULE_COUNT');
        }
        if (stats.ruleCount / previousRules < QUARANTINE.minimumRetainedRatio) {
          blockers.push('UNEXPECTED_RULE_LOSS');
        }
      }
    }
    return {mode, accepted: !blockers.length, blockers,
      excludedRows: stats.rejectedLines, activationEligible: false};
  }

  return Object.freeze({normalizeDomain, assess, QUARANTINE});
}

/* global require */
(function publish(root) {
  const commonJs = typeof module === 'object' && module.exports;
  const api = Object.freeze(Object.assign({}, createDomainSourcePolicy(
    commonJs ? require('tldts') : root.tldts), {factorySource: createDomainSourcePolicy.toString()}));
  if (commonJs) module.exports = api;
  else root.rucbDomainSourcePolicy = api;
})(typeof globalThis === 'object' ? globalThis : this);
