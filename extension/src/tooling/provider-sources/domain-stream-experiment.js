'use strict';

const Fs = require('node:fs');
const Path = require('node:path');
const Crypto = require('node:crypto');
const Readline = require('node:readline');
const {performance} = require('node:perf_hooks');
const Stream = require('./domain-stream-import');

function createFileScratch(parent) {
  const root = Fs.mkdtempSync(Path.join(Path.resolve(parent), 'sort-'));
  return {
    async writeRun(id, sorted) {
      await Fs.promises.writeFile(Path.join(root, `${id}.lst`), sorted.join('\n') + '\n');
    },
    async *openRun(id) {
      const input = Fs.createReadStream(Path.join(root, `${id}.lst`),
          {encoding: 'utf8', highWaterMark: 4096});
      const lines = Readline.createInterface({input, crlfDelay: Infinity});
      try { for await (const line of lines) yield line; }
      finally { lines.close(); input.destroy(); }
    },
    async cleanup() {
      const resolved = Path.resolve(root);
      if (Path.dirname(resolved) !== Path.resolve(parent) ||
          !Path.basename(resolved).startsWith('sort-')) {
        throw new Error('INVALID_SCRATCH_PATH');
      }
      await Fs.promises.rm(resolved, {recursive: true, force: true,
        maxRetries: 5, retryDelay: 100});
    },
  };
}

async function main() {
  if (process.argv.length !== 4) throw new Error('EXPECTED_INPUT_AND_SCRATCH_PARENT');
  const hash = Crypto.createHash('sha256');
  const started = performance.now();
  async function* chunks() {
    const input = Fs.createReadStream(process.argv[2], {highWaterMark: 64 * 1024});
    for await (const chunk of input) { hash.update(chunk); yield chunk; }
  }
  // Explicit research-only opt-in; a successful result remains inactive.
  const result = await Stream.importStream(chunks(), createFileScratch(process.argv[3]),
      {mode: 'QUARANTINE_INVALID_V1'});
  const artifact = result.payload ? JSON.stringify(result.payload) : null;
  console.log(JSON.stringify({status: result.status, activationEligible: false,
    sourceSha256: hash.digest('hex'), stats: result.stats, assessment: result.assessment,
    artifactBytes: artifact ? Buffer.byteLength(artifact) : 0,
    artifactSha256: artifact ? Crypto.createHash('sha256').update(artifact).digest('hex') : null,
    elapsedMs: performance.now() - started,
    wholeProcessMaxRssKiB: process.resourceUsage().maxRSS, engine: process.version,
    note: 'Disk scratch experiment; no browser activation or freshness/authentication claim.'}, null, 2));
  process.exitCode = result.payload ? 0 : 2;
}

if (require.main === module) {
  main().catch((error) => {
    const code = error.code || error.message;
    console.error(JSON.stringify({status: 'FAILED', code:
      /^[A-Z_]+$/.test(code) ? code : 'STREAM_EXPERIMENT_FAILED'}));
    process.exitCode = 1;
  });
}

module.exports = {createFileScratch};
