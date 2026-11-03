'use strict';

const Assert = require('node:assert/strict');
const Fs = require('node:fs');
const Path = require('node:path');
const Resources = require('../../shared/site-resources');

describe('Opt-in website resource discovery', function() {
  let time;
  let capture;
  const details = (patch = {}) => Object.assign({tabId: 4, incognito: false,
    timeStamp: 1000, requestId: 'request-1', url: 'https://cdn.example/video?q=private',
    type: 'media'}, patch);
  beforeEach(function() {
    time = 1000;
    capture = Resources.createCapture({tabId: 4, host: 'site.example', now: () => time});
  });

  it('retains only host counts and bounded types, never paths, queries or error text', function() {
    capture.observe('START', details());
    capture.observe('ERROR', details({error: 'private error text'}));
    Assert.deepEqual(capture.snapshot().rows, [{host: 'cdn.example', requests: 1,
      failures: 1, types: ['media']}]);
    Assert.doesNotMatch(JSON.stringify(capture.snapshot()), /private|video\?|request-1/u);
  });

  it('rejects credentials, unsupported URLs, malformed hosts and oversized input', function() {
    for (const url of ['https://user:password@site.example/', 'file:///private',
      'chrome://settings', 'https://-bad.example', 'https://' + 'a'.repeat(9000)]) {
      Assert.equal(Resources.hostFromUrl(url), '');
      capture.observe('START', details({url}));
    }
    Assert.deepEqual(capture.snapshot().rows, []);
    Assert.equal(Resources.hostFromUrl('https://CDN.example./path'), 'cdn.example');
    Assert.equal(Resources.hostFromUrl('https://пример.рф/'), 'xn--e1afmkfd.xn--p1ai');
  });

  it('ignores private/other tabs, requests predating consent and future timestamps', function() {
    for (const patch of [{incognito: true}, {tabId: -1}, {tabId: 5},
      {timeStamp: 999}, {timeStamp: 999999}, {timeStamp: undefined}]) {
      capture.observe('START', details(patch));
    }
    Assert.deepEqual(capture.snapshot().rows, []);
  });

  it('counts only failures correlated to a captured request and ignores duplicate completions', function() {
    capture.observe('ERROR', details());
    capture.observe('START', details());
    capture.observe('DONE', details({statusCode: 403}));
    capture.observe('ERROR', details());
    Assert.equal(capture.snapshot().rows[0].failures, 1);
  });

  it('clears collected domains on cross-site or protected top-level navigation', function() {
    capture.observe('START', details());
    capture.observe('START', details({type: 'main_frame', url: 'https://site.example/reload'}));
    Assert.equal(capture.snapshot().phase, 'CAPTURING');
    capture.observe('START', details({type: 'main_frame', url: 'about:blank'}));
    Assert.deepEqual(capture.snapshot().rows, []);
    Assert.equal(capture.snapshot().reason, 'NAVIGATED');
  });

  it('stops after two minutes and erases the result after ten minutes', function() {
    capture.observe('START', details());
    time += Resources.LIMITS.captureMs;
    Assert.equal(capture.snapshot().phase, 'STOPPED');
    capture.observe('START', details({requestId: 'late', timeStamp: time}));
    Assert.equal(capture.snapshot().rows[0].requests, 1);
    time = 1000 + Resources.LIMITS.retentionMs;
    Assert.equal(capture.snapshot().reason, 'EXPIRED');
    Assert.deepEqual(capture.snapshot().rows, []);
  });

  it('bounds host count and preserves the limit explanation when presenting results', function() {
    for (let n = 0; n <= Resources.LIMITS.hosts; n++) {
      capture.observe('START', details({url: `https://host${n}.example`, requestId: String(n)}));
    }
    capture.stop();
    Assert.equal(capture.snapshot().rows.length, Resources.LIMITS.hosts);
    Assert.equal(capture.snapshot().reason, 'LIMIT');
  });

  it('bounds request count and pending correlations independently', function() {
    for (let n = 0; n <= Resources.LIMITS.requests; n++) {
      const request = details({requestId: String(n)});
      capture.observe('START', request);
      capture.observe('DONE', request);
    }
    Assert.equal(capture.snapshot().rows[0].requests, Resources.LIMITS.requests);
    Assert.equal(capture.snapshot().reason, 'LIMIT');
    capture = Resources.createCapture({tabId: 4, host: 'site.example', now: () => time});
    for (let n = 0; n <= Resources.LIMITS.pending; n++) {
      capture.observe('START', details({requestId: String(n)}));
    }
    Assert.equal(capture.snapshot().rows[0].requests, Resources.LIMITS.pending);
    Assert.equal(capture.snapshot().reason, 'LIMIT');
  });

  it('preserves explicit Direct and Proxy scope without changing wildcard semantics', function() {
    const rules = {direct: ['*.cdn.example'], proxy: ['proxy.example']};
    Assert.equal(Resources.ruleState('video.cdn.example', rules), 'DIRECT');
    Assert.equal(Resources.ruleState('cdn.example', rules), 'DIRECT');
    Assert.equal(Resources.ruleState('notcdn.example', rules), 'NONE');
    Assert.equal(Resources.ruleState('proxy.example', rules), 'PROXY');
    Assert.equal(Resources.ruleState('sub.proxy.example', rules), 'NONE');
    Assert.equal(Resources.ruleState('xn--e1afmkfd.xn--p1ai',
        {direct: ['*.пример.рф'], proxy: []}), 'DIRECT');
    for (const hosts of [[], ['cdn.example'], ['unseen.example'], ['ok.example', 'ok.example']]) {
      Assert.throws(() => Resources.selectedHosts(hosts,
          [{host: 'cdn.example'}, {host: 'ok.example'}], rules));
    }
  });

  for (const family of ['chromium', 'firefox']) {
    it(`${family}: saves selected exact hosts through one revision-bound Saved call only`, async function() {
      const calls = [];
      const proxy = {enabled: true, host: 'proxy.example', port: 1080,
        password: '***', credentials: {mode: 'KEEP', username: 'synthetic'}};
      const config = family === 'chromium' ? {exceptions: [{pattern: 'direct.example',
        action: 'DIRECT', enabled: true}], rules: [{pattern: '*.legacy.example', action: 'DIRECT'}],
        ownProxies: [proxy], credentialRevision: 17} :
        {rules: {direct: ['direct.example'], proxy: []}, ownProxies: [proxy]};
      const original = JSON.stringify(config);
      const adapter = Resources.createAdapter({family, rpc: async (method, params) => {
        calls.push([method, params]);
        if (method === 'getState') return {state: {savedRevision: 12, pacMods: config}};
        if (method.type === 'firefox.settings.get') return {revision: 12, settings: config};
        return {};
      }});
      const saved = await adapter.read();
      if (family === 'chromium') Assert.equal(Resources.ruleState('x.legacy.example', saved.rules), 'DIRECT');
      await adapter.save(saved, ['cdn.example'], [{host: 'cdn.example'}]);
      Assert.equal(calls.length, 2);
      const payload = family === 'chromium' ? calls[1][1] : calls[1][0];
      Assert.equal(payload.expectedRevision, 12);
      Assert.equal(family === 'chromium' ? calls[1][0] : payload.type,
          family === 'chromium' ? 'setPacMods' : 'firefox.settings.replace');
      const next = payload.pacMods || payload.settings;
      Assert.deepEqual(next.ownProxies, [proxy]);
      Assert.equal(JSON.stringify(config), original);
      Assert.deepEqual(family === 'chromium' ? next.exceptions.at(-1) : next.rules.proxy,
          family === 'chromium' ? {pattern: 'cdn.example', action: 'PROXY', enabled: true, note: ''} : ['cdn.example']);
    });

    it(`${family}: refuses missing proxy candidates and does not retry revision conflicts`, async function() {
      let writes = 0;
      const adapter = Resources.createAdapter({family, rpc: async () => {
        writes += 1;
        throw new Error('SAVED_REVISION_CHANGED');
      }});
      const config = {exceptions: [], rules: {direct: [], proxy: []}};
      const snapshot = {revision: 1, canProxy: false, config, rules: {direct: [], proxy: []}};
      await Assert.rejects(adapter.save(snapshot, ['cdn.example'], [{host: 'cdn.example'}]),
          /RESOURCE_PROXY_REQUIRED/u);
      Assert.equal(writes, 0);
      snapshot.canProxy = true;
      await Assert.rejects(adapter.save(snapshot, ['cdn.example'], [{host: 'cdn.example'}]),
          /SAVED_REVISION_CHANGED/u);
      Assert.equal(writes, 1);
    });
  }

  it('has matching localized messages and only local entrypoint scripts in both browsers', function() {
    let expected;
    for (const target of ['chromium', 'firefox']) for (const locale of ['ru', 'en']) {
      const dir = Path.resolve(__dirname, '../../', target);
      const catalog = JSON.parse(Fs.readFileSync(Path.join(dir, '_locales', locale, 'messages.json')));
      const keys = Object.keys(catalog).filter((key) => key.startsWith('resources')).sort();
      if (expected) Assert.deepEqual(keys, expected);
      expected = keys;
      Assert.equal(keys.length, 37);
      for (const key of keys) Assert.ok(catalog[key].message.trim());
      const html = Fs.readFileSync(Path.join(dir, 'pages/resources/index.html'), 'utf8');
      Assert.doesNotMatch(html, /https?:|onload=|onclick=/u);
      Assert.match(html, /site-resources-ui\.js/u);
    }
  });
});
