# File: Backend/src/routes/admin.js

Admin route definitions. Mounted at `/v1/admin`. Two access tiers: Tehsil_Admin and above (`requireAdmin`) for approval queue and submission status; Senior Admin only (`requireSeniorAdmin` = HQ_Admin / Super_Admin) for registration lifecycle and user management.

```mermaid
flowchart TD
    A[admin.js routes\nprefix: /v1/admin] --> B[GET /reports/queue\npreHandler: authenticate + requireAdmin\n→ adminController.getApprovalQueue]
    A --> C[GET /reports/submission-status?month=\npreHandler: authenticate + requireAdmin\n→ adminController.getSubmissionStatus]
    A --> D[POST /remind\nbody: instituteId, month\npreHandler: authenticate + requireAdmin\n→ adminController.sendReminder]
    A --> E[GET /registrations\npreHandler: authenticate + requireSeniorAdmin\n→ adminController.getPendingRegistrations]
    A --> F[POST /registrations/:id/approve\npreHandler: authenticate + requireSeniorAdmin\n→ adminController.approveRegistration]
    A --> G[POST /registrations/:id/reject\nbody: reason\npreHandler: authenticate + requireSeniorAdmin\n→ adminController.rejectRegistration]
    A --> H[GET /users\npreHandler: authenticate + requireAdmin\n→ adminController.listUsers]
    A --> I[PATCH /users/:id\nbody: partial staff fields\npreHandler: authenticate + requireSeniorAdmin\n→ adminController.updateUser]
    A --> J[DELETE /users/:id\npreHandler: authenticate + requireSeniorAdmin\n→ adminController.deactivateUser]

    subgraph Guards
        G1[requireAdmin\nrole IN ADMIN_ROLES\n403 if not]
        G2[requireSeniorAdmin\nrole IN SENIOR_ADMIN_ROLES\n403 if not]
    end
```

**Role constants** (`src/config/roles.js`):
- `ADMIN_ROLES` — Tehsil_Admin, District_Admin, HQ_Admin, Super_Admin
- `SENIOR_ADMIN_ROLES` — HQ_Admin, Super_Admin

All routes also pass through the global `authenticate` middleware which validates the JWT and attaches `request.user`.
