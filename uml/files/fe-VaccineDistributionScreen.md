# File: PWA/src/screens/VaccineDistributionScreen.tsx

VaccineBank screen for issuing vaccine doses to CVH/CVD institutes and viewing current stock.

```mermaid
flowchart TD
    A[VaccineDistributionScreen] --> B[GET /v1/distributions/vaccine/stock\ncurrent vials and doses per vaccine type]
    A --> C[GET /v1/distributions/vaccine?limit=20\nrecent issue transactions]

    B --> D[Stock panel:\nvaccine name, vials available, doses available\ncolour: red if below threshold]

    C --> E[Transaction list:\ndate, vaccine, institute, quantity, batch_no]

    A --> F[Issue Doses button → modal]
    F --> G[Issue form:\nvaccine_id dropdown ← stock list\nto_institute_id dropdown ← institutes in scope\nvials, doses_per_vial, batch_no, expiry_date\nnotes optional]
    G --> H[POST /v1/distributions/vaccine/issue\nbody: { vaccine_id, to_institute_id, vials, doses_per_vial, batch_no, expiry_date }]
    H --> I{success?}
    I -->|yes| J[refetch stock + transactions\nsuccess toast]
    I -->|409 insufficient| K[error: insufficient stock]
    I -->|no| L[error toast]
```

**Notes:**
- Only users with `VaccineBank` role can issue doses (enforced by backend route guard).
- Stock threshold colours are client-side computed; the API returns raw counts.
- Batch number and expiry date are required for cold-chain traceability.
- Transaction list is paginated; the screen fetches 20 most recent and shows "Load more".
