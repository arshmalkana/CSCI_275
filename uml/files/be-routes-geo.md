# File: Backend/src/routes/geo.js

Geographic hierarchy endpoints. Mounted at `/v1/geo`. All endpoints are public (no auth) — the data is needed before login during registration.

```mermaid
flowchart TD
    A[geo.js routes\nprefix: /v1/geo] --> B[GET /districts\n→ geoController.getDistricts\nreturns all Punjab districts]
    A --> C[GET /tehsils?district=name\n→ geoController.getTehsils\nreturns tehsils for one district]
    A --> D[GET /villages?district=name&tehsil=name\n→ geoController.getVillages\nreturns villages + population for one tehsil]
    A --> E[GET /villages/search?q=term\n→ geoController.searchVillages\nautocomplete: LIKE %q% LIMIT 20]
    A --> F[GET /hierarchy\n→ geoController.getHierarchy\nfull district→tehsil tree, no villages]
    A --> G[GET /eligible-parents?district=&tehsil=&type=\n→ geoController.getEligibleParents\nused by RegisterScreen for parent-institute dropdown]

    subgraph Response shapes
        D -->|200| V[{ districtName, tehsilName, villages: [\n  { villageId, villageName, pincode,\n    population: { human, buffaloes, cows, ... }\n  }\n]}]
        G -->|200| EP[[ { instituteId, instituteName,\n  instituteType, villageName,\n  tehsilName, districtName } ]]
    end
```

**Notes:**
- No authentication required on any geo endpoint.
- `GET /hierarchy` is the recommended endpoint for initial app load — returns the full tree without village details, suitable for caching in `localStorage`.
- `GET /eligible-parents` drives the "Select Parent Institute" dropdown in RegisterScreen based on the type of institute being registered (PAIW sees only CVH/CVD in the same tehsil, etc.).
