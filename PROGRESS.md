# AH Punjab Reporting — Implementation Progress

Updated: 2026-06-22

## Hierarchy Map

```
State HQ (institute_type = 'HQ')
  └─ District HQ (institute_type = 'District_HQ')  via reporting_authority_id → state HQ
       └─ Tehsil HQ (institute_type = 'TehsilHQ')  via reporting_authority_id → district HQ
            └─ Village institutes (CVH / CVD / etc.) via reporting_authority_id → tehsil HQ
```

Key FK: `institutes.reporting_authority_id` → parent `institute_id`  
Key col: `staff.current_institute_id` → staff's own institute  
Scope function: `Backend/src/utils/scope.js::getVisibleInstituteIds(user)`

## Role → Capability Matrix

| Role | Own Reports | Approve/Reject | Rollup View | User Mgmt | Master Data |
|---|---|---|---|---|---|
| INAPH / AIW | ✅ create/submit/view | — | — | — | — |
| Tehsil_Admin | ✅ | ✅ subtree | ✅ tehsil | — | — |
| District_Admin | ✅ | ✅ subtree | ✅ district | — | — |
| HQ_Admin | ✅ | ✅ subtree | ✅ statewide | ✅ | ✅ |
| Super_Admin | ✅ | ✅ all | ✅ all | ✅ full | ✅ full |

---

## STEP 0 — Foundation & Scope ✅
- [x] Scope utility `Backend/src/utils/scope.js`
- [x] `PROGRESS.md` created

---

## PHASE 0 — Foundation Fixes ✅

- [x] `instituteId` added to JWT payload (authService.js + authenticate.js)
- [x] All `|| 1` fallbacks removed from reportsController.js
- [x] `validateReportData()` uncommented in reportsService.js
- [x] Service-worker API cache pattern fixed (`/v1/api/` → `/v1/`)
- [x] Migration 001 mounted in docker-compose.yml (before 002)
- [x] `01-schema.sql` updated with `ladies_attended` + `camp_subtype` columns
- [x] `Backend/.env.example` created documenting all required vars
- [x] Hardcoded secret fallbacks removed; fail-fast in production
- [x] `fastify` moved from devDependencies to dependencies
- [x] Dockerfile switched to `npm ci --omit=dev`
- [x] CORS locked to env-allowlist

---

## PHASE 1 — Core Workflow (Approve / Reject / Audit Trail) ✅

- [x] `Backend/src/services/reportsService.js` — approve/reject service functions
- [x] `Backend/src/controllers/reportsController.js` — approve/reject controller handlers
- [x] `Backend/src/routes/reports.js` — PATCH routes with role guards
- [x] `report_edits_audit` written on every state change
- [x] **Audit trail on re-save**: before deleting detail rows, snapshots all 6 tables (opd, certificates, diagnostics, extensionActivities, ai, vaccinations) into `report_edits_audit` as JSON old_value (`reportsService.js` lines 212-228)
- [x] `createReportApprovedNotification` / `createReportRejectedNotification` wired
- [x] Resubmit after rejection allowed (status guard updated)
- [x] `createReportSubmittedNotification` fixed to use correct role names (Tehsil_Admin etc.)
- [x] Frontend: `ApprovalQueueScreen.tsx` (admin inbox with approve/reject + reason modal)
- [x] Frontend: `api.ts` typed helpers for approve/reject endpoints
- [x] Frontend: `SideMenu.tsx` role-aware nav with admin queue entry
- [x] Frontend: `App.tsx` AdminRoute guard + `/admin/approval-queue` route

---

## PHASE 2 — Admin: User & Registration Lifecycle ✅

- [x] `Backend/src/services/adminService.js`
- [x] `Backend/src/controllers/adminController.js`
- [x] `Backend/src/routes/admin.js` — all endpoints scope-enforced
- [x] Registration approval queue (list + approve + reject)
- [x] `approveRegistration` now hashes password with Argon2id (was plaintext — FIXED)
- [x] User list + deactivate/reactivate; update via PATCH
- [x] All endpoints audited via `report_edits_audit`
- [x] Frontend: `AdminPanelScreen.tsx` (registrations tab + users tab)
- [x] Frontend: role-aware nav (admin panel only visible to HQ+Super)
- [x] **Institute CRUD**: `listInstitutes`, `createInstitute`, `updateInstitute`, `setInstituteActive` (HQ_Admin+)
- [x] Frontend: `InstituteManagementScreen.tsx` + `/admin/institutes` route + SideMenu nav entry

