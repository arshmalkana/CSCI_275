# How AH Punjab Works — End-to-End Overview

This document ties together every component of the AH Punjab reporting system.
Every claim links to a detailed diagram in the `uml/` tree.

---

## Two Apps, Two Audiences

The system is split into two separate deployments that share the same backend:

| App | Who logs in | Role |
|---|---|---|
| **PWA** (`PWA/`) | CVD, CVH, PAIW, SemenBank, VaccineBank | Submit monthly reports, manage distributions |
| **Panel** (`OversightPanel/`) | Oversight (Tehsil-level officers) | Approve reports, close periods, view rollups |

`ProtectedRoute` in each app enforces this split at the client level.
`authenticate.js` enforces it at the API level — every sensitive route checks
`request.user.role` against either `FIELD_ROLES` or `ADMIN_ROLES`.

→ See [architecture.md](architecture.md) for the full system diagram.
→ See [files/fe-App.md](files/fe-App.md) for PWA routing + Oversight block.

---

## Institute Hierarchy and the Two Linkage Fields

All institutes sit in a four-level tree:

```
Punjab (HQ)
 └─ District
     └─ Tehsil  ← where Oversight users are assigned
         ├─ CVD / CVH / PAIW / SemenBank / VaccineBank  (field institutes)
         └─ …
```

Every institute row has **two** distinct foreign keys into the same `institutes` table:

| Field | Meaning | Used for |
|---|---|---|
| `reporting_institute_id` | Which Tehsil this institute rolls up to | Oversight scope (which field units does this Tehsil see?), approval queues, rollup aggregation |
| `parent_institute_id` | Direct organizational parent (one hop up) | Distribution only — vaccine/semen may only go to direct children |

**These must never be swapped.** `scope.js` uses `reporting_institute_id` for all visibility checks.
`distributionService.js` uses `parent_institute_id` for issuing stock.

→ See [DATABASE.md](../DATABASE.md) for the full ER diagram and the linkage field explanation.
→ See [files/be-scope.md](files/be-scope.md) for `getVisibleInstituteIds`.
→ See [files/be-distributionService.md](files/be-distributionService.md) for direct-child check.

---

## Monthly Report Lifecycle

A field report goes through six stages:

```
Draft → Submitted → per-section review → Approved (all sections) → Tehsil close/compile
```

1. **Field staff** creates a report in `CreateReportScreen` — 5 sections: OPD, AI, Vaccination, Camp, Lab.
2. They submit it: `POST /v1/reports/monthly { status: "Submitted" }`.
3. **Oversight** reviews section by section:
   - Approve sections: `PATCH /monthly/:month/approve-sections { sections: ["opd_report", …] }`
   - Reject a section: `PATCH /monthly/:month/reject-section` → report drops back to Draft for revision
4. When **all 5 sections** are Approved, `monthly_reports.status` becomes `Approved`.
5. Oversight calls `POST /monthly/:month/close-period` — validates all field reports are Approved, then writes a frozen `compiled_reports` snapshot.

Each section has its own row in `report_section_status` with status Pending / Approved / Rejected.

→ See [flows/flow-report-lifecycle.md](flows/flow-report-lifecycle.md) for the full sequence.
→ See [flows/flow-close-period.md](flows/flow-close-period.md) for the compile step.
→ See [files/be-reportsService.md](files/be-reportsService.md) for `approveSections`, `closeTehsilPeriod`.

---

## Rollup: Live vs Frozen

The Oversight panel's Consolidated Dashboard calls `GET /v1/rollup/summary?month=YYYY-MM`.
The response differs depending on whether the period has been closed:

```
period closed?
  yes → return compiled_reports.payload_json  (frozen JSONB snapshot, instant)
  no  → live SUM query over approved monthly_reports for visible institutes
```

This means the rollup total is immutable once the period closes.
The regression anchor — Talwandi Sabo Tehsil, April 2026 = ₹62,425 — must match the compiled snapshot exactly.

→ See [flows/flow-rollup-read.md](flows/flow-rollup-read.md) for the branch logic.
→ See [files/be-rollupService.md](files/be-rollupService.md) for `getRollupSummary`.
→ See [endpoints/rollup.md](endpoints/rollup.md) for `/v1/rollup/summary` and `/v1/rollup/export`.

---

## Distribution Ledgers

Two independent stock ledgers, both enforcing **direct-child-only** issuance:

### Vaccine Distribution
- **Issuer roles:** VaccineBank, CVH
- **Receiver:** any direct child via `parent_institute_id`
- **Table:** `vaccine_transactions`
- **PWA screen:** `VaccineDistributionScreen` → `SemenLedgerScreen` for receipts

### Semen Distribution
- **Issuer role:** SemenBank only
- **Receiver:** any direct child via `parent_institute_id`
- **Table:** `semen_distribution_transactions`
- **PWA screens:** `SemenDistributionScreen` (issue), `SemenLedgerScreen` (ledger + balance)

Both ledgers create in-app notifications for the receiving institute on successful issuance.

→ See [flows/flow-vaccine-issue.md](flows/flow-vaccine-issue.md).
→ See [flows/flow-semen-issue.md](flows/flow-semen-issue.md).
→ See [files/be-distributionService.md](files/be-distributionService.md).
→ See [endpoints/distributions-vaccine.md](endpoints/distributions-vaccine.md) and [endpoints/distributions-semen.md](endpoints/distributions-semen.md).

---

## Authentication and Session

### Password login
1. `POST /v1/auth/login { userId, password }` — Argon2id verify
2. Backend issues a 15-min **access token** (JWT) + 7-day **refresh token** (HttpOnly cookie)
3. Access token stored in `localStorage`; refresh token never accessible from JS
4. Every API call goes through `apiClient.ts`:
   - Attaches `Authorization: Bearer <token>`
   - Saves the `X-New-Token` rolling header if present (refreshes 15-min window)
   - On 401: fires `POST /v1/auth/refresh` once (deduped), retries the original request

### WebAuthn passkey
1. Device registers a passkey credential via `POST /v1/auth/webauthn/register-options` + `verify`
2. On subsequent logins, device sign-in verifies the assertion server-side via `webauthnService.js`
3. On success, same JWT + cookie flow as password login

### Logout
`DELETE /v1/auth/logout` revokes the refresh token in the DB.
`authService.logout()` clears localStorage. The access token expires naturally within 15 min.

→ See [flows/flow-login.md](flows/flow-login.md).
→ See [flows/flow-logout.md](flows/flow-logout.md).
→ See [files/be-authService.md](files/be-authService.md).
→ See [files/fe-apiClient.md](files/fe-apiClient.md).

---

## File Map

| Layer | Key files |
|---|---|
| Backend entry | [files/be-server.md](files/be-server.md) — plugin order, 14 route prefixes |
| Auth middleware | [files/be-authenticate.md](files/be-authenticate.md) — JWT verify + rolling token |
| Data isolation | [files/be-scope.md](files/be-scope.md) — `getVisibleInstituteIds` |
| Roles config | [files/be-roles.md](files/be-roles.md) — FIELD_ROLES, OVERSIGHT_ROLE |
| Database pool | [files/be-db.md](files/be-db.md) — pg Pool, query(), getClient() |
| PWA root | [files/fe-App.md](files/fe-App.md) — router, Oversight block |
| Token fetch | [files/fe-apiClient.md](files/fe-apiClient.md) — rolling token + refresh dedup |
| API wrappers | [files/fe-api.md](files/fe-api.md) — typed calls to all backend endpoints |

→ See [INDEX.md](INDEX.md) for the complete 58-diagram catalogue.
