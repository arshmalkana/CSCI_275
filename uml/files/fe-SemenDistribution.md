# File: PWA/src/screens/SemenDistributionScreen.tsx

SemenBank issue form — issue straws to a direct-child institute.

```mermaid
flowchart TD
    A[SemenDistributionScreen] --> B["useQuery: api.getSemenTypes()"]
    B --> C["GET /v1/admin/distributions/semen/types"]

    A --> D["useQuery: api.getSemenStock()"]
    D --> E["GET /v1/admin/distributions/semen/stock"]

    A --> F["useQuery: api.getSemenReceivingInstitutes()"]
    F --> G["GET /v1/admin/distributions/semen/receiving-institutes"]

    A --> H[render form]
    H --> I[SearchableSelect: Semen Type]
    H --> J[SearchableSelect: To Institute - children only]
    H --> K[Input: Straws Issued]
    H --> L[Input: Transaction Date]
    H --> M[Input: Batch Number optional]
    H --> N[Input: Expiry Date optional]

    H --> O[Submit button]
    O --> P["api.issueSemen(body)"]
    P --> Q["POST /v1/admin/distributions/semen/issue"]
    Q --> R{success?}
    R -->|yes| S[show success toast + reset form]
    R -->|no| T[show error]

    H --> U[Current Stock display]
    U --> V[table: semen type, received, used, balance]
```

**Guard:** Backend route has `requireSemenIssuer` — only SemenBank role can hit POST /semen/issue. If another role somehow reaches this screen, the API returns 403.

**File:** `PWA/src/screens/SemenDistributionScreen.tsx`
