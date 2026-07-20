# UI: Approval Queue Screen

Admin-only. Lists submitted reports for the admin's oversight scope.

```mermaid
flowchart TD
    A[ApprovalQueueScreen] --> H[Header\nBack  ·  Approval Queue  ·  pending-count badge]

    H --> FILTERS[Filter row\nMonth picker  ·  Status dropdown All/Submitted/Approved/Rejected]

    FILTERS --> LIST[Scrollable report list]

    LIST --> CARD[Report card\nInstitute name  ·  Type chip\nSubmitted date  ·  Status badge\nProgress indicator]

    CARD --> EXPAND[Tap → expand detail panel]

    EXPAND --> SECTIONS[Section review:\nOPD / Cert / Lab / Ext / AI\neach with status: pending / approved / rejected]

    SECTIONS --> ACTIONS[Action bar\nApprove All  ·  Approve Sections  ·  Reject Section\nSend Reminder button]

    SECTIONS --> MODAL[Reject Section modal\nSelect section  ·  Reason text\nSubmit reject]

    subgraph Empty state
        ES[All caught up illustration\nNo pending reports for this month]
    end
```

**API calls:** `GET /v1/admin/reports/queue`, `PATCH /v1/admin/reports/monthly/:month/approve`, `PATCH .../approve-sections`, `PATCH .../reject-section`, `POST /v1/admin/remind`.
