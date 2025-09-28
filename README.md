# AH Punjab Reporting

A Progressive Web App for Punjab's Animal Husbandry Department reporting system.

## Overview

AH Punjab Reporting replaces the old Google Sheets system with a secure, role-based reporting platform for veterinary staff across the village → tehsil → district → HQ hierarchy.

**Architecture**: React PWA + Fastify + PostgreSQL

## Project Structure

```
├── ahpunjabfrontend/    # React PWA with TypeScript
├── Backend/             # Fastify Node.js server
└── CLAUDE.md           # Development guidelines
```

## Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis

### Frontend Development
```bash
cd ahpunjabfrontend
npm install
npm run dev          # Starts Vite dev server on port 3000
```

### Backend Development
```bash
cd Backend
npm install
npm run dev          # Starts Fastify server on port 8080
```

## Features

- **Progressive Web App**: Installable, offline-capable with service workers
- **WebAuthn Authentication**: Biometric login + JWT tokens
- **Role-based Access Control**: Multi-level hierarchy permissions
- **Monthly Reporting Workflow**: Draft → Submit → Approve flow
- **Real-time Analytics**: Dashboard with reporting insights
- **Geographic Hierarchy**: Districts, tehsils, villages management

## API Documentation

When the backend is running, visit `http://localhost:8080/docs` for interactive Swagger API documentation.

Base API URL: `/v1`

**Core Endpoints:**
- `/auth/*` - Authentication and user management
- `/geo/*` - Geographic hierarchy data
- `/institutes/*` - Staff directory and population data
- `/vaccines/*`, `/semen/*` - Inventory tracking
- `/reports/*` - Monthly reporting system
- `/analytics/*` - Dashboard and analytics

## Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite build system
- TailwindCSS v4
- PWA with service workers

**Backend:**
- Fastify web framework
- PostgreSQL database
- Redis for caching
- WebAuthn + JWT authentication
- JSON Schema validation

## Development Commands

### Frontend
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint
```

### Backend
```bash
npm run dev          # Development with auto-reload
npm start            # Production server
npm test             # Run tests
```

## Security

- Argon2id password hashing
- WebAuthn biometric authentication
- Short-lived JWT access tokens
- Rotating refresh tokens in HttpOnly cookies
- Row Level Security (RLS) in PostgreSQL
- CSP, CORS, and input sanitization

## License

[Add your license here]