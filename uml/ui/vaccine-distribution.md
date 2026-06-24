# UI: Vaccine Distribution Screen

Issue vaccine doses to direct-child institutes (VaccineBank + CVH roles).

```mermaid
graph TD
    A[VaccineDistributionScreen] --> B[ScreenHeader: Vaccine Distribution]

    A --> C[Issue form card]
    C --> C1["Vaccine select — useQuery GET /admin/distributions/vaccines"]
    C --> C2["To Institute select — useQuery GET /admin/distributions/institutes"]
    C --> C3[Doses Issued: number input]
    C --> C4[Transaction Date: date picker]
    C --> C5[Batch Number: optional text]

    C --> C6[Issue Doses button]
    C6 --> C7["POST /admin/distributions/vaccines/issue"]
    C7 --> C8{success?}
    C8 -->|yes| C9[success toast + reset form]
    C8 -->|no| C10[error banner]

    A --> D[My Stock card]
    D --> D1["useQuery GET /admin/distributions/vaccines/stock"]
    D --> D2[table: vaccine name, current stock, unit]

    A --> E[History tab]
    E --> E1["useQuery GET /admin/distributions/vaccines/received"]
    E --> E2[list of past issuances: to-institute, vaccine, doses, date]
```

**Guard:** Only `VaccineBank` and `CVH` can see this screen. App.tsx wraps in ProtectedRoute and SideMenu only shows link for these roles.