---

## PHASE 3 — Consolidated Reporting / Rollup ✅

- [x] `Backend/src/services/rollupService.js` — OPD, AI, vaccination aggregation
- [x] `Backend/src/controllers/rollupController.js`
- [x] `Backend/src/routes/rollup.js` — GET /rollup/summary + GET /rollup/export
- [x] Scope-enforced: only institutes in admin's subtree are summed
- [x] Frontend: `ConsolidatedDashboardScreen.tsx` with drill-down and collapsible sections
- [x] Frontend: `/admin/rollup` route in App.tsx
- [x] **Export**: `GET /v1/rollup/export?month=YYYY-MM&format=pdf|csv`
  - PDF via `pdfkit` (already in deps): title, submission summary, institute list, OPD / AI / Vaccination tables, page numbers
  - CSV: multi-section flat file, RFC-compliant escaping
  - Frontend: PDF and CSV download buttons in ConsolidatedDashboardScreen header; auth handled via `apiClient.fetch` → `response.blob()` → Blob URL download
  - `api.ts`: `downloadExport(params)` helper returns a `Blob`

---

## PHASE 4 — Reporting Periods, Deadlines & Reminders ✅

- [x] `Database/migrations/003-reporting-periods.sql`
- [x] `Backend/src/services/periodsService.js`
- [x] `Backend/src/controllers/periodsController.js`
- [x] `Backend/src/routes/periods.js` — list / get / create(upsert) / lock / reopen
- [x] All period mutations audited
- [x] Admin reminder (`POST /admin/remind`) wired in adminService.js + SideMenu
- [x] Frontend: `PeriodConfigScreen.tsx`
- [x] Frontend: `/admin/periods` route in App.tsx
- [x] **Deadline reminders**: `sendDeadlineReminders()` in notificationsService.js; called on boot + every 24h via setInterval in server.js
- [x] **Real reporting status**: homeService.js now queries `reporting_periods.deadline` → 'On Time' / 'Late' / 'Missing' / 'Pending'

---

## PHASE 5 — Master-Data Management ✅

- [x] **Migration 005**: `Database/migrations/005-master-data-fixup.sql`
  - Fixes vaccine codes BRUC→BRUCELLOSIS, THEI→THEILARIA (was silently dropping vaccination data on submit)
  - Ensures all 7 expected codes exist (HS, FMD, BQ, BRUCELLOSIS, ETV, THEILARIA, RABIES)
  - Adds `idx_fee_changes_charge_month` performance index
  - Replaces `get_fee_summary()` with historical-rate-aware version: looks up `old_rate` from `fee_changes_history` for entries after the reporting month; falls back to `current_rate`
- [x] **Backend service**: `Backend/src/services/masterDataService.js`
  - `listServiceCharges`, `createServiceCharge`, `updateServiceChargeRate` (records `fee_changes_history`), `setServiceChargeActive`
  - `listSemenTypes`, `createSemenType`, `updateSemenType`, `setSemenTypeActive`
  - `listVaccines`, `createVaccine`, `updateVaccine`, `setVaccineActive`
  - `listTargets` (scope-filtered), `getTargetsForInstitute` (assertInstituteInScope), `setTarget` (upsert by institute/type/FY, assertInstituteInScope)
  - All mutations write to `report_edits_audit`; unique-code conflicts return 409
- [x] **Backend controller**: `Backend/src/controllers/masterDataController.js` — thin handlers for all 19 service functions
- [x] **Backend routes**: `Backend/src/routes/masterData.js`
  - `/charges` (GET/POST/PATCH rate/activate/deactivate) — `requireSeniorAdmin`
  - `/semen` (GET/POST/PATCH/activate/deactivate) — `requireSeniorAdmin`
  - `/vaccines` (GET/POST/PATCH/activate/deactivate) — `requireSeniorAdmin`
  - `/targets` (GET/POST/GET :instituteId) — `requireAdmin` (subtree-scoped)
