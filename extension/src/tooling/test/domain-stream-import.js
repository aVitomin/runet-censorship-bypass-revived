'use strict';

const Assert = require('node:assert');
const Codec = require('../provider-sources/domain-block-codec');
const Policy = require('../provider-sources/domain-source-policy');
const Importer = require('../provider-sources/domain-stream-import');

function memoryStore() {
  const runs = new Map();
  return {cleaned: false, runs,
    async writeRun(id, values) { runs.set(id, values.slice()); },
    async *openRun(id) { yield* runs.get(id); },
    async cleanup() { runs.clear(); this.cleaned = true; },
  };
}
async function* chunks(text, size = 17) {
  const bytes = Buffer.from(text);
  for (let at = 0; at < bytes.length; at += size) yield bytes.subarray(at, at + size);
}

describe('Streaming domain import', function() {
  it('accepts URL underscores without confusing compact record markers', async function() {
    const source = '_service.example.com\r\nпример.рф\nExample.com.\nexample.com\n';
    const store = memoryStore();
    const result = await Importer.importStream(chunks(source, 1), store);
    Assert.strictEqual(result.status, 'PREPARED_INACTIVE');
    Assert.strictEqual(result.activationEligible, false);
    Assert.strictEqual(result.stats.ruleCount, 3);
    Assert.strictEqual(result.stats.duplicates, 1);
    Assert.strictEqual(store.cleaned, true);
    const lookup = Codec.createLookup(result.payload);
    Assert.strictEqual(lookup.matches('_service.example.com'), true);
    Assert.strictEqual(lookup.matches('service.example.com'), false);
    Assert.strictEqual(lookup.matches('child.example.com'), false);
    Assert.strictEqual(Policy.normalizeDomain('пример.рф'), 'xn--e1afmkfd.xn--p1ai');
  });

  it('matches independent in-memory encoding across multiple sort runs', async function() {
    const hosts = Array.from({length: Importer.LIMITS.runRecords + 53},
        (_, i) => `site-${i}.example.com`);
    const result = await Importer.importStream(chunks(
        hosts.slice().reverse().concat(hosts.slice(0, 20)).join('\n'), 65536), memoryStore());
    Assert.strictEqual(result.stats.runCount, 2);
    Assert.strictEqual(result.stats.maximumBufferedRecords, Importer.LIMITS.runRecords);
    Assert.strictEqual(result.stats.duplicates, 20);
    Assert.deepStrictEqual(result.payload, Codec.encode(hosts));
  });

  it('retains whole-source rejection by default and does not repair bad rows', async function() {
    const result = await Importer.importStream(chunks(
        'example.com\n"example.net\nhttps://example.org\nkh.ua\n192.0.2.1'), memoryStore());
    Assert.strictEqual(result.status, 'BLOCKED');
    Assert.strictEqual(result.payload, null);
    Assert.strictEqual(result.stats.rejectedLines, 4);
    Assert.strictEqual(result.activationEligible, false);
  });

  it('bounds explicit quarantine by count, ratio, minimum size and previous count', function() {
    const base = {lines: 1769711, ruleCount: 1768522, rejectedLines: 34};
    Assert.strictEqual(Policy.assess(base).accepted, false);
    Assert.strictEqual(Policy.assess(base, 'QUARANTINE_INVALID_V1').accepted, true);
    const rejected = [
      {...base, rejectedLines: 101},
      {lines: 10000, ruleCount: 9998, rejectedLines: 2},
      {...base, ruleCount: 1499999},
    ];
    for (const stats of rejected) {
      Assert.strictEqual(Policy.assess(stats, 'QUARANTINE_INVALID_V1').accepted, false);
    }
    Assert.ok(Policy.assess(base, 'QUARANTINE_INVALID_V1', 2000000)
        .blockers.includes('UNEXPECTED_RULE_LOSS'));
  });

  it('rejects malformed UTF-8, long rows and cancellation and cleans scratch', async function() {
    const cases = [
      {source: [Buffer.from([0xc3])], code: 'INVALID_UTF8'},
      {source: chunks('a'.repeat(4097)), code: 'LINE_TOO_LONG'},
      {source: [new Uint16Array(1)], code: 'INVALID_SOURCE_CHUNK'},
      {source: [Buffer.alloc(Importer.LIMITS.sourceBytes + 1)], code: 'SOURCE_TOO_LARGE'},
      {source: chunks('example.com'), options: {signal: {aborted: true}}, code: 'IMPORT_ABORTED'},
    ];
    for (const test of cases) {
      const store = memoryStore();
      await Assert.rejects(() => Importer.importStream(test.source, store, test.options),
          {code: test.code});
      Assert.strictEqual(store.cleaned, true);
    }
  });

  it('subdivides coalesced browser chunks without raising the total source cap', async function() {
    const source = Buffer.from('example.com\n'.repeat(100000));
    Assert.ok(source.length > Importer.LIMITS.chunkBytes);
    const result = await Importer.importStream([source], memoryStore());
    Assert.strictEqual(result.stats.lines, 100000);
    Assert.strictEqual(result.stats.ruleCount, 1);
    Assert.strictEqual(result.stats.duplicates, 99999);
    Assert.strictEqual(result.stats.maximumBufferedRecords, Importer.LIMITS.runRecords);
  });

  it('rejects truncated scratch data and propagates storage failures', async function() {
    const store = memoryStore();
    store.openRun = async function*() { yield 'moc.elpmaxe.a'; };
    await Assert.rejects(() => Importer.importStream(
        chunks('a.example.com\nb.example.com'), store), {code: 'TRUNCATED_SORT_RUN'});
    Assert.strictEqual(store.cleaned, true);
    const failed = memoryStore();
    failed.writeRun = async () => { throw new Error('DISK_FULL'); };
    await Assert.rejects(() => Importer.importStream(chunks('example.com'), failed), /DISK_FULL/);
    Assert.strictEqual(failed.cleaned, true);
    const corrupt = memoryStore();
    corrupt.openRun = async function*() { yield 'x'.repeat(254); };
    await Assert.rejects(() => Importer.importStream(chunks('example.com'), corrupt),
        {code: 'CORRUPT_SORT_RUN'});
    Assert.strictEqual(corrupt.cleaned, true);
  });

  it('does not begin reading a source when cancellation is already requested', async function() {
    let reads = 0;
    async function* source() { reads++; yield Buffer.from('example.com'); }
    const store = memoryStore();
    await Assert.rejects(() => Importer.importStream(source(), store,
        {signal: {aborted: true}}), {code: 'IMPORT_ABORTED'});
    Assert.strictEqual(reads, 0);
    Assert.strictEqual(store.cleaned, true);
  });
});
