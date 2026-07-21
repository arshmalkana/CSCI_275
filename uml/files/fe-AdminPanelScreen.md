# File: PWA/src/screens/AdminPanelScreen.tsx

HQ Admin hub with two tabs: Pending Registrations and Users management.

```mermaid
flowchart TD
    A[AdminPanelScreen] --> T{Active tab}
    T --> P[Pending Registrations tab]
    T --> U[Users tab]

    P --> P1[GET /v1/admin/registrations\nlist of is_active=false staff]
    P1 --> P2[Registration card:\nname, role, institute, district, tehsil\nsubmitted date]
    P2 --> P3{Action}
    P3 --> P4[Approve → POST /v1/admin/registrations/:id/approve\n200 → remove from list + success toast]
    P3 --> P5[Reject → modal: enter reason\nPOST /v1/admin/registrations/:id/reject {reason}\n200 → remove from list]

    U --> U1[GET /v1/admin/users\nlist of all active staff in scope]
    U1 --> U2[User card:\nname, role, institute, last login]
    U2 --> U3{Action}
    U3 --> U4[Edit → PATCH /v1/admin/users/:id\nmodal: update name/designation/role]
    U3 --> U5[Deactivate → DELETE /v1/admin/users/:id\nconfirm dialog]

    subgraph Role gate
        RG[Only HQ_Admin and Super_Admin can access this screen\nApp.tsx AdminRoute guard checks role]
    end
```

**Notes:**
- Empty state on Pending Registrations tab shows "No pending registrations" with a checkmark.
- User deactivation requires a confirmation dialog before calling the API.
- Badge on the tab shows count of pending registrations (fetched in background on mount).
