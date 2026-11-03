'use strict';

function createDomainStreamImporter(codec, policy) {
  const LIMITS = Object.freeze({sourceBytes: 64 * 1024 * 1024,
    chunkBytes: 1024 * 1024, lineBytes: 4096, lines: 2500000,
    runRecords: 8192, pageRecords: 128});
  const ROW_ERRORS = ['NON_HOST_SYNTAX', 'INVALID_DNS_HOSTNAME', 'IP_OR_PUBLIC_SUFFIX'];
  function fail(code) {
    const error = new Error(code);
    error.code = code;
    throw error;
  }
  function heapPush(heap, item) {
    let index = heap.length;
    heap.push(item);
    while (index) {
      const parent = (index - 1) >>> 1;
      if (heap[parent].value <= item.value) break;
      heap[index] = heap[parent];
      index = parent;
    }
    heap[index] = item;
  }
  function heapPop(heap) {
    const first = heap[0];
    const last = heap.pop();
    if (heap.length) {
      let index = 0;
      while (index * 2 + 1 < heap.length) {
        let child = index * 2 + 1;
        if (child + 1 < heap.length && heap[child + 1].value < heap[child].value) child++;
        if (last.value <= heap[child].value) break;
        heap[index] = heap[child];
        index = child;
      }
      heap[index] = last;
    }
    return first;
  }

  async function importStream(chunks, store, options = {}) {
    const mode = options.mode || 'STRICT';
    const stats = {bytes: 0, lines: 0, validRows: 0, rejectedLines: 0,
      normalized: 0, rejected: {}, runCount: 0, maximumBufferedRecords: 0};
    const decoder = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true});
    const textEncoder = new TextEncoder();
    const iterators = [];
    const runLengths = [];
    const readCounts = [];
    let buffer = [];
    let tail = '';
    function checkAbort() {
      if (options.signal && options.signal.aborted) fail('IMPORT_ABORTED');
    }
    function checkRecord(value) {
      if (typeof value !== 'string' || !value.length || value.length > 253) {
        fail('CORRUPT_SORT_RUN');
      }
    }
    async function flushRun() {
      checkAbort();
      if (!buffer.length) return;
      buffer.sort();
      const sorted = buffer.filter((host, i) => !i || host !== buffer[i - 1]);
      await store.writeRun(stats.runCount++, sorted);
      runLengths.push(sorted.length);
      buffer = [];
    }
    async function readLine(rawLine) {
      const line = rawLine.replace(/\r$/, '');
      if (++stats.lines > LIMITS.lines) fail('TOO_MANY_LINES');
      if (textEncoder.encode(line).length > LIMITS.lineBytes) fail('LINE_TOO_LONG');
      let host;
      try {
        host = policy.normalizeDomain(line);
      } catch (error) {
        if (!ROW_ERRORS.includes(error.code)) throw error;
        stats.rejectedLines++;
        stats.rejected[error.code] = (stats.rejected[error.code] || 0) + 1;
        if (mode === 'QUARANTINE_INVALID_V1' &&
            stats.rejectedLines > policy.QUARANTINE.maxRejected) fail('QUARANTINE_LIMIT');
        return;
      }
      stats.validRows++;
      stats.normalized += Number(host !== line);
      buffer.push(host.split('').reverse().join(''));
      stats.maximumBufferedRecords = Math.max(stats.maximumBufferedRecords, buffer.length);
      if (buffer.length === LIMITS.runRecords) await flushRun();
    }
    async function consume(text) {
      const combined = tail + text;
      let start = 0;
      let newline;
      while ((newline = combined.indexOf('\n', start)) !== -1) {
        await readLine(combined.slice(start, newline));
        start = newline + 1;
      }
      tail = combined.slice(start);
      if (textEncoder.encode(tail).length > LIMITS.lineBytes + 1) fail('LINE_TOO_LONG');
    }
    try {
      if (!['STRICT', 'QUARANTINE_INVALID_V1'].includes(mode)) fail('INVALID_POLICY');
      checkAbort();
      for await (const chunk of chunks) {
        checkAbort();
        if (!(chunk instanceof Uint8Array)) {
          fail('INVALID_SOURCE_CHUNK');
        }
        stats.bytes += chunk.byteLength;
        if (stats.bytes > LIMITS.sourceBytes) fail('SOURCE_TOO_LARGE');
        // Fetch may coalesce a fast response into a large chunk. Preserve the
        // total input cap while decoding it in bounded views without a copy.
        for (let start = 0; start < chunk.length; start += LIMITS.chunkBytes) {
          checkAbort();
          let text;
          try {
            text = decoder.decode(chunk.subarray(start, start + LIMITS.chunkBytes),
                {stream: true});
          } catch (error) { fail('INVALID_UTF8'); }
          await consume(text);
        }
      }
      let finalText;
      try { finalText = decoder.decode(); }
      catch (error) { fail('INVALID_UTF8'); }
      await consume(finalText);
      if (tail) await readLine(tail);
      if (!stats.validRows) fail('EMPTY_DATASET');
      await flushRun();
      const heap = [];
      for (let run = 0; run < stats.runCount; run++) {
        const iterator = store.openRun(run)[Symbol.asyncIterator]();
        iterators.push(iterator);
        const item = await iterator.next();
        if (item.done) fail('MISSING_SORT_RUN');
        checkRecord(item.value);
        readCounts.push(1);
        heapPush(heap, {value: item.value, run});
      }
      const encoder = codec.createEncoder('EXACT_HOST');
      let merged = 0;
      let previous = '';
      while (heap.length) {
        checkAbort();
        const item = heapPop(heap);
        if (typeof item.value !== 'string' || item.value < previous) fail('CORRUPT_SORT_RUN');
        encoder.addReversed(item.value);
        previous = item.value;
        const next = await iterators[item.run].next();
        if (!next.done) {
          checkRecord(next.value);
          if (++readCounts[item.run] > runLengths[item.run]) fail('CORRUPT_SORT_RUN');
          heapPush(heap, {value: next.value, run: item.run});
        } else if (readCounts[item.run] !== runLengths[item.run]) fail('TRUNCATED_SORT_RUN');
        if (++merged % LIMITS.runRecords === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
      const payload = encoder.finish();
      stats.ruleCount = payload.ruleCount;
      stats.duplicates = stats.validRows - payload.ruleCount;
      const assessment = policy.assess(stats, mode, options.previousRules);
      return {status: assessment.accepted ? 'PREPARED_INACTIVE' : 'BLOCKED',
        activationEligible: false, stats, assessment,
        payload: assessment.accepted ? payload : null};
    } finally {
      try {
        await Promise.all(iterators.map((iterator) => iterator.return ? iterator.return() : null));
      } finally {
        await store.cleanup();
      }
    }
  }
  return Object.freeze({LIMITS, importStream});
}

/* global require */
(function publish(root) {
  const commonJs = typeof module === 'object' && module.exports;
  const api = Object.freeze(Object.assign({}, createDomainStreamImporter(
    commonJs ? require('./domain-block-codec') : root.rucbDomainBlockCodec,
    commonJs ? require('./domain-source-policy') : root.rucbDomainSourcePolicy), {factorySource: createDomainStreamImporter.toString()}));
  if (commonJs) module.exports = api;
  else root.rucbDomainStreamImporter = api;
})(typeof globalThis === 'object' ? globalThis : this);
