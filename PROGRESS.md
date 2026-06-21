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
- [x] Destructive delete-and-reinsert stopped (snapshot before overwrite)
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
- [x] `Backend/src/routes/rollup.js` — GET /rollup/summary with drill param
- [x] Scope-enforced: only institutes in admin's subtree are summed
- [x] Frontend: `ConsolidatedDashboardScreen.tsx` with drill-down and collapsible sections
- [x] Frontend: `/admin/rollup` route in App.tsx
- [ ] **INCOMPLETE**: Aggregate PDF/Excel export — no multi-institute export endpoint yet

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

## PHASE 5 — Master-Data Management ❌ NOT STARTED

- [ ] Admin CRUD for `semen_types` (add / edit / deactivate)
- [ ] Admin CRUD for `service_charges`
- [ ] Admin CRUD for `institute_targets`
- [ ] Admin CRUD for `vaccines`
- [ ] All changes scope-gated (HQ_Admin+) and audited
- [ ] Frontend: master-data admin screens

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

## What's Left (next session)

1. **Phase 5**: Master-data CRUD (semen_types, service_charges, institute_targets, vaccines) — full stack
2. **Phase 7 wire-up**: Update `CreateReportScreen.tsx` to call `queueReport()` when offline, listen for `REPORT_SYNCED` to clear pending badge
3. **Phase 8 remaining**:
   - Remove the ~440-line duplicate JSX from `HomeScreen.tsx`
   - Fix the dual token-refresh race in `authService.ts` vs `apiClient.ts`
   - Rewrite `README.md`
4. **Phase 4 remaining**: Automated cron/setInterval for deadline reminders; real status badges using `reporting_periods.deadline`
5. **Phase 2 remaining**: Institute CRUD (parent reassignment)
6. **Phase 3 remaining**: Multi-institute PDF/Excel export endpoint
