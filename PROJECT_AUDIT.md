# AH Punjab Reporting — Project Audit

_Scope: **Database + Backend + Frontend PWA only.** The Oversight Panel app is intentionally not built yet; this document maps what belongs to it. Generated 2026-07-21 from a full read of `Database/schema.sql`, the live `ahpunjab_db`, all of `Backend/src`, and `PWA/src`._

---

## 0. TL;DR

- **DB:** 35 tables + 8 views defined in `Database/schema.sql`. The live dev DB has **37 tables** (the 2 extra — `financial_summaries`, `semen_transactions` — are deprecated, 0 code refs, pending `DROP`). All 8 views compile but **none are currently queried by the app** — they were provisioned for reporting/the panel.
- **Docker:** ✅ Correct. One `docker compose up` at the repo root builds backend + frontend images, starts Postgres (auto-seeded) + pgAdmin, and links everything on the default compose network. Frontend nginx proxies `/v1 → backend:8080`; backend talks to `postgres`. Health-gated `depends_on`. No manual wiring required.
- **Frontend:** 16 field-staff screens are built, routed, and API-wired (working). **7 oversight screens are built but NOT mounted** — they are the seed of the future panel and are correctly kept out of the PWA route table.
- **Not built:** Surgery reporting (table+UI), vaccine dosage logic, staff posting history usage, and the entire Oversight Panel app.
- **Calculations:** Fee math lives **only** server-side in `get_fee_summary()` (good — nothing hardcoded in the frontend), but it has correctness gaps (PD fee always ₹0, surgery data ignored, castration sourced from an OPD workaround, stale fallback rates). Semen straw balance (`get_straw_balance`) is used; the rollup aggregation omits 4 of 7 report sections. Details in §6.
- **Audit fixes applied this pass:** schema integrity hardening (S2/S4/S5/S6), auth identity-freshness + session-bound rolling token (B1/B2), CORS header exposure (F1). See §7.

---

## 1. Database — Tables (35 in schema, grouped by domain)

Legend for "Used by": backend service/controller files that read or write the table. **⚠️ UNUSED** = defined in schema but never referenced by application code.

### 1.1 Geographic hierarchy (3)
| Table | Stores | Used by |
|---|---|---|
| `districts` | 21 Punjab districts (name, state). | geo, register, profile, rollup, admin, auth (dropdowns + rollup grouping) |
| `tehsils` | 84 tehsils, FK→district. | same as districts |
| `villages` | 12,354 villages + **animal population** columns (equine, buffaloes, cows, pigs, goat, sheep, poultry, dogs) + human_population, GPS. | geo, home, register, profile, reports |

### 1.2 Institutes (2)
| Table | Stores | Used by |
|---|---|---|
| `institutes` | The core org unit (CVH/CVD/PAIW/SemenBank/VaccineBank/TehsilHQ/etc). Holds `parent_institute_id` (stock/visibility chain) and `reporting_institute_id` (approval + rollup target, **one hop**). | ~everywhere: scope.js, admin, register, reports, rollup, distribution, home, geo |
| `institute_service_villages` | M:N institute↔village with `is_primary`. | home, profile, register |

### 1.3 Staff (2)
| Table | Stores | Used by |
|---|---|---|
| `staff` | Users: login (`user_id`, `password_hash`), role, designation, current institute, passkey flag, profile pic. | 135 refs — auth, profile, admin, register, notifications, webauthn, reports |
| `staff_postings` | Posting/transfer **history** (start/end, is_incharge, is_current). | **⚠️ UNUSED by backend** — only the `v_current_staff_postings` view reads it. The app uses `staff.current_institute_id` instead. Posting history is a designed-but-unimplemented feature. |

### 1.4 Authentication & security (4)
| Table | Stores | Used by |
|---|---|---|
| `webauthn_credentials` | Passkey public keys, counter, transports. | webauthnService |
| `webauthn_challenges` | Short-lived registration/auth challenges. | webauthnService |
| `refresh_tokens` | Rotating refresh sessions (SHA-256 hash, device, revoke state). | authenticate middleware, refreshTokenService |
| `password_reset_tokens` | One-time reset token hashes. | passwordResetService |

