# UML Diagram Index

All diagrams use Mermaid and render in GitHub/GitLab markdown. Each `.md` file contains one diagram and a prose explanation.

Legend: ✅ written | ⬜ missing

---

## System Architecture (1)

| File | Description | Status |
|------|-------------|--------|
| [architecture.md](architecture.md) | System-level: PWA + Admin Panel + Backend + Postgres + Cloudflare tunnel; role→app mapping | ✅ |

---

## End-to-End Flows — `uml/flows/` (9)

| File | Description | Status |
|------|-------------|--------|
| [flow-login.md](flows/flow-login.md) | Password login and passkey login through JWT + refresh token issue | ✅ |
| [flow-logout.md](flows/flow-logout.md) | Logout: revoke refresh token and clear cookie | ✅ |
| [flow-report-lifecycle.md](flows/flow-report-lifecycle.md) | Draft → Submit → per-section Approve/Reject → resubmit → Approved | ✅ |
| [flow-close-period.md](flows/flow-close-period.md) | Tehsil overseer closes period: compile snapshot → compiled_reports | ✅ |
| [flow-rollup-read.md](flows/flow-rollup-read.md) | Rollup dashboard read: prefer compiled_reports, fall back to live SUM | ✅ |
| [flow-vaccine-issue.md](flows/flow-vaccine-issue.md) | VaccineBank issues doses to CVH/CVD: stock check → transaction → stock update | ✅ |
| [flow-semen-issue.md](flows/flow-semen-issue.md) | SemenBank issues straws to CVH/CVD; CVH issues to PAIW | ✅ |
| [flow-forgot-password.md](flows/flow-forgot-password.md) | Forgot-password: email link → SHA-256 token → reset → Argon2id hash | ✅ |
| [flow-register-approval.md](flows/flow-register-approval.md) | New user registers → pending → HQ_Admin approves → active account | ✅ |

---

## API Endpoints — `uml/endpoints/` (16)

| File | Description | Status |
|------|-------------|--------|
| [auth.md](endpoints/auth.md) | POST /auth/login, /auth/refresh, /auth/logout, /auth/change-password | ✅ |
| [register.md](endpoints/register.md) | POST /register (submit pending registration) | ✅ |
| [webauthn.md](endpoints/webauthn.md) | WebAuthn registration and authentication challenge/verify flows | ✅ |
| [geo.md](endpoints/geo.md) | GET /geo/districts, /geo/tehsils, /geo/villages | ✅ |
| [home.md](endpoints/home.md) | GET /home (dashboard summary: reports, targets, reminders) | ✅ |
| [profile.md](endpoints/profile.md) | GET/PATCH /profile, /profile/picture | ✅ |
| [reports.md](endpoints/reports.md) | POST /reports/monthly, GET list/single, PATCH approve/reject, section approval | ✅ |
| [admin.md](endpoints/admin.md) | Registration approvals, user CRUD, institute CRUD, remind endpoint | ✅ |
| [master-data.md](endpoints/master-data.md) | Service charges, semen types, vaccines CRUD; targets GET/SET | ✅ |
| [periods.md](endpoints/periods.md) | Reporting period list/create/lock/reopen | ✅ |
| [rollup.md](endpoints/rollup.md) | GET /rollup/summary, GET /rollup/export (PDF/CSV) | ✅ |
| [distributions-semen.md](endpoints/distributions-semen.md) | Semen distribution: issue, list transactions, stock balance | ✅ |
| [distributions-vaccine.md](endpoints/distributions-vaccine.md) | Vaccine distribution: issue, list transactions, vaccine stock | ✅ |
| [notifications.md](endpoints/notifications.md) | GET inbox, mark read, mark all read, delete | ✅ |
| [push.md](endpoints/push.md) | POST /push/subscribe, DELETE /push/unsubscribe, GET /push/vapid-key | ✅ |
| [monthly.md](endpoints/monthly.md) | Monthly report PDF download endpoint detail | ✅ |

---

