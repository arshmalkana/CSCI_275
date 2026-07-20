# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AH Punjab Reporting - A Progressive Web App for Punjab's Animal Husbandry Department.

**What it is**: A reporting system for veterinary staff across village → tehsil → district → HQ hierarchy, replacing the old Google Sheets system with secure authentication, role-based access, and proper workflow management.

**Architecture**: React PWA + Fastify + PostgreSQL (traditional client-server, not offline-first)

- **Frontend**: `ahpunjabfrontend/` - React 19 PWA with TypeScript, TailwindCSS v4, Vite, auto-updating service workers
- **Backend**: `Backend/` - Fastify 5.6 Node.js server with plugin architecture, JSON Schema validation, Swagger docs

## Environment & Deployment

- **ahdp.in is a development/testing deployment — NOT production.** It is not yet live to real users. Don't assume real user data is at stake — but the code is still built to production standards (see Security Model).
- **Development happens on the server** that hosts ahdp.in, edited through a browser-based VS Code console. "localhost" in this environment refers to the server itself, not a local laptop.
- **ahdp.in is served via a Cloudflare Tunnel.** Test against local ports directly (`localhost:3000` / `localhost:8080`), not through the public tunnel URL.
- **PostgreSQL runs in a Docker container published to loopback only** (`127.0.0.1:5432`). The dev DB is reseedable and has been reset before when the container was recreated — **take a `pg_dump` before any migration or structural DB change** so hand-built test state isn't lost.
- **Runtime**: Node 24.

## MCP Tooling & Tool Discipline

This repo has MCP servers configured in Claude Code. Prefer them over reasoning from memory or plain-text search:

- **Postgres MCP** (`localhost:5432`, unrestricted): Introspect the **live schema** and treat it as the source of truth for drift checks — diff it against the migration/DDL files before writing or trusting any migration. Use `EXPLAIN` / index analysis for slow queries. _(Resolved: the "45" figure was tables+views — the live dev DB has **37 base tables + 8 views**. The "37 tables" count in this doc is correct.)_
- **Serena** (semantic code tools): Navigate and edit by symbol across the route groups → controllers → services. Use `find_symbol` / `find_referencing_symbols` instead of grepping and reading whole files, and `rename_symbol` / `replace_symbol_body` for refactors so references stay consistent. This is the primary defense against reintroducing schema/role drift during edits.
- **Context7** (current docs): Before using any Fastify 5.6, React 19.1, Vite 7, TailwindCSS v4, `vite-plugin-pwa`, or Workbox API, confirm current syntax via Context7 — these are recent and pre-training assumptions are often stale (e.g. Tailwind v4 CSS-first config, React 19 Actions / `use()`, Fastify 5 plugin encapsulation).
- **Playwright / Chrome DevTools**: Test against the running app at `localhost:3000` (frontend) and `localhost:8080` (API), not through the tunnel. Use **Playwright** for repeatable E2E across the role/institute matrix and WebAuthn/passkey flows; use **Chrome DevTools** for performance traces, service-worker / PWA / offline debugging, and network/console inspection.
- **GitHub**: Use for issues, PRs, and CI/workflow context on this repo.
- **Snyk**: Run security scans (SAST/SCA) before merging changes to auth, RBAC/scope, or data-handling code paths. This is public-sector software.

**Rule of thumb**: verify the live schema before migrations (Postgres MCP), verify library APIs before using them (Context7), navigate by symbol not by grep (Serena).

## Development Commands

### Frontend (ahpunjabfrontend/)

```bash
cd ahpunjabfrontend
npm run dev          # Start Vite dev server with --host (accessible on network)
npm run build        # TypeScript compile + Vite build with PWA manifest
npm run preview      # Preview production build with --host
npm run lint         # ESLint with TypeScript, React Hooks, React Refresh rules
```

### Backend (Backend/)

```bash
cd Backend
npm run dev          # Fastify start with -w (watch) and fastify.config.json
npm start            # Production Fastify server with fastify.config.json
npm test             # Node.js test runner with --watch mode
```

### Common Development Workflow

```bash
# Terminal 1: Start backend
cd Backend && npm run dev

# Terminal 2: Start frontend (proxies /v1 to backend)
cd ahpunjabfrontend && npm run dev

# Access: Frontend at http://localhost:3000, API docs at http://localhost:8080/docs
```

## Architecture

### Frontend Structure (ahpunjabfrontend/)

- **React 19.1.1 + TypeScript** with strict configuration (`noUnusedLocals`, `noUnusedParameters`)
- **Vite 7.1.7** build system with ES2022 target, ESNext modules
- **PWA Implementation**:
  - `vite-plugin-pwa` with `registerType: 'autoUpdate'`
  - Workbox service workers with asset caching
  - Mobile-optimized with iOS safe area insets (`safe-top`, `safe-bottom` utilities)
  - App shortcuts and protocol handlers in manifest