### 1.5 Fees & master data (6)
| Table | Stores | Used by |
|---|---|---|
| `service_charges` | Rate card per `service_code` (OPD_LARGE, PD, AI_*, etc.). **Single source of truth for fees.** | masterData, reports (`get_fee_summary`) |
| `fee_changes_history` | Rate-change log (old/new rate, month) → historical-rate-aware fee calc. | masterData |
| `semen_types` | Semen catalogue (code, species, category, charge link). | distribution, home, masterData, reports, rollup |
| `vaccines` | Vaccine catalogue. | distribution, home, masterData, reports, rollup |
| `vaccine_species_dosage` | Dose-per-animal by species. | **⚠️ UNUSED** — dosage-based auto-calc not implemented. |
| `institute_targets` | Annual/monthly performance targets (institute- or type-scoped, with date ranges). | home, masterData |

### 1.6 Distribution & stock (4)
| Table | Stores | Used by |
|---|---|---|
| `vaccine_transactions` | Vaccine issue events between institutes. | distributionService |
| `vaccine_stock` | Current vaccine stock per institute (received/used/current). | distributionService |
| `semen_distribution_transactions` | Straw issue events (SemenBank→CVD/CVH→PAIW). | distributionService |
| `semen_stock` | Current straw stock per institute. | distributionService |

### 1.7 Monthly report + 7 detail sections (8)
| Table | Stores | Used by |
|---|---|---|
| `monthly_reports` | The report header per institute+month; workflow status (Draft/Submitted/Rejected/Approved), prepared_by/verified_by. | reports, home, rollup, admin, notifications |
| `opd_report_details` | OPD cases by type × category. | reports, home, rollup |
| `surgery_report_details` | Castration/PD/etc. procedures. | **⚠️ UNUSED** — surgery section not implemented in UI or API; also ignored by fee calc. |
| `certificate_report_details` | Health/PostMortem/etc. certificates. | reports |
| `vaccination_report_details` | Doses received/used, animals vaccinated. | reports, home, rollup |
| `ai_report_details` | AI performance + straw usage per semen type. | reports, home, rollup |
| `diagnostic_report_details` | Lab tests by type. | reports |
| `extension_activities_details` | Camps/lectures/training (+ camp_subtype, ladies_attended). | reports |

### 1.8 Report workflow & audit (3)
| Table | Stores | Used by |
|---|---|---|
| `report_section_status` | Per-section approve/reject state (Pending/Approved/Rejected) for granular review. | reports, admin |
| `report_edits_audit` | Field-level audit trail of admin edits (old/new value, reason). | reports, admin, distribution, masterData, periods, auth |
| `compiled_reports` | **Frozen** tier aggregate snapshot (Tehsil/District/Punjab) when a period closes; JSONB payload. | reports, rollup |

### 1.9 Periods & notifications (3)
| Table | Stores | Used by |
|---|---|---|
| `reporting_periods` | Per-month open/deadline/close + lock state. | periods, home, notifications |
| `notifications` | In-app notifications (actions/attachments JSONB, read/archive, expiry). | notifications, push, server |
| `push_subscriptions` | Web-push endpoints per staff. | pushService |

---

## 2. Database — Views (8) and why they exist

**All 8 views compile but are currently unused by the application** (0 references in `Backend/src`). They exist as convenience/reporting surfaces — pre-built for the Oversight Panel and ad-hoc SQL/pgAdmin analysis. Recommendation: keep them (they document intent and will serve the panel), but be aware the PWA backend queries base tables directly.

| View | What it computes | Intended consumer |
|---|---|---|
| `v_institute_hierarchy` | Institute flattened with village/tehsil/district, incharge contact, parent + reporting-institute names. | Panel institute browser / org chart. |
| `v_village_populations` | Village + per-species animal counts + `total_animals`. | Registration form / planning. |
| `v_current_staff_postings` | Current postings joined to staff + institute (`is_current = TRUE`). | Panel staff roster (once posting history is used). |
| `v_monthly_report_summary` | Report + institute + geo + preparer, one row per report. | Panel report list. |
| `v_current_targets` | Active targets with `Institute-Specific` vs `Type-Default` label. ⚠️ Note: shows future-dated targets as current (no `effective_from <= today` filter). | Panel targets dashboard. |
| `v_opd_progressive_totals` | Cumulative OPD totals from **fiscal-year start (April)** via window function. | Progressive report columns / panel trends. |
| `v_vaccination_progressive_totals` | Cumulative vaccination totals (FY window). | same |
| `v_ai_progressive_totals` | Cumulative AI + straw totals (FY window). | same |

