'use strict';

// Package-owned codec for declarative domain data. No network or downloaded code.
(function publishDomainBlockCodec(root, factory) {
  const api = Object.freeze(Object.assign({}, factory(), {
    factorySource: factory.toString(),
  }));
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
    return;
  }
  root.rucbDomainBlockCodec = api;
})(typeof globalThis === 'object' ? globalThis : this, createDomainBlockCodec);
function createDomainBlockCodec() {

  const FORMAT = 'REVERSED_DOMAIN_BLOCKS_V1';
  const BLOCK_SIZE = 128;
  const MAX_RULES = 2000000;
  const MAX_BYTES = 16 * 1024 * 1024;
  // Markers never overlap DNS characters, so records need no separator byte.
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!#$%&()*+,/:;<=>?@[]^`{}~';
  const POLICIES = ['EXACT_HOST', 'DOMAIN_AND_SUBDOMAINS'];

  function fail(code, bytes) {
    const error = new TypeError(code);
    error.code = code;
    if (bytes !== undefined) error.bytes = bytes;
    throw error;
  }

  function reverse(value) {
    return value.split('').reverse().join('');
  }

  function validHost(host) {
    return typeof host === 'string' && host.length <= 253 &&
      /^(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?\.)+[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?$/.test(host);
  }

  function commonPrefix(left, right) {
    let prefix = 0;
    while (prefix < left.length && prefix < right.length &&
        left[prefix] === right[prefix]) prefix++;
    return prefix;
  }

  function prefixCode(length) {
    return length < ALPHABET.length ? ALPHABET[length] :
      '|' + length.toString(16).padStart(2, '0');
  }

  function readRecord(block, offset, previous) {
    const extended = block[offset] === '|';
    const headerLength = extended ? 3 : 1;
    const digits = block.slice(offset + 1, offset + 3);
    const prefix = extended && /^[a-f0-9]{2}$/.test(digits) ?
      parseInt(digits, 16) : ALPHABET.indexOf(block[offset]);
    let end = offset + headerLength;
    while (end < block.length) {
      const code = block.charCodeAt(end);
      if (!(code === 45 || code === 46 || code === 95 || (code >= 48 && code <= 57) ||
          (code >= 97 && code <= 122))) break;
      end++;
    }
    if (prefix < 0 || prefix > previous.length ||
        (extended && prefix < ALPHABET.length) ||
        end <= offset + headerLength) fail('INVALID_RECORD_PREFIX');
    return {
      value: previous.slice(0, prefix) + block.slice(offset + headerLength, end),
      offset: end,
      prefix,
    };
  }

  function validate(payload) {
    const fields = ['format', 'policy', 'blockSize', 'ruleCount', 'blocks'];
    if (!payload || typeof payload !== 'object' ||
        Object.keys(payload).length !== fields.length ||
        fields.some((field) => !Object.prototype.hasOwnProperty.call(payload, field))) {
      fail('INVALID_PAYLOAD_FIELDS');
    }
    if (payload.format !== FORMAT || payload.blockSize !== BLOCK_SIZE ||
        !POLICIES.includes(payload.policy)) fail('INVALID_FORMAT_OR_POLICY');
    if (!Number.isSafeInteger(payload.ruleCount) || payload.ruleCount < 1 ||
        payload.ruleCount > MAX_RULES || !Array.isArray(payload.blocks) ||
        payload.blocks.length !== Math.ceil(payload.ruleCount / BLOCK_SIZE)) {
      fail('INVALID_RULE_COUNT');
    }
    let previousGlobal = '';
    let totalBytes = 0;
    const keys = [];
    for (let index = 0; index < payload.blocks.length; index++) {
      const block = payload.blocks[index];
      if (typeof block !== 'string' || !block ||
          block.length > BLOCK_SIZE * 257) fail('INVALID_BLOCK_SIZE');
      totalBytes += block.length;
      if (totalBytes > MAX_BYTES) fail('ARTIFACT_TOO_LARGE');
      let offset = 0;
      let previous = '';
      let count = 0;
      while (offset < block.length) {
        const record = readRecord(block, offset, previous);
        if (++count > BLOCK_SIZE || record.value <= previousGlobal ||
            !validHost(reverse(record.value)) ||
            record.prefix !== commonPrefix(previous, record.value)) {
          fail('INVALID_RECORD_ORDER_OR_HOST');
        }
        if (count === 1) keys.push(record.value);
        previous = previousGlobal = record.value;
        offset = record.offset;
      }
      const expected = Math.min(BLOCK_SIZE, payload.ruleCount - index * BLOCK_SIZE);
      if (count !== expected) fail('BLOCK_COUNT_MISMATCH');
    }
    // Validated characters are ASCII without JSON escapes; this is also bytes.
    if (JSON.stringify(payload).length > MAX_BYTES) fail('ARTIFACT_TOO_LARGE');
    return keys;
  }

  function encode(hosts, {policy = 'EXACT_HOST'} = {}) {
    if (!Array.isArray(hosts) || !hosts.length || hosts.length > MAX_RULES) {
      fail('INVALID_RULE_COUNT');
    }
    if (!POLICIES.includes(policy)) fail('INVALID_FORMAT_OR_POLICY');
    const reversed = hosts.map((host) => {
      if (!validHost(host)) fail('INVALID_HOST');
      return reverse(host);
    }).sort();
    const encoder = createEncoder(policy);
    for (const host of reversed) encoder.addReversed(host);
    return encoder.finish();
  }

  function createEncoder(policy = 'EXACT_HOST') {
    if (!POLICIES.includes(policy)) fail('INVALID_FORMAT_OR_POLICY');
    const blocks = [];
    let count = 0;
    let block = '';
    let previous = '';
    let previousGlobal = '';
    let bytes = 0;
    let finished = false;
    function addReversed(host) {
      if (finished) fail('ENCODER_FINISHED');
      if (!validHost(reverse(host)) || host < previousGlobal) fail('INVALID_SORTED_HOST');
      if (host === previousGlobal) return;
      if (count >= MAX_RULES) fail('INVALID_RULE_COUNT');
      if (count % BLOCK_SIZE === 0) {
        if (block) blocks.push(block);
        block = '';
        previous = '';
      }
      const prefix = commonPrefix(previous, host);
      const record = prefixCode(prefix) + host.slice(prefix);
      bytes += record.length;
      if (bytes > MAX_BYTES) fail('ARTIFACT_TOO_LARGE', bytes);
      block += record;
      previous = previousGlobal = host;
      count++;
    }
    function finish() {
      if (finished) fail('ENCODER_FINISHED');
      finished = true;
      if (block) blocks.push(block);
      const payload = {format: FORMAT, policy, blockSize: BLOCK_SIZE,
        ruleCount: count, blocks};
      const byteCount = JSON.stringify(payload).length;
      if (byteCount > MAX_BYTES) fail('ARTIFACT_TOO_LARGE', byteCount);
      validate(payload);
      return Object.freeze(Object.assign({}, payload, {blocks: Object.freeze(blocks)}));
    }
    return Object.freeze({addReversed, finish});
  }

  function createLookup(payload) {
    const keys = validate(payload);
    // Own the immutable index so caller mutations cannot change lookup results.
    const blocks = payload.blocks.slice();
    const subdomains = payload.policy === 'DOMAIN_AND_SUBDOMAINS';
    function contains(reversed) {
      let low = 0;
      let high = keys.length;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (keys[middle] <= reversed) low = middle + 1;
        else high = middle;
      }
      if (!low) return false;
      const block = blocks[low - 1];
      let previous = '';
      let offset = 0;
      while (offset < block.length) {
        const record = readRecord(block, offset, previous);
        if (record.value === reversed) return true;
        if (record.value > reversed) return false;
        previous = record.value;
        offset = record.offset;
      }
      return false;
    }
    return Object.freeze({
      ruleCount: payload.ruleCount,
      matches(host) {
        if (typeof host !== 'string') return false;
        host = host.toLowerCase().replace(/\.$/, '');
        if (!validHost(host)) return false;
        let reversed = reverse(host);
        while (reversed.includes('.')) {
          if (contains(reversed)) return true;
          if (!subdomains) break;
          reversed = reversed.slice(0, reversed.lastIndexOf('.'));
        }
        return false;
      },
    });
  }

  return Object.freeze({FORMAT, BLOCK_SIZE, MAX_RULES, MAX_BYTES,
    encode, createEncoder, validate, createLookup});

}
