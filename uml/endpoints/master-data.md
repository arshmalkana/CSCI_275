# Endpoints: Master Data

```mermaid
sequenceDiagram
    participant A as Oversight user
    participant M as requireAdmin
    participant R as routes/masterData.js
    participant S as masterDataService.js
    participant DB as PostgreSQL

    Note over A,DB: Service charges
    A->>M: GET /v1/master/service-charges
    R->>S: listServiceCharges()
    S->>DB: SELECT service_charges ORDER BY category
    R-->>A: [{charge_id, category, procedure_name, fee_amount}]

    A->>M: POST /v1/master/service-charges {category, procedure_name, fee_amount}
    R->>S: createServiceCharge(data)
    S->>DB: INSERT service_charges
    R-->>A: 201 {chargeId}

    A->>M: PUT /v1/master/service-charges/:id {fee_amount}
    R->>S: updateServiceCharge(id, data)
    S->>DB: UPDATE service_charges SET fee_amount=? WHERE charge_id=?
    R-->>A: 200

    Note over A,DB: Semen types
    A->>M: GET /v1/master/semen-types
    R->>S: listSemenTypes()
    S->>DB: SELECT semen_types WHERE deleted_at IS NULL
    R-->>A: [{semen_type_id, bull_name, breed, straw_type, active}]

    A->>M: POST /v1/master/semen-types {bull_name, breed, straw_type}
    R->>S: createSemenType(data)
    S->>DB: INSERT semen_types
    R-->>A: 201 {semenTypeId}

    Note over A,DB: Vaccines
    A->>M: GET /v1/master/vaccines
    R->>S: listVaccines()
    S->>DB: SELECT vaccines WHERE deleted_at IS NULL
    R-->>A: [{vaccine_id, name, unit, active}]

    A->>M: POST /v1/master/vaccines {name, unit}
    R->>S: createVaccine(data)
    S->>DB: INSERT vaccines
    R-->>A: 201 {vaccineId}
```

**Key files:** `Backend/src/routes/masterData.js`, `Backend/src/services/masterDataService.js`

Service charges feed the `get_fee_summary()` Postgres function used during the close-period compile step. The regression anchor (Talwandi Sabo Tehsil, April 2026 = ₹62,425) depends on these rates being unchanged.
