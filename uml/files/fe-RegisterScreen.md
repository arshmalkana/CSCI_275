# File: PWA/src/screens/RegisterScreen.tsx

Multi-step self-registration form. Steps: Personal Info → Role & Location → Service Villages → Review & Submit. No authentication required.

```mermaid
flowchart TD
    A[RegisterScreen] --> S1[Step 1: Personal Info\nfullName, mobile, email, dob\nusername, password, confirmPassword]
    S1 --> S2[Step 2: Role & Location\nrole dropdown: CVD/CVH/PAIW/SemenBank/VaccineBank\ndistrict dropdown ← GET /geo/districts\ntehsil dropdown ← GET /geo/tehsils?district=]
    S2 --> S3[Step 3: Service Villages\nmulti-select ← GET /geo/villages?district=&tehsil=\nSearch filter for long lists]
    S3 --> S4[Step 4: Review & Submit\nSummary card with all entered data\nSubmit button]
    S4 --> API[POST /v1/register\n{ fullName, mobile, email, dob,\n  username, password, role,\n  instituteId, districtName, tehsilName,\n  serviceVillages: villageId[] }]
    API --> OK[Success screen:\nPending approval message\nLink back to Login]
    API --> ERR[409 Username taken → show error on Step 1\n422 Validation error → show field error]

    subgraph Navigation
        NAV[Back/Next buttons\nStep indicator 1-4\nStep 1 ← button goes to Login]
    end

    subgraph Validation
        V[Per-step validation before advancing:\nStep 1: password match, min length 8\nStep 2: role + district + tehsil required\nStep 3: at least 1 village]
    end
```

**Notes:**
- District/tehsil dropdowns cascade: selecting a district fetches tehsils, selecting tehsil fetches villages.
- Progress is preserved in local state so Back navigation doesn't clear fields.
- Role selection determines which parent-institute dropdown is shown (PAIW sees fewer options than CVH).
