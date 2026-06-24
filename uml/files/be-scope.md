# File: Backend/src/utils/scope.js

The single chokepoint for data-isolation. All authorization guards call this.

```mermaid
flowchart TD
    A[getVisibleInstituteIds - user] --> B{user.role}
    B -->|FIELD_ROLES\nCVD/CVH/PAIW/SemenBank/VaccineBank| C[return user.instituteId only]
    B -->|Oversight| D["SELECT institute_id FROM institutes\nWHERE institute_id=? OR reporting_institute_id=?"]
    D --> E[return Tehsil + all field children]
    B -->|unknown| F[return empty array]

    G[getApprovalScopeInstituteIds - user] --> H{user.role == Oversight?}
    H -->|yes| I["SELECT institute_id WHERE reporting_institute_id = user.instituteId\n(field children only, NOT Tehsil itself)"]
    H -->|no| J[return empty array]

    K[assertInstituteInScope - user, targetId] --> L[getVisibleInstituteIds]
    L --> M{targetId in visible?}
    M -->|yes| N[pass — no error]
    M -->|no| O[throw 403 Access denied]
```

**Exports:** `getVisibleInstituteIds`, `getApprovalScopeInstituteIds`, `assertInstituteInScope`

**Called by:** `adminService.js` (approval queue, submission status), `reportsService.js` (approveSections, rejectSection), `rollupService.js` (getRollupSummary), `distributionService.js` (issueVaccine, issueSemen)

**Critical distinction:** `reporting_institute_id` is used here for Oversight scope (which field institutes roll up to this Tehsil). `parent_institute_id` is NEVER used in scope.js — it belongs to distribution logic only.

**File:** `Backend/src/utils/scope.js`
