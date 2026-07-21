# File: PWA/src/offlineQueue.ts

IndexedDB-backed queue for draft reports saved while offline. When the device reconnects, the service worker sync event flushes the queue to the API.

```mermaid
flowchart TD
    A[offlineQueue.ts] --> B[openDB\nIndexedDB: ah-punjab-db v1\nobjectStore: offline-reports keyPath: localId]
    A --> C[enqueue report\nINSERT { localId: uuid, month, data, status:'pending', savedAt }]
    A --> D[dequeue localId\nDELETE from offline-reports]
    A --> E[listPending\nSELECT all WHERE status='pending']
    A --> F[markSynced localId\nUPDATE status='synced', syncedAt=now]
    A --> G[markFailed localId, error\nUPDATE status='failed', error=message]

    subgraph Service Worker sync
        SW[Background Sync API\nself.addEventListener 'sync'\ntag: 'report-sync']
        SW --> E
        E --> H{any pending?}
        H -->|yes| I[POST /v1/reports/monthly data]
        I --> J{200?}
        J -->|yes| F
        J -->|no| G
        H -->|no| K[done]
    end

    subgraph CreateReportScreen
        CRS[Save Draft button\n→ enqueue draft\n→ show 'Saved offline' toast]
    end
```

**Notes:**
- Used only when `navigator.onLine === false` at save time, or when the fetch throws a network error.
- `localId` is a client-generated UUID; the server assigns the real `reportId` on successful sync.
- `markFailed` preserves the error message so the UI can display retry instructions.
- Synced entries are kept for 7 days before cleanup so the user can see sync history.