**Functions:** `get_fee_summary` ✅used, `get_straw_balance` ✅used, `cleanup_expired_refresh_tokens` ✅used, `get_active_target` ⚠️unused, `cleanup_expired_challenges` ⚠️unused (no scheduler calls it — expired challenges are not being purged), plus trigger fns `update_updated_at_column`, `set_notification_expiry`.

---

## 3. Project structure & Docker — verdict: solid

### 3.1 One-command bring-up ✅
`docker compose up` at the repo root (`/docker-compose.yml`) does everything:
- **postgres** (`ahpunjab-postgres`) — auto-runs `schema.sql → seed-geo → seed-login → seed-other` on first init (validated: 0 errors), loopback-published `127.0.0.1:5432`.
- **backend** — built from `Backend/Dockerfile` (`node:24-alpine`, `npm ci --omit=dev`), `depends_on: postgres (service_healthy)`, connects via `DB_HOST=postgres`.
- **frontend** — built from `PWA/Dockerfile` (multi-stage: Vite build → nginx), `depends_on: backend`, published `8082:80`.
- **pgadmin** — `5050:80`.

All four share the default compose network, so service-name DNS (`postgres`, `backend`) resolves automatically. **No manual linking needed.**

### 3.2 Connections ✅
- Frontend → backend: `PWA/nginx.conf` proxies `location /v1 → http://backend:8080`. The SPA calls the relative `/v1` base, so it's same-origin in the container — no CORS needed in prod, and the rolling-token header passes straight through nginx.
- Backend → DB: `pg` pool in `src/database/db.js`, env-driven.
- Dev mode: `npm run dev` (root) starts the DB via compose, then Vite (`:3000`, proxies `/v1 → :8080`) + Fastify (`:8080`).

### 3.3 Folder structure & naming ✅ (minor notes)
- Clean MVC split in `Backend/src`: `routes/ → controllers/ → services/`, plus `config/ middleware/ plugins/ utils/ schemas/ database/`. Naming is consistent (`xController.js` / `xService.js`).
- Frontend: `screens/ components/ services/ utils/ config/ sw/`. Consistent PascalCase screens, camelCase utils.
- Database: consolidated to 4 files (`schema.sql` + 3 seeds). ✅
- **Minor:** `Backend/src/schemas/` holds only `userSchema.js` (most route schemas are inline) — inconsistent but harmless. `AllScreensScreen`/`/all-screens` is a dev-only nav aid shipped in the bundle; consider stripping from prod builds.

---

## 4. Frontend — what's built vs. not

### 4.1 Built, routed, API-wired (the field PWA — working) ✅
Auth/account: `LoginScreen`, `RegisterScreen`, `ForgetPasswordScreen`, `ResetPasswordScreen`, `ChangePasswordScreen`, `ProfileScreen`, `PasskeySetupScreen`, `ManagePasskeysScreen`, `ActiveSessionsScreen`.
Core work: `HomeScreen` (dashboard), `MonthlyReportScreen`, `CreateReportScreen` (1,527 lines — the big one), `NotificationsScreen`, `NotificationSettingsScreen`.
Distribution: `VaccineDistributionScreen`, `SemenDistributionScreen`, `SemenLedgerScreen`.

These fetch master data (semen types, vaccines, geo, service charges) from the API — **no hardcoded catalogues or rates in the frontend.**

### 4.2 Built but NOT mounted (orphaned oversight screens) ⚠️
These 7 exist in `screens/` but are **not imported or routed in `App.tsx`** and not referenced anywhere. `ProtectedRoute` actively bounces Oversight users out of the PWA (`isFieldRole` guard). They are the future panel, currently dead code in the PWA repo:
`AdminPanelScreen`, `ApprovalQueueScreen`, `ConsolidatedDashboardScreen`, `InstituteManagementScreen`, `MasterDataScreen`, `PeriodConfigScreen`, `TargetsScreen`.