## Source File Diagrams — `uml/files/` (66)

### Backend — Services (18)

| File | Description | Status |
|------|-------------|--------|
| [be-authService.md](files/be-authService.md) | authService.js: login, refreshToken, logout, changePassword | ✅ |
| [be-registerService.md](files/be-registerService.md) | registerService.js: submitRegistration, approveRegistration, rejectRegistration | ✅ |
| [be-webauthnService.md](files/be-webauthnService.md) | webauthnService.js: generateChallenge, verifyRegistration, verifyAuthentication | ✅ |
| [be-reportsService.md](files/be-reportsService.md) | reportsService.js: saveReport, getReport, approveReport, rejectReport, closePeriod | ✅ |
| [be-adminService.md](files/be-adminService.md) | adminService.js: listPendingRegistrations, approveUser, deactivateUser, institute CRUD | ✅ |
| [be-homeService.md](files/be-homeService.md) | homeService.js: getDashboardSummary (targets, status, reminders) | ✅ |
| [be-rollupService.md](files/be-rollupService.md) | rollupService.js: getRollupSummary, generateExportPdf, generateExportCsv | ✅ |
| [be-distributionService.md](files/be-distributionService.md) | distributionService.js: issueSemen, issueVaccine, getSemenStock, getVaccineStock | ✅ |
| [be-notificationsService.md](files/be-notificationsService.md) | notificationsService.js: createNotification, markRead, cleanupExpired, sendDeadlineReminders | ✅ |
| [be-periodsService.md](files/be-periodsService.md) | periodsService.js: listPeriods, upsertPeriod, lockPeriod, reopenPeriod | ✅ |
| [be-masterDataService.md](files/be-masterDataService.md) | masterDataService.js: charges/semen/vaccines CRUD, targets get/set | ✅ |
| [be-geoService.md](files/be-geoService.md) | geoService.js: listDistricts, listTehsils, listVillages | ✅ |
| [be-pdfService.md](files/be-pdfService.md) | pdfService.js: generateReportPdf (mirrors official report template) | ✅ |
| [be-pushService.md](files/be-pushService.md) | pushService.js: subscribe, unsubscribe, sendPushNotification | ✅ |
| [be-passwordResetService.md](files/be-passwordResetService.md) | passwordResetService.js: createToken, validateToken, resetPassword | ✅ |
| [be-profileService.md](files/be-profileService.md) | profileService.js: getProfile, updateProfile, uploadPicture | ✅ |
| [be-refreshTokenService.md](files/be-refreshTokenService.md) | refreshTokenService.js: createToken, rotateToken, revokeToken, cleanupExpired | ✅ |
| [be-emailService.md](files/be-emailService.md) | emailService.js: sendPasswordResetEmail (nodemailer, dev JSON transport) | ✅ |

### Backend — Utils / Plugins (4)

| File | Description | Status |
|------|-------------|--------|
| [be-scope.md](files/be-scope.md) | scope.js: getVisibleInstituteIds, getApprovalScope, assertInstituteInScope | ✅ |
| [be-authenticate.md](files/be-authenticate.md) | authenticate.js middleware: verify JWT, attach user, check is_active | ✅ |
| [be-db.md](files/be-db.md) | db.js: pg Pool singleton, query helper | ✅ |
| [be-roles.md](files/be-roles.md) | roles.js: FIELD_ROLES, OVERSIGHT_ROLE, ADMIN_ROLES, HQ_ROLES constants | ✅ |

### Backend — Routes (15)

