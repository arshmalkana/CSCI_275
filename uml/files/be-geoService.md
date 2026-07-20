# File: Backend/src/services/geoService.js

Read-only geographic hierarchy queries: districts → tehsils → villages with livestock population data. Also resolves eligible parent institutes during registration.

```mermaid
flowchart TD
    A[geoService.js] --> B[getAllDistricts\nSELECT districts ORDER BY district_name]
    A --> C[getTehsilsByDistrict\nJOIN tehsils+districts WHERE district_name=$1]
    A --> D[getVillagesByTehsil\nJOIN villages+tehsils+districts WHERE district+tehsil]
    A --> E[searchVillages\nLIKE %query% LIMIT 20 — autocomplete]
    A --> F[getGeographyHierarchy\nFull district→tehsil tree, no villages — cached at app load]
    A --> G[getEligibleParentInstitutes\ndistrictName + tehsilName + instituteType]

    G --> G1{instituteType?}
    G1 -->|PAIW| G2[CVH/CVD/CVH_Lab in same tehsil]
    G1 -->|CVD| G3[CVH/CVD/CVH_Lab in same district]
    G1 -->|CVH/CVH_Lab| G4[CVH in same district + all District_HQ + TehsilHQ]
    G1 -->|other| G5[All active institutes in district]

    D --> V[villages table\nvillage_id, village_name, pincode, lat/lng\nhuman_population, equine, buffaloes,\ncows, pigs, goat, sheep,\npoultry_layers, poultry_broilers, dogs]
```

**Notes:**
- `getVillagesByTehsil` returns `null` (not 404) when the district/tehsil combo doesn't exist — the route controller translates this to a 404 response.
- Village population fields (equine, buffaloes, etc.) are the basis for AI coverage % on dashboards.
- `getGeographyHierarchy` returns a grouped object keyed by district name — used by RegisterScreen to populate district/tehsil dropdowns without paginating the API.
- `getEligibleParentInstitutes` sorts results by institute type priority so CVH appears before CVD in dropdown lists.
