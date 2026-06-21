/**
 * Lightweight wrapper around IndexedDB for the offline report queue.
 *
 * The service worker's BackgroundSyncPlugin handles the actual replay — this
 * utility is only used by UI components to show pending/synced status.
 */

const DB_NAME = 'ahpunjab-offline'
const DB_VERSION = 1
const STORE_NAME = 'pending-reports'

interface PendingReport {
  id: string
  reportingMonth: string
  savedAt: number
  status: 'pending' | 'synced'
  data: unknown
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = e => resolve((e.target as IDBOpenDBRequest).result)
    req.onerror = () => reject(req.error)
  })
}

export async function queueReport(reportingMonth: string, data: unknown): Promise<string> {
  const db = await openDB()
  const id = `${reportingMonth}-${Date.now()}`
  const record: PendingReport = { id, reportingMonth, savedAt: Date.now(), status: 'pending', data }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(record)
    tx.oncomplete = () => resolve(id)
    tx.onerror = () => reject(tx.error)
  })
}

export async function markSynced(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  return new Promise((resolve, reject) => {
    const req = store.get(id)
    req.onsuccess = () => {
      if (req.result) store.put({ ...req.result, status: 'synced' })
      resolve()
    }
    req.onerror = () => reject(req.error)
  })
}

export async function getPendingReports(): Promise<PendingReport[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve((req.result as PendingReport[]).filter(r => r.status === 'pending'))
    req.onerror = () => reject(req.error)
  })
}

export async function clearSynced(): Promise<void> {
  const db = await openDB()
  const records = await new Promise<PendingReport[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result as PendingReport[])
    req.onerror = () => reject(req.error)
  })
  const synced = records.filter(r => r.status === 'synced')
  if (synced.length === 0) return
  const db2 = await openDB()
  const tx = db2.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  synced.forEach(r => store.delete(r.id))
}
