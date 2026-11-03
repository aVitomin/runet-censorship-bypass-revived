'use strict';

(function publish(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.rucbSiteResources = api;
})(typeof globalThis === 'object' ? globalThis : this, function() {
  const LIMITS = Object.freeze({hosts: 100, requests: 1000, pending: 256,
    captureMs: 120000, retentionMs: 600000});

  function hostFromUrl(value) {
    if (typeof value !== 'string' || value.length > 8192) return '';
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase().replace(/\.+$/u, '');
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
          host.length > 253 || !host.split('.').every((label) =>
            /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(label))) return '';
      return host;
    } catch (_error) {
      return '';
    }
  }

  function matches(host, pattern) {
    const value = String(pattern).toLowerCase().replace(/\.+$/u, '');
    const wildcard = value.startsWith('*.');
    const base = hostFromUrl(`https://${wildcard ? value.slice(2) : value}/`);
    return Boolean(base) && (host === base || wildcard && host.endsWith(`.${base}`));
  }

  function ruleState(host, rules) {
    if (rules.direct.some((pattern) => matches(host, pattern))) return 'DIRECT';
    if (rules.proxy.some((pattern) => matches(host, pattern))) return 'PROXY';
    return 'NONE';
  }

  function selectedHosts(hosts, rows, rules) {
    if (!Array.isArray(hosts) || !hosts.length || hosts.length > LIMITS.hosts ||
        new Set(hosts).size !== hosts.length) throw new Error('RESOURCE_SELECTION_INVALID');
    const observed = new Set(rows.map((row) => row.host));
    if (hosts.some((host) => !observed.has(host) || hostFromUrl(`https://${host}/`) !== host ||
        ruleState(host, rules) !== 'NONE')) throw new Error('RESOURCE_SELECTION_INVALID');
    return hosts.slice();
  }

  function createCapture({tabId, host, now = Date.now}) {
    if (!Number.isSafeInteger(tabId) || tabId < 0 || hostFromUrl(`https://${host}/`) !== host) {
      throw new Error('RESOURCE_TARGET_INVALID');
    }
    const startedAt = now();
    const rows = new Map();
    const pending = new Map();
    let phase = 'CAPTURING';
    let reason = '';
    let count = 0;

    function stop(why = 'STOPPED') {
      if (phase === 'CAPTURING') {
        phase = 'STOPPED';
        reason = why;
      }
      pending.clear();
    }

    function clear(why = 'CLEARED') {
      stop(why);
      reason = why;
      rows.clear();
      phase = 'CLEARED';
    }

    function tick() {
      if (now() >= startedAt + LIMITS.retentionMs) clear('EXPIRED');
      else if (phase === 'CAPTURING' && now() >= startedAt + LIMITS.captureMs) stop('TIME');
    }

    function observe(kind, details) {
      tick();
      if (phase !== 'CAPTURING' || !details || details.tabId !== tabId ||
          details.incognito === true || !Number.isFinite(details.timeStamp) ||
          details.timeStamp < startedAt || details.timeStamp > now() + 1000) return;
      const target = hostFromUrl(details.url);
      if (details.type === 'main_frame' && target !== host) {
        clear('NAVIGATED');
        return;
      }
      if (!target || target === host || typeof details.requestId !== 'string' ||
          details.requestId.length > 128) return;
      if (kind === 'START') {
        if (++count > LIMITS.requests || !rows.has(target) && rows.size >= LIMITS.hosts ||
            !pending.has(details.requestId) && pending.size >= LIMITS.pending) {
          stop('LIMIT');
          return;
        }
        if (!rows.has(target)) rows.set(target, {host: target, requests: 0, failures: 0, types: new Set()});
        const row = rows.get(target);
        row.requests += 1;
        row.types.add(['image', 'media', 'script', 'stylesheet', 'xmlhttprequest', 'sub_frame']
            .includes(details.type) ? details.type : 'other');
        pending.set(details.requestId, target);
      } else if (pending.get(details.requestId) === target) {
        pending.delete(details.requestId);
        if (kind === 'ERROR' || Number.isInteger(details.statusCode) && details.statusCode >= 400) {
          rows.get(target).failures += 1;
        }
      }
    }

    function snapshot() {
      tick();
      return {phase, reason, host, tabId, rows: Array.from(rows.values(), (row) =>
        ({host: row.host, requests: row.requests, failures: row.failures,
          types: Array.from(row.types).sort()})).sort((a, b) => a.host.localeCompare(b.host))};
    }

    return Object.freeze({observe, stop, clear, snapshot});
  }

  function createAdapter({family, rpc, initLanguage = async () => {}}) {
    async function read() {
      if (family === 'chromium') {
        const result = await rpc('getState');
        const config = result.state.pacMods;
        await initLanguage(result.state.uiLanguage);
        const rules = {direct: [], proxy: []};
        for (const rule of (config.exceptions || []).concat(config.rules || [])) {
          if (rule.enabled !== false && ['DIRECT', 'PROXY'].includes(rule.action)) {
            rules[rule.action.toLowerCase()].push(rule.pattern);
          }
        }
        const canProxy = (config.ownProxies || []).some((proxy) => proxy.enabled !== false &&
          proxy.host && proxy.port) || ['localTor', 'torBrowser', 'warp'].some((key) =>
          config[key] && config[key].enabled === true && config[key].useForProxyRules !== false &&
          (key !== 'warp' || String(config[key].proxyString || '').trim()));
        return {revision: result.state.savedRevision, config, rules, canProxy: Boolean(canProxy)};
      }
      const result = await rpc({type: 'firefox.settings.get'});
      const config = result.settings;
      const canProxy = (config.ownProxies || []).some((proxy) => proxy.enabled === true) ||
        ['localTor', 'torBrowser'].some((key) => config[key] && config[key].useForProxyRules === true) ||
        config.warp && config.warp.useForProxyRules === true && config.warp.candidates.length > 0;
      return {revision: result.revision, config, rules: config.rules, canProxy: Boolean(canProxy)};
    }

    async function save(snapshot, hosts, rows) {
      if (!snapshot.canProxy) throw new Error('RESOURCE_PROXY_REQUIRED');
      const selection = selectedHosts(hosts, rows, snapshot.rules);
      const config = JSON.parse(JSON.stringify(snapshot.config));
      if (family === 'chromium') {
        config.exceptions.push(...selection.map((host) =>
          ({pattern: host, action: 'PROXY', enabled: true, note: ''})));
        await rpc('setPacMods', {expectedRevision: snapshot.revision, pacMods: config});
      } else {
        config.rules.proxy.push(...selection);
        await rpc({type: 'firefox.settings.replace', expectedRevision: snapshot.revision, settings: config});
      }
    }
    return Object.freeze({read, save});
  }

  return Object.freeze({LIMITS, hostFromUrl, matches, ruleState, selectedHosts, createCapture, createAdapter});
});
