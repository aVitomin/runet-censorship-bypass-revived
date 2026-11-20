'use strict';
/* global require */

(function publishLocalAntizapret(root, factory) {
  const parser = typeof module === 'object' && module.exports ?
    require('../../shared/antizapret-pac') : root.rucbAntizapretPac;
  const api = factory(parser);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.rucbFirefoxLocalAntizapret = api;
})(globalThis, function(Parser) {
  const IDENTITY = Object.freeze({
    providerKey: 'antizapret-local',
    datasetVersion: 'pac-snapshot-20261119',
    artifactSha256: 'fb194cb34c6a0d33b9842bf306dd93f0c54847c773e7fd412fb5249d70d53d93',
  });
  const ASSET = 'provider-data/antizapret-local.json';
  const {MAX_BYTES, ipv4, parsePac, invalidPac} = Parser;
  const SOURCE_URL = 'https://p.thenewone.lol:8443/proxy.pac';
  const RESULTS = Object.freeze({DIRECT: 'DIRECT', PROXY: 'PROXY', BLOCK: 'BLOCK'});

  function isIdentity(value) {
    return Boolean(value && Object.keys(value).length === 3 &&
      value.providerKey === IDENTITY.providerKey && /^[a-f0-9]{64}$/.test(value.artifactSha256) &&
      (value.datasetVersion === `pac-${value.artifactSha256.slice(0, 24)}` ||
        (value.artifactSha256 === IDENTITY.artifactSha256 &&
          value.datasetVersion === IDENTITY.datasetVersion)));
  }

  async function download(fetchImpl) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let reader;
    try {
      const response = await fetchImpl(SOURCE_URL, {
        credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error',
        cache: 'no-store', signal: controller.signal,
      });
      if (response.url === SOURCE_URL && !response.redirected && response.status === 403) {
        throw Object.assign(new Error('ANTIZAPRET_HTTP_403'), {code: 'ANTIZAPRET_HTTP_403'});
      }
      if (response.url !== SOURCE_URL || response.redirected || !response.ok ||
          response.status !== 200 || !response.body ||
          Number(response.headers.get('content-length')) > MAX_BYTES) throw invalidPac();
      reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8', {fatal: true});
      let size = 0;
      let text = '';
      while (!controller.signal.aborted) {
        const part = await reader.read();
        if (part.done) return text + decoder.decode();
        size += part.value.byteLength;
        if (size > MAX_BYTES) break;
        text += decoder.decode(part.value, {stream: true});
      }
      throw invalidPac();
    } finally {
      clearTimeout(timer);
      controller.abort();
      if (reader) reader.cancel().catch(() => undefined);
    }
  }

  function isIpv6(address) {
    if (typeof address !== 'string' || !/^[0-9a-f:.]+$/i.test(address) ||
        !address.includes(':')) return false;
    try {
      new URL(`http://[${address}]/`);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function createLookup(pack) {
    const suffixes = new Set(pack.suffixLabels);
    const short = new Set(pack.short);
    const addresses = new Set(pack.ipv4);
    const subnets = (pack.subnets || []).map((pair) => pair.map(ipv4));
    const patterns = Object.entries(pack.patterns);
    const domains = new Map(Object.entries(pack.domains).map(([zone, widths]) =>
      [zone, new Map(Object.entries(widths).map(([width, values]) =>
        [Number(width), new Set(values)]))]));
    function classifyHost(host) {
      const address = ipv4(host);
      if (address !== null) {
        const matched = addresses.has(address) ||
          subnets.some(([network, mask]) => (address & mask) === (network & mask));
        return matched ? RESULTS.PROXY : RESULTS.DIRECT;
      }
      if (host === '::1' || host === 'localhost' || host.endsWith('.localhost')) return RESULTS.DIRECT;
      if (isIpv6(host)) return RESULTS.PROXY;
      const parts = host.split('.');
      const width = suffixes.has(parts.at(-2)) ? 3 : 2;
      const normalized = parts.slice(-width).join('.').replace(/^www\.(.+)/, '$1');
      if (short.has(normalized)) return RESULTS.PROXY;
      const match = /^(.*)\.([^.]+)$/.exec(normalized);
      if (!match || !match[1] || host.endsWith('.local')) return RESULTS.BLOCK;
      let encoded = match[1];
      for (const [token, value] of patterns) encoded = encoded.split(value).join(token);
      const zone = domains.get(match[2]);
      const bucket = zone && zone.get(encoded.length);
      if (bucket && bucket.has(encoded)) return RESULTS.PROXY;
      // Do not disclose .onion names to the system resolver.
      if (host.endsWith('.onion')) return RESULTS.BLOCK;
      return null;
    }

    function classifyAddresses(found) {
      if (!Array.isArray(found) || !found.length || found.length > 16 ||
          !found.every((address) => ipv4(address) !== null || isIpv6(address))) {
        return RESULTS.BLOCK;
      }
      // Firefox can connect using HTTPS records or a different DNS cache partition.
      // A valid address lookup can only authorize the configured proxy for a name.
      return RESULTS.PROXY;
    }

    return Object.freeze({classifyHost, classifyAddresses});
  }

  async function load(readAsset, sha256) {
    const bytes = await readAsset(ASSET, MAX_BYTES);
    if (!bytes || bytes.byteLength > MAX_BYTES || await sha256(bytes) !== IDENTITY.artifactSha256) {
      throw new Error('ANTIZAPRET_LOCAL_SNAPSHOT_INVALID');
    }
    return createLookup(JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes)));
  }

  async function resolveDns(hostname, dns) {
    let timer;
    try {
      const lookup = dns.resolve(hostname).then((record) => record.addresses);
      const deadline = new Promise((done) => {
        timer = setTimeout(() => done(null), 750);
      });
      return await Promise.race([lookup, deadline]);
    } catch (_error) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return Object.freeze({
    IDENTITY, RESULTS, SOURCE_URL, MAX_BYTES, isIdentity, load, resolveDns,
    parsePac, download, createLookup,
  });
});
