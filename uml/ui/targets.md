# UI: Targets Screen

Admin sets monthly OPD and AI service targets per institute.

```mermaid
flowchart TD
    A[TargetsScreen] --> H[Header\nBack  ·  Set Targets]

    H --> SEL[Selector row\nInstitute dropdown ← admin scope\nMonth picker default: current month]

    SEL --> LOAD[GET /v1/admin/master-data/targets?instituteId=&month=]

    LOAD --> FORM[Target form\nOPD Target: number input\nAI Target: number input]

    FORM --> ACH[Achievement panel below form\nCurrent OPD: N cases  ·  Target: N  →  X%\nCurrent AI: N services  ·  Target: N  →  Y%\nColour: red<50% / yellow 50-80% / green >80%]

    FORM --> SAVE[Save button\nPUT /v1/admin/master-data/targets\nbody: { instituteId, month, opd, ai }\nsuccess toast]

    subgraph Unset state
        US[If no target exists for month:\nForm shows empty inputs\nAchievement panel shows: No target set]
    end
```

**API calls:** `GET /v1/admin/master-data/targets`, `PUT /v1/admin/master-data/targets`, `GET /v1/admin/institutes` (dropdown), `GET /v1/reports/monthly/:month?instituteId=` (for achievement).
