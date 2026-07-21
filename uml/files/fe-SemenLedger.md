# File: PWA/src/screens/SemenLedgerScreen.tsx

Received semen history + current stock balance for any field role.

```mermaid
flowchart TD
    A[SemenLedgerScreen] --> B["useQuery: api.getSemenReceipts()"]
    B --> C["GET /v1/admin/distributions/semen/received"]
    C --> D[render receipt list]

    A --> E["useQuery: api.getSemenStock()"]
    E --> F["GET /v1/admin/distributions/semen/stock"]
    F --> G[render stock summary]

    D --> H[receipt card per transaction]
    H --> I[from institute name]
    H --> J[semen type + straws issued]
    H --> K[transaction date]
    H --> L[batch number if present]

    G --> M[stock table]
    M --> N[columns: breed, received total, used total, balance]
    M --> O{balance < threshold?}
    O -->|yes| P[show low-stock warning badge]
```

**Roles:** All FIELD_ROLES can view their receipts (`requireFieldRole`). SemenBank also sees issuance history as receipts in this view (incoming from HQ or district).

**File:** `PWA/src/screens/SemenLedgerScreen.tsx`
