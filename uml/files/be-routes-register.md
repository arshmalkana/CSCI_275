# File: Backend/src/routes/register.js

New user self-registration. Mounted at `/v1/register`. Public endpoint — no authentication (the user doesn't have an account yet).

```mermaid
flowchart TD
    A[register.js routes\nprefix: /v1/register] --> B[POST /\nno auth\nrate limit: 3 per hour per IP\nbody: registration data\n→ registerController.submit]

    B --> B1[Validate body:\nfullName, username, password min 8\nrole: CVD/CVH/PAIW/SemenBank/VaccineBank\ninstituteId, districtName, tehsilName\nserviceVillages: villageId[]]

    B1 --> B2[registerService.submitRegistration body]

    B2 --> B3[Check username unique\nSELECT staff WHERE user_id=$username]
    B3 --> B4{exists?}
    B4 -->|yes| B5[409 Username already taken]
    B4 -->|no| B6[argon2.hash password]
    B6 --> B7[INSERT staff\nis_active=false, approval_status='pending']
    B7 --> B8[INSERT institute_service_villages\nfor each villageId]
    B8 --> B9[INSERT notifications for HQ staff\ntype='registration_request']
    B9 --> B10[201 { message: 'Registration submitted. Pending approval.' }]
```

**Notes:**
- This is the only truly public write endpoint in the system — rate-limited at 3 per hour per IP to prevent spam registrations.
- `serviceVillages` must be village IDs from the `villages` table (FK enforced); the controller validates they belong to the specified tehsil.
- Argon2id hashing happens before the INSERT so the plaintext password is never written to the DB.
- The HQ notification triggers a push notification if HQ staff have push subscriptions registered.
