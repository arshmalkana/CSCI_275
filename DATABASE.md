# AH Punjab Reporting — Database Reference

## How to Visualize the Database

### Connect pgAdmin (already running at port 5050)

pgAdmin is in the Docker Compose stack.

1. Open `http://<server-ip>:5050` in your browser
2. Login: `admin@ahpunjab.local` / password from your `.env` (`PGADMIN_PASSWORD`)
3. Add a server:
   - **Name**: AH Punjab
   - **Host**: `ahpunjab-postgres` (Docker service name, reachable inside the Docker network)
   - **Port**: `5432`
   - **Database**: `ahpunjab` (or as configured in `POSTGRES_DB`)
   - **Username/Password**: from `POSTGRES_USER` / `POSTGRES_PASSWORD` in `.env`
4. Navigate: Servers → AH Punjab → Databases → ahpunjab → Schemas → public → Tables

### Connect DBeaver / DataGrip from host machine

The postgres container does **not** expose port 5432 to the host by default (security). To connect, either:
- Use pgAdmin (already exposed at 5050), **or**
- Temporarily add `ports: ["5432:5432"]` under the `postgres` service in `docker-compose.yml`, restart, connect, then remove it

Connection string: `postgresql://POSTGRES_USER:POSTGRES_PASSWORD@localhost:5432/ahpunjab`

### Quick inspection queries

```sql
-- Count rows in all main tables
SELECT schemaname, tablename, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Institute hierarchy: who reports where
SELECT i.org_id, i.institute_name, i.institute_type,
       p.institute_name AS parent_name,
       r.institute_name AS reporting_tehsil
FROM institutes i
LEFT JOIN institutes p ON i.parent_institute_id   = p.institute_id
LEFT JOIN institutes r ON i.reporting_institute_id = r.institute_id
ORDER BY i.institute_type, i.institute_name;

-- Monthly report submission status for April 2026
SELECT i.institute_name, mr.submission_status, mr.submitted_at
FROM monthly_reports mr
JOIN institutes i ON mr.institute_id = i.institute_id
WHERE mr.reporting_month = '2026-04'
ORDER BY mr.submission_status, i.institute_name;

-- Fee summary for Talwandi Sabo Tehsil, April 2026 (regression anchor = ₹62,425)
SELECT * FROM get_fee_summary(12, '2026-04');

-- Current semen stock across all institutes
SELECT i.institute_name, st.semen_name, ss.current_stock
FROM semen_stock ss
JOIN institutes i  ON ss.institute_id   = i.institute_id
JOIN semen_types st ON ss.semen_type_id = st.semen_id
WHERE ss.current_stock > 0
ORDER BY i.institute_name, st.semen_name;
```

---

## Entity-Relationship Diagram

