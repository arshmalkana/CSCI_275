# AH Punjab Reporting — Implementation Progress

Updated: 2026-06-21

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
- [ ] **INCOMPLETE**: README.md rewrite

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

All planned features complete. `README.md` rewritten (2026-06-21).