| File | Description | Status |
|------|-------------|--------|
| [be-routes-reports.md](files/be-routes-reports.md) | reports.js route file: endpoints, middleware chain, schema validation | ✅ |
| [be-routes-admin.md](files/be-routes-admin.md) | admin.js route file | ✅ |
| [be-routes-distributions.md](files/be-routes-distributions.md) | distributions.js route file | ✅ |
| [be-routes-rollup.md](files/be-routes-rollup.md) | rollup.js route file | ✅ |
| [be-routes-periods.md](files/be-routes-periods.md) | periods.js route file | ✅ |
| [be-routes-auth.md](files/be-routes-auth.md) | auth.js route file | ✅ |
| [be-routes-register.md](files/be-routes-register.md) | register.js route file | ✅ |
| [be-routes-masterData.md](files/be-routes-masterData.md) | masterData.js route file (prefix /v1/admin/master-data) | ✅ |
| [be-routes-push.md](files/be-routes-push.md) | push.js route file | ✅ |
| [be-routes-profile.md](files/be-routes-profile.md) | profile.js route file | ✅ |
| [be-routes-notifications.md](files/be-routes-notifications.md) | notifications.js route file | ✅ |
| [be-routes-home.md](files/be-routes-home.md) | home.js route file | ✅ |
| [be-routes-geo.md](files/be-routes-geo.md) | geo.js route file | ✅ |
| [be-routes-webauthn.md](files/be-routes-webauthn.md) | webauthn.js route file | ✅ |
| [be-server.md](files/be-server.md) | server.js: plugin registration order, startup hooks | ✅ |

### Frontend — PWA Utility Files (6)

| File | Description | Status |
|------|-------------|--------|
| [fe-api.md](files/fe-api.md) | api.ts: typed helpers for every API endpoint | ✅ |
| [fe-apiClient.md](files/fe-apiClient.md) | apiClient.ts: fetch wrapper, single-flight token refresh | ✅ |
| [fe-authService.md](files/fe-authService.md) | authService.ts: login, logout, getUser, token storage | ✅ |
| [fe-App.md](files/fe-App.md) | App.tsx: router, AdminRoute guard, all screen routes | ✅ |
| [fe-SideMenu.md](files/fe-SideMenu.md) | SideMenu.tsx: role-filtered navigation | ✅ |
| [fe-offlineQueue.md](files/fe-offlineQueue.md) | offlineQueue.ts: IndexedDB helpers for pending/synced report queue | ✅ |

### Frontend — PWA Screens (23)

| File | Description | Status |
|------|-------------|--------|
| [fe-LoginScreen.md](files/fe-LoginScreen.md) | LoginScreen.tsx | ✅ |
| [fe-RegisterScreen.md](files/fe-RegisterScreen.md) | RegisterScreen.tsx | ✅ |
| [fe-HomeScreen.md](files/fe-HomeScreen.md) | HomeScreen.tsx | ✅ |
| [fe-ProfileScreen.md](files/fe-ProfileScreen.md) | ProfileScreen.tsx | ✅ |
| [fe-CreateReportScreen.md](files/fe-CreateReportScreen.md) | CreateReportScreen.tsx: PAIW-aware section filtering | ✅ |
| [fe-MonthlyReportScreen.md](files/fe-MonthlyReportScreen.md) | MonthlyReportScreen.tsx: past report viewer | ✅ |
| [fe-ApprovalQueueScreen.md](files/fe-ApprovalQueueScreen.md) | ApprovalQueueScreen.tsx: admin inbox approve/reject | ✅ |
| [fe-AdminPanelScreen.md](files/fe-AdminPanelScreen.md) | AdminPanelScreen.tsx: registrations + users tabs | ✅ |
| [fe-InstituteManagementScreen.md](files/fe-InstituteManagementScreen.md) | InstituteManagementScreen.tsx | ✅ |
| [fe-MasterDataScreen.md](files/fe-MasterDataScreen.md) | MasterDataScreen.tsx: service charges, semen types, vaccines tabs | ✅ |
| [fe-TargetsScreen.md](files/fe-TargetsScreen.md) | TargetsScreen.tsx: OPD/AI targets per institute | ✅ |
| [fe-PeriodConfigScreen.md](files/fe-PeriodConfigScreen.md) | PeriodConfigScreen.tsx: open/close/lock reporting months | ✅ |
| [fe-VaccineDistributionScreen.md](files/fe-VaccineDistributionScreen.md) | VaccineDistributionScreen.tsx | ✅ |
| [fe-SemenDistribution.md](files/fe-SemenDistribution.md) | SemenDistributionScreen.tsx | ✅ |
| [fe-SemenLedger.md](files/fe-SemenLedger.md) | SemenLedgerScreen.tsx | ✅ |
| [fe-NotificationsScreen.md](files/fe-NotificationsScreen.md) | NotificationsScreen.tsx | ✅ |
| [fe-NotificationSettingsScreen.md](files/fe-NotificationSettingsScreen.md) | NotificationSettingsScreen.tsx | ✅ |
| [fe-ChangePasswordScreen.md](files/fe-ChangePasswordScreen.md) | ChangePasswordScreen.tsx | ✅ |
| [fe-ForgetPasswordScreen.md](files/fe-ForgetPasswordScreen.md) | ForgetPasswordScreen.tsx | ✅ |
| [fe-ResetPasswordScreen.md](files/fe-ResetPasswordScreen.md) | ResetPasswordScreen.tsx | ✅ |
| [fe-ManagePasskeysScreen.md](files/fe-ManagePasskeysScreen.md) | ManagePasskeysScreen.tsx | ✅ |
| [fe-PasskeySetupScreen.md](files/fe-PasskeySetupScreen.md) | PasskeySetupScreen.tsx | ✅ |
| [fe-ActiveSessionsScreen.md](files/fe-ActiveSessionsScreen.md) | ActiveSessionsScreen.tsx | ✅ |

