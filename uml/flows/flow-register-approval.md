# Flow: New User Registration → HQ Approval

New field staff self-register through the PWA. The account is inactive until a Senior Admin (HQ_Admin or Super_Admin) approves it. Field staff cannot log in until approved.

```mermaid
sequenceDiagram
    participant App as PWA RegisterScreen
    participant BE as Backend /v1/register
    participant DB as PostgreSQL
    participant HQ as HQ Admin (PWA)
    participant Email as emailService

    App->>BE: POST /v1/register { fullName, mobile, username, password, role, instituteId, districtName, tehsilName, serviceVillages[] }
    BE->>DB: INSERT staff (is_active=false, approval_status='pending')
    BE->>DB: INSERT institute_service_villages for each serviceVillage
    BE->>DB: INSERT notification for HQ staff (type='registration_request')
    BE-->>App: 201 { message: 'Registration submitted. Pending approval.' }

    Note over App: User sees "awaiting approval" state.<br/>Cannot log in until approved.

    HQ->>BE: GET /v1/admin/registrations (preHandler: authenticate, requireSeniorAdmin)
    BE->>DB: SELECT staff WHERE is_active=false AND approval_status='pending'<br/>INNER JOIN institutes WHERE reporting_institute_id IN scope
    BE-->>HQ: [ {staffId, fullName, role, instituteName, ...} ]

    alt HQ approves
        HQ->>BE: POST /v1/admin/registrations/:id/approve
        BE->>DB: UPDATE staff SET is_active=true, approval_status='approved'
        BE->>DB: INSERT notification for new staff (type='registration_approved')
        BE-->>HQ: 200 { message: 'Registration approved' }
    else HQ rejects
        HQ->>BE: POST /v1/admin/registrations/:id/reject { reason }
        BE->>DB: UPDATE staff SET approval_status='rejected', rejection_reason=$reason
        BE->>DB: INSERT notification for new staff (type='registration_rejected')
        BE-->>HQ: 200 { message: 'Registration rejected' }
    end

    Note over App: Staff now gets push notification.<br/>If approved: login works.<br/>If rejected: sees reason on next open.
```

**Key rules:**
- Registration scope: HQ only sees pending registrations where the new institute's `reporting_institute_id` falls within their oversight scope.
- `is_active = false` blocks JWT issuance — `authService.login` checks `is_active` before issuing tokens.
- Service villages are linked in `institute_service_villages`; their population data drives AI coverage metrics.
