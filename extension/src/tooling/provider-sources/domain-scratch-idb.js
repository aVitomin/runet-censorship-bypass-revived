'use strict';

function createDomainScratchStore(indexedDB, name) {
  if (!/^rucb-domain-scratch-[a-f0-9-]{36}$/.test(name)) {
    throw new Error('INVALID_SCRATCH_DATABASE_NAME');
  }
  let database;
  let owned = false;
  const ready = new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = (event) => {
      if (event.oldVersion !== 0) return;
      owned = true;
      request.result.createObjectStore('pages');
    };
    request.onerror = () => reject(new Error('SCRATCH_OPEN_FAILED'));
    request.onblocked = () => reject(new Error('SCRATCH_OPEN_BLOCKED'));
    request.onsuccess = () => {
      database = request.result;
      if (!owned) {
        database.close();
        reject(new Error('SCRATCH_DATABASE_EXISTS'));
      } else resolve(database);
    };
  });
  async function transaction(mode, action) {
    const db = await ready;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pages', mode);
      let result;
      tx.oncomplete = () => resolve(result);
      tx.onabort = tx.onerror = () => reject(new Error('SCRATCH_TRANSACTION_FAILED'));
      try {
        action(tx.objectStore('pages'), (value) => { result = value; });
      } catch (error) {
        tx.abort();
        reject(new Error('SCRATCH_TRANSACTION_FAILED'));
      }
    });
  }
  return {
    async writeRun(run, sorted) {
      await transaction('readwrite', (store) => {
        for (let start = 0; start < sorted.length; start += 128) {
          store.put(sorted.slice(start, start + 128), `${run}:${start / 128}`);
        }
      });
    },
    async *openRun(run) {
      for (let page = 0; ; page++) {
        const entries = await transaction('readonly', (store, result) => {
          store.get(`${run}:${page}`).onsuccess = (event) => result(event.target.result);
        });
        if (!entries) return;
        if (!Array.isArray(entries) || !entries.length || entries.length > 128) {
          throw new Error('INVALID_SCRATCH_PAGE');
        }
        for (const entry of entries) yield entry;
      }
    },
    async cleanup() {
      try { await ready; } catch (error) { /* Only delete a database created here. */ }
      if (database) database.close();
      if (!owned) return;
      await new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = resolve;
        request.onerror = request.onblocked = () => reject(new Error('SCRATCH_CLEANUP_FAILED'));
      });
      owned = false;
    },
  };
}

module.exports = {createDomainScratchStore, factorySource: createDomainScratchStore.toString()};
