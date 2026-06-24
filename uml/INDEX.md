# UML Diagram Index

All diagrams use Mermaid syntax and render in GitHub/GitLab markdown viewers.

**Total diagrams: 58**

---

## Checklist

### Architecture (1)
- [x] [architecture.md](architecture.md) — System-level: PWA + Panel + Backend + Postgres + Cloudflare + role→app mapping

### Flows (8)
- [x] [flows/flow-login.md](flows/flow-login.md) — Password login + WebAuthn passkey login with token refresh
- [x] [flows/flow-logout.md](flows/flow-logout.md) — Logout: revoke refresh token, clear cookie, cancel in-flight refresh
- [x] [flows/flow-forgot-password.md](flows/flow-forgot-password.md) — Forgot password → email token → reset
- [x] [flows/flow-report-lifecycle.md](flows/flow-report-lifecycle.md) — Field report: Draft→Submit→per-section approve/reject→resubmit→fully approved
- [x] [flows/flow-close-period.md](flows/flow-close-period.md) — Tehsil close-period → compile frozen snapshot
- [x] [flows/flow-rollup-read.md](flows/flow-rollup-read.md) — Rollup read: live SUM vs frozen compiled_reports branch
- [x] [flows/flow-vaccine-issue.md](flows/flow-vaccine-issue.md) — Vaccine issuance: VaccineBank→CVH or CVH→CVD (direct-child check)
- [x] [flows/flow-semen-issue.md](flows/flow-semen-issue.md) — Semen issuance: SemenBank→PAIW/CVD/CVH (direct-child check, stock transaction)

### Endpoints (14 groups)
- [x] [endpoints/auth.md](endpoints/auth.md) — POST /auth/login, POST /auth/logout, POST /auth/refresh
- [x] [endpoints/webauthn.md](endpoints/webauthn.md) — WebAuthn registration and authentication flows
- [x] [endpoints/register.md](endpoints/register.md) — POST /register + admin approve/reject registration
- [x] [endpoints/monthly.md](endpoints/monthly.md) — GET/POST monthly reports, GET by month, PATCH approve/reject sections, POST close-period, GET PDF *(file is monthly.md — "reports.md" blocked by hook)*
- [x] [endpoints/admin.md](endpoints/admin.md) — Approval queue, submission status, user management
- [x] [endpoints/rollup.md](endpoints/rollup.md) — GET /rollup/summary (live vs frozen), GET /rollup/export
- [x] [endpoints/periods.md](endpoints/periods.md) — GET/POST /periods, lock, reopen
- [x] [endpoints/distributions-vaccine.md](endpoints/distributions-vaccine.md) — GET vaccines, GET stock, GET receiving-institutes, POST issue, GET received
- [x] [endpoints/distributions-semen.md](endpoints/distributions-semen.md) — GET semen types, GET stock, GET receiving-institutes, POST issue, GET received
- [x] [endpoints/home.md](endpoints/home.md) — GET /home dashboard data
- [x] [endpoints/profile.md](endpoints/profile.md) — GET/PUT profile, location, picture
- [x] [endpoints/geo.md](endpoints/geo.md) — GET districts/tehsils/villages
- [x] [endpoints/master-data.md](endpoints/master-data.md) — Service charges, semen types, vaccines CRUD
- [x] [endpoints/notifications.md](endpoints/notifications.md) — List, mark-read, archive, clear notifications

