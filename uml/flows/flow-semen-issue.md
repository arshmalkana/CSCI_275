# Flow: Semen Issuance (SemenBank → PAIW/CVD/CVH)

```mermaid
sequenceDiagram
    actor SB as SemenBank user
    participant SDS as SemenDistributionScreen
    participant BE as Backend
    participant DS as distributionService.js
    participant DB as PostgreSQL

    SB->>SDS: Open Semen Distribution
    SDS->>BE: GET /v1/admin/distributions/semen/types (requireSemenIssuer)
    SDS->>BE: GET /v1/admin/distributions/semen/stock (requireFieldRole)
    SDS->>BE: GET /v1/admin/distributions/semen/receiving-institutes (requireSemenIssuer)
    BE->>DS: getSemenReceivingInstitutes(user)
    DS->>DB: SELECT WHERE parent_institute_id = user.instituteId AND is_active=TRUE

    SB->>SDS: Select semen type, recipient, straws, date, batch, expiry
    SDS->>BE: POST /v1/admin/distributions/semen/issue
    BE->>DS: issueSemen(user, {semenTypeId, toInstituteId, strawsIssued, ...})

    DS->>DB: SELECT WHERE institute_id=receiver AND parent_institute_id=issuer.instituteId
    alt not a direct child
        DS-->>BE: 403 "Not a direct child"
    end

    DS->>DB: BEGIN TRANSACTION
    DS->>DB: SELECT current_stock FROM semen_stock WHERE issuer
    alt insufficient stock
        DS-->>BE: 409 "Insufficient stock: N straws available"
    end

    DS->>DB: INSERT semen_distribution_transactions (issuer, receiver, straws, batch, expiry, issued_by, notes)
    DS->>DB: UPDATE semen_stock SET current_stock -= straws WHERE issuer
    DS->>DB: UPSERT semen_stock SET current_stock += straws WHERE receiver
    DS->>DB: COMMIT
    DS-->>SDS: {transactionId, stockRemaining}
    SDS-->>SB: "Issued successfully. Remaining: N straws"

    note over SB: PAIW/CVD/CVH check their received semen separately
    actor Field as CVD/CVH/PAIW user
    Field->>BE: GET /v1/admin/distributions/semen/received (requireFieldRole)
    BE->>DS: getMySemenReceipts(user)
    DS->>DB: SELECT semen_distribution_transactions WHERE receiving_institute_id=user.instituteId
    Field->>BE: GET /v1/admin/distributions/semen/stock (requireFieldRole)
    BE->>DS: getMySemenStock(user)
    DS->>DB: SELECT semen_stock WHERE institute_id=user.instituteId
```

**Key files:**
- `ahpunjabfrontend/src/screens/SemenDistributionScreen.tsx` — SemenBank issue form
- `ahpunjabfrontend/src/screens/SemenLedgerScreen.tsx` — Field user receipts + balance
- `Backend/src/services/distributionService.js` — `issueSemen`, `getMySemenReceipts`, `getMySemenStock`
- `Backend/src/routes/distributions.js` — `requireSemenIssuer=['SemenBank']`, `requireFieldRole` for stock/received
- `Database/schema.sql` — `semen_distribution_transactions`, `semen_stock` (sections 8, 34)