### 4.3 Not built at all
- **Surgery report section** — `surgery_report_details` has no UI and no API.
- **Vaccine dosage auto-calc** — `vaccine_species_dosage` unused.
- **Staff posting history** — `staff_postings` unused; transfers aren't recorded as history.
- **The Oversight Panel app** — see §5.

---

## 5. Oversight Panel — what belongs there (not in the PWA)

The design is explicit (`config/roles.js`): field roles (CVD/CVH/PAIW/SemenBank/VaccineBank) use the PWA; the single `Oversight` role uses a **separate panel app**. Today the panel's *backend* already exists (endpoints live in this same Fastify server) and 7 of its *screens* are prototyped in the PWA repo. To make the system complete — so **no oversight action requires hardcoding or DB surgery** — the panel must own:

**Approval & compilation**
- Approve/reject reports and per-section review — backend `reports.js` + `report_section_status` (UI: `ApprovalQueueScreen`).
- Close/compile a tehsil period into `compiled_reports`, view rollups — `rollup.js` (2), `ConsolidatedDashboardScreen`.
- Open/lock reporting periods — `periods.js` (5), `PeriodConfigScreen`.

**Master-data administration (removes the "hardcoded rates" risk)**
- Edit `service_charges` + log to `fee_changes_history` — `masterData.js` (18), `MasterDataScreen`. **This is the correct home for fee rates** so the fallback literals in `get_fee_summary` can be deleted (see §6).
- Manage semen types, vaccines, (and `vaccine_species_dosage`).
- Manage `institute_targets` — `TargetsScreen`.

**Org & user administration**
- Create/manage institutes and the `parent_institute_id`/`reporting_institute_id` wiring — `admin.js` (16), `InstituteManagementScreen`.
- Approve staff registrations, assign roles/postings, reset passwords — `admin.js`, `AdminPanelScreen`.

**Distribution oversight**
- Stock issue/reconcile across institutes — `distributions.js` (10).

Backend endpoint surface today: **99 endpoints across 14 route groups**; roughly **51 of them** (`admin` 16, `master-data` 18, `distributions` 10, `periods` 5, `rollup` 2) are oversight-oriented and should be served to the panel, guarded by `scope.js` (already correct).

> **Migration note:** move the 7 orphan screens out of `PWA/` into the panel app so the PWA bundle carries only field code. The backend can stay shared or be split later (`roles.js` already flags this as Phase 2).

---

## 6. Calculations — what exists, where, and how to correct it

**Where fee/quantity math lives:** entirely server-side (good). The frontend never computes money.

### 6.1 `get_fee_summary(institute_id, month)` — `Database/schema.sql` §28
Computes per-institute service fees for a month, historical-rate-aware (reads `fee_changes_history`, falls back to `service_charges.current_rate`). Called by `reportsService.js` (report fee panel + PDF). **Correctness gaps to fix:**

