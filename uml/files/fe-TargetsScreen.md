# File: ahpunjabfrontend/src/screens/TargetsScreen.tsx

Admin screen to set monthly reporting targets (OPD cases and AI services) per institute.

```mermaid
flowchart TD
    A[TargetsScreen] --> B[Institute selector dropdown\nGET /v1/admin/institutes within scope]
    A --> C[Month picker\ndefault: current month YYYY-MM]

    B & C --> D[GET /v1/admin/master-data/targets?instituteId=&month=\nreturns { opd: N, ai: N } or null if unset]

    D --> E[Target form:\nOPD target input number\nAI target input number]

    E --> F[Save → PUT /v1/admin/master-data/targets\nbody: { instituteId, month, opd, ai }\nUPSERT reporting_targets]

    F --> G{success?}
    G -->|yes| H[success toast\nlocal state updated]
    G -->|no| I[error message]

    subgraph Visual
        VIZ[After save: comparison panel\nshows target vs current month's actual from reports\n% achievement colour coded: red/yellow/green]
    end
```

**Notes:**
- Targets are per-institute per-month; if not set, the dashboard shows "No target set".
- `PUT /targets` uses UPSERT (ON CONFLICT DO UPDATE) so the same form works for both create and update.
- Achievement display pulls current report data from `/v1/reports/monthly/:month` for the selected institute and computes % inline.
