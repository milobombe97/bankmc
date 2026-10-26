import type { StoredFile } from './files'

const DB_NAME = 'nevolute-files'
const STORE = 'files'

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open file storage.'))
  })
}

export function receiptFileKey(clientId: string, transactionId: string) {
  return `receipt:${clientId || 'primary'}:${transactionId}`
}

export function saveStoredFile(key: string, file: StoredFile) {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).put(file, key)
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => {
          db.close()
          reject(tx.error ?? new Error('Could not store the file.'))
        }
      }),
  )
}

export function loadStoredFile(key: string) {
  return openDb().then(
    (db) =>
      new Promise<StoredFile | null>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly')
        const request = tx.objectStore(STORE).get(key)
        request.onsuccess = () => {
          db.close()
          resolve((request.result as StoredFile | undefined) ?? null)
        }
        request.onerror = () => {
          db.close()
          reject(request.error ?? new Error('Could not read the file.'))
        }
      }),
  )
}
