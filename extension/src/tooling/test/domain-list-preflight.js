'use strict';

const Assert = require('node:assert');
const Crypto = require('node:crypto');
const Fs = require('node:fs');
const Os = require('node:os');
const Path = require('node:path');
const Vm = require('node:vm');
const Dataset = require('../../shared/provider-dataset');
const Lookup = require('../../firefox/background/provider-lookup');
const Preflight = require('../provider-sources/domain-list-preflight');

function analyze(text) {

  return Preflight.analyzeDomainList(Buffer.from(text));

}

describe('Offline domain source preflight', function() {

  it('normalizes IDNs and deduplicates only covered suffix rules', function() {

    const first = analyze('Example.com\r\na.example.com\r\nexample.com.\n' +
      'пример.рф\nxn--e1afmkfd.xn--p1ai\nnotexample.com\n');
    const second = analyze('notexample.com\nпример.рф\nexample.com');
    Assert.strictEqual(first.report.lines, 6);
    Assert.strictEqual(first.report.duplicates, 2);
    Assert.strictEqual(first.report.coveredSubdomains, 1);
    Assert.strictEqual(first.report.preview.ruleCount, 3);
    Assert.deepStrictEqual(first.artifactBytes, second.artifactBytes);
    Assert.strictEqual(first.report.activationEligible, false);

  });

  it('does not silently accept a partially malformed list', function() {

    const result = analyze('example.com\nhttps://example.net\n' +
      '*.example.org\nuser:secret@example.net\nexample.net/path\n' +
      '<html>\nwhite space.com\n192.0.2.1\ncom\nkh.ua\ngithub.io\n' +
      'a..example.net\n-bad.example.net\n\n');
    Assert.strictEqual(result.report.status, 'BLOCKED');
    Assert.strictEqual(result.report.rejectedLines, 13);
    Assert.strictEqual(result.report.uniqueValidHosts, 1);
    Assert.strictEqual(result.artifactBytes, null);
    Assert.ok(result.report.blockers.includes('REJECTED_SOURCE_ROWS'));
    Assert.ok(!JSON.stringify(result.report).includes('secret'));

  });

  it('rejects invalid UTF-8, empty input and excessive line length', function() {

    Assert.throws(() => Preflight.analyzeDomainList(Buffer.from([0xc3, 0x28])),
        {code: 'INVALID_UTF8'});
    Assert.throws(() => analyze(''), {code: 'SOURCE_BYTES_REQUIRED'});
    Assert.throws(() => analyze('a'.repeat(Preflight.MAX_LINE_BYTES + 1)),
        {code: 'LINE_TOO_LONG'});
    Assert.throws(() => Preflight.analyzeDomainList(
        Buffer.alloc(Preflight.MAX_SOURCE_BYTES + 1)), {code: 'SOURCE_TOO_LARGE'});

  });

  it('produces a strictly verified, inactive Firefox preview with suffix lookup',
      async function() {

        const {report, artifactBytes} = analyze('example.com\na.example.com\n' +
          'пример.рф');
        const verification = await Dataset.verifyProviderDataset({
          envelope: {
            schemaVersion: Dataset.SCHEMA_VERSION,
            routeTableVersion: Dataset.ROUTE_TABLE_VERSION,
            providerKey: 'antifilter-experiment',
            datasetVersion: 'synthetic.1',
            generatedAt: '2026-10-29T00:00:00.000Z',
            sourceRevisions: [{sourceId: 'synthetic-domain-list',
              revision: report.source.sha256}],
            ruleCount: report.preview.ruleCount,
            artifactByteCount: artifactBytes.length,
            artifactSha256: report.preview.sha256,
          },
          artifactBytes,
          trust: Dataset.TRUST.REMOTE_UNAUTHENTICATED,
          sha256: async (bytes) => Crypto.createHash('sha256')
              .update(bytes).digest('hex'),
        });
        Assert.strictEqual(verification.ok, true, JSON.stringify(verification));
        Assert.strictEqual(verification.activationEligible, false);
        const lookup = Lookup.buildLookup(verification);
        for (const host of ['example.com', 'A.EXAMPLE.COM.',
          'xn--e1afmkfd.xn--p1ai']) {
          Assert.strictEqual(lookup.lookup(host).kind, 'PROVIDER_PROXY');
        }
        for (const host of ['notexample.com', 'example.com.evil.net']) {
          Assert.strictEqual(lookup.lookup(host).kind, 'MISS');
        }

      });

  it('blocks rule and size overflow without truncating the input', function() {

    this.timeout(30000);
    const prefix = 'a'.repeat(50) + '.';
    const lines = Array.from({length: Dataset.LIMITS.MAX_RULES + 1},
        (_, index) => `${prefix}host-${index}.example.com`);
    const result = analyze(lines.join('\n'));
    Assert.strictEqual(result.report.lines, lines.length);
    Assert.strictEqual(result.report.preview.ruleCount, lines.length);
    Assert.strictEqual(result.artifactBytes, null);
    Assert.ok(result.report.blockers.includes('FIREFOX_RULE_LIMIT'));
    Assert.ok(result.report.blockers.includes('FIREFOX_ARTIFACT_LIMIT'));
    Assert.strictEqual(result.report.chromium.previewFitsPacBudget, false);

  });

  it('keeps its Chromium budget equal to the actual cooker limit', function() {

    // Execute only trusted repository code, never the downloaded domain list.
    const context = {self: {}};
    Vm.runInNewContext(Fs.readFileSync(require.resolve(
        '../../chromium/background/pac-cook'), 'utf8'), context, {timeout: 1000});
    Assert.strictEqual(Preflight.CHROMIUM_PAC_BYTE_LIMIT,
        context.self.mv3PacCook.MAX_PAC_BYTES);

  });

  it('reads a local input with a size bound and rejects oversized files',
      async function() {

        const directory = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'domain-list-'));
        const filename = Path.join(directory, 'input.lst');
        try {
          Fs.writeFileSync(filename, 'example.com\n');
          Assert.strictEqual((await Preflight.readBoundedFile(filename))
              .toString(), 'example.com\n');
          Fs.truncateSync(filename, Preflight.MAX_SOURCE_BYTES + 1);
          await Assert.rejects(() => Preflight.readBoundedFile(filename),
              {code: 'INVALID_SOURCE_FILE_SIZE'});
        } finally {
          Fs.unlinkSync(filename);
          Fs.rmdirSync(directory);
        }

      });

});
