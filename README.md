# AH Punjab Reporting

A Progressive Web App for Punjab's Animal Husbandry Department reporting system.

## Overview

AH Punjab Reporting replaces the old Google Sheets system with a secure, role-based reporting platform for veterinary staff across the village → tehsil → district → HQ hierarchy.

**Architecture**: React 19 PWA + Fastify 5.6 + PostgreSQL (planned)

## Project Structure

```
├── ahpunjabfrontend/         # React 19 PWA with TypeScript & TailwindCSS v4
├── Backend/                  # Fastify 5.6 Node.js server with plugin architecture
├── Other Related Docs/       # Project documentation & UI designs
├── CLAUDE.md                # Development guidelines for Claude Code
└── README.md                # Project documentation
```

## Quick Start

### Prerequisites
- Node.js (v18+)
- Currently: No database required (uses mock storage)
- Planned: PostgreSQL and Redis

### Development Setup
```bash
# Terminal 1: Start backend (port 8080)
cd Backend
npm install
npm run dev

# Terminal 2: Start frontend (port 3000, proxies /v1 to backend)
cd ahpunjabfrontend
npm install
npm run dev

# Access:
# Frontend: http://localhost:3000
# API Docs: http://localhost:8080/docs
```

## Features

### Current Implementation
- **Progressive Web App**: Auto-updating service workers, mobile-optimized with iOS safe areas
- **Modern Frontend**: React 19 with TypeScript, TailwindCSS v4, Vite build system
- **API-First Backend**: Fastify with plugin architecture, JSON Schema validation
- **Auto-Documentation**: Swagger UI with live API documentation
- **Development-Ready**: Hot reload, ESLint, TypeScript strict mode

### Planned Features
- **WebAuthn Authentication**: Biometric login + JWT tokens
- **Role-based Access Control**: Multi-level hierarchy permissions
- **Monthly Reporting Workflow**: Draft → Submit → Approve flow
- **Real-time Analytics**: Dashboard with reporting insights
- **Geographic Hierarchy**: Districts, tehsils, villages management
- **Database Integration**: PostgreSQL with proper schema and migrations

## API Documentation

When the backend is running, visit `http://localhost:8080/docs` for interactive Swagger API documentation.

Base API URL: `/v1`

**Current Endpoints:**
- `/users` - Basic user CRUD operations (currently implemented)

**Planned Endpoints:**
- `/auth/*` - Authentication and user management
- `/geo/*` - Geographic hierarchy data
- `/institutes/*` - Staff directory and population data
- `/vaccines/*`, `/semen/*` - Inventory tracking
- `/reports/*` - Monthly reporting system
- `/analytics/*` - Dashboard and analytics

## Technology Stack

**Frontend:**
- **React 19.1.1** with TypeScript (strict mode)
- **Vite 7.1.7** build system with ES2022 target
- **TailwindCSS 4.1.13** with PostCSS
- **PWA**: `vite-plugin-pwa` with Workbox service workers
- **Code Quality**: ESLint 9.36.0 with flat config

**Backend:**
- **Fastify 5.6.0** web framework with ES modules
- **Plugin Architecture**: Sequential plugin registration
- **Validation**: JSON Schema with AJV
- **Documentation**: Auto-generated Swagger UI
- **Testing**: Node.js built-in test runner with watch mode
- **Database**: Mock storage (PostgreSQL planned)

## Development Commands

### Frontend (ahpunjabfrontend/)
```bash
npm run dev          # Vite dev server with --host (network accessible)
npm run build        # TypeScript compile + Vite build with PWA manifest
npm run preview      # Preview production build with --host
npm run lint         # ESLint with TypeScript, React Hooks rules
```

### Backend (Backend/)
```bash
npm run dev          # Fastify with watch mode and fastify.config.json
npm start            # Production Fastify server
npm test             # Node.js test runner with --watch mode
```

## Current Implementation Status

### ✅ Completed
- Basic React PWA with TypeScript and mobile optimization
- Fastify backend with plugin architecture
- JSON Schema validation and Swagger documentation
- Basic user CRUD operations
- Development tooling (ESLint, hot reload, testing framework)
- PWA features (service workers, installability, offline detection)

### 🚧 In Development / Planned
- PostgreSQL database integration
- WebAuthn + JWT authentication system
- Geographic hierarchy models
- Monthly reporting workflow
- Role-based access control
- Real analytics dashboard

## Security (Planned)

- Argon2id password hashing
- WebAuthn biometric authentication
- Short-lived JWT access tokens
- Rotating refresh tokens in HttpOnly cookies
- Row Level Security (RLS) in PostgreSQL
- CSP, CORS, and input sanitization

## License

[Add your license here]