'use strict';

const Crypto = require('node:crypto');
const Vm = require('node:vm');
const {performance} = require('node:perf_hooks');
const Codec = require('./domain-block-codec');
const Preflight = require('./domain-list-preflight');

function createDiagnosticPac(payload) {

  Codec.validate(payload);
  const source = [
    '// LOCAL EXPERIMENT ONLY: not a production proxy configuration.',
    `const codec = (${Codec.factorySource})();`,
    `const index = codec.createLookup(${JSON.stringify(payload)});`,
    'function FindProxyForURL(url, host) {',
    '  return index.matches(host) ? "PROXY test.invalid:9" : "DIRECT";',
    '}',
  ].join('\n');
  if (Buffer.byteLength(source) > Preflight.CHROMIUM_PAC_BYTE_LIMIT) {
    throw new Error('PAC_SIZE_LIMIT');
  }
  return source;

}

function queryBenchmark(matches, queries, expected) {

  const started = performance.now();
  let mismatches = 0;
  for (let index = 0; index < queries.length; index++) {
    if (matches(queries[index]) !== expected[index]) mismatches++;
  }
  const elapsedMs = performance.now() - started;
  if (mismatches) throw new Error('LOOKUP_MISMATCH');
  return {queries: queries.length, mismatches, elapsedMs,
    meanMicroseconds: elapsedMs * 1000 / queries.length};

}

function runExperiment(hostSet) {

  const hosts = Array.from(hostSet);
  const buildStarted = performance.now();
  // Preserve every normalized valid host; do not prune descendants or broaden
  // to parent domains. Source rejection remains separate and blocks activation.
  const payload = Codec.encode(hosts, {policy: 'EXACT_HOST'});
  const buildMs = performance.now() - buildStarted;
  const artifact = JSON.stringify(payload);
  const beforeLookupHeap = process.memoryUsage().heapUsed;
  const lookupStarted = performance.now();
  const lookup = Codec.createLookup(payload);
  const lookupBuildMs = performance.now() - lookupStarted;
  const afterLookupHeap = process.memoryUsage().heapUsed;
  const allHostsStarted = performance.now();
  for (const host of hosts) {
    if (!lookup.matches(host)) throw new Error('LOST_SOURCE_HOST');
  }
  const allHostsMs = performance.now() - allHostsStarted;
  const queries = [];
  const stride = Math.max(1, Math.floor(hosts.length / 512));
  for (let index = 0; index < hosts.length && queries.length < 2048; index += stride) {
    const host = hosts[index];
    queries.push(host, host.toUpperCase() + '.', `probe.${host}`,
        `miss-${index}.invalid`);
  }
  const expected = queries.map((host) => hostSet.has(
      host.toLowerCase().replace(/\.$/, '')));
  const portableQueries = queryBenchmark(
      (host) => lookup.matches(host), queries, expected);
  const pac = createDiagnosticPac(payload);
  const context = {};
  const pacStarted = performance.now();
  // Only local factory code and strictly validated JSON data are evaluated.
  Vm.runInNewContext(pac, context, {timeout: 30000});
  const pacInitializationMs = performance.now() - pacStarted;
  const pacQueries = queryBenchmark((host) => context.FindProxyForURL(
      'https://unused.invalid/', host) === 'PROXY test.invalid:9', queries, expected);
  return {
    status: 'EXPERIMENT_ONLY',
    activationEligible: false,
    policy: payload.policy,
    format: payload.format,
    ruleCount: payload.ruleCount,
    blockCount: payload.blocks.length,
    blockSize: payload.blockSize,
    artifactBytes: Buffer.byteLength(artifact),
    artifactSha256: Crypto.createHash('sha256').update(artifact).digest('hex'),
    diagnosticPacBytes: Buffer.byteLength(pac),
    pacBudgetBytes: Preflight.CHROMIUM_PAC_BYTE_LIMIT,
    buildMs,
    portableLookupBuildMs: lookupBuildMs,
    allHosts: {queries: hosts.length, misses: 0, elapsedMs: allHostsMs},
    portableQueries,
    diagnosticPacInitializationMs: pacInitializationMs,
    diagnosticPacQueries: pacQueries,
    memory: {
      heapBeforeLookup: beforeLookupHeap,
      heapAfterLookup: afterLookupHeap,
      wholeProcessMaxRssKiB: process.resourceUsage().maxRSS,
      note: 'Node snapshots, affected by GC; whole process includes source analysis. ' +
        'Not browser memory, not a retained-heap or per-lookup peak measurement.',
    },
    engine: process.version,
    browserQa: false,
  };

}

async function main() {

  if (process.argv.length !== 3) throw new Error('EXPECTED_LOCAL_LIST_PATH');
  let compact;
  const analysis = Preflight.analyzeDomainList(
      await Preflight.readBoundedFile(process.argv[2]), {
        inspectPreview({hosts}) {
          compact = runExperiment(hosts);
        },
      });
  console.log(JSON.stringify({sourceAnalysis: analysis.report, compact}, null, 2));
  process.exitCode = analysis.report.status === 'BLOCKED' ? 2 : 0;

}

if (require.main === module) {
  main().catch((error) => {
    const code = error.code || error.message;
    console.error(JSON.stringify({status: 'FAILED', code:
      /^[A-Z_]+$/.test(code) ? code : 'DOMAIN_SOURCE_EXPERIMENT_FAILED',
    bytes: error.bytes}));
    process.exitCode = 1;
  });
}

module.exports = {createDiagnosticPac, runExperiment};