- **Styling**: TailwindCSS v4.1.13 with PostCSS, mobile-first responsive design, Poppins font
- **Development Proxy**: `/v1/*` routes proxy to `http://localhost:8080` for API calls
- **Screen Layout Pattern**: All screens use flexbox layout with fixed header/footer and scrollable content:
  ```tsx
  <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
    <div className="flex-shrink-0">{/* Fixed Header */}</div>
    <div className="flex-1 overflow-y-auto" style={{WebkitOverflowScrolling: 'touch'}}>
      {/* Scrollable Content with pb-32 for button clearance */}
    </div>
    <div className="flex-shrink-0" style={{paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))'}>
      {/* Fixed Button */}
    </div>
  </div>
  ```

### Backend Structure (Backend/)

- **Fastify 5.6.0** with ES modules (`"type": "module"`)
- **Plugin Architecture**: Sequential plugin registration in `src/server.js`
  ```javascript
  await fastify.register(import("@fastify/swagger"));
  await fastify.register(import("./routes/user.js"), { prefix: "/users" });
  ```
- **MVC Pattern**:
  - **Routes**: Route definitions with schema validation (`src/routes/`)
  - **Controllers**: Request handlers (`src/controllers/`)
  - **Services**: Business logic (`src/services/`)
  - **Schemas**: JSON Schema validation definitions (`src/schemas/`)
  - **Plugins**: Fastify plugins like CORS (`src/plugins/`)
- **Schema-First Development**: JSON Schema definitions drive API validation and Swagger docs
- **Current State**: Fully implemented against PostgreSQL (37 live base tables + 8 views). The consolidated `Database/schema.sql` defines **35 tables** — it intentionally omits `financial_summaries` and `semen_transactions`, which are deprecated (0 code refs) and still exist in the live dev DB pending a `DROP`. Don't treat that 35-vs-37 gap as drift. 14 route groups (`src/routes/`) backed by controllers + services, JWT auth with rolling tokens + WebAuthn, Argon2 password hashing, institute-scoped RBAC (`src/utils/scope.js`, `src/config/roles.js`), rate limiting, input sanitization, and a global error handler. DB access via `pg` pool in `src/database/db.js`.

### Communication Architecture

- **API Versioning**: Base URL `/v1` for all backend routes
- **Development Setup**: Frontend dev server proxies API calls to backend
- **CORS Configuration**: `origin: '*'` for development (configured in `src/plugins/cors.js`)
- **Documentation**: Auto-generated Swagger UI at `http://localhost:8080/docs`

## API Design

Base URL: `/v1`

**Core API Groups** (actual prefixes registered in `src/server.js`):

- **Auth**: `/v1/auth/*` - login, refresh, logout; WebAuthn under `/v1/auth/webauthn/*`
- **Register**: `/v1/register/*` - staff registration + approval
- **Home**: `/v1/home/*` - dashboard data
- **Profile**: `/v1/profile/*` - own profile management
- **Geography**: `/v1/geo/*` - districts, tehsils, villages hierarchy
- **Reports**: `/v1/reports/*` - monthly reporting workflow (draft → submit → approve)
- **Admin**: `/v1/admin/*` - oversight admin ops; master data at `/v1/admin/master-data/*`, distributions at `/v1/admin/distributions/*`
- **Rollup**: `/v1/rollup/*` - period compilation / aggregation
- **Periods**: `/v1/periods/*` - reporting-period configuration
- **Notifications**: `/v1/notifications/*` and **Push**: `/v1/push/*`

**Workflow Pattern**: Draft → Submit → Approve → Return/Compile flow for monthly reports

## Database Schema Patterns

- PostgreSQL with proper indexes, foreign keys, audit trails
- Soft deletes (`deleted_at` pattern)
- JSONB for flexible form data
- Audit logs for all critical operations
- Role-based access with Row Level Security (RLS)

## Security Model

- Argon2id for password hashing
- WebAuthn for biometric authentication
- JWT (5-15 min) + rotating refresh tokens in HttpOnly cookies
- Re-authentication required for sensitive operations
- CSP, CORS, input sanitization, TLS everywhere

## Server Configuration

- Backend runs on port 8080 by default
- Frontend runs on port 3000 by default
- Backend serves Swagger docs at `http://localhost:8080/docs`
- Health endpoints: `/health`, `/ready`

## Testing Architecture

