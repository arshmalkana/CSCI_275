# Domain Re-architecture Switch Progress

## Fixed Decisions (verbatim, never reinterpret)
1. PWA roles: CVD, CVH, PAIW, SemenBank, VaccineBank only. PAIW=AI section only; CVD=monthly+daily vaccination; CVH=CVD+vaccine issuing to own CVDs; SemenBank=semen transactions; VaccineBank=vaccine transactions.
2. Oversight = `"somecooluserroleforparentinstitute"` — panel-only (desktop), NOT PWA
3. Approval routing: field report → Tehsil ONLY (one hop). `parent_institute_id` = stock + child visibility. `reporting_institute_id` = approval + rollup target.
4. Per-section rejection: panel can reject specific sections; rejected sections return to field user.
5. Staged compile: manual "close period" → frozen Tehsil → District closes → compiles Tehsils → Punjab closes → compiles Districts. NO live SUM aggregation.
6. Two distinct linkage fields: `reporting_institute_id` (Tehsil) vs `parent_institute_id` (direct parent).
7. NO legacy roles: INAPH/AIW RETIRED.
8. PWA/panel = SEPARATE DEPLOYMENTS.
9. DATA RESET: fresh seeds. Regression anchor = ₹62,425 (Talwandi Sabo Tehsil, April 2026, compiled total).

---

## Phase 0 — Data Layer ✅ COMPLETE

**Schema changes (`01-schema.sql`):**
- [x] `user_role` enum → CVD, CVH, PAIW, SemenBank, VaccineBank, Oversight
- [x] `institute_type` enum → added VaccineBank
- [x] `reporting_authority_id` → `reporting_institute_id` (with comment distinguishing from `parent_institute_id`)
- [x] Added `idx_institutes_reporting` index
- [x] Made `village_id` nullable (higher-level institutes like TehsilHQ/District_HQ have no single village)
- [x] Updated `v_institute_hierarchy` view (reporting_authority_name → reporting_institute_name)
- [x] Updated `get_fee_summary` CTE: `reporting_authority_id` → `reporting_institute_id`
- [x] Added `report_section_status` table (section_name, status, reviewed_by, rejection_reason)
- [x] Added `compiled_reports` table (tier, frozen payload JSONB, closed_at)
- [x] Added `semen_distribution_transactions` table (mirrors vaccine_transactions)

**Seed files created:**
- [x] `Database/init/02-seed-semen-types.sql` — semen types only
- [x] `Database/init/03-test-seed.sql` — test institutes/staff/reports (roles fixed: INAPH→CVH, AIW→PAIW)
- [x] `Database/init/04-seed-monthly-reports.sql` — stub (reports in 03 and 11)
- [x] `Database/init/05-seed-notifications.sql` — sample notifications
- [x] `Database/init/07-seed-talwandi-sabo.sql` — added `reporting_institute_id` UPDATE at end

**Migration files created:**
- [x] `Database/migrations/001-update-buffalo-breeds.sql`
- [x] `Database/migrations/002-report-alignment.sql` — reporting_authority_id → reporting_institute_id
- [x] `Database/migrations/003-reporting-periods.sql` — IF NOT EXISTS guard
- [x] `Database/migrations/004-password-reset-tokens.sql` — IF NOT EXISTS guard
- [x] `Database/migrations/005-master-data-fixup.sql` — reporting_authority_id → reporting_institute_id
- [x] `Database/migrations/006-fee-formula-fix.sql` — reporting_authority_id → reporting_institute_id + LAB_FECAL=₹50 + April 2026 corrections

**Small bug fixes (folded in):**
- [x] `LoginScreen.tsx`: trim username at all 4 call sites + write trimmed value back to state
- [x] `SideMenu.tsx`: `handleLogout` made async + awaits `authService.logout()`

**Verification:** ✅ PASSED
- [x] `docker compose down -v && docker compose up` — zero init errors, all 13 files ran
- [x] New enums: CVD/CVH/PAIW/SemenBank/VaccineBank/Oversight + VaccineBank institute_type
- [x] New tables: report_section_status, compiled_reports, semen_distribution_transactions
- [x] Column rename: reporting_institute_id confirmed, no reporting_authority_id remaining
- [x] 31 TS_ institutes loaded, 30 have reporting_institute_id, roles: 14 CVH + 10 CVD + 7 PAIW
- [x] 387 monthly reports loaded (365 Talwandi Sabo + 22 test)

---

## Phase 1 — Approval + Staged Rollup ✅ COMPLETE

