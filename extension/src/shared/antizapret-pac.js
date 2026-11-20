'use strict';

(function publishAntizapretPac(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.rucbAntizapretPac = api;
})(globalThis, function() {
  const MAX_BYTES = 2 * 1024 * 1024;

  function ipv4(address) {
    if (typeof address !== 'string' || !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(address)) return null;
    const bytes = address.split('.').map(Number);
    if (bytes.some((byte) => byte > 255)) return null;
    return bytes.reduce((value, byte) => value * 256 + byte, 0);
  }

  function invalidPac() {
    return new TypeError('ANTIZAPRET_INVALID_PAC');
  }

  function quotedLiteral(source, name) {
    const marker = '\nvar ' + name + ' = "';
    const first = source.indexOf(marker);
    if (first < 0 || source.indexOf(marker, first + marker.length) >= 0) throw invalidPac();
    const start = first + marker.length - 1;
    let end = start + 1;
    for (; end < source.length; end++) {
      if (source[end] === '\\') end++;
      else if (source[end] === '"') break;
    }
    const tail = source.slice(end + 1, end + 17);
    if (!(name === 'd_ipaddr' ? /^\.split\(" "\);/ : /^\s*;/).test(tail)) throw invalidPac();
    return JSON.parse(source.slice(start, end + 1).replace(/\\\n/g, ''));
  }

  function parsePac(text) {
    if (typeof text !== 'string' || !text.length || text.length > MAX_BYTES) throw invalidPac();
    const source = '\n' + text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    if (!source.startsWith('\n// ProstoVPN.AntiZapret PAC-host File\n')) throw invalidPac();
    const layoutText = /^domains = (\{[^;]+\});/m.exec(source);
    const suffixes = /if \(\/\\\.\(([a-z0-9|-]+)\)\\\.\[\^\.\]\+\$\/\.test\(host\)\)/.exec(source);
    const short = /^ {2}fbtw = (\[[^;]+\]);/m.exec(source);
    const subnetText = /^var special = (\[[^;]+\]);/m.exec(source);
    const patternMaps = Array.from(source.matchAll(/\bvar patterns = (\{[^\n]+\});/g), (match) => match[1]);
    if (!layoutText || !suffixes || !short || !subnetText || patternMaps.length !== 2 ||
        patternMaps.some((value) => value.length > 8192)) throw invalidPac();
    const [patterns, maskPatterns] = patternMaps.map((value) => JSON.parse(value.replace(/'/g, '"')));
    if (!Object.entries(patterns).every(([key, value]) =>
      /^[!-~]{1,8}$/.test(key) && typeof value === 'string' && /^[a-z0-9.-]{1,16}$/.test(value))) {
      throw invalidPac();
    }
    let masks = quotedLiteral(source, 'mask_lzp');
    for (const [key, value] of Object.entries(maskPatterns)) {
      if (!/^[A-Za-z0-9+/]{2}$/.test(key) || typeof value !== 'string' ||
          !/^[^A-Za-z0-9+/=]$/.test(value)) throw invalidPac();
      masks = masks.split(value).join(key);
    }
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(masks)) throw invalidPac();
    const packed = quotedLiteral(source, 'domains_lzp');
    const layout = JSON.parse(layoutText[1].replace(/([,{])\s*(\d+):/g, '$1"$2":'));
    const domains = Object.create(null);
    const table = new Uint8Array(1 << 18);
    const raw = new Uint8Array(MAX_BYTES);
    let history = 0;
    let cursor = 0;
    let count = 0;
    for (const character of atob(masks)) {
      const mask = character.charCodeAt(0);
      for (let bit = 0; bit < 8; bit++) {
        let value;
        if (mask & (1 << bit)) value = table[history];
        else {
          if (cursor === packed.length) break;
          value = packed.charCodeAt(cursor++);
          table[history] = value;
        }
        if (value < 33 || value > 126 || count === raw.length) throw invalidPac();
        raw[count++] = value;
        history = ((history << 7) ^ value) & (table.length - 1);
      }
    }
    if (cursor !== packed.length) throw invalidPac();
    const pool = new TextDecoder().decode(raw.subarray(0, count));
    let offset = 0;
    for (const [zone, widths] of Object.entries(layout)) {
      if (!/^[a-z0-9-]{1,63}$/.test(zone) || !widths || Array.isArray(widths) ||
          typeof widths !== 'object') throw invalidPac();
      const groups = Object.create(null);
      for (const [width, size] of Object.entries(widths)) {
        const step = Number(width);
        if (!/^\d{1,3}$/.test(width) || step < 1 || step > 253 ||
            !Number.isSafeInteger(size) || size < 1 || size % step ||
            offset + size > pool.length) throw invalidPac();
        const rows = [];
        const end = offset + size;
        for (; offset < end; offset += step) rows.push(pool.slice(offset, offset + step));
        groups[width] = rows;
      }
      domains[zone] = groups;
    }
    if (!offset || offset !== pool.length) throw invalidPac();
    let address = 0;
    const addresses = quotedLiteral(source, 'd_ipaddr').trim().split(/\s+/).map((token) => {
      if (!/^[a-z0-9]{1,7}$/i.test(token)) throw invalidPac();
      address += parseInt(token, 36);
      if (address > 0xffffffff) throw invalidPac();
      return address;
    });
    const shortHosts = JSON.parse(short[1].replace(/'/g, '"'));
    if (shortHosts.length > 128 || !shortHosts.every((host) =>
      typeof host === 'string' && /^[a-z0-9.-]{1,253}$/.test(host))) throw invalidPac();
    const subnets = JSON.parse(subnetText[1].replace(/'/g, '"').replace(/,\s*\]/g, ']'));
    if (subnets.length > 4096 || !subnets.every((pair) =>
      Array.isArray(pair) && pair.length === 2 && pair.every((value) => ipv4(value) !== null))) {
      throw invalidPac();
    }
    return {
      domains, ipv4: addresses, subnets, patterns, short: shortHosts,
      suffixLabels: suffixes[1].split('|'),
    };
  }

  return Object.freeze({MAX_BYTES, ipv4, invalidPac, parsePac});
});
