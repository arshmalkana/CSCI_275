# File: PWA/src/screens/HomeScreen.tsx

Main dashboard. First screen after login. Shows submission status, targets, recent reports, and quick-action cards.

```mermaid
flowchart TD
    A[HomeScreen] --> B[GET /v1/home on mount]
    B --> C{loading?}
    C -->|yes| D[Skeleton cards]
    C -->|no| E[Render dashboard]

    E --> E1[Period Banner\nDeadline countdown if period is open]
    E --> E2[Submission Status Card\nsubmitted / draft / not started\nColour: green / yellow / red]
    E --> E3[Targets Card\nOPD target vs achieved\nAI target vs achieved\nProgress bars]
    E --> E4[Quick Actions Grid\nCreate Report → /create-report\nMy Reports → /reports\nDistribution → role-gated\nApproval Queue → oversight only]
    E --> E5[Recent Reports List\nlast 6 months, status badge + progress %]
    E --> E6[Pending Approvals Banner\noversight role only\n→ /approval-queue]

    subgraph Role gating
        RG[FIELD_ROLES: show Create Report, My Reports, Distribution\nOversight: additionally show Approval Queue, Pending count]
    end
```

**Notes:**
- Single API call `GET /v1/home` provides all data; no waterfall of separate calls.
- Period banner is hidden if no open period exists.
- Quick action cards are filtered by role; PAIWs only see Create Report (AI section) and My Reports.
