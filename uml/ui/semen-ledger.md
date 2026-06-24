# UI: Semen Ledger Screen

Received semen history and running stock balance.

```mermaid
graph TD
    A[SemenLedgerScreen] --> B[ScreenHeader: Semen Ledger]
    A --> C[SideMenu]

    A --> D[Stock Summary card]
    D --> D1["useQuery GET /admin/distributions/semen/stock"]
    D --> D2[table: breed name, total received, total used, balance straws]
    D --> D3{balance low?}
    D3 -->|yes| D4[amber low-stock badge]

    A --> E[Received History list]
    E --> E1["useQuery GET /admin/distributions/semen/received"]
    E --> E2[sorted DESC by transaction_date]
    E --> E3[card per receipt]

    E3 --> F[From institute name]
    E3 --> G[Breed / semen type]
    E3 --> H[Straws received]
    E3 --> I[Date]
    E3 --> J[Batch number if present]
    E3 --> K[Expiry date if present]
```

**Roles:** All FIELD_ROLES can view their own receipts. SemenBank sees both issues made (as the issuer) and incoming straws (if they also receive from a higher-level SemenBank).
