# File: ahpunjabfrontend/src/screens/MasterDataScreen.tsx

HQ Admin screen to manage the reference tables that power report calculations: service charges, semen types, and vaccines.

```mermaid
flowchart TD
    A[MasterDataScreen] --> T{Tab}
    T --> SC[Service Charges tab]
    T --> ST[Semen Types tab]
    T --> VA[Vaccines tab]

    SC --> SC1[GET /v1/admin/master-data/charges\ngroup by category: OPD/Cert/Lab/Camp]
    SC1 --> SC2[Charge row: code, name, rate, effective_from]
    SC2 --> SC3[Edit rate → modal:\nnewRate, effectiveMonth\nPATCH /v1/admin/master-data/charges/:id/rate]
    SC2 --> SC4[Add new charge →\nPOST /v1/admin/master-data/charges]
    SC2 --> SC5[Deactivate →\nDELETE /v1/admin/master-data/charges/:id]

    ST --> ST1[GET /v1/admin/master-data/semen-types]
    ST1 --> ST2[Semen type row: code, bull_name, breed, is_active]
    ST2 --> ST3[Edit → PATCH /v1/admin/master-data/semen-types/:id]
    ST2 --> ST4[Add → POST /v1/admin/master-data/semen-types]

    VA --> VA1[GET /v1/admin/master-data/vaccines]
    VA1 --> VA2[Vaccine row: name, disease, doses_per_vial]
    VA2 --> VA3[Edit → PATCH /v1/admin/master-data/vaccines/:id]
    VA2 --> VA4[Add → POST /v1/admin/master-data/vaccines]
```

**Notes:**
- Deactivating a service charge hides it from new reports but does not affect historical calculations.
- Rate change history is stored in `fee_changes_history` for audit; only the current rate is shown here.
- Changes to semen types and vaccines propagate immediately to the distribution screens.