---

## UI Screen Diagrams — `uml/ui/` (23)

| File | Description | Status |
|------|-------------|--------|
| [login.md](ui/login.md) | Login screen: components, API calls, navigation out | ✅ |
| [register.md](ui/register.md) | Register screen: multi-step flow | ✅ |
| [home.md](ui/home.md) | Home dashboard screen | ✅ |
| [profile.md](ui/profile.md) | Profile edit screen | ✅ |
| [create-report.md](ui/create-report.md) | Create/edit monthly report (PAIW-aware) | ✅ |
| [monthly-report.md](ui/monthly-report.md) | View past monthly report | ✅ |
| [approval-queue.md](ui/approval-queue.md) | Admin approval queue | ✅ |
| [admin-panel.md](ui/admin-panel.md) | Admin panel: users + registrations | ✅ |
| [institute-management.md](ui/institute-management.md) | Institute management screen | ✅ |
| [master-data.md](ui/master-data.md) | Master data management | ✅ |
| [targets.md](ui/targets.md) | Targets configuration | ✅ |
| [period-config.md](ui/period-config.md) | Reporting period configuration | ✅ |
| [vaccine-distribution.md](ui/vaccine-distribution.md) | Vaccine distribution screen | ✅ |
| [semen-distribution.md](ui/semen-distribution.md) | Semen distribution screen | ✅ |
| [semen-ledger.md](ui/semen-ledger.md) | Semen ledger / stock history | ✅ |
| [notifications.md](ui/notifications.md) | Notifications inbox | ✅ |
| [notification-settings.md](ui/notification-settings.md) | Notification preferences | ✅ |
| [change-password.md](ui/change-password.md) | Change password screen | ✅ |
| [forget-password.md](ui/forget-password.md) | Forgot password screen | ✅ |
| [reset-password.md](ui/reset-password.md) | Reset password from email link | ✅ |
| [manage-passkeys.md](ui/manage-passkeys.md) | View and delete passkeys | ✅ |
| [passkey-setup.md](ui/passkey-setup.md) | Register a new passkey | ✅ |
| [active-sessions.md](ui/active-sessions.md) | View and revoke active refresh token sessions | ✅ |

---

## Overview & Narrative

| File | Description | Status |
|------|-------------|--------|
| [OVERVIEW.md](OVERVIEW.md) | Prose narrative: apps, hierarchy, report lifecycle, rollup, distribution, auth | ✅ |

---

**Total diagrams: 115**