- [x] **server.js**: registered `masterData.js` under prefix `/v1/admin/master-data`
- [x] **homeService.js**: removed `|| 1200`, `|| 600`, `|| 360` hardcoded target fallbacks — replaced with `?? null` (null = no target set)
- [x] **api.ts**: 20 new typed helper methods for all master-data operations
- [x] **Frontend**: `ahpunjabfrontend/src/screens/MasterDataScreen.tsx`
  - 3 tabs: Service Charges | Semen Types | Vaccines
  - Each tab: list (active/inactive), create form, edit modal, activate/deactivate; rate-change modal shows effective month picker
  - Guarded by `AdminRoute roles={HQ_ROLES}` in App.tsx
- [x] **Frontend**: `ahpunjabfrontend/src/screens/TargetsScreen.tsx`
  - Institute selector (from visible scope), financial year field
  - Shows current targets for OPD / AI_Cattle / AI_Buffalo; editable inputs with current value shown
  - Saves only changed types; disabled save button until dirty
  - Guarded by `AdminRoute` (all admin tiers) in App.tsx
- [x] **App.tsx**: routes `/admin/master-data` (HQ_ROLES) and `/admin/targets` (ADMIN_ROLES) added
- [x] **SideMenu.tsx**: "Master Data" (HQ_ROLES) and "Targets" (ADMIN_ROLES) nav entries added
- [x] **docker-compose.yml**: migration 005 mounted as `10-migration-005.sql`

---

## PHASE 6 — Forgot-Password Backend ✅

- [x] `Database/migrations/004-password-reset-tokens.sql`
- [x] `Backend/src/services/emailService.js` (nodemailer, dev jsonTransport)
- [x] `Backend/src/services/passwordResetService.js`
- [x] `POST /v1/auth/forgot-password` + `POST /v1/auth/reset-password`
- [x] Reset link now correctly points to `/reset-password?token=...` (was `/forgot-password?token=...` — FIXED)
- [x] `PATCH /v1/auth/change-password` — verifies current password, hashes new with Argon2id, writes audit
- [x] Rate-limited (3 req / 15 min); raw token hashed with SHA-256 before storage
- [x] `argon2` integrated — `verifyPassword` now uses Argon2id with plain-text fallback + auto-upgrade
- [x] Frontend: `ForgetPasswordScreen.tsx` wired to real backend (no more console.log stub)
- [x] Frontend: `ResetPasswordScreen.tsx` — reads `?token` from URL, calls reset API
- [x] Frontend: `ChangePasswordScreen.tsx` — wired to `api.changePassword()`, shows success
- [x] `FRONTEND_ORIGIN` env var added to `.env.example` for reset-link base URL

---

## PHASE 7 — Offline Write / PWA Resilience ✅

- [x] `workbox-background-sync` added to frontend devDependencies
- [x] `sw.js` — BackgroundSyncPlugin for `POST /v1/reports/monthly`
- [x] `ahpunjabfrontend/src/utils/offlineQueue.ts` — IndexedDB helpers for pending/synced state
- [x] SW posts `REPORT_SYNCED` message to open windows on successful replay
- [x] `CreateReportScreen.tsx` — checks `navigator.onLine`, queues via `queueReport()` when offline; listens for `REPORT_SYNCED` to call `clearSynced()`

---

## PHASE 8 — Polish / De-Risk ✅

