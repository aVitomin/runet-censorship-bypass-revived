'use strict';

const Assert = require('node:assert');
const Vm = require('node:vm');
const Codec = require('../provider-sources/domain-block-codec');
const Experiment = require('../provider-sources/domain-source-experiment');
const Preflight = require('../provider-sources/domain-list-preflight');

function clone(payload) {
  return JSON.parse(JSON.stringify(payload));
}

describe('Compact domain blocks (offline experiment)', function() {

  const hosts = Array.from({length: Codec.BLOCK_SIZE * 3 + 1},
      (_, index) => `site-${index}.example.com`);

  it('is deterministic and retains every exact host across block boundaries', function() {
    const payload = Codec.encode(hosts);
    const reversed = Codec.encode(hosts.slice().reverse().concat(hosts.slice(0, 3)));
    Assert.deepStrictEqual(payload, reversed);
    Assert.strictEqual(payload.blocks.length, 4);
    Assert.strictEqual(payload.ruleCount, hosts.length);
    const lookup = Codec.createLookup(payload);
    for (const host of hosts) {
      Assert.strictEqual(lookup.matches(host), true);
      Assert.strictEqual(lookup.matches(`child.${host}`), false);
      Assert.strictEqual(lookup.matches(host + '.invalid'), false);
    }
    Assert.strictEqual(lookup.matches('before.invalid'), false);
    Assert.strictEqual(lookup.matches('zzzz.zzzz'), false);
  });

  it('makes exact versus subdomain behavior explicit and preserves IDNs', function() {
    const payload = Codec.encode(['example.com', 'xn--e1afmkfd.xn--p1ai'],
        {policy: 'DOMAIN_AND_SUBDOMAINS'});
    const lookup = Codec.createLookup(payload);
    for (const host of ['EXAMPLE.COM.', 'a.b.example.com', 'xn--e1afmkfd.xn--p1ai']) {
      Assert.strictEqual(lookup.matches(host), true);
    }
    for (const host of ['notexample.com', 'example.com.invalid', 'com',
      'example.com..', 'user@example.com', 'a..example.com', '', null]) {
      Assert.strictEqual(lookup.matches(host), false);
    }
    Assert.throws(() => Codec.encode(['example.com'], {policy: 'UNKNOWN'}),
        {code: 'INVALID_FORMAT_OR_POLICY'});
  });

  it('handles extended prefixes without ambiguous record delimiters', function() {
    const suffix = 'b'.repeat(62) + '.example.com';
    const payload = Codec.encode(['a' + suffix, 'c' + suffix]);
    Assert.ok(payload.blocks[0].includes('|'));
    const lookup = Codec.createLookup(payload);
    Assert.strictEqual(lookup.matches('a' + suffix), true);
    Assert.strictEqual(lookup.matches('c' + suffix), true);
    Assert.strictEqual(lookup.matches('d' + suffix), false);
    const corrupt = clone(payload);
    corrupt.blocks[0] = corrupt.blocks[0].replace(/\|[a-f0-9]{2}/, '|00');
    Assert.throws(() => Codec.validate(corrupt), {code: 'INVALID_RECORD_PREFIX'});
  });

  it('rejects malformed metadata, unordered records and invalid host data', function() {
    const original = Codec.encode(hosts);
    const mutations = [
      (p) => { p.extra = true; },
      (p) => { p.ruleCount++; },
      (p) => { p.ruleCount = Codec.MAX_RULES + 1; },
      (p) => { p.blockSize++; },
      (p) => { p.blocks[0] = null; },
      (p) => { p.blocks[0] = 'x'.repeat(Codec.BLOCK_SIZE * 257 + 1); },
      (p) => { p.blocks[0] = 'B' + p.blocks[0].slice(1); },
      (p) => { p.blocks[0] = '|'; },
      (p) => { p.blocks[0] = 'Amo c.elpmaxe'; },
      (p) => { p.blocks[1] = p.blocks[0]; },
      (p) => { p.blocks[0] += 'Azzzz.zzzz'; },
    ];
    for (const mutate of mutations) {
      const corrupt = clone(original);
      mutate(corrupt);
      Assert.throws(() => Codec.createLookup(corrupt), TypeError);
    }
    Assert.throws(() => Codec.encode(['example.com";throw 1;']),
        {code: 'INVALID_HOST'});
    Assert.throws(() => Codec.encode([]), {code: 'INVALID_RULE_COUNT'});
  });

  it('owns immutable lookup data after validation', function() {
    const payload = clone(Codec.encode(['example.com']));
    const lookup = Codec.createLookup(payload);
    payload.blocks[0] = 'Amoc.live';
    payload.policy = 'DOMAIN_AND_SUBDOMAINS';
    Assert.strictEqual(lookup.matches('example.com'), true);
    Assert.strictEqual(lookup.matches('child.example.com'), false);
    Assert.strictEqual(lookup.matches('evil.com'), false);
  });

  it('matches an independent set oracle for both policies in generated PAC', function() {
    const source = new Set(hosts.concat(['example.net', 'xn--e1afmkfd.xn--p1ai']));
    for (const policy of ['EXACT_HOST', 'DOMAIN_AND_SUBDOMAINS']) {
      const payload = Codec.encode(Array.from(source), {policy});
      const portable = Codec.createLookup(payload);
      const context = {};
      Vm.runInNewContext(Experiment.createDiagnosticPac(payload), context,
          {timeout: 1000});
      for (const host of [...source, 'example.com', 'notexample.net', 'other.invalid']) {
        for (const query of [host, 'a.' + host, host + '.invalid']) {
          let expected = source.has(query);
          if (policy === 'DOMAIN_AND_SUBDOMAINS') {
            const labels = query.split('.');
            while (labels.length > 1) {
              expected ||= source.has(labels.join('.'));
              labels.shift();
            }
          }
          Assert.strictEqual(portable.matches(query), expected);
          Assert.strictEqual(context.FindProxyForURL('https://unused.invalid/', query),
              expected ? 'PROXY test.invalid:9' : 'DIRECT');
        }
      }
    }
  });

  it('keeps source rejection in force when inspecting the valid subset', function() {
    let observed;
    const result = Preflight.analyzeDomainList(Buffer.from('example.com\nbad url'), {
      inspectPreview({hosts: valid, rejectedLines}) {
        observed = {payload: Codec.encode(Array.from(valid)), rejectedLines};
      },
    });
    Assert.strictEqual(observed.rejectedLines, 1);
    Assert.strictEqual(observed.payload.ruleCount, 1);
    Assert.strictEqual(result.report.status, 'BLOCKED');
    Assert.strictEqual(result.report.activationEligible, false);
    Assert.strictEqual(result.artifactBytes, null);
  });

});