### Files — Backend (18)
- [x] [files/be-scope.md](files/be-scope.md) — utils/scope.js: getVisibleInstituteIds, getApprovalScopeInstituteIds, assertInstituteInScope
- [x] [files/be-roles.md](files/be-roles.md) — config/roles.js: FIELD_ROLES, OVERSIGHT_ROLE, ADMIN_ROLES
- [x] [files/be-authenticate.md](files/be-authenticate.md) — middleware/authenticate.js: JWT verify + refresh token flow
- [x] [files/be-reportsService.md](files/be-reportsService.md) — services/reportsService.js: create, save, submit, approveSections, rejectSection, closeTehsilPeriod
- [x] [files/be-rollupService.md](files/be-rollupService.md) — services/rollupService.js: buildLiveRollup, getRollupSummary (live/frozen branch), PDF/CSV export
- [x] [files/be-adminService.md](files/be-adminService.md) — services/adminService.js: getApprovalQueue, getSubmissionStatus, user management
- [x] [files/be-authService.md](files/be-authService.md) — services/authService.js: login, JWT issue, logout, refresh
- [x] [files/be-distributionService.md](files/be-distributionService.md) — services/distributionService.js: issueVaccine, issueSemen, receipts, stock queries
- [x] [files/be-notificationsService.md](files/be-notificationsService.md) — services/notificationsService.js: create, list, mark-read, push dispatch
- [x] [files/be-homeService.md](files/be-homeService.md) — services/homeService.js: dashboard data aggregation
- [x] [files/be-periodsService.md](files/be-periodsService.md) — services/periodsService.js: list, create, lock, reopen periods
- [x] [files/be-registerService.md](files/be-registerService.md) — services/registerService.js: registration request, approval, rejection
- [x] [files/be-server.md](files/be-server.md) — server.js: plugin registration order, route prefixes, startup hooks
- [x] [files/be-routes-reports.md](files/be-routes-reports.md) — routes/reports.js: requireFieldRole guard, all report routes
- [x] [files/be-routes-distributions.md](files/be-routes-distributions.md) — routes/distributions.js: role guards, all distribution routes
- [x] [files/be-routes-rollup.md](files/be-routes-rollup.md) — routes/rollup.js: requireAdmin guard, summary + export routes
- [x] [files/be-db.md](files/be-db.md) — database/db.js: pg Pool, query(), getClient() for transactions
- [x] [files/be-webauthnService.md](files/be-webauthnService.md) — services/webauthnService.js: generate/verify registration and authentication options

### Files — Frontend PWA (9)
- [x] [files/fe-App.md](files/fe-App.md) — App.tsx: routing, ProtectedRoute (blocks Oversight), PublicRoute
- [x] [files/fe-authService.md](files/fe-authService.md) — services/authService.ts: login, logout, token storage, getUser
- [x] [files/fe-apiClient.md](files/fe-apiClient.md) — utils/apiClient.ts: fetch wrapper with auto-refresh, token injection
- [x] [files/fe-api.md](files/fe-api.md) — utils/api.ts: typed wrappers for all backend calls
- [x] [files/fe-SideMenu.md](files/fe-SideMenu.md) — components/SideMenu.tsx: role-filtered nav, async logout
- [x] [files/fe-LoginScreen.md](files/fe-LoginScreen.md) — screens/LoginScreen.tsx: password + passkey login, Oversight block, trim
- [x] [files/fe-MonthlyReportScreen.md](files/fe-MonthlyReportScreen.md) — screens/MonthlyReportScreen.tsx: report list, submit, section status display
- [x] [files/fe-SemenDistribution.md](files/fe-SemenDistribution.md) — screens/SemenDistributionScreen.tsx: SemenBank issue form
- [x] [files/fe-SemenLedger.md](files/fe-SemenLedger.md) — screens/SemenLedgerScreen.tsx: received semen + current stock balance

### UI Screens (8)
- [x] [ui/login.md](ui/login.md) — LoginScreen: components, API calls, roles, error states
- [x] [ui/register.md](ui/register.md) — RegisterScreen: multi-step wizard, geo selects, role selection
- [x] [ui/home.md](ui/home.md) — HomeScreen: dashboard stats, quick actions, role-aware sections
- [x] [ui/monthly-report.md](ui/monthly-report.md) — MonthlyReportScreen: report list with section status dots
- [x] [ui/create-report.md](ui/create-report.md) — CreateReportScreen: multi-section form (OPD/AI/Vaccination/Lab/Certificates)
- [x] [ui/vaccine-distribution.md](ui/vaccine-distribution.md) — VaccineDistributionScreen: issue form + received history
- [x] [ui/semen-distribution.md](ui/semen-distribution.md) — SemenDistributionScreen: SemenBank issue form
- [x] [ui/semen-ledger.md](ui/semen-ledger.md) — SemenLedgerScreen: received history + current balance

---

## Category Summary

| Category | Count |
|---|---|
| Architecture | 1 |
| Flows | 8 |
| Endpoints | 14 |
| Files — Backend | 18 |
| Files — Frontend | 9 |
| UI Screens | 8 |
| **Total** | **58** |