1. **PD (Pregnancy Diagnosis) fee is always ₹0.** `pd_count` is hardcoded to `0` (schema.sql ~line 1166). The `PD` rate exists (₹25). → **Fix:** source PD counts from real data (see #2).
2. **Surgery data is ignored entirely.** `surgery_report_details` (Castration, PD…) is never read; instead `castrations` are pulled from `opd_report_details` where `case_category = 'Camp'` — an OPD workaround. → **Fix:** decide the canonical source. If surgery is entered in the surgery section, join `surgery_report_details` by `procedure_type IN ('Castration','Pregnancy Diagnosis')`. If it's really entered under OPD, then the surgery table + section should be dropped. This needs your data-entry reality — **it's the main "formula not correct" item.**
3. **Stale hardcoded fallback rates.** Each fee line is `COALESCE((SELECT rate …), <literal>)` and the literals drifted (e.g. `LAB_FECAL` literal 40 vs live 50). They're currently unreachable (all 12 `service_code`s exist), but they're a landmine. → **Fix:** delete the literals and rely solely on `service_charges` (managed from the panel's `MasterDataScreen`). A missing code should surface as NULL/visibly-zero, not a silent wrong number.
4. **No submission-status filter.** Fees are computed over Draft data too. Confirm whether that's intended (live preview) or should be limited to `Submitted/Approved`.
5. **Category mapping is by convention** (`case_category = 'New'` for OPD large/dogs, `'Camp'` for castration). Documented at the top of `schema.sql`; verify it matches the form.

### 6.2 `get_straw_balance(institute_id, month)` — `Database/schema.sql` §27 ✅ used
Running semen-straw balances (last-year carry, last-month, this-month, this-year, balance-in-hand) from `ai_report_details`. Logic is internally consistent (fiscal-year aware). No status filter (same note as above). Called by `reportsService.js`.

### 6.3 Rollup aggregation — `services/rollupService.js` (`buildLiveRollup`)
Sums report sections across an oversight user's scope for the compile/dashboard. **Gap:** it only aggregates **OPD, AI, and Vaccination** — it omits **surgery, certificate, diagnostic, and extension** sections. → **Fix:** add the missing 4 aggregations before the panel dashboards go live, or the tier totals will undercount. It correctly filters `submission_status IN ('Submitted','Approved')` and returns frozen `compiled_reports.payload` for closed periods (no recompute).

### 6.4 Progressive totals — 3 views (§2), currently unused
`v_opd/vaccination/ai_progressive_totals` already implement correct fiscal-year cumulative sums. They're ready for the panel/report "progressive" columns but nothing queries them yet. → **Fix:** wire the report/panel to these instead of recomputing in JS.

### 6.5 Targets — `get_active_target()` unused
The function (institute-specific → type-default fallback, date-aware) is written but never called; target vs. actual comparison isn't wired. `v_current_targets` also unused. → **Fix:** call `get_active_target` from the home/report/panel "performance vs target" widgets.

---

## 7. Audit fixes applied in this pass

Structural issues from the prior review, fixed here (see git diff):

| ID | Fix | File |
|---|---|---|
| S2 | Partial-unique indexes: one `is_current` posting per staff; one `is_primary` village per institute. | `schema.sql` §32 |
| S4 | Missing `updated_at` trigger added for `service_charges`. | `schema.sql` §32 |
| S5 | Indexed unindexed FK/join columns (surgery/certificate/extension `report_id`, `monthly_reports.prepared_by/verified_by`, `notifications.sender_id`). | `schema.sql` §32 |
| S6 | CHECK constraints: `reporting_month` must be `YYYY-MM` (protects `TO_DATE` in views/functions); `end_date >= start_date`. | `schema.sql` §32 |
| B1 | Auth middleware now re-reads `role`/`institute`/`designation`/`is_active` from the DB every request, so RBAC scope is never stale after a role change or transfer. | `middleware/authenticate.js` |
| B2 | Rolling token only re-issues while a valid (unrevoked, unexpired) refresh session exists — bounds a stolen access token to one TTL after logout. | `middleware/authenticate.js` |
| F1 | CORS now exposes `X-New-Token` so the rolling token works cross-origin (not only behind the nginx proxy). | `plugins/cors.js` |

Validated: full fresh init (schema + 3 seeds) loads with **0 errors** and the new constraints hold against seed data.

**Documented, not auto-changed (need your domain input):** the §6.1 fee-formula corrections (PD/surgery sourcing, stale fallbacks) and §6.3 rollup section coverage — because they change reported numbers.

---

## 8. Prioritized backlog (suggested)

1. **Decide surgery/PD sourcing** (§6.1 #1–2) — unblocks correct fees. _High._
2. **Delete hardcoded fee fallbacks** once #1 is settled (§6.1 #3). _High, low-risk._
3. **Complete rollup aggregation** (add 4 missing sections, §6.3) before panel dashboards. _High._
4. **Build the Oversight Panel** from the 7 orphan screens + existing endpoints (§5); move them out of the PWA. _Large._
5. **Wire targets** (`get_active_target`, `v_current_targets`) into performance widgets (§6.5). _Medium._
6. **Implement or drop** `staff_postings`, `vaccine_species_dosage`, `surgery_report_details` (§1) — resolve schema/feature drift. _Medium._
7. Schedule `cleanup_expired_challenges()` (§2) — expired WebAuthn challenges aren't being purged. _Low._
8. Drop deprecated `financial_summaries` + `semen_transactions` from the live DB (§0). _Low._
