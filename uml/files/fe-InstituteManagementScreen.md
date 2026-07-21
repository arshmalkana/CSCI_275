# File: PWA/src/screens/InstituteManagementScreen.tsx

Admin panel for creating and editing institutes (veterinary centres, HQ offices, etc.) within the admin's geographic scope.

```mermaid
flowchart TD
    A[InstituteManagementScreen] --> B[GET /v1/admin/institutes\nfiltered by admin scope\nreturns list with type, district, tehsil, village]

    B --> C[Institute list\neach card: name, type badge, location, is_active toggle]

    C --> D[+ New Institute button → modal]
    D --> E[Institute form:\nname, type: CVH/CVD/PAIW/SemenBank/VaccineBank/TehsilHQ/District_HQ\ndistrict ← /geo/districts\ntehsil ← /geo/tehsils\nvillage ← /geo/villages\nparent_institute_id ← /geo/eligible-parents\nreporting_institute_id]
    E --> F[POST /v1/admin/institutes\n201 → add to list]

    C --> G[Edit icon → edit modal\npre-filled with current data]
    G --> H[PATCH /v1/admin/institutes/:id\n200 → update list item]

    C --> I[Deactivate toggle\nPATCH /v1/admin/institutes/:id\n{ is_active: false }\nconfirm dialog]

    subgraph Two FK fields
        FK[parent_institute_id\n— stock flow and child visibility\nreporting_institute_id\n— approval routing and rollup]
    end
```

**Notes:**
- Both `parent_institute_id` and `reporting_institute_id` are required fields and must be selected separately — they serve different purposes and are not interchangeable.
- Institute type determines which service villages and distribution features are available.
- Deactivated institutes are hidden from field staff dropdown lists but their historical reports remain accessible.