- **Backend**: Node.js built-in test runner with `--watch` mode
- **Test Location**: `Backend/test/` directory
- **Testing Pattern**: Fastify injection testing for API endpoints
- **Example Test Structure**:
  ```javascript
  const app = Fastify();
  app.addSchema(userSchema);
  await app.register(appPlugin);
  const res = await app.inject({ method: "GET", url: "/users" });
  assert.strictEqual(res.statusCode, 200);
  ```
- **E2E (via MCP)**: Use Playwright MCP for role/WebAuthn flows against `localhost:3000`; see MCP Tooling section.

## Code Quality Tools

### Frontend

- **ESLint 9.36.0**: Flat config with TypeScript, React Hooks, React Refresh plugins
- **TypeScript**: Strict mode with exhaustive linting rules
- **Prettier**: Integrated with ESLint for code formatting

### Backend

- **ESLint**: Node.js environment configuration
- **Prettier**: Code formatting
- **AJV**: JSON Schema validation for request/response

### Security Scanning

- **Snyk** (via MCP): SAST/SCA scans on auth, RBAC/scope, and data-handling changes before merge.

## Development Patterns

1. **Schema-First API Development**: Define JSON schemas before implementation
2. **Plugin-Based Architecture**: Register Fastify plugins sequentially in `server.js`
3. **Mobile-First PWA**: Design for mobile devices with progressive enhancement
4. **Auto-Documentation**: Swagger UI generates from JSON schemas automatically
5. **ES Modules**: Both frontend and backend use `"type": "module"`
6. **Verify-before-write**: Confirm the live schema (Postgres MCP) and current library APIs (Context7) before writing migrations or framework code.
7. **Scroll Handling Pattern**: ALWAYS use flexbox layout for screens, NEVER use fixed positioning for header/footer:

   ```tsx
   // CORRECT - Works on iOS, Android, Desktop
   <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
     <div className="flex-shrink-0">{/* Header */}</div>
     <div
       className="flex-1 overflow-y-auto"
       style={{WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain'}}
     >
       <div className="pb-32">{/* Content with bottom padding for button clearance */}</div>
     </div>
     <div
       className="flex-shrink-0"
       style={{paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))'}}
     >
       {/* Fixed Button */}
     </div>
   </div>

   // WRONG - Breaks scrolling on iOS
   <div className="relative h-full">
     <div className="fixed top-0">{/* Header */}</div>
     <div className="absolute top-0 bottom-0 overflow-y-auto">{/* Content */}</div>
     <div className="fixed bottom-0">{/* Button */}</div>
   </div>
   ```

## Implementation Status

**Completed - Frontend**:

- Basic project structure with PWA foundation
- Mobile-optimized React PWA with offline detection and installation prompts
- Development tooling (ESLint, TypeScript, Vite)
- **UI Components**:
  - `FloatingLabelField`: Reusable input component with floating labels, icons, error states, vertical centering
  - `PWAWrapper`: iOS safe area handling with `safe-top` class
- **Screens**:
  - `LoginScreen`: Optimized to fit on one screen without scrolling
  - `RegisterScreen`: Multi-step registration with form validation, role selection, multi-select for service villages
  - `ForgetPasswordScreen`: Password recovery flow
  - `ChangePasswordScreen`: Password change with validation
  - `HomeScreen`: Main dashboard with quick actions
  - `ProfileScreen`: Edit profile with flexbox scrolling pattern
  - `NotificationsScreen`: Notifications with responsive header and multi-line action buttons
- **Styling Patterns**:
  - iOS webkit scrolling on all screens
  - Responsive text sizing (text-base sm:text-lg md:text-xl)
  - Consistent yellow gradient buttons (from-yellow-400 to-yellow-500)
  - Poppins font family throughout

**Completed - Backend**:

- Fastify backend with plugin architecture and Swagger docs
- PostgreSQL integration (37 tables — verify current count via Postgres MCP) via `pg` pool in `src/database/db.js`
- JWT auth with rolling access tokens + rotating refresh tokens; WebAuthn (passkeys); Argon2 password hashing; password-reset tokens
- Geographic hierarchy (village → tehsil → district → HQ) and institutes model
- Monthly reporting workflow (Draft → Submit → Approve/Reject) with section status + audit trail
- Institute-scoped RBAC in `src/utils/scope.js` (approval routing via `reporting_institute_id`, one hop) and `src/config/roles.js` (roles: CVD, CVH, PAIW, SemenBank, VaccineBank, Oversight)
- Rate limiting, input sanitization, global error handler, notifications + web push

**Planned / In progress**:

- Panel app split (the `Oversight` role name in `src/config/roles.js` is a placeholder pending the panel deployment; `ADMIN_ROLES`/`SENIOR_ADMIN_ROLES` are legacy aliases collapsing to `Oversight`)
- Row Level Security (currently enforced in application layer via `scope.js`, not Postgres RLS)

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
