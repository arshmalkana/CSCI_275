# Endpoints: Geography

```mermaid
sequenceDiagram
    participant C as Client (Register / Profile)
    participant R as routes/geo.js
    participant S as geoService.js
    participant DB as PostgreSQL

    Note over C,DB: List all districts
    C->>R: GET /v1/geo/districts
    R->>S: getDistricts()
    S->>DB: SELECT institutes WHERE type='District' ORDER BY name
    R-->>C: [{institute_id, name}]

    Note over C,DB: List tehsils in a district
    C->>R: GET /v1/geo/districts/:districtId/tehsils
    R->>S: getTehsils(districtId)
    S->>DB: SELECT institutes WHERE type='Tehsil' AND reporting_institute_id=districtId
    R-->>C: [{institute_id, name}]

    Note over C,DB: List institutes (villages / dispensaries) in a tehsil
    C->>R: GET /v1/geo/tehsils/:tehsilId/institutes
    R->>S: getInstitutesInTehsil(tehsilId)
    S->>DB: SELECT institutes WHERE reporting_institute_id=tehsilId
    R-->>C: [{institute_id, name, type, org_id}]

    Note over C,DB: List villages served by an institute
    C->>R: GET /v1/geo/institutes/:instituteId/villages
    R->>S: getVillages(instituteId)
    S->>DB: SELECT villages WHERE institute_id=instituteId
    R-->>C: [{village_id, name, census_code}]
```

**Key files:** `Backend/src/routes/geo.js`, `Backend/src/services/geoService.js`

Geo routes are public (no auth required) to allow the registration flow to populate dropdowns before the user has a session. The hierarchy is: Punjab → District → Tehsil → Village/Institute.
