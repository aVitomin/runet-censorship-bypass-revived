'use strict';

const Crypto = require('node:crypto');
const Fs = require('node:fs/promises');
const {TextDecoder} = require('node:util');
const Dataset = require('../../shared/provider-dataset');
const {normalizeDomain} = require('./domain-source-policy');

// Offline research limits, not permission to increase browser runtime limits.
const MAX_SOURCE_BYTES = 64 * 1024 * 1024;
const MAX_LINES = 2500000;
const MAX_LINE_BYTES = 4096;
const CHROMIUM_PAC_BYTE_LIMIT = 16 * 1024 * 1024;

function preflightError(code) {

  const error = new TypeError(code);
  error.code = code;
  return error;

}

function sha256(bytes) {

  return Crypto.createHash('sha256').update(bytes).digest('hex');

}

function makePayload(hosts) {

  const byWidth = new Map();
  for (const host of hosts) {
    const bucket = byWidth.get(host.length) || [];
    bucket.push(host);
    byWidth.set(host.length, bucket);
  }
  return {
    format: Dataset.PAYLOAD_FORMAT,
    buckets: Array.from(byWidth.keys()).sort((a, b) => a - b).map((width) => ({
      width,
      routeRef: 'PROVIDER_PROXY',
      hosts: byWidth.get(width).sort().join(''),
    })),
  };

}

function analyzeDomainList(sourceBytes, {inspectPreview} = {}) {

  if (!(sourceBytes instanceof Uint8Array) || !sourceBytes.byteLength) {
    throw preflightError('SOURCE_BYTES_REQUIRED');
  }
  if (sourceBytes.byteLength > MAX_SOURCE_BYTES) {
    throw preflightError('SOURCE_TOO_LARGE');
  }
  let text;
  try {
    text = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true})
        .decode(sourceBytes);
  } catch (error) {
    throw preflightError('INVALID_UTF8');
  }
  const hosts = new Set();
  const rejected = {};
  let lines = 0;
  let normalized = 0;
  let duplicates = 0;
  let rejectedLines = 0;
  // Scan without allocating an array containing millions of source lines.
  for (let start = 0; start < text.length;) {
    const newline = text.indexOf('\n', start);
    const end = newline === -1 ? text.length : newline;
    const line = text.slice(start, end).replace(/\r$/, '');
    start = end + 1;
    if (++lines > MAX_LINES) {
      throw preflightError('TOO_MANY_LINES');
    }
    if (Buffer.byteLength(line) > MAX_LINE_BYTES) {
      throw preflightError('LINE_TOO_LONG');
    }
    try {
      const host = normalizeDomain(line);
      normalized += Number(host !== line);
      if (hosts.has(host)) {
        duplicates++;
      } else {
        hosts.add(host);
      }
    } catch (error) {
      if (!error.code) throw error;
      rejected[error.code] = (rejected[error.code] || 0) + 1;
      rejectedLines++;
    }
  }
  // Experimental suffix policy: an entry covers itself and its subdomains.
  // It is not an assertion about the source publisher's intended semantics.
  const minimalHosts = [];
  for (const host of hosts) {
    let parent = host;
    let covered = false;
    while (parent.includes('.')) {
      parent = parent.slice(parent.indexOf('.') + 1);
      if (hosts.has(parent)) {
        covered = true;
        break;
      }
    }
    if (!covered) minimalHosts.push(host);
  }
  // Research-only observer. These are untrusted, potentially partial source
  // rows, not an activation candidate. The CLI never exposes them.
  if (inspectPreview) {
    inspectPreview({hosts, minimalHosts, rejectedLines});
  }
  const payload = makePayload(minimalHosts);
  const previewBytes = Buffer.from(JSON.stringify(payload));
  const blockers = [];
  if (rejectedLines) blockers.push('REJECTED_SOURCE_ROWS');
  if (!minimalHosts.length) blockers.push('EMPTY_DATASET');
  if (minimalHosts.length > Dataset.LIMITS.MAX_RULES) {
    blockers.push('FIREFOX_RULE_LIMIT');
  }
  if (previewBytes.length > Dataset.LIMITS.MAX_ARTIFACT_BYTES) {
    blockers.push('FIREFOX_ARTIFACT_LIMIT');
  }
  if (payload.buckets.length > Dataset.LIMITS.MAX_BUCKETS) {
    blockers.push('FIREFOX_BUCKET_LIMIT');
  }
  return {
    report: {
      status: blockers.length ? 'BLOCKED' : 'READY_FOR_OFFLINE_TEST',
      activationEligible: false,
      policy: 'EXPERIMENTAL_DOMAIN_AND_SUBDOMAINS',
      source: {bytes: sourceBytes.byteLength, sha256: sha256(sourceBytes)},
      lines, normalized, duplicates, rejectedLines, rejected,
      uniqueValidHosts: hosts.size,
      coveredSubdomains: hosts.size - minimalHosts.length,
      preview: {
        ruleCount: minimalHosts.length,
        bucketCount: payload.buckets.length,
        bytes: previewBytes.length,
        sha256: sha256(previewBytes),
      },
      firefoxLimits: Dataset.LIMITS,
      chromium: {
        pacByteLimit: CHROMIUM_PAC_BYTE_LIMIT,
        rawListFitsPacDownloadBudget:
          sourceBytes.byteLength <= CHROMIUM_PAC_BYTE_LIMIT,
        // This is only a size comparison, not a PAC generator or validator.
        previewFitsPacBudget: previewBytes.length <= CHROMIUM_PAC_BYTE_LIMIT,
        integrationImplemented: false,
      },
      blockers,
    },
    // Never expose a partially accepted or oversized candidate for activation.
    artifactBytes: blockers.length ? null : previewBytes,
  };

}

async function readBoundedFile(filename) {

  const handle = await Fs.open(filename, 'r');
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || !stat.size || stat.size > MAX_SOURCE_BYTES) {
      throw preflightError('INVALID_SOURCE_FILE_SIZE');
    }
    // Read exactly the observed length plus one byte to detect concurrent growth.
    const bytes = Buffer.alloc(stat.size + 1);
    let length = 0;
    while (length < bytes.length) {
      const result = await handle.read(bytes, length, bytes.length - length);
      if (!result.bytesRead) break;
      length += result.bytesRead;
    }
    if (length !== stat.size) throw preflightError('SOURCE_FILE_CHANGED');
    return bytes.subarray(0, length);
  } finally {
    await handle.close();
  }

}

async function main() {

  if (process.argv.length !== 3) throw preflightError('EXPECTED_LOCAL_LIST_PATH');
  const {report} = analyzeDomainList(await readBoundedFile(process.argv[2]));
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.status === 'BLOCKED' ? 2 : 0;

}

if (require.main === module) {
  main().catch((error) => {
    // No raw lines, local paths, credentials or arbitrary exception messages.
    console.error(JSON.stringify({status: 'FAILED', code: error.code || 'FAILED'}));
    process.exitCode = 1;
  });
}

module.exports = {
  MAX_SOURCE_BYTES, MAX_LINES, MAX_LINE_BYTES, CHROMIUM_PAC_BYTE_LIMIT,
  analyzeDomainList, readBoundedFile,
};
