# File: ahpunjabfrontend/src/screens/CreateReportScreen.tsx

Monthly report entry form. Sections vary by role: PAIW sees only the AI section; all other field roles see all 5 sections.

```mermaid
flowchart TD
    A[CreateReportScreen] --> B{isPAIW?\nauthService.getUser role === 'PAIW'}
    B -->|PAIW| C[Default section: 'ai'\nProgress: AI section weight only 0/50/100\nLabel: 1 Section]
    B -->|other| D[Default section: 'opd'\nProgress: 5 sections weighted\nLabel: 5 Sections]

    A --> TABS{Tab navigation}
    TABS -->|PAIW| AI_ONLY[AI tab only]
    TABS -->|other| ALL5[OPD / Cert / Lab / Extension / AI]

    A --> INIT[On mount:\nGET /v1/reports/monthly/:month\nif exists, populate form data]

    A --> SAVE[Auto-save / Save Draft\nPOST or PATCH /v1/reports/monthly\nbody: { month, sections: { opd?, cert?, lab?, ext?, ai? } }]

    A --> SUBMIT[Submit button\nEnabled when isAllSectionsComplete\n→ PATCH /v1/reports/monthly/:month\nstatus: 'Submitted']

    subgraph isAllSectionsComplete
        IAC{isPAIW?}
        IAC -->|yes| PCHECK[ai.breedingsDone > 0]
        IAC -->|no| ACHECK[all 5 sections have required fields filled]
    end

    subgraph calculateProgress
        CP{isPAIW?}
        CP -->|yes| PW[ai section weight only]
        CP -->|no| FW[sum of section weights\nopd:20 cert:20 lab:20 ext:20 ai:20]
    end
```

**Notes:**
- `{!isPAIW && (<>OPD/Cert/Lab/Extension tabs</>)}` — tabs are entirely absent from DOM for PAIW, not just hidden.
- Progress bar shows completion across all required sections.
- Offline save: if network is unavailable, falls back to `offlineQueue.enqueue(draft)` and shows toast.