```mermaid
erDiagram
    districts {
        int district_id PK
        varchar district_name
        varchar state_name
    }
    tehsils {
        int tehsil_id PK
        varchar tehsil_name
        int district_id FK
    }
    villages {
        int village_id PK
        varchar village_name
        int tehsil_id FK
        int district_id FK
        int buffaloes
        int cows
        int human_population
    }
    institutes {
        int institute_id PK
        varchar org_id
        varchar institute_name
        enum institute_type
        int village_id FK
        int tehsil_id FK
        int district_id FK
        int current_incharge_id FK
        int parent_institute_id FK
        int reporting_institute_id FK
        bool is_active
    }
    institute_service_villages {
        int id PK
        int institute_id FK
        int village_id FK
        bool is_primary
    }
    staff {
        int staff_id PK
        varchar user_id
        varchar full_name
        enum designation
        enum user_role
        int current_institute_id FK
        bool is_active
        bool passkey_enabled
    }
    staff_postings {
        int posting_id PK
        int staff_id FK
        int institute_id FK
        enum designation
        date start_date
        date end_date
        bool is_current
    }
    webauthn_credentials {
        text credential_id PK
        int staff_id FK
        text public_key
        bigint counter
        varchar device_name
    }
    webauthn_challenges {
        uuid challenge_id PK
        varchar challenge_key
        text challenge
        int staff_id FK
        varchar challenge_type
        timestamptz expires_at
    }
    refresh_tokens {
        int token_id PK
        varchar token_hash
        int staff_id FK
        timestamptz expires_at
        bool is_revoked
    }
    password_reset_tokens {
        int token_id PK
        int staff_id FK
        text token_hash
        timestamptz expires_at
        timestamptz used_at
    }
    service_charges {
        int charge_id PK
        varchar service_code
        varchar service_name
        enum category
        decimal current_rate
        date effective_from
    }
    fee_changes_history {
        int id PK
        int charge_id FK
        varchar month
        decimal old_rate
        decimal new_rate
    }
    semen_types {
        int semen_id PK
        varchar semen_code
        varchar semen_name
        enum species
        varchar semen_category
        int service_charge_id FK
        bool is_active
    }
    vaccines {
        int vaccine_id PK
        varchar vaccine_code
        varchar vaccine_name
        int service_charge_id FK
        bool is_active
    }
    vaccine_species_dosage {
        int id PK
        int vaccine_id FK
        enum species
        decimal dose_per_animal
    }
    monthly_reports {
        int report_id PK
        int institute_id FK
        varchar reporting_month
        int prepared_by FK
        int verified_by FK
        enum submission_status
        timestamptz submitted_at
    }
    report_section_status {
        int id PK
        int report_id FK
        varchar section_name
        enum status
        int reviewed_by FK
        text rejection_reason
    }
    compiled_reports {
        int compiled_id PK
        enum tier
        int institute_id FK
        varchar reporting_month
        enum status
        int closed_by FK
        jsonb payload
    }
    opd_report_details {
        int detail_id PK
        int report_id FK
        enum opd_type
        enum case_category
        int total_cases
        int beneficiaries_covered
    }
    ai_report_details {
        int detail_id PK
        int report_id FK
        int semen_type_id FK
        int total_ai_done
        int animals_covered
        int straws_received
    }
    vaccination_report_details {
        int detail_id PK
        int report_id FK
        int vaccine_id FK
        int doses_received
        int doses_used
        int animals_vaccinated
    }
    diagnostic_report_details {
        int detail_id PK
        int report_id FK
        enum diagnostic_type
        int tests_conducted
    }
    certificate_report_details {
        int detail_id PK
        int report_id FK
        enum certificate_type
        int total_issued
    }
    surgery_report_details {
        int detail_id PK
        int report_id FK
        varchar procedure_type
        int total_procedures
    }
    extension_activities_details {
        int detail_id PK
        int report_id FK
        enum activity_type
        varchar camp_subtype
        int events_conducted
        int ladies_attended
    }
    financial_summaries {
        int summary_id PK
        int report_id FK
        enum category
        decimal total_fees
    }
    report_edits_audit {
        int edit_id PK
        int report_id FK
        int edited_by FK
        varchar table_name
        varchar field_name
        text old_value
        text new_value
    }
    semen_transactions {
        int transaction_id PK
        date transaction_date
        int semen_bank_id FK
        int institute_id FK
        int semen_type_id FK
        enum transaction_type
        int quantity
    }
    semen_stock {
        int stock_id PK
        int institute_id FK
        int semen_type_id FK
        int current_stock
    }
    semen_distribution_transactions {
        int transaction_id PK
        date transaction_date
        int semen_type_id FK
        int issuing_institute_id FK
        int receiving_institute_id FK
        int straws_issued
        int issued_by FK
    }
    vaccine_transactions {
        int transaction_id PK
        date transaction_date
        int vaccine_id FK
        int issuing_institute_id FK
        int receiving_institute_id FK
        int doses_issued
    }
    vaccine_stock {
        int stock_id PK
        int institute_id FK
        int vaccine_id FK
        int doses_received
        int doses_used
        int current_stock
    }
    institute_targets {
        int target_id PK
        int institute_id FK
        enum institute_type
        enum target_type
        int vaccine_id FK
        int annual_target
        date effective_from
        date effective_until
    }
    reporting_periods {
        int period_id PK
        varchar reporting_month
        timestamptz opens_at
        timestamptz deadline
        bool is_locked
    }
    notifications {
        int notification_id PK
        int recipient_id FK
        int sender_id FK
        varchar category
        varchar title
        text message
        bool is_read
    }
    push_subscriptions {
        int subscription_id PK
        int staff_id FK
        text endpoint
        bool is_active
    }

    districts ||--o{ tehsils : "has"
    tehsils ||--o{ villages : "has"
    tehsils ||--o{ institutes : "tehsil_id"
    districts ||--o{ institutes : "district_id"
    villages ||--o{ institutes : "village_id"
    institutes ||--o{ institute_service_villages : "serves"
    villages ||--o{ institute_service_villages : "served_by"
    institutes ||--o| institutes : "parent_institute_id (stock/child)"
    institutes ||--o| institutes : "reporting_institute_id (approval/rollup)"
    institutes ||--o| staff : "current_incharge_id"
    staff ||--o{ staff_postings : "postings"
    institutes ||--o{ staff_postings : "postings"
    staff ||--o{ webauthn_credentials : "passkeys"
    staff ||--o{ webauthn_challenges : "challenges"
    staff ||--o{ refresh_tokens : "sessions"
    staff ||--o{ password_reset_tokens : "reset_tokens"
    service_charges ||--o{ fee_changes_history : "history"
    service_charges ||--o{ semen_types : "charge"
    service_charges ||--o{ vaccines : "charge"
    vaccines ||--o{ vaccine_species_dosage : "dosage"
    institutes ||--o{ monthly_reports : "submits"
    staff ||--o{ monthly_reports : "prepared_by"
    monthly_reports ||--o{ report_section_status : "sections"
    monthly_reports ||--o{ opd_report_details : "OPD"
    monthly_reports ||--o{ ai_report_details : "AI"
    monthly_reports ||--o{ vaccination_report_details : "vaccinations"
    monthly_reports ||--o{ diagnostic_report_details : "labs"
    monthly_reports ||--o{ certificate_report_details : "certs"
    monthly_reports ||--o{ surgery_report_details : "surgeries"
    monthly_reports ||--o{ extension_activities_details : "extension"
    monthly_reports ||--o{ financial_summaries : "fees"
    monthly_reports ||--o{ report_edits_audit : "audit"
    semen_types ||--o{ ai_report_details : "type"
    vaccines ||--o{ vaccination_report_details : "vaccine"
    institutes ||--o{ compiled_reports : "compiled"
    institutes ||--o{ semen_transactions : "semen_bank"
    institutes ||--o{ semen_stock : "semen_stock"
    semen_types ||--o{ semen_stock : "type"
    semen_types ||--o{ semen_distribution_transactions : "type"
    institutes ||--o{ semen_distribution_transactions : "issuer"
    institutes ||--o{ vaccine_transactions : "issuer"
    institutes ||--o{ vaccine_stock : "stock"
    vaccines ||--o{ vaccine_stock : "type"
    institutes ||--o{ institute_targets : "targets"
    staff ||--o{ notifications : "recipient"
    staff ||--o{ push_subscriptions : "subscriptions"
```

