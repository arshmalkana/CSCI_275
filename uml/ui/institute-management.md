# UI: Institute Management Screen

Admin screen for creating, editing, and deactivating institutes.

```mermaid
flowchart TD
    A[InstituteManagementScreen] --> H[Header\nBack  ·  Institute Management  ·  + button]

    H --> SEARCH[Search bar: filter by name]

    SEARCH --> LIST[Institute list\ncard: name, type badge, district/tehsil/village\nactive/inactive toggle]

    LIST --> NEW[+ button → Create Institute modal]
    NEW --> FORM[Institute form\nName  ·  Type: CVH/CVD/PAIW/SemenBank/VaccineBank/TehsilHQ/District_HQ\nDistrict → Tehsil → Village cascaded dropdowns\nParent Institute: parent_institute_id stock chain\nReporting Institute: reporting_institute_id approval chain\nPOST /v1/admin/institutes]

    LIST --> EDIT[Tap card edit icon → Edit modal\npre-filled form\nPATCH /v1/admin/institutes/:id]

    LIST --> TOGGLE[Deactivate toggle → confirm dialog\nSET is_active=false\nPATCH /v1/admin/institutes/:id]

    subgraph FK explanation in UI
        FK[Parent Institute tooltip:\n'Controls stock distribution flow'\nReporting Institute tooltip:\n'Controls approval routing and rollup']
    end
```

**API calls:** `GET /v1/admin/institutes`, `POST /v1/admin/institutes`, `PATCH /v1/admin/institutes/:id`, `GET /v1/geo/eligible-parents?district=&tehsil=&type=`.
