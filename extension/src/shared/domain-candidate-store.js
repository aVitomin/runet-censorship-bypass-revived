'use strict';
/* global require */

(function publish(root, factory) {
  const commonJs = typeof module === 'object' && module.exports;
  const api = factory(commonJs ? require('./antifilter-source') : root.rucbAntifilterSource, root);
  if (commonJs) module.exports = api;
  else root.rucbDomainCandidateStore = api;
})(typeof globalThis === 'object' ? globalThis : this, function(Source, root) {
  const DATABASE_NAME = 'rucb-antifilter-candidate-v1';
  const LEASE_MS = 180000;
  const TRANSACTION_MS = 30000;
  const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
  function error(code) { return Object.assign(new Error(code), {code}); }

  function createStore(options = {}) {
    const indexedDB = options.indexedDB || root.indexedDB;
    const now = options.now || Date.now;
    const sha256 = options.sha256 || Source.sha256Bytes;
    const makeId = options.makeId || (() => root.crypto.randomUUID());
    if (!indexedDB) throw error('ANTIFILTER_STORE_UNAVAILABLE');
    let ready;
    let database;
    function open() {
      if (ready) return ready;
      ready = new Promise((resolve, reject) => {
        let settled = false;
        const request = indexedDB.open(DATABASE_NAME, 1);
        const fail = () => {
          clearTimeout(timer); settled = true; reject(error('ANTIFILTER_STORE_OPEN_FAILED'));
        };
        const timer = setTimeout(fail, TRANSACTION_MS);
        request.onerror = request.onblocked = fail;
        request.onupgradeneeded = () => {
          for (const name of ['meta', 'scratch', 'artifacts']) request.result.createObjectStore(name);
        };
        request.onsuccess = () => {
          clearTimeout(timer);
          const db = request.result;
          if (settled || db.objectStoreNames.length !== 3 ||
              ['meta', 'scratch', 'artifacts'].some(name => !db.objectStoreNames.contains(name))) {
            db.close(); fail(); return;
          }
          database = db;
          db.onversionchange = () => { db.close(); database = null; ready = null; };
          resolve(db);
        };
      }).catch(failure => { ready = null; throw failure; });
      return ready;
    }
    async function transact(names, mode, operation, signal) {
      const db = await open();
      return new Promise((resolve, reject) => {
        let failure;
        let result;
        let tx;
        const abort = code => {
          failure = error(code);
          try { tx.abort(); } catch (_error) { /* Completed transaction owns its result. */ }
        };
        try { tx = db.transaction(names, mode); }
        catch (_error) { reject(error('ANTIFILTER_STORE_FAILED')); return; }
        const externalAbort = () => abort('ANTIFILTER_CANCELLED');
        const timer = setTimeout(() => abort('ANTIFILTER_STORE_TIMEOUT'), TRANSACTION_MS);
        const cleanup = () => {
          clearTimeout(timer);
          if (signal) signal.removeEventListener('abort', externalAbort);
        };
        tx.oncomplete = () => { cleanup(); resolve(result); };
        tx.onerror = () => {};
        tx.onabort = () => { cleanup(); reject(failure || error('ANTIFILTER_STORE_FAILED')); };
        const guard = fn => event => {
          try { fn(event); } catch (caught) {
            failure = caught && /^ANTIFILTER_[A-Z_]+$/.test(caught.code) ? caught :
              error('ANTIFILTER_STORE_FAILED');
            tx.abort();
          }
        };
        if (signal) signal.addEventListener('abort', externalAbort, {once: true});
        if (signal && signal.aborted) { externalAbort(); return; }
        guard(() => operation(tx, value => { result = value; }, guard))();
      });
    }
    function validJob(job) {
      return job && Object.keys(job).length === 2 && UUID.test(job.id) &&
        Number.isSafeInteger(job.expiresAt) && job.expiresAt > 0;
    }
    function validFloor(floor) {
      if (floor === undefined) return null;
      if (!floor || Object.keys(floor).length !== 2 || !floor.envelope || !floor.receipt) {
        throw error('ANTIFILTER_STORE_CORRUPT');
      }
      Source.validateBinding(floor.envelope, floor.receipt);
      return floor;
    }
    function withJob(id, stores, mode, action, signal) {
      return transact(['meta', ...stores], mode, (tx, result, guard) => {
        tx.objectStore('meta').get('job').onsuccess = guard(event => {
          const job = event.target.result;
          if (!validJob(job) || job.id !== id || job.expiresAt <= now()) {
            throw error('ANTIFILTER_JOB_LOST');
          }
          action(tx, result, guard);
        });
      }, signal);
    }
    async function begin() {
      const id = makeId();
      const started = now();
      if (!UUID.test(id) || !Number.isSafeInteger(started) || started <= 0) {
        throw error('ANTIFILTER_JOB_INVALID');
      }
      const floor = await transact(['meta', 'scratch'], 'readwrite', (tx, result, guard) => {
        const meta = tx.objectStore('meta');
        meta.get('job').onsuccess = guard(event => {
          const job = event.target.result;
          if (job !== undefined && !validJob(job)) throw error('ANTIFILTER_STORE_CORRUPT');
          if (job && job.expiresAt > started) throw error('ANTIFILTER_STORE_BUSY');
          meta.get('floor').onsuccess = guard(event => {
            const previous = validFloor(event.target.result);
            // This dedicated store contains only this source's abandoned work.
            // Claim and cleanup are one transaction, fencing any old context.
            tx.objectStore('scratch').clear();
            meta.put({id, expiresAt: started + LEASE_MS}, 'job');
            result(previous);
          });
        });
      });
      async function cleanup(release = false) {
        return transact(['meta', 'scratch'], 'readwrite', (tx, result, guard) => {
          const meta = tx.objectStore('meta');
          meta.get('job').onsuccess = guard(event => {
            const job = event.target.result;
            if (!job || job.id !== id) return;
            tx.objectStore('scratch').clear();
            if (release) meta.delete('job');
          });
        });
      }
      return Object.freeze({
        id, floor,
        async writeRun(run, values) {
          if (!Number.isSafeInteger(run) || run < 0 || !Array.isArray(values) ||
              !values.length || values.length > 8192 || values.some(value =>
                typeof value !== 'string' || value.length > 253 || !value.length)) {
            throw error('ANTIFILTER_SCRATCH_INVALID');
          }
          await withJob(id, ['scratch'], 'readwrite', tx => {
            const scratch = tx.objectStore('scratch');
            for (let offset = 0; offset < values.length; offset += 128) {
              scratch.put(values.slice(offset, offset + 128), [run, offset / 128]);
            }
          });
        },
        async *openRun(run) {
          if (!Number.isSafeInteger(run) || run < 0) throw error('ANTIFILTER_SCRATCH_INVALID');
          for (let page = 0; ; page++) {
            const values = await withJob(id, ['scratch'], 'readonly', (tx, result, guard) => {
              tx.objectStore('scratch').get([run, page]).onsuccess =
                guard(event => result(event.target.result));
            });
            if (values === undefined) return;
            if (!Array.isArray(values) || !values.length || values.length > 128) {
              throw error('ANTIFILTER_SCRATCH_INVALID');
            }
            for (const value of values) yield value;
          }
        },
        cleanup: () => cleanup(false),
        release: () => cleanup(true),
        async stage(input, signal) {
          if (signal && signal.aborted) throw error('ANTIFILTER_CANCELLED');
          const {candidate} = await Source.verifyCandidate(input, sha256);
          return withJob(id, ['artifacts', 'scratch'], 'readwrite', (tx, result, guard) => {
            const meta = tx.objectStore('meta');
            meta.get('floor').onsuccess = guard(event => {
              const previous = validFloor(event.target.result);
              Source.checkContinuity(candidate, previous);
              // Candidate publication is atomic, but is NEVER an Effective Apply.
              tx.objectStore('artifacts').put(candidate, 'candidate');
              meta.put({envelope: candidate.envelope, receipt: candidate.receipt}, 'floor');
              meta.delete('job');
              tx.objectStore('scratch').clear();
              result({unchanged: Boolean(previous &&
                previous.envelope.artifactSha256 === candidate.envelope.artifactSha256)});
            });
          }, signal);
        },
      });
    }
    async function loadCandidate() {
      const saved = await transact(['meta', 'artifacts'], 'readonly', (tx, result, guard) => {
        tx.objectStore('meta').get('floor').onsuccess = guard(event => {
          const floor = validFloor(event.target.result);
          tx.objectStore('artifacts').get('candidate').onsuccess = guard(event =>
            result({floor, candidate: event.target.result}));
        });
      });
      if (!saved.floor && saved.candidate === undefined) return null;
      if (!saved.floor || !saved.candidate) throw error('ANTIFILTER_STORE_CORRUPT');
      const verified = await Source.verifyCandidate(saved.candidate, sha256);
      if (JSON.stringify(verified.candidate.envelope) !== JSON.stringify(saved.floor.envelope) ||
          JSON.stringify(verified.candidate.receipt) !== JSON.stringify(saved.floor.receipt)) {
        throw error('ANTIFILTER_STORE_CORRUPT');
      }
      return verified;
    }
    return Object.freeze({begin, loadCandidate, close() {
      if (database) database.close();
      database = null; ready = null;
    }});
  }
  return Object.freeze({DATABASE_NAME, LEASE_MS, createStore});
});