---

## Table Reference

### Geographic Hierarchy

| Table | Purpose |
|---|---|
| `districts` | 23 Punjab districts |
| `tehsils` | Sub-district administrative units; each has one or more TehsilHQ institutes |
| `villages` | Villages with animal population data (buffaloes, cows, etc.) |

### Institutes

| Table | Purpose |
|---|---|
| `institutes` | Core entity. Every CVH, CVD, PAIW, SemenBank, VaccineBank, TehsilHQ, District_HQ, and HQ is a row here |
| `institute_service_villages` | Many-to-many: which villages an institute serves |

**The two linkage fields on `institutes`:**

| Field | What it means | Used for |
|---|---|---|
| `parent_institute_id` | Direct organisational parent (PAIW→CVD/CVH, CVD→CVH, CVH→TehsilHQ) | Stock-issuing (`getReceivingInstitutes` queries direct children); child visibility |
| `reporting_institute_id` | The **Tehsil** this institute's monthly reports roll into | ONE-HOP approval routing; rollup aggregation; `close-period` compile scope |

These are intentionally separate. A CVD's `parent_institute_id` may point to a CVH (its administrative parent for vaccine stock), while its `reporting_institute_id` always points to the Tehsil (its approval target). Never use `parent_institute_id` for approval routing.

### Staff & Auth

| Table | Purpose |
|---|---|
| `staff` | All users: field staff (CVD/CVH/PAIW/Banks) and oversight users |
| `staff_postings` | Transfer history; `is_current=true` row is the active posting |
| `webauthn_credentials` | Passkey credentials (FIDO2 public keys + counter) |
| `webauthn_challenges` | Ephemeral challenges for passkey registration/auth flows |
| `refresh_tokens` | Active JWT sessions; 7-day rolling tokens stored as SHA-256 hashes |
| `password_reset_tokens` | One-time tokens for forgot-password flow |

### Master Data

| Table | Purpose |
|---|---|
| `service_charges` | Fee schedule (OPD_LARGE=₹10, AI_COW_ETT=₹35, etc.) |
| `fee_changes_history` | Historical rate changes — `get_fee_summary` uses this to apply the rate that was in effect at the time of reporting |
| `semen_types` | Bull breeds (HF, Jersey, Murrah, etc.) with species and category |
| `vaccines` | Vaccine catalogue (HS, FMD, BQ, etc.) |
| `vaccine_species_dosage` | Species-specific dose amounts |

