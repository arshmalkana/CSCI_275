# UI: Admin Panel Screen

HQ Admin screen with two tabs: Pending Registrations and Users.

```mermaid
flowchart TD
    A[AdminPanelScreen] --> H[Header\nBack  ·  Admin Panel]

    H --> TABS[Tab bar\nPending (N badge)  ·  Users]

    TABS --> P[Pending Registrations tab]
    TABS --> U[Users tab]

    P --> PC[Registration card\nName  ·  Role chip\nInstitute  ·  District / Tehsil\nSubmitted date]
    PC --> PA[Approve button → green confirm]
    PC --> PR[Reject button → modal: enter reason text]

    U --> UL[User list\nSearch bar at top\nUser card: name, role, institute, last login]
    UL --> UE[Edit icon → edit modal\nname, designation, role\nPATCH /v1/admin/users/:id]
    UL --> UD[Deactivate toggle → confirm dialog\nDELETE /v1/admin/users/:id]

    subgraph Empty states
        PE[No pending registrations ✓]
        UE2[No users found]
    end
```

**Access:** HQ_Admin and Super_Admin only (checked by `AdminRoute` guard in `App.tsx`).

**API calls:** `GET /v1/admin/registrations`, `POST /v1/admin/registrations/:id/approve`, `POST /v1/admin/registrations/:id/reject`, `GET /v1/admin/users`, `PATCH /v1/admin/users/:id`, `DELETE /v1/admin/users/:id`.