- [x] `/all-screens` guarded behind `import.meta.env.DEV` check in App.tsx
- [x] "CSCI 275 / Team 404" watermark removed from `LoginScreen.tsx`
- [x] `VITE_API_BASE_URL` env var in apiClient.ts + authService.ts (hardcoded URL as fallback only)
- [x] `ahpunjabfrontend/.env.example` created
- [x] Backend `console.*` → pino logger across ALL services (reportsService, webauthnService, adminService, registerService, authController, authenticate.js, db.js)
- [x] `createReportSubmittedNotification()` fixed to use correct role enum values
- [x] HomeScreen dead commented-out mock data block removed (~112 lines)
- [x] Dual refresh-token race fixed: `apiClient.ts` single-flight with `_refreshPromise`; `authService.ts.refreshAccessToken()` now delegates to `apiClient.refreshToken()`
- [x] `|| 1` auth bypass fallbacks removed from `notificationsController.js` (6 instances) and `pushController.js` (3 instances)
- [x] `|| 1` removed from notificationsController + pushController; all replaced with 401 guards
- [x] `ahpunjabfrontend/README.md` rewritten (was Vite boilerplate; now describes project architecture, screens, env vars)

---

## FINAL PASS — GO Gate Blocks ✅/⚠️

### Block A — Fake Controls (DONE)
- [x] **A1: VaccineDistributionScreen** — rewritten with real DB writes: `distributionService.js` → `distributionController.js` → `routes/distributions.js` (prefix `/v1/admin/distributions`). Real stock check + transaction + audit. Hardcoded arrays and `console.log` fake submit gone.
- [x] **A2: HomeScreen reminder** — `handleSendReminder` now calls `api.sendReminder(institute.id, currentMonth)`. homeService.js returns `institute_id`. Hardcoded vaccine fallback block removed.

### Block B — Audit Snapshot on Re-save (VERIFIED)
- [x] `Backend/src/services/reportsService.js` lines 212–232: before DELETE on re-save, all 6 detail tables (opd, certificates, diagnostics, extensionActivities, ai, vaccinations) are snapshotted into `report_edits_audit` as a JSON old_value blob. Code is live and unambiguous.

### Block C — Master Data CRUD (VERIFIED)
- [x] `Backend/src/services/masterDataService.js`: full CRUD for service_charges (with fee_changes_history), semen_types, vaccines, institute_targets.
- [x] `ahpunjabfrontend/src/screens/MasterDataScreen.tsx`: 3-tab UI — Service Charges, Semen Types, Vaccines.

### Block D — Admin Completeness (DONE)
- [x] **D1**: `POST /admin/users` — `createUser()` in adminService.js (Argon2id, scope-checked, 409 on duplicate, audited); CreateUserModal in AdminPanelScreen.
- [x] **D2**: EditUserModal in AdminPanelScreen; PATCH /admin/users/:staffId; re-login warning shown.
- [x] **D3**: `setUserActive(false)` revokes refresh tokens; `updateUser` revokes on role/institute change; `authenticate.js` does DB is_active check after JWT verify.

### Block E — Multi-institute Export (VERIFIED)
- [x] `Backend/src/services/rollupService.js`: `generateExportPdf` (pdfkit, real tables) and `generateExportCsv`.
- [x] `Backend/src/routes/rollup.js`: `GET /export` route calls `rollupController.exportRollup`.
- [x] ConsolidatedDashboardScreen has PDF + CSV download buttons.

### Block F — Dead-Control Sweep (VERIFIED CLEAN)
All 21 live screens pass: no console.log-as-submit, no hardcoded data arrays used as real data, no TODO stubs wired to buttons. Archive `-Demon.tsx` files excluded from sweep.

| Screen | Result |
|--------|--------|
| LoginScreen | ✅ |
| RegisterScreen | ✅ |
| HomeScreen | ✅ |
| ProfileScreen | ✅ |
| CreateReportScreen | ✅ |
| MonthlyReportScreen | ✅ |
| ApprovalQueueScreen | ✅ |
| ConsolidatedDashboardScreen | ✅ |
| AdminPanelScreen | ✅ |
| InstituteManagementScreen | ✅ |
| MasterDataScreen | ✅ |
| TargetsScreen | ✅ |
| PeriodConfigScreen | ✅ |
| VaccineDistributionScreen | ✅ |
| ForgetPasswordScreen | ✅ |
| ResetPasswordScreen | ✅ |
| ChangePasswordScreen | ✅ |
| NotificationsScreen | ✅ |
| NotificationSettingsScreen | ✅ |
| AllScreensScreen | ✅ (dev-only) |
| SideMenu (actions) | ✅ |

