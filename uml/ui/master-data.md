# UI: Master Data Screen

HQ Admin reference-data management: service charges, semen types, vaccines.

```mermaid
flowchart TD
    A[MasterDataScreen] --> H[Header\nBack  ·  Master Data]

    H --> TABS[Tab bar\nService Charges  ·  Semen Types  ·  Vaccines]

    TABS --> SC[Service Charges tab\nGrouped by category: OPD / Cert / Lab / Camp\nEach row: code, name, rate ₹, effective-from]
    SC --> SCR[Edit rate icon → modal\nnewRate, effectiveMonth\nPATCH /charges/:id/rate]
    SC --> SCA[+ Add Charge button → modal\nserviceCode, serviceName, category, currentRate\nPOST /charges]
    SC --> SCD[Deactivate icon → confirm\nDELETE /charges/:id]

    TABS --> ST[Semen Types tab\nRows: code, bull name, breed, is_active]
    ST --> STE[Edit → modal  ·  Add → modal]

    TABS --> VA[Vaccines tab\nRows: name, disease, doses_per_vial, is_active]
    VA --> VAE[Edit → modal  ·  Add → modal]

    subgraph Rate history note
        RH[Rate change modal shows history:\nlast 3 rate changes with dates\nsourced from fee_changes_history table]
    end
```

**API calls:** All at `/v1/admin/master-data/charges`, `/semen-types`, `/vaccines` — GET list, POST create, PATCH update, DELETE deactivate.