### Monthly Reports (The Core Workflow)

| Table | Purpose |
|---|---|
| `monthly_reports` | One row per institute per month. Status: Draft → Submitted → Approved/Rejected |
| `report_section_status` | Per-section status (Pending/Approved/Rejected) for the 5 sections: ai_report, vaccination_report, camp_report, opd_report, lab_report |
| `opd_report_details` | OPD case counts by type and category |
| `ai_report_details` | AI (artificial insemination) data by semen type |
| `vaccination_report_details` | Vaccination data by vaccine |
| `diagnostic_report_details` | Lab/diagnostic test counts |
| `certificate_report_details` | Health/PostMortem/VetroLegal certificate counts |
| `surgery_report_details` | Castration, PD, and other procedure counts |
| `extension_activities_details` | Camps, farmer training, awareness events |
| `financial_summaries` | Calculated fee totals per category |
| `report_edits_audit` | Immutable audit trail of all edits |

**Report lifecycle:**
1. Field user creates a Draft (`submission_status = 'Draft'`)
2. Field user submits (`submission_status = 'Submitted'`); `report_section_status` rows are created as 'Pending'
3. Oversight (Tehsil) user approves sections one-by-one (or all at once)
4. Rejecting a section flips it to 'Rejected' and returns the whole report to 'Draft' for re-editing
5. When all 5 sections are Approved → `monthly_reports.submission_status` → 'Approved'
6. Oversight clicks "Close Period" → `closeTehsilPeriod` validates all approved, freezes rollup into `compiled_reports`

### Staged Compile (Frozen Snapshots)

| Table | Purpose |
|---|---|
| `compiled_reports` | Frozen tier reports. `tier` ∈ {Tehsil, District, Punjab}. `payload` JSONB holds the full aggregated snapshot. Once `status='Closed'` this is never modified |
| `reporting_periods` | Panel-configurable month windows: when a period opens, its deadline, and whether it's locked |

**Rollup read logic:** `getRollupSummary` first checks `compiled_reports` for a `Closed` row. If found → return frozen payload. If not → live SUM from `monthly_reports`. This means closed periods are immutable and fast.

### Distribution Ledgers

| Table | Purpose |
|---|---|
| `vaccine_transactions` | Every vaccine issuance (VaccineBank→CVH, CVH→CVD). Source of truth for vaccine flow |
| `vaccine_stock` | Running balance per institute per vaccine. Updated transactionally on each issue |
| `semen_distribution_transactions` | Every semen issuance (SemenBank→CVD/CVH/PAIW). Mirrors `vaccine_transactions` structure |
| `semen_stock` | Running semen balance per institute per type |
| `semen_transactions` | Legacy semen bank ledger (pre-re-arch). The new distribution flow uses `semen_distribution_transactions` |

### Targets & Notifications

| Table | Purpose |
|---|---|
| `institute_targets` | Annual performance targets per institute (or per institute type as default). Supports historical date ranges |
| `notifications` | In-app notifications with 90-day retention (audit notifications kept forever) |
| `push_subscriptions` | Web Push API endpoints for PWA background notifications |

### Views & Functions

| Object | Purpose |
|---|---|
| `v_institute_hierarchy` | Denormalized institute view with parent name and reporting tehsil name |
| `v_monthly_report_summary` | Report list with institute/district/tehsil context |
| `v_current_staff_postings` | Active postings only |
| `v_current_targets` | Currently-active target rows |
| `v_opd_progressive_totals` | Fiscal-year cumulative OPD totals (window function) |
| `v_vaccination_progressive_totals` | Fiscal-year cumulative vaccination totals |
| `v_ai_progressive_totals` | Fiscal-year cumulative AI totals |
| `get_active_target(institute_id, type, vaccine_id, date)` | Returns the applicable target for a given date |
| `get_straw_balance(institute_id, month)` | Returns semen straw balances (last year/month/this month/this year/in-hand) |
| `get_fee_summary(institute_id, month)` | Returns fee breakdown per institute using historically-correct rates |

---

## Files Reference

| File | Role |
|---|---|
| `Database/schema.sql` | Complete authoritative schema — single source of truth. Run this on a fresh DB |
| `Database/seeds.sql` | Combined seed data in execution order |
| `Database/init/` | Docker init directory — files run in alphabetical order on `docker compose up` with a fresh volume |
| `Database/migrations/` | Historical ALTER TABLE / data-fix scripts. Already reflected in `schema.sql` |
| `Database/migrate.sh` | Applies migrations against a running DB (for upgrades without volume reset) |
