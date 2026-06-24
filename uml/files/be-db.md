# File: Backend/src/database/db.js

```mermaid
flowchart LR
    ENV["process.env\nDB_HOST / DB_PORT / DB_NAME\nDB_USER / DB_PASSWORD"] --> POOL[pg.Pool\nmax:20, idle:30s, connect:2s]

    POOL -->|"pool.on('error')"| EXIT[process.exit -1]

    POOL --> QFN["query(text, params)\n→ pool.query\n→ logs duration\n→ throws on error"]
    POOL --> GC["getClient()\n→ pool.connect()\n→ returns client\n  (caller must client.release())"]

    QFN -->|used by| SVC[All Services]
    GC -->|used for transactions| TSVC["distributionService.js\nreportsService.js\n(BEGIN / COMMIT / ROLLBACK)"]
```

**Key files:** `Backend/src/database/db.js`

`query()` is for single-statement calls; `getClient()` returns a raw pg client for multi-statement transactions where the caller manually calls `BEGIN`, `COMMIT`, `ROLLBACK`, and `client.release()`. Pool size is capped at 20 connections. If DB_PASSWORD is missing in production the process crashes immediately on boot rather than silently connecting with a default.
