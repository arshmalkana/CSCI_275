# File: Backend/src/services/distributionService.js

Vaccine and semen issuance — direct-child-only scoping via `parent_institute_id`.

```mermaid
flowchart TD
    A[issueVaccine - user, body] --> B{user.role in VACCINE_ISSUERS?}
    B -->|no| C[throw 403]
    B -->|yes| D["SELECT institutes WHERE institute_id=toInstituteId
AND parent_institute_id=user.instituteId"]
    D --> E{found?}
    E -->|no| F[throw 403 not a direct child]
    E -->|yes| G[BEGIN transaction]
    G --> H[INSERT vaccine_distribution_transactions]
    H --> I[COMMIT]
    I --> J[createNotification for recipient]
    J --> K[return transaction record]

    L[issueSemen - user, body] --> M{user.role == SemenBank?}
    M -->|no| N[throw 403]
    M -->|yes| O["SELECT institutes WHERE parent_institute_id=user.instituteId"]
    O --> P{toInstituteId in children?}
    P -->|no| Q[throw 403 not a direct child]
    P -->|yes| R[BEGIN transaction]
    R --> S[INSERT semen_distribution_transactions]
    S --> T[COMMIT]
    T --> U[createNotification for recipient]
    U --> V[return transaction record]

    W[getMyVaccineReceipts - user] --> X["SELECT vdt.* WHERE to_institute_id=user.instituteId
ORDER BY transaction_date DESC"]

    Y[getMySemenStock - user] --> Z["SELECT semen_type, SUM(straws_issued) received,
SUM(straws_used) used
FROM semen_distribution_transactions WHERE to_institute_id=?"]
```

**Key invariant:** `parent_institute_id` (NOT `reporting_institute_id`) is used for direct-child check. This ensures distribution only flows one hop down the hierarchy.

**File:** `Backend/src/services/distributionService.js`