### Block G — Polish (DONE)
- [x] Removed `console.log('Login successful:')` and `console.log('Passkey login successful:')` from LoginScreen.tsx
- [x] Removed debug console.logs (lines 79, 81) from NotificationSettingsScreen.tsx
- [x] Removed TODO comments from CreateReportScreen.tsx (month selector + copy-from-last-month)
- [x] `ahpunjabfrontend/README.md` rewritten from Vite boilerplate

### Block H — Talwandi Sabo Parity Gate (PARTIAL ⚠️)
- [x] Seed file exists: `Database/init/07-seed-talwandi-sabo.sql` (985 KB, 31 institutes, 365 reports)
- [x] **FIXED**: seed is now mounted in `docker-compose.yml` as `11-seed-talwandi-sabo.sql` (was only in `docker-compose-Demon.yml`)
- [x] Institutes: all 31 Talwandi Sabo institutes seeded with correct tehsil/district FK lookups
- [x] Staff: one user per institute with plaintext password 'Talwandi@2025' (auto-upgrades to Argon2id on first login via `verifyPassword` in authService.js)
- [x] Reports: 365 monthly reports across institutes, March 2025–April 2026

**Parity comparison (March 2025, from Excel `Talwandi Sabo Ah Punjab DB.xlsx`):**

| Metric | Excel reference | Seed data |
|--------|----------------|-----------|
| Institutes present | 31 | 31 ✅ |
| Fee register GRAND TOTAL | 62,425 | ⚠️ 0 (seed has no OPD/cert/AI-done counts) |
| Tehsil OPD new cases | 1,954 | ⚠️ 0 (no opd_report_details seeded) |
| Total cow AI done | 621 | ⚠️ 0 (total_ai_done = 0 in seed) |
| Total buffalo AI done | 636 | ⚠️ 0 |
| Semen straws received (CVH Talwandi Sabo HF) | 134 | ✅ 134 |
| BQ vaccine at CVD Jaga Ram Tirath | 330 doses | ✅ 330 |

**Root cause**: `gen_seed.js` only captured straws-received data from the Cluster Responses Google Form. OPD case counts, certificate counts, and AI-done counts were in individual institute form submissions (sheet 3 "Form responses") but not extracted.

**Impact**: Semen stock balances would match if straws_used were seeded. Fee register total requires OPD/AI/cert activity records which are absent. The application logic (get_fee_summary, rollupService) is correct — the gap is test data completeness.

---

## New Tables / Migrations

| File | Purpose |
|---|---|
| `Database/migrations/001-update-buffalo-breeds.sql` | Buffalo breed names |
| `Database/migrations/002-report-alignment.sql` | Report schema alignment |
| `Database/migrations/003-reporting-periods.sql` | `reporting_periods` table |
| `Database/migrations/004-password-reset-tokens.sql` | `password_reset_tokens` table |
| `Database/migrations/005-master-data-fixup.sql`     | Fix vaccine codes; historical-rate-aware `get_fee_summary`; performance index |

## New Env Vars

See `Backend/.env.example` for the full list. New additions:
- `FRONTEND_ORIGIN` — base URL for password reset links
- `CORS_ORIGINS` — comma-separated allow-list
- `SMTP_*` — email sending credentials

## New Dependencies

| Package | Scope | Purpose |
|---|---|---|
| `fastify` | Backend dependencies (moved from devDeps) | Core framework |
| `nodemailer ^6.9.16` | Backend dependencies | SMTP email |
| `argon2 ^0.41.1` | Backend dependencies | Password hashing (Argon2id) |
| `workbox-background-sync ^7.3.0` | Frontend devDependencies | Offline sync queue |

## What's Left

**Application code**: Complete. All features wired DB → service → controller → route → frontend.

**Remaining data gap**: Block H fee-parity. The seed lacks OPD/cert/AI-done activity counts for March 2025. To close: export the "Form responses" sheet from `Talwandi Sabo Ah Punjab DB.xlsx` to CSV, extract per-institute service counts, and add `opd_report_details` / `certificate_report_details` rows to `07-seed-talwandi-sabo.sql`. The rollup will then produce 62,425 matching the Excel fee register.
