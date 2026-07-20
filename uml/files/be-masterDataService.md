# File: Backend/src/services/masterDataService.js

Admin-only CRUD for the reference tables that drive report calculations: service charges, semen types, vaccines, and per-institute reporting targets.

```mermaid
flowchart TD
    A[masterDataService.js] --> B[Service Charges]
    A --> C[Semen Types]
    A --> D[Vaccines]
    A --> E[Targets]

    B --> B1[listServiceCharges\nSELECT service_charges ORDER BY category]
    B --> B2[createServiceCharge\nINSERT + audit log transaction]
    B --> B3[updateServiceChargeRate\nINSERT fee_changes_history + UPDATE rate + audit]
    B --> B4[deactivateServiceCharge\nSET is_active=false + audit]

    C --> C1[listSemenTypes\nSELECT semen_types WHERE is_active=true]
    C --> C2[createSemenType\nINSERT + audit]
    C --> C3[updateSemenType\nUPDATE + audit]

    D --> D1[listVaccines\nSELECT vaccines WHERE is_active=true]
    D --> D2[createVaccine\nINSERT + audit]
    D --> D3[updateVaccine\nUPDATE + audit]

    E --> E1[getTargets instituteId, month\nSELECT reporting_targets]
    E --> E2[setTargets instituteId, month, targets\nUPSERT reporting_targets ON CONFLICT DO UPDATE]

    subgraph Audit Trail
        AUD[report_edits_audit\ntable_name=service_charges\nfield_name=current_rate\nold/new value + reason]
    end

    B2 & B3 & B4 & C2 & C3 & D2 & D3 --> AUD
```

**Key patterns:**
- All write operations run inside a `getClient()` transaction with `BEGIN / COMMIT / ROLLBACK`.
- `audit()` helper inserts into `report_edits_audit` with `report_id=0` (sentinel for non-report audit rows).
- `createServiceCharge` catches `pg error 23505` (unique constraint on `service_code`) and rethrows as HTTP 409.
- Targets use `ON CONFLICT (institute_id, month) DO UPDATE` — idempotent upsert, no history needed.
- Scope enforcement: callers (route preHandlers) verify admin role before these functions are called; functions themselves trust the caller.
