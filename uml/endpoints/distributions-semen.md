# Endpoints: Semen Distributions

```mermaid
sequenceDiagram
    participant U as SemenBank
    participant M as authenticate + role guard
    participant R as routes/distributions.js
    participant S as distributionService.js
    participant DB as PostgreSQL

    Note over U,DB: List semen types (master data)
    U->>M: GET /v1/distributions/semen/types
    M->>R: field roles only
    R->>S: listSemenTypes()
    S->>DB: SELECT semen_types WHERE active=true
    R-->>U: [{semen_type_id, bull_name, breed, straw_type}]

    Note over U,DB: Get current semen stock
    U->>M: GET /v1/distributions/semen/stock
    M->>R: field roles only
    R->>S: getSemenStock(user.instituteId)
    S->>DB: SELECT semen_stock WHERE institute_id=?
    R-->>U: [{semen_type_id, bull_name, quantity_straws}]

    Note over U,DB: Get receiving institutes
    U->>M: GET /v1/distributions/semen/receiving-institutes
    M->>R: SemenBank only
    R->>S: getReceivingInstitutes(user)
    S->>DB: SELECT institutes WHERE parent_institute_id = user.instituteId
    R-->>U: [{institute_id, name, type}]

    Note over U,DB: Issue semen straws to child institute
    U->>M: POST /v1/distributions/semen/issue
    M->>R: SemenBank only
    R->>S: issueSemen(user, {semenTypeId, toInstituteId, quantity})
    S->>DB: SELECT institutes WHERE id=toInstituteId AND parent_institute_id=user.instituteId
    alt not a direct child
        S-->>U: 403 Outside scope
    else direct child
        S->>DB: BEGIN TRANSACTION
        S->>DB: SELECT semen_stock FOR UPDATE (check quantity)
        S->>DB: INSERT semen_distribution_transactions (from, to, quantity, type)
        S->>DB: UPDATE semen_stock (decrement issuer, increment receiver)
        S->>DB: COMMIT
        R-->>U: 201 {transactionId}
    end

    Note over U,DB: View received semen history
    U->>M: GET /v1/distributions/semen/received
    M->>R: field roles only
    R->>S: getReceivedSemen(user.instituteId)
    S->>DB: SELECT semen_distribution_transactions WHERE to_institute_id=?
    R-->>U: [{semenTypeId, bull_name, quantity, from_institute, issued_at}]
```

**Key files:** `Backend/src/routes/distributions.js`, `Backend/src/services/distributionService.js`

`semen_distribution_transactions` mirrors the structure of `vaccine_transactions` for semen stock. Both use the same `parent_institute_id = user.instituteId` scope check — field staff can only issue to their direct children.
