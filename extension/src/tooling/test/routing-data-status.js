'use strict';

const Assert = require('node:assert/strict');
const Fs = require('node:fs');
const Path = require('node:path');
const Status = require('../../shared/routing-data-status');

describe('Routing data freshness presentation', function() {
  const now = Date.UTC(2026, 10, 2);
  const base = {source: 'antifilter', sourceUpdatedAt: null, lastCheckedAt: now,
    canCheck: true, updating: false, active: false};

  it('does not turn a successful recent check into fresh source data', function() {
    Assert.equal(Status.freshness(base, now), 'UNKNOWN');
    Assert.equal(Status.freshness({...base, sourceUpdatedAt: now - Status.OLD_AFTER_MS - 1}, now), 'OLD');
    Assert.equal(Status.freshness({...base, sourceUpdatedAt: now + 3600000}, now), 'UNKNOWN');
    Assert.equal(Status.freshness({...base, sourceUpdatedAt: now - 1000}, now), 'DATED');
    Assert.equal(Status.freshness({...base, source: 'manual'}, now), 'NONE');
  });

  it('rejects extra payloads and invalid timestamps instead of exposing them', function() {
    Assert.deepEqual(Status.validate(base), base);
    for (const patch of [{url: 'https://private.invalid/?secret=synthetic'},
      {sourceUpdatedAt: 'not-a-date'}, {lastCheckedAt: -1}, {source: 'untrusted'}, {active: 1}]) {
      Assert.throws(() => Status.validate({...base, ...patch}), /INVALID_ROUTING_DATA_STATUS/);
    }
  });

  it('provides equal nonempty routing-data messages in RU and EN for both targets', function() {
    let keys;
    for (const browser of ['chromium', 'firefox']) for (const locale of ['en', 'ru']) {
      const catalog = JSON.parse(Fs.readFileSync(Path.resolve(__dirname,
          `../../${browser}/_locales/${locale}/messages.json`), 'utf8'));
      const current = Object.keys(catalog).filter((key) => key.startsWith('routingData')).sort();
      if (keys) Assert.deepEqual(current, keys);
      keys = current;
      Assert.ok(current.length > 15);
      for (const key of current) Assert.ok(catalog[key].message.trim(), key);
    }
  });
});
