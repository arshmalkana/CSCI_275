# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AH Punjab Reporting - A Progressive Web App for Punjab's Animal Husbandry Department.

**What it is**: A reporting system for veterinary staff across village → tehsil → district → HQ hierarchy, replacing the old Google Sheets system with secure authentication, role-based access, and proper workflow management.

**Architecture**: React PWA + Fastify + PostgreSQL (traditional client-server, not offline-first)

- **Frontend**: `ahpunjabfrontend/` - React 19 PWA with TypeScript, TailwindCSS v4, Vite, auto-updating service workers
- **Backend**: `Backend/` - Fastify 5.6 Node.js server with plugin architecture, JSON Schema validation, Swagger docs

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
  await fastify.register(import('@fastify/swagger'))
  await fastify.register(import('./routes/user.js'), { prefix: '/users' })
  ```
- **MVC Pattern**:
  - **Routes**: Route definitions with schema validation (`src/routes/`)
  - **Controllers**: Request handlers (`src/controllers/`)
  - **Services**: Business logic (`src/services/`)
  - **Schemas**: JSON Schema validation definitions (`src/schemas/`)
  - **Plugins**: Fastify plugins like CORS (`src/plugins/`)
- **Schema-First Development**: JSON Schema definitions drive API validation and Swagger docs
- **Current State**: Basic user CRUD with in-memory storage, CORS enabled, Swagger UI active

### Communication Architecture
- **API Versioning**: Base URL `/v1` for all backend routes
- **Development Setup**: Frontend dev server proxies API calls to backend
- **CORS Configuration**: `origin: '*'` for development (configured in `src/plugins/cors.js`)
- **Documentation**: Auto-generated Swagger UI at `http://localhost:8080/docs`

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

## Testing Architecture
- **Backend**: Node.js built-in test runner with `--watch` mode
- **Test Location**: `Backend/test/` directory
- **Testing Pattern**: Fastify injection testing for API endpoints
- **Example Test Structure**:
  ```javascript
  const app = Fastify()
  app.addSchema(userSchema)
  await app.register(appPlugin)
  const res = await app.inject({ method: 'GET', url: '/users' })
  assert.strictEqual(res.statusCode, 200)
  ```

## Code Quality Tools
### Frontend
- **ESLint 9.36.0**: Flat config with TypeScript, React Hooks, React Refresh plugins
- **TypeScript**: Strict mode with exhaustive linting rules
- **Prettier**: Integrated with ESLint for code formatting

### Backend
- **ESLint**: Node.js environment configuration
- **Prettier**: Code formatting
- **AJV**: JSON Schema validation for request/response

## Development Patterns
1. **Schema-First API Development**: Define JSON schemas before implementation
2. **Plugin-Based Architecture**: Register Fastify plugins sequentially in `server.js`
3. **Mobile-First PWA**: Design for mobile devices with progressive enhancement
4. **Auto-Documentation**: Swagger UI generates from JSON schemas automatically
5. **ES Modules**: Both frontend and backend use `"type": "module"`
6. **Scroll Handling Pattern**: ALWAYS use flexbox layout for screens, NEVER use fixed positioning for header/footer:
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
- User CRUD operations with schema validation
- CORS configuration for development

**Planned** (from existing design):
- PostgreSQL database integration (currently mock storage)
- WebAuthn + JWT authentication system
- Geographic hierarchy models (village → tehsil → district → HQ)
- Monthly reporting workflow (Draft → Submit → Approve)
- Role-based access control with Row Level Security

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.