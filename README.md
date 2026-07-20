# AH Punjab Reporting

Progressive Web App for Punjab's Animal Husbandry Department, replacing the old Google Sheets workflow with a secure, role-based reporting platform for veterinary staff across a village → tehsil → district → HQ hierarchy.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, TailwindCSS v4, Vite 7, vite-plugin-pwa |
| Backend | Fastify 5.6, Node.js (ES modules) |
| Database | PostgreSQL 16 |
| Auth | JWT (15 min) + rotating refresh tokens (HttpOnly cookies) + WebAuthn passkeys |
| Passwords | Argon2id |
| Deployment | Docker Compose (postgres + backend + frontend + pgAdmin) |

## Project Layout

```
├── ahpunjabfrontend/      React PWA
│   ├── src/screens/       One file per screen
│   ├── src/components/    Shared UI components
│   ├── src/utils/         api.ts (all API calls), apiClient.ts (JWT + refresh), offlineQueue.ts
│   └── src/services/      authService.ts
├── Backend/
│   ├── src/routes/        Fastify route plugins (one per domain)
│   ├── src/controllers/   Request handlers (thin — delegate to services)
│   ├── src/services/      Business logic
│   ├── src/middleware/    authenticate.js, sanitize.js
│   └── src/utils/         scope.js (institute access control), errors.js, logger.js
├── Database/
│   ├── init/              Schema + seed SQL (run in order by Docker)
│   └── migrations/        Additive migrations (001–005)
├── docker-compose.yml
├── PROGRESS.md            Detailed implementation changelog
└── CLAUDE.md              AI development guidelines
```

## Quick Start (Docker)

```bash
cp Backend/.env.example Backend/.env
# Edit Backend/.env — fill in COOKIE_SECRET, JWT_SECRET, CORS_ORIGINS, etc.

docker compose up --build
# Frontend: http://localhost:3000
# Backend API docs: http://localhost:8080/docs
# pgAdmin: http://localhost:5050
```

## Quick Start (Development)

**Prerequisites**: Node.js 20+, PostgreSQL 16 running locally

```bash
# 1. Database: start Postgres with schema + seeds auto-loaded
docker compose up -d postgres pgadmin   # or: npm run db
# Manual alternative — run in order:
#   psql ... -f Database/schema.sql
#   psql ... -f Database/seed-geo.sql
#   psql ... -f Database/seed-login.sql
#   psql ... -f Database/seed-other.sql

# 2. Backend (port 8080)
cd Backend
cp .env.example .env   # fill in required values
npm install
npm run dev

# 3. Frontend (port 3000)
cd ahpunjabfrontend
cp .env.example .env
npm install
npm run dev
```

Swagger UI: `http://localhost:8080/docs`

## Role Hierarchy & Permissions

```
INAPH / AIW        — field staff: create / submit own monthly reports
Tehsil_Admin       — approve/reject in tehsil subtree, view rollup
District_Admin     — approve/reject in district subtree, view rollup
HQ_Admin           — approve/reject statewide, user management, master data, institute CRUD
Super_Admin        — full access
```

Institute tree FK: `institutes.reporting_authority_id` → parent `institute_id`  
Scope enforcement: `Backend/src/utils/scope.js::getVisibleInstituteIds(user)` — recursive CTE, used as the single access-control chokepoint for every admin query.

## Implemented Features

### Authentication
- JWT (5 min access) + rotating refresh tokens in HttpOnly cookies; single-flight refresh race prevention
- WebAuthn passkey registration and authentication
- Argon2id password hashing; plain-text fallback detection + auto-upgrade on first login
- Forgot-password → email reset link → `/reset-password?token=...` flow
- PATCH `/auth/change-password` with current-password verification

### Monthly Reporting Workflow
- Field staff: Draft → Submit (with offline queue via IndexedDB + Background Sync SW)
- Admin: Approve / Reject with comment (subtree-scoped)
- Full audit trail in `report_edits_audit`: initial creation, status changes, and a JSON snapshot of all detail rows before every re-save
- Reporting periods with configurable deadlines; automated daily deadline reminder notifications

### Consolidated Dashboard (Admin)
- Aggregated OPD / AI / Vaccination totals across the admin's visible institutes
- Drill-down to a single institute
- Export as **PDF** (`pdfkit`) or **CSV** — downloaded via authenticated fetch + Blob URL

### Master Data Management (HQ_Admin+)
- **Service charges**: CRUD + rate history — when a rate is updated, the old rate is recorded in `fee_changes_history`; `get_fee_summary()` DB function is historical-rate-aware (uses the rate that was in effect during the reporting month)
- **Semen types**: CRUD (code, name, species, category); drives AI report breed columns
- **Vaccines**: CRUD; fixes vaccine code alignment that was silently dropping vaccination data
- **Institute targets**: subtree-scoped per-institute annual targets (OPD / AI_Cattle / AI_Buffalo); replaces previously hardcoded fallback values

### Administration
- Registration approval queue (admin reviews pending registrations)
- User lifecycle: deactivate / reactivate / edit role
- Institute CRUD: create, rename, change type, deactivate (HQ_Admin+)
- Period config: lock / reopen reporting months; manual reminders to non-submitting institutes
- Notifications: in-app + Web Push; deadline reminders sent automatically on boot and every 24 h

### PWA
- Auto-updating service worker (Workbox)
- Offline detection; report submissions queued when offline and synced on reconnect
- iOS safe-area-inset handling throughout
- Web Push notification subscription

## API Base URL

`/v1` — all endpoints live under this prefix.

Key route groups: `/v1/auth`, `/v1/reports`, `/v1/admin`, `/v1/admin/master-data`, `/v1/rollup`, `/v1/periods`, `/v1/notifications`, `/v1/push`

## Environment Variables

See `Backend/.env.example` for the full list. Required in production:

```
NODE_ENV=production
COOKIE_SECRET=<32+ random bytes>
JWT_SECRET=<32+ random bytes>
CORS_ORIGINS=https://your-domain.com
FRONTEND_ORIGIN=https://your-domain.com
DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM
VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT
```

## Database Schema & Seeds

The schema and seed data are consolidated into four files, applied in order by Docker's `docker-entrypoint-initdb.d/` mechanism (see `docker-compose.yml`):

| File | Purpose |
|---|---|
| `Database/schema.sql` | Full schema — all tables, indexes, views, functions, triggers |
| `Database/seed-geo.sql` | Punjab geography (districts, tehsils, villages) |
| `Database/seed-login.sql` | Minimal master data + test user |
| `Database/seed-other.sql` | Sample test data + Talwandi Sabo real data |

## Development Commands

```bash
# Frontend
npm run dev      # Vite dev server (port 3000, proxies /v1 to :8080)
npm run build    # TypeScript + Vite production build
npm run lint     # ESLint (strict TypeScript + React Hooks rules)

# Backend
npm run dev      # nodemon with fastify config
npm start        # production
npm test         # Node.js built-in test runner
```
