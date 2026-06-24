# File: Backend/src/services/registerService.js

Registration request workflow — submit, approve, reject.

```mermaid
flowchart TD
    A[submitRegistration - body] --> B["INSERT INTO registration_requests
{full_name, user_id, designation, role,
institute_id, mobile, email, requested_villages[]}"]
    B --> C[createNotification for all Oversight users]
    C --> D[return {requestId}]

    E[approveRegistration - adminUser, requestId] --> F["SELECT registration_requests WHERE request_id=$1"]
    F --> G{status == pending?}
    G -->|no| H[throw 409 Already processed]
    G -->|yes| I[BEGIN transaction]
    I --> J["INSERT INTO staff {…from request, is_active=true}"]
    J --> K["INSERT INTO staff_villages (service villages)"]
    K --> L["UPDATE registration_requests SET status=approved"]
    L --> M[COMMIT]
    M --> N[createNotification for applicant]
    N --> O[return {staffId}]

    P[rejectRegistration - adminUser, requestId, reason] --> Q["UPDATE registration_requests
SET status=rejected, rejection_reason=$2"]
    Q --> R[createNotification for applicant]
    R --> S[return success]
```

**Security:** No `staff` record exists until an Oversight user explicitly approves. The requestor has no login access during pending state.

**File:** `Backend/src/services/registerService.js`
