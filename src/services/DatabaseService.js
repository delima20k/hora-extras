const DB_NAME = 'controle-horas-extras';
const DB_VERSION = 2;
const STORES = ['employees', 'workSchedules', 'payrollSettings', 'overtimeEntries', 'appSettings'];

export const requestToPromise = (request) => new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error || new Error('Falha no banco local.')); });
const transactionDone = (transaction) => new Promise((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onabort = () => reject(transaction.error || new Error('A operação foi cancelada.')); transaction.onerror = () => reject(transaction.error || new Error('Falha na transação.')); });

export class DatabaseService {
  constructor() { this.db = null; }
  close() { this.db?.close(); this.db = null; }
  async open() {
    if (this.db) return this.db;
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('employees')) db.createObjectStore('employees', { keyPath: 'id' });
      for (const name of ['workSchedules', 'payrollSettings', 'overtimeEntries']) {
        if (!db.objectStoreNames.contains(name)) { const store = db.createObjectStore(name, { keyPath: 'id' }); store.createIndex('employeeId', 'employeeId', { unique: false }); }
      }
      if (!db.objectStoreNames.contains('appSettings')) db.createObjectStore('appSettings', { keyPath: 'key' });
      const entries = request.transaction.objectStore('overtimeEntries');
      if (!entries.indexNames.contains('employeeId_date')) entries.createIndex('employeeId_date', ['employeeId', 'date'], { unique: false });
    };
    this.db = await requestToPromise(request); return this.db;
  }
  async runTransaction(storeNames, mode, callback) {
    await this.open();
    if (!storeNames.every((name) => STORES.includes(name))) throw new Error('Store inexistente.');
    const transaction = this.db.transaction(storeNames, mode);
    const completed = transactionDone(transaction);
    const api = {
      get: (store, key) => requestToPromise(transaction.objectStore(store).get(key)),
      getAll: (store) => requestToPromise(transaction.objectStore(store).getAll()),
      getByIndex: (store, index, value) => requestToPromise(transaction.objectStore(store).index(index).getAll(value)),
      getByIndexRange: (store, index, range) => requestToPromise(transaction.objectStore(store).index(index).getAll(range)),
      put: (store, value) => requestToPromise(transaction.objectStore(store).put(value)),
      add: (store, value) => requestToPromise(transaction.objectStore(store).add(value)),
      delete: (store, key) => requestToPromise(transaction.objectStore(store).delete(key)),
      clear: (store) => requestToPromise(transaction.objectStore(store).clear())
    };
    try { const result = await callback(api); await completed; return result; }
    catch (error) { try { transaction.abort(); } catch { /* already completed */ } await completed.catch(() => {}); throw error; }
  }
  add(store, data) { return this.runTransaction([store], 'readwrite', (tx) => tx.add(store, data)); }
  getById(store, id) { return this.runTransaction([store], 'readonly', (tx) => tx.get(store, id)); }
  getAll(store) { return this.runTransaction([store], 'readonly', (tx) => tx.getAll(store)); }
  update(store, data) { return this.runTransaction([store], 'readwrite', (tx) => tx.put(store, data)); }
  delete(store, id) { return this.runTransaction([store], 'readwrite', (tx) => tx.delete(store, id)); }
  getByIndex(store, index, value) { return this.runTransaction([store], 'readonly', (tx) => tx.getByIndex(store, index, value)); }
  getByIndexRange(store, index, range) { return this.runTransaction([store], 'readonly', (tx) => tx.getByIndexRange(store, index, range)); }
  clear(store) { return this.runTransaction([store], 'readwrite', (tx) => tx.clear(store)); }
}
