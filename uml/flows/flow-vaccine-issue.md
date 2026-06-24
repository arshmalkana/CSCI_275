# Flow: Vaccine Issuance (VaccineBank → CVH or CVH → CVD)

```mermaid
sequenceDiagram
    actor Issuer as VaccineBank or CVH user
    participant VDS as VaccineDistributionScreen
    participant BE as Backend
    participant DS as distributionService.js
    participant DB as PostgreSQL

    Issuer->>VDS: Open Vaccine Distribution
    VDS->>BE: GET /v1/admin/distributions/vaccines (requireVaccineIssuer)
    VDS->>BE: GET /v1/admin/distributions/vaccines/stock
    VDS->>BE: GET /v1/admin/distributions/institutes
    BE->>DS: getReceivingInstitutes(user)
    DS->>DB: SELECT WHERE parent_institute_id = user.instituteId AND is_active=TRUE
    Note over DS,DB: DIRECT CHILDREN ONLY via parent_institute_id

    Issuer->>VDS: Select vaccine, recipient institute, doses, date
    VDS->>BE: POST /v1/admin/distributions/vaccines/issue
    BE->>DS: issueVaccine(user, {vaccineId, toInstituteId, dosesIssued, ...})

    DS->>DB: SELECT WHERE institute_id=toInstituteId AND parent_institute_id=user.instituteId
    alt not a direct child
        DS-->>BE: 403 "Not a direct child"
    end

    DS->>DB: BEGIN TRANSACTION
    DS->>DB: SELECT current_stock FROM vaccine_stock WHERE institute_id=issuer
    alt insufficient stock
        DS-->>BE: 409 "Insufficient stock: N doses available"
    end

    DS->>DB: INSERT vaccine_transactions (issuer, receiver, doses, date)
    DS->>DB: UPDATE vaccine_stock SET current_stock -= doses WHERE issuer
    DS->>DB: UPSERT vaccine_stock SET current_stock += doses WHERE receiver
    DS->>DB: INSERT report_edits_audit (distribution log)
    DS->>DB: COMMIT
    DS-->>VDS: {transactionId, stockRemaining}
    VDS-->>Issuer: Success message with remaining stock
```

**Key files:**
- `ahpunjabfrontend/src/screens/VaccineDistributionScreen.tsx`
- `Backend/src/services/distributionService.js` — `issueVaccine`, `getReceivingInstitutes`
- `Backend/src/routes/distributions.js` — `requireVaccineIssuer = ['VaccineBank', 'CVH']`
- `Database/schema.sql` — `vaccine_transactions`, `vaccine_stock` (sections 9)
