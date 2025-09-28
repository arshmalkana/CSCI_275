# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AH Punjab Reporting - A Progressive Web App for Punjab's Animal Husbandry Department.

**What it is**: A reporting system for veterinary staff across village → tehsil → district → HQ hierarchy, replacing the old Google Sheets system with secure authentication, role-based access, and proper workflow management.

**Architecture**: React PWA + Fastify + PostgreSQL (traditional client-server, not offline-first)

- **Frontend**: `ahpunjabfrontend/` - React PWA with TypeScript, TailwindCSS, service workers for installability and push notifications
- **Backend**: `Backend/` - Fastify Node.js server with PostgreSQL, Redis for caching/queues, Swagger documentation

## Development Commands

### Frontend (ahpunjabfrontend/)
```bash
cd ahpunjabfrontend
npm run dev          # Start Vite development server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

### Backend (Backend/)
```bash
cd Backend
npm run dev          # Start Fastify development server with auto-reload (port 8080)
npm start            # Start production server
npm test             # Run tests with Node.js test runner (--watch mode)
```

## Architecture

### Frontend Structure
- **Vite + React PWA** with TypeScript
- Located in `ahpunjabfrontend/src/`
- **PWA Features**: Auto-updating service workers, installable, API caching
- **Styling**: TailwindCSS v4 with PostCSS
- **Development**: Vite dev server with HMR, API proxy to backend
- **Production**: Optimized builds with PWA manifest and service worker
- **Authentication**: WebAuthn + JWT (to be implemented)

### Backend Structure
- Fastify server with modular plugin architecture
- Main entry point: `Backend/src/server.js`
- MVC pattern:
  - Controllers: `src/controllers/`
  - Routes: `src/routes/`
  - Services: `src/services/`
  - Schemas: `src/schemas/`
  - Utils: `src/utils/`
- PostgreSQL database with proper migrations
- Redis for caching and queues
- Swagger/OpenAPI documentation available at `/docs` when server is running
- Configuration via `fastify.config.json` (port 8080, address 0.0.0.0)

### Key Backend Features
- WebAuthn + JWT authentication (short-lived access tokens, rotating refresh tokens)
- Role-based access control across hierarchy levels
- JSON schema validation using AJV
- Structured logging with Pino
- Auto-generated API documentation with Swagger UI
- Plugin-based architecture for modularity

## API Design
Base URL: `/v1`

**Core API Groups:**
- **Auth**: `/auth/*` - login, register, refresh, WebAuthn endpoints
- **Geography**: `/geo/*` - districts, tehsils, villages hierarchy
- **Institutes**: `/institutes/*` - staff directory, population data
- **Inventory**: `/vaccines/*`, `/semen/*` - vaccine and semen tracking
- **Reports**: `/reports/*` - monthly reporting workflow (draft → submit → approve)
- **Analytics**: `/analytics/*` - dashboard and summary data

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

## Testing
- Backend uses Node.js built-in test runner
- Tests located in `Backend/test/`
- Tests run in watch mode by default during development

## Development Workflow
1. **Contracts first**: JSON Schemas + OpenAPI definitions
2. **Iterative slices**: Auth → Directory → Inventory → Reports → Admin
3. **Database migrations** for schema changes
4. **Security-first**: All endpoints require proper authentication/authorization