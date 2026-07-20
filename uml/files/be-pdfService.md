# File: Backend/src/services/pdfService.js

Generates AH Punjab branded A4 landscape monthly report PDFs using PDFKit. The layout mirrors the official government report template with an amber/yellow brand palette.

```mermaid
flowchart TD
    A[pdfService.js\ngenerateReportPdf report, institute] --> B[new PDFDocument\nA4 Landscape 841×595pt\nmargin=22pt]

    B --> P1[Page 1: OPD / Service Fees]
    B --> P2[Page 2: AI / Semen Report]
    B --> P3[Page 3: Vaccination Report]
    B --> P4[Page 4: Camp / Lab / Extension]

    P1 --> H1[titleBar: institute name + month\nAmber gradient background]
    P1 --> T1[OPD table: species rows × service cols\nget_fee_summary values]

    P2 --> H2[subHeader bar]
    P2 --> T2[AI section: semen type rows\nbreedings, conceptions, calves born]

    P3 --> H3[subHeader bar]
    P3 --> T3[Vaccine table: disease × dose columns]

    P4 --> H4[subHeader bar]
    P4 --> T4[Camp stats + lab tests + extension work]

    subgraph Layout constants
        LC[PAGE_W=841.89  PAGE_H=595.28\nMARGIN=22  CONTENT_W=797\nSEC_H=26  RH_DATA=20  RH_HEAD=18\nTITLE_H=68  FOOTER_H=13  GAP=14]
    end

    subgraph Fonts & Colors
        FC[Poppins / Poppins-SemiBold\nC_AMBER=#FBBF24  C_DARK=#1F2937\nC_WHITE=#FFFFFF  C_BORDER=#FCD34D]
    end

    subgraph cw helper
        CW[cw available count\nSpreads pixels evenly across N columns\n1-pixel remainder distributed to first cols]
    end
```

**Key implementation details:**
- Font files loaded from `Backend/fonts/` directory (Poppins TTF).
- Assets (logo, etc.) loaded from `Backend/assets/`.
- `cw(available, count)` distributes integer column widths without fractional pixels to avoid blurry lines.
- Each page section is drawn with explicit x/y coordinates; the service uses a cursor-style `y` variable that advances after each row.
- Called by `reportsService.generatePdf(reportId)` which fetches the report data then passes it to this service.
