# AH Punjab Reporting — Frontend

Progressive Web App for Punjab's Animal Husbandry Department. Replaces Google Sheets with secure authentication, role-based access, and proper workflow management.

## Tech Stack

- React 19.1.1 + TypeScript (strict mode)
- Vite 7 with PWA plugin (auto-updating service workers)
- TailwindCSS v4 + PostCSS
- React Query v5 for server state
- React Router v6

## Development

```bash
npm install
npm run dev          # Vite dev server on port 3000 (proxies /v1 to backend at :8080)
npm run build        # TypeScript compile + Vite PWA build
npm run lint         # ESLint
```

Backend must be running on port 8080 (see `../Backend/`). The dev proxy in `vite.config.ts` forwards all `/v1/*` requests to the backend.

## Architecture

**Screen layout pattern** — all screens use flexbox, never fixed positioning:
```tsx
<div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
  <div className="flex-shrink-0">{/* header */}</div>
  <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
    {/* scrollable content with pb-32 for button clearance */}
  </div>
  <div className="flex-shrink-0">{/* sticky button */}</div>
</div>
```

**API calls** — all go through `src/utils/apiClient.ts` which handles JWT refresh (single-flight `_refreshPromise` pattern) and `src/utils/api.ts` which exposes typed helpers per endpoint group.

**Role guards** — `AdminRoute` in `App.tsx` accepts a `roles` prop; role constants (`ADMIN_ROLES`, `HQ_ROLES`, etc.) live in `src/utils/roles.ts`.

**Offline** — `CreateReportScreen.tsx` detects `navigator.onLine`, queues reports via IndexedDB (`src/utils/offlineQueue.ts`), and listens for `REPORT_SYNCED` messages from the service worker.

## Key Screens

| Screen | Path | Roles |
|--------|------|-------|
| Login | `/login` | all |
| Home dashboard | `/home` | all |
| Create / submit report | `/create-report` | INAPH, AIW |
| Monthly report detail | `/report/:id` | all |
| Approval queue | `/admin/approval-queue` | Tehsil_Admin+ |
| Consolidated rollup | `/admin/rollup` | Tehsil_Admin+ |
| Admin panel | `/admin/panel` | HQ_Admin, Super_Admin |
| Institutes | `/admin/institutes` | HQ_Admin+ |
| Master data | `/admin/master-data` | HQ_Admin+ |
| Targets | `/admin/targets` | Tehsil_Admin+ |
| Periods config | `/admin/periods` | Tehsil_Admin+ |
| Vaccine distribution | `/admin/vaccine-distribution` | Tehsil_Admin+ |
| Profile | `/profile` | all |
| Change password | `/change-password` | all |
| Push notifications | `/notification-settings` | all |

## Environment

Copy `../Backend/.env.example` and set `VITE_API_BASE_URL` if the backend is not on the default port.

The `VITE_API_BASE_URL` env var is read in `src/utils/apiClient.ts` and `src/utils/authService.ts`.
