# Endpoints: Vaccine Distributions

```mermaid
sequenceDiagram
    participant U as CVH or VaccineBank
    participant M as authenticate + role guard
    participant R as routes/distributions.js
    participant S as distributionService.js
    participant DB as PostgreSQL

    Note over U,DB: List available vaccines (master data)
    U->>M: GET /v1/distributions/vaccines
    M->>R: field roles only
    R->>S: listVaccines()
    S->>DB: SELECT vaccines WHERE active=true
    R-->>U: [{vaccine_id, name, unit}]

    Note over U,DB: Get current stock
    U->>M: GET /v1/distributions/vaccines/stock
    M->>R: field roles only
    R->>S: getVaccineStock(user.instituteId)
    S->>DB: SELECT vaccine_stock WHERE institute_id=?
    R-->>U: [{vaccine_id, name, quantity}]

    Note over U,DB: Get receiving institutes (direct children only)
    U->>M: GET /v1/distributions/vaccines/receiving-institutes
    M->>R: CVH or VaccineBank
    R->>S: getReceivingInstitutes(user)
    S->>DB: SELECT institutes WHERE parent_institute_id = user.instituteId
    R-->>U: [{institute_id, name, type}]

    Note over U,DB: Issue vaccine to child institute
    U->>M: POST /v1/distributions/vaccines/issue
    M->>R: CVH or VaccineBank
    R->>S: issueVaccine(user, {vaccineId, toInstituteId, quantity, batchNo})
    S->>DB: SELECT institutes WHERE id=toInstituteId AND parent_institute_id=user.instituteId
    alt not a direct child
        S-->>U: 403 Outside scope
    else direct child
        S->>DB: BEGIN TRANSACTION
        S->>DB: SELECT vaccine_stock FOR UPDATE (check sufficient quantity)
        S->>DB: INSERT vaccine_transactions (from, to, quantity, batch)
        S->>DB: UPDATE vaccine_stock (decrement issuer, increment receiver)
        S->>DB: COMMIT
        R-->>U: 201 {transactionId}
    end

    Note over U,DB: View received vaccine history
    U->>M: GET /v1/distributions/vaccines/received
    M->>R: field roles only
    R->>S: getReceivedVaccines(user.instituteId)
    S->>DB: SELECT vaccine_transactions WHERE to_institute_id=?
    R-->>U: [{vaccineId, name, quantity, from_institute, issued_at, batchNo}]
```

**Key files:** `Backend/src/routes/distributions.js`, `Backend/src/services/distributionService.js`

Distribution scope uses `parent_institute_id` (stock-chain linkage) NOT `reporting_institute_id` (approval linkage). A CVH can only issue to institutes whose `parent_institute_id = CVH.instituteId`.
