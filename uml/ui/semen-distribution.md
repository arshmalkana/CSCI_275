# UI: Semen Distribution Screen

Issue semen straws to a direct-child institute (SemenBank role only).

```mermaid
graph TD
    A[SemenDistributionScreen] --> B[ScreenHeader: Semen Distribution]

    A --> C[Issue form card]
    C --> C1["Semen Type select — useQuery GET /admin/distributions/semen/types"]
    C --> C2["To Institute select — useQuery GET /admin/distributions/semen/receiving-institutes"]
    C --> C3[Straws Issued: number input]
    C --> C4[Transaction Date: date picker]
    C --> C5[Batch Number: optional]
    C --> C6[Expiry Date: optional]
    C --> C7[Notes: optional textarea]

    C --> C8[Issue Straws button]
    C8 --> C9["POST /admin/distributions/semen/issue"]
    C9 --> C10{success?}
    C10 -->|yes| C11[toast + reset form]
    C10 -->|no| C12[error banner]

    A --> D[Current Stock summary]
    D --> D1["useQuery GET /admin/distributions/semen/stock"]
    D --> D2[breed, received, used, balance per row]
```

**Only SemenBank role can issue.** The backend `requireSemenIssuer` guard enforces this even if the client is tampered with.
