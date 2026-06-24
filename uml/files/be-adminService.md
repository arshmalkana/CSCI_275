# File: Backend/src/services/adminService.js

Oversight-facing operations: approval queue, submission status, user management.

```mermaid
flowchart TD
    A[getApprovalQueue - user, month] --> B[getVisibleInstituteIds from scope.js]
    B --> C["SELECT monthly_reports WHERE status=Submitted
AND institute_id IN visible"]
    C --> D[return queue with section_status join]

    E[getSubmissionStatus - user, month] --> F[getVisibleInstituteIds]
    F --> G["SELECT institutes LEFT JOIN monthly_reports
to show missing/draft/submitted/approved per institute"]
    G --> H[return status matrix]

    I[listUsers - user] --> J[getVisibleInstituteIds]
    J --> K["SELECT staff WHERE current_institute_id IN visible"]
    K --> L[return user list]

    M[deactivateUser - adminUser, targetStaffId] --> N[verify targetStaffId in scope]
    N --> O["UPDATE staff SET is_active=false WHERE staff_id=$1"]
    O --> P[return success]

    Q[getPendingRegistrations] --> R["SELECT registration_requests
WHERE status=pending ORDER BY submitted_at"]
    R --> S[return list with geo join]
```

**Exports:** `getApprovalQueue`, `getSubmissionStatus`, `listUsers`, `deactivateUser`, `getPendingRegistrations`

**Called by:** `controllers/adminController.js`

**File:** `Backend/src/services/adminService.js`