- [x] Rewrote `Backend/src/utils/scope.js`: removed recursive CTE, Tehsil-only one-hop routing, field roles → own institute, Oversight → `reporting_institute_id = their_institute_id`
- [x] Rewrote `Backend/src/config/roles.js`: FIELD_ROLES, OVERSIGHT_ROLE, legacy aliases
- [x] `reporting_authority_id` → `reporting_institute_id` in: notificationsService.js, adminService.js, homeService.js
- [x] Old role strings `'INAPH'`/`'AIW'` → `'CVD'`/`'PAIW'` in: notificationsService.js, adminService.js, registerService.js, routes/admin.js
- [x] `HQ_ROLES = ['HQ_Admin', 'Super_Admin']` → `OVERSIGHT_ROLE` in: periodsService.js, routes/periods.js, routes/masterData.js
- [x] Added `approveSections` + `rejectSection` to reportsService.js (per-section status in `report_section_status` table)
- [x] Added `closeTehsilPeriod` to reportsService.js (validates all Approved, freezes comprehensive payload into `compiled_reports`)
- [x] Added 3 new routes: `PATCH /monthly/:month/approve-sections`, `PATCH /monthly/:month/reject-section`, `POST /monthly/:month/close-period`
- [x] Added 3 controller handlers to reportsController.js
- [x] Rewrote rollupService.js: extracted `buildLiveRollup`, `getRollupSummary` now reads from `compiled_reports` when period is closed (NO live SUM on closed periods)
- [x] **Verify**: Talwandi Sabo → approve all → Tehsil close → compiled total = **₹62,425** ✅
  - Root cause of discrepancy: service_charges had wrong rates (AI_COW_ETT=₹100 vs ₹35, AI_BUFFALO=₹50 vs ₹25, PM_LARGE=₹150 vs ₹100)
  - Fixed in: `03-test-seed.sql`, `03-seed.sql`, `006-fee-formula-fix.sql`
  - `closeTehsilPeriod` validation relaxed: only blocks on unapproved SUBMITTED reports (institutes with no report = zero-activity, allowed)
  - `compiled_reports` row inserted: tier=Tehsil, institute_id=12, 2026-04, totalFee=62425

---

## Phase 2 — PWA/Panel Split + Role Remodel ✅ COMPLETE

- [x] Removed from PWA routing: ApprovalQueueScreen, ConsolidatedDashboardScreen, AdminPanelScreen, PeriodConfigScreen, InstituteManagementScreen, MasterDataScreen, TargetsScreen
- [x] Removed `AdminRoute` component and `ADMIN_ROLES`/`HQ_ROLES` imports from PWA
- [x] Updated `ahpunjabfrontend/src/config/roles.ts`: `FIELD_ROLES`, `OVERSIGHT_ROLE`, `isFieldRole()`
- [x] `LoginScreen.tsx`: blocks Oversight users with "use the oversight panel" error + logs them out
- [x] `App.tsx` `ProtectedRoute`: redirects Oversight users back to `/login`
- [x] `SideMenu.tsx`: all admin menu items removed; only Home, Monthly Reporting, Vaccine Distribution remain
- [x] Created `ahpunjabpanel/` — separate Vite React app (port 3001 dev) with:
  - Oversight-only `LoginScreen` (rejects field roles with "use the field app" message)
  - `DashboardScreen` listing all 7 panel sections (routes are stubs, ready for Phase 3 wiring)
  - `authService.ts` + `apiClient.ts` shared from PWA
  - `config/roles.ts` with `OVERSIGHT_ROLE` and `isOversightRole()`
- [x] Backend `routes/reports.js`: `requireFieldRole` middleware added; `POST /reports/monthly` blocks Oversight users (403)
- [x] Panel shell does NOT have PWA plugin — desktop-first, no service worker

---

## Phase 3 — Bank/Distribution Workflows ✅ COMPLETE

- [x] Fixed `getReceivingInstitutes` in `distributionService.js`: now queries `parent_institute_id = user.instituteId` (direct children only); removed `getVisibleInstituteIds` usage. Works for VaccineBank→CVH, CVH→CVD, SemenBank→PAIW chains.
- [x] Fixed `issueVaccine`: replaced `assertInstituteInScope` with direct-child check (403 if not a direct child)
- [x] Added semen distribution service functions: `getSemenTypes`, `getMySemenStock`, `getSemenReceivingInstitutes`, `issueSemen`, `getMySemenReceipts`
- [x] `issueSemen`: transactional — direct-child check, stock check, insert `semen_distribution_transactions`, deduct `semen_stock` for issuer, credit `semen_stock` for receiver
- [x] Added `getMyVaccineReceipts`: vaccine_transactions WHERE receiving_institute_id = user.instituteId (any field role)
- [x] Rewrote `routes/distributions.js`: replaced `requireAdmin` (Oversight) with role-specific guards:
  - `requireVaccineIssuer` — `['VaccineBank', 'CVH']`
  - `requireSemenIssuer` — `['SemenBank']`
  - `requireFieldRole` — all FIELD_ROLES (for receipt/ledger endpoints)
- [x] New routes: `GET /vaccines/received`, `GET /semen/types`, `GET /semen/stock` (all field roles), `GET /semen/receiving-institutes`, `POST /semen/issue`, `GET /semen/received`
- [x] Frontend `api.ts`: added `getMyVaccineReceipts`, `getSemenTypes`, `getMySemenStock`, `getSemenReceivingInstitutes`, `issueSemenDistribution`, `getMySemenReceipts`
- [x] Frontend `SideMenu.tsx`: role-aware menu items — Monthly Reporting (CVD/CVH/PAIW), Vaccine Distribution (CVH/VaccineBank), Semen Distribution (SemenBank), Semen Ledger (CVD/CVH/PAIW)
- [x] New screen `SemenDistributionScreen.tsx` — for SemenBank (issues semen to direct children)
- [x] New screen `SemenLedgerScreen.tsx` — for CVD/CVH/PAIW (sees received semen + current balance)
- [x] `App.tsx`: wired `/semen-distribution` and `/semen-ledger` routes
- [x] **Verify**: all 5 new backend routes registered and return 401 (auth-gated) ✅
