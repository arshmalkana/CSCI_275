/**
 * pdfService.js — AH Punjab branded monthly report PDF
 */

import PDFDocument from 'pdfkit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir     = dirname(fileURLToPath(import.meta.url))
const FONT_DIR  = join(__dir, '..', '..', 'fonts')
const ASSET_DIR = join(__dir, '..', '..', 'assets')

// ── A4 Landscape ──────────────────────────────────────────────────────────────
const PAGE_W    = 841.89
const PAGE_H    = 595.28
const MARGIN    = 22
const CONTENT_W = Math.floor(PAGE_W - MARGIN * 2)   // 797

// ── Layout ────────────────────────────────────────────────────────────────────
const SEC_H    = 26   // section header bar height
const RH_DATA  = 20   // data row height
const RH_HEAD  = 18   // column sub-header row height
const TITLE_H  = 68   // page 1 title bar
const SUB_H    = 22   // pages 2-4 sub-header bar
const FOOTER_H = 13
const GAP      = 14   // gap between sections

// Label widths — consistent per page so data columns start at the same X
const LW = { 1: 90, 2: 100, 3: 110, 4: 110 }

// ── Brand colours ─────────────────────────────────────────────────────────────
const C_AMBER    = '#FBBF24'
const C_AMBER_D  = '#F59E0B'
const C_AMBER_DK = '#D97706'
const C_AMBER_L  = '#FEF3C7'
const C_AMBER_XL = '#FFFBEB'
const C_AMBER_MD = '#FDE68A'
const C_WHITE    = '#FFFFFF'
const C_DARK     = '#1F2937'
const C_DARKEST  = '#111827'
const C_BORDER   = '#FCD34D'

const F_REG  = 'Poppins'
const F_BOLD = 'Poppins-SemiBold'

const FS_TITLE = 13
const FS_SEC   = 9
const FS_HEAD  = 7
const FS_BODY  = 7
const FS_FOOT  = 5.5

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Spread `available` pixels across `count` columns, 1-pixel remainder to first cols */
function cw(available, count) {
  const base = Math.floor(available / count)
  const rem  = available - base * count
  return Array.from({ length: count }, (_, i) => base + (i < rem ? 1 : 0))
}

/** Sum a slice of a widths array (for group-header spans) */
function span(widths, start, len) {
  return widths.slice(start, start + len).reduce((s, w) => s + w, 0)
}

function n(v) { const x = Number(v); return isNaN(x) ? 0 : x }

const CONTENT_H = Math.floor(PAGE_H - 2 * MARGIN)  // 551

/** Uniform row height — kept as a no-op wrapper so page functions stay consistent */
function pageRH(_fixedH, _rows) { return RH_DATA }

function cell(doc, x, y, w, h, text, opts = {}) {
  const { bg = null, fg = C_DARK, fontSize = FS_BODY, bold = false,
          align = 'center', border = true } = opts
  if (bg)     doc.save().rect(x, y, w, h).fillColor(bg).fill().restore()
  if (border) doc.save().rect(x, y, w, h).strokeColor(C_BORDER).lineWidth(0.3).stroke().restore()
  doc
    .save()
    .font(bold ? F_BOLD : F_REG).fontSize(fontSize).fillColor(fg)
    .text(String(text ?? ''), x + 2, y + (h - fontSize) / 2,
      { width: w - 4, align, lineBreak: false })
    .restore()
}

/** Draw a row of cells from a widths array */
function row(doc, startX, y, widths, values, rowH, opts = {}) {
  let x = startX
  widths.forEach((w, i) => {
    cell(doc, x, y, w, rowH, values[i] ?? '', {
      ...opts,
      align: (opts.firstLeft && i === 0) ? 'left' : (opts.align || 'center'),
    })
    x += w
  })
}

function sectionHeader(doc, y, title) {
  doc.save().rect(MARGIN, y, 5, SEC_H).fillColor(C_AMBER_D).fill().restore()
  doc.save().rect(MARGIN + 5, y, CONTENT_W - 5, SEC_H).fillColor(C_AMBER_L).fill().restore()
  doc.save().moveTo(MARGIN, y + SEC_H).lineTo(MARGIN + CONTENT_W, y + SEC_H)
    .strokeColor(C_AMBER_DK).lineWidth(0.8).stroke().restore()
  doc.save().font(F_BOLD).fontSize(FS_SEC).fillColor(C_DARKEST)
    .text(title, MARGIN + 12, y + (SEC_H - FS_SEC) / 2,
      { width: CONTENT_W - 16, align: 'left', lineBreak: false })
    .restore()
  return y + SEC_H
}

function pageFooter(doc, data, pageNum) {
  const fy = PAGE_H - MARGIN - FOOTER_H
  doc.save().rect(MARGIN, fy, CONTENT_W, FOOTER_H).fillColor(C_AMBER_L).fill().restore()
  doc.save().moveTo(MARGIN, fy).lineTo(MARGIN + CONTENT_W, fy)
    .strokeColor(C_AMBER_DK).lineWidth(0.5).stroke().restore()
  doc.save().font(F_REG).fontSize(FS_FOOT).fillColor(C_DARK)
    .text('AH Punjab Reporting System  ·  Animal Husbandry Department, Government of Punjab',
      MARGIN + 4, fy + (FOOTER_H - FS_FOOT) / 2, { width: CONTENT_W * 0.65, lineBreak: false })
    .restore()
  doc.save().font(F_REG).fontSize(FS_FOOT).fillColor(C_DARK)
    .text(`Page ${pageNum} of 4  ·  ${data.reportingMonth}  ·  ${(data.instituteName || '').toUpperCase()}`,
      MARGIN + CONTENT_W * 0.65, fy + (FOOTER_H - FS_FOOT) / 2,
      { width: CONTENT_W * 0.35, align: 'right', lineBreak: false })
    .restore()
}

function pageSubHeader(doc, data, subtitle, pageNum) {
  const y = MARGIN
  doc.save().rect(MARGIN, y, CONTENT_W, SUB_H).fillColor(C_AMBER).fill().restore()
  doc.save().rect(MARGIN, y + SUB_H, CONTENT_W, 2).fillColor(C_AMBER_D).fill().restore()
  try { doc.image(join(ASSET_DIR, 'logo.png'), MARGIN + 3, y + 2, { height: SUB_H - 4 }) } catch (_) {}
  doc.save().font(F_BOLD).fontSize(11).fillColor(C_WHITE)
    .text('AH Punjab', MARGIN + SUB_H + 2, y + 3, { lineBreak: false, width: 100 }).restore()
  doc.save().font(F_REG).fontSize(6).fillColor(C_WHITE)
    .text(subtitle, MARGIN + SUB_H + 2, y + 15, { lineBreak: false, width: CONTENT_W * 0.5 }).restore()
  doc.save().font(F_BOLD).fontSize(7).fillColor(C_WHITE)
    .text(`${(data.instituteName || '').toUpperCase()}  ·  ${data.reportingMonth}`,
      MARGIN + CONTENT_W * 0.5, y + 8,
      { width: CONTENT_W * 0.5 - 10, align: 'right', lineBreak: false })
    .restore()
  return y + SUB_H + 6
}

// ── Main export ───────────────────────────────────────────────────────────────
export function generateReportPDF(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0,
      info: { Title: `Monthly Report – ${data.instituteName} – ${data.reportingMonth}`,
              Author: 'AH Punjab Reporting System' } })
    doc.registerFont(F_REG,  join(FONT_DIR, 'Poppins-Regular.ttf'))
    doc.registerFont(F_BOLD, join(FONT_DIR, 'Poppins-SemiBold.ttf'))
    const chunks = []
    doc.on('data', c => chunks.push(c))
    doc.on('end',  () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    renderPage1(doc, data)
    doc.addPage(); renderPage2(doc, data)
    doc.addPage(); renderPage3(doc, data)
    doc.addPage(); renderPage4(doc, data)
    doc.end()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1 – Title · OPD · Vaccination
// ─────────────────────────────────────────────────────────────────────────────

function renderPage1(doc, data) {
  // 5 data rows (2 OPD + 3 VAC); fixed = title+gap + 2×(secH+2×headH) + gap + footer
  const rh = pageRH((TITLE_H + 6) + 2 * (SEC_H + 2 * RH_HEAD) + GAP + FOOTER_H, 5)
  let y = MARGIN

  // ── Title bar ──
  doc.save().rect(MARGIN, y, CONTENT_W, TITLE_H).fillColor(C_AMBER).fill().restore()
  doc.save().rect(MARGIN, y + TITLE_H, CONTENT_W, 3).fillColor(C_AMBER_D).fill().restore()
  try { doc.image(join(ASSET_DIR, 'logo.png'), MARGIN + 6, y + 6, { height: TITLE_H - 12 }) } catch (_) {}
  const lx = MARGIN + TITLE_H + 4
  doc.save().font(F_BOLD).fontSize(17).fillColor(C_WHITE)
    .text('AH Punjab', lx, y + 10, { lineBreak: false, width: 140 }).restore()
  doc.save().font(F_REG).fontSize(9).fillColor(C_WHITE)
    .text('Monthly Report — Animal Husbandry Department', lx, y + 32, { lineBreak: false, width: CONTENT_W * 0.52 }).restore()
  doc.save().font(F_BOLD).fontSize(11).fillColor(C_WHITE)
    .text((data.instituteName || '').toUpperCase(), MARGIN + CONTENT_W * 0.52, y + 14,
      { width: CONTENT_W * 0.48, align: 'right', lineBreak: false }).restore()
  doc.save().font(F_REG).fontSize(9).fillColor(C_WHITE)
    .text(`${fmtDate(data.startDate)}  –  ${fmtDate(data.endDate)}`,
      MARGIN + CONTENT_W * 0.52, y + 32,
      { width: CONTENT_W * 0.48, align: 'right', lineBreak: false }).restore()
  y += TITLE_H + 6

  // ── OPD ──
  // Columns: 4 species × 3 sub-cols (New/Old/Camp) = 12, plus 8 extras (Cast B/O, PD, HC ×2, PM ×3)
  // species cols = 37pt each (uniform 111pt per species group), extra = 33pt each
  // 12×37 + 8×33 = 444+264 = 708 = CONTENT_W - LW[1]
  const SP_W = 37, EX_W = 33, labelW1 = LW[1]

  y = sectionHeader(doc, y, 'OPD REPORT')

  // Group header row (species names)
  const species = [
    { key: 'equine', label: 'Equine' },
    { key: 'bovine', label: 'Bovine' },
    { key: 'others', label: 'Others' },
    { key: 'dogs',   label: 'Dogs / Pets' },
  ]
  const extraGroups = [
    { label: 'CASTRATIONS', cols: 2 },
    { label: 'PD',          cols: 1 },
    { label: 'A.H. CERT.',  cols: 2 },
    { label: 'POST MORTEM', cols: 3 },
  ]

  cell(doc, MARGIN, y, labelW1, RH_HEAD, '', { bg: C_AMBER_L })
  let x = MARGIN + labelW1
  species.forEach(sp => {
    cell(doc, x, y, SP_W * 3, RH_HEAD, sp.label, { bg: C_AMBER_L, bold: true, fontSize: FS_HEAD })
    x += SP_W * 3
  })
  extraGroups.forEach(g => {
    cell(doc, x, y, EX_W * g.cols, RH_HEAD, g.label, { bg: C_AMBER_L, bold: true, fontSize: 5.5 })
    x += EX_W * g.cols
  })
  y += RH_HEAD

  // Sub-label row (New/Old/Camp per species, then extra labels)
  cell(doc, MARGIN, y, labelW1, RH_HEAD, '', { bg: C_AMBER_L })
  x = MARGIN + labelW1
  species.forEach(() => {
    ;['New','Old','Camp'].forEach(lbl => {
      cell(doc, x, y, SP_W, RH_HEAD, lbl, { bg: C_AMBER_L, bold: true, fontSize: 5.5 })
      x += SP_W
    })
  })
  ;['B','O','No.','Sm','Lg','Sm','Lg','VL'].forEach(lbl => {
    cell(doc, x, y, EX_W, RH_HEAD, lbl, { bg: C_AMBER_L, bold: true, fontSize: 5.5 })
    x += EX_W
  })
  y += RH_HEAD

  ;[
    { label: 'During the Month',  src: 'thisMonth'   },
    { label: 'Progressive Total', src: 'progressive' },
  ].forEach(({ label, src }, ri) => {
    const bg = ri % 2 === 0 ? C_WHITE : C_AMBER_XL
    const opd  = data.opd?.[src] || {}
    const cast = data.castrations?.[src] || {}
    const cert = data.certificates?.[src] || {}
    const pd   = data.pd?.[src] || 0

    cell(doc, MARGIN, y, labelW1, rh, label, { bg: C_AMBER_L, bold: true, align: 'left', fontSize: FS_HEAD })
    x = MARGIN + labelW1
    species.forEach(sp => {
      const s = opd[sp.key] || {}
      ;['new','old','camp'].forEach(cat => { cell(doc, x, y, SP_W, rh, n(s[cat]), { bg }); x += SP_W })
    })
    ;[n(cast.bovine),n(cast.others),n(pd),n(cert.hcSmall),n(cert.hcLarge),
      n(cert.pmSmall),n(cert.pmLarge),n(cert.vetroLegal)].forEach(v => {
      cell(doc, x, y, EX_W, rh, v, { bg }); x += EX_W
    })
    y += rh
  })

  y += GAP

  // ── Vaccination ──
  // 7 vaccines × 3 sub-cols = 21 data cols, labelW1 = 90
  const vacAvail = CONTENT_W - labelW1   // 707
  const vacGroupWs = cw(vacAvail, 7)     // [102,102,101,101,101,101,101] or similar
  const vacSubWs   = vacGroupWs.flatMap(gw => cw(gw, 3))  // 21 sub-col widths

  const vaccines = [
    { code: 'HS',          name: 'H.S.'       },
    { code: 'FMD',         name: 'F.M.D.'     },
    { code: 'BQ',          name: 'B.Q.'       },
    { code: 'BRUC',        name: 'Brucell.'   },
    { code: 'ETV',         name: 'E.T.V.'     },
    { code: 'SWINE_FEVER', name: 'Swine Fvr.' },
    { code: 'GOAT_POX',   name: 'Goat Pox'   },
    { code: 'PPR',         name: 'P.P.R.'     },
    { code: 'RABIES',      name: 'Rabies'     },
  ]

  y = sectionHeader(doc, y, 'VACCINATION REPORT')

  // Vaccine name group headers
  cell(doc, MARGIN, y, labelW1, RH_HEAD, '', { bg: C_AMBER_L })
  x = MARGIN + labelW1
  vaccines.forEach((v, vi) => {
    cell(doc, x, y, vacGroupWs[vi], RH_HEAD, v.name, { bg: C_AMBER_L, bold: true, fontSize: FS_HEAD })
    x += vacGroupWs[vi]
  })
  y += RH_HEAD

  // Sub-labels: Rcvd / Used / Vac per vaccine
  cell(doc, MARGIN, y, labelW1, RH_HEAD, '', { bg: C_AMBER_L })
  x = MARGIN + labelW1
  vacSubWs.forEach((w, i) => {
    cell(doc, x, y, w, RH_HEAD, ['Rcvd','Used','Vac'][i % 3], { bg: C_AMBER_L, bold: true, fontSize: 5.5 })
    x += w
  })
  y += RH_HEAD

  ;[
    { label: 'During Month',    src: 'thisMonth' },
    { label: 'This Year',       src: 'thisYear'  },
    { label: 'Balance Vaccine', src: 'balance'   },
  ].forEach(({ label, src }, ri) => {
    const bg = ri % 2 === 0 ? C_WHITE : C_AMBER_XL
    cell(doc, MARGIN, y, labelW1, rh, label, { bg: C_AMBER_L, bold: true, align: 'left', fontSize: FS_HEAD })
    x = MARGIN + labelW1
    vaccines.forEach((v, vi) => {
      const e    = (data.vaccinations?.[src] || []).find(r => r.code === v.code) || {}
      const vals = [n(e.received), n(e.used), n(e.vaccinated)]
      vals.forEach((val, si) => {
        const w = vacSubWs[vi * 3 + si]
        cell(doc, x, y, w, rh, val, { bg }); x += w
      })
    })
    y += rh
  })

  pageFooter(doc, data, 1)
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2 – AI Cows · PD · Calves
// ─────────────────────────────────────────────────────────────────────────────

function renderPage2(doc, data) {
  // 8 data rows (2 AI + 3 PD + 3 Calves); fixed = subH+gap + 3×(secH+2×headH) + 2×gap + footer
  const rh = pageRH((SUB_H + 6) + 3 * (SEC_H + 2 * RH_HEAD) + 2 * GAP + FOOTER_H, 8)
  let y = pageSubHeader(doc, data, 'AI WITH FROZEN SEMEN IN COWS  ·  PREGNANCY DIAGNOSIS  ·  CALVES BORN', 2)

  const labelW2 = LW[2]
  const cowBreeds = [
    { code: 'HF_LOCAL',      label: 'HF'       },
    { code: 'JERSEY_LOCAL',  label: 'Jersey'   },
    { code: 'CB_LOCAL',      label: 'C.Breed'  },
    { code: 'SAHIWAL_LOCAL', label: 'Sahiwal'  },
    { code: 'HF_ETT',        label: 'HF ETT'   },
    { code: 'JERSEY_ETT',    label: 'JR ETT'   },
    { code: 'HF_SEXED',      label: 'Sx HF'    },
    { code: 'JERSEY_SEXED',  label: 'Sx JR'    },
    { code: 'CB_SEXED',      label: 'Sx CB'    },
    { code: 'SAHIWAL_SEXED', label: 'Sx Sahi'  },
  ]
  const nBreeds = cowBreeds.length

  // AI Cows: 9 breeds × 2 sub-cols (AI, Cov) + 2 total cols = 20 cols
  // cw() distributes exactly, no rounding gaps
  const aiAvail  = CONTENT_W - labelW2              // 697
  const aiColWs  = cw(aiAvail, nBreeds * 2 + 2)    // 20 column widths
  // breed group header widths = sum of each pair
  const aiBreedGroupWs = cowBreeds.map((_, i) => aiColWs[i * 2] + aiColWs[i * 2 + 1])
  const aiTotEach0 = aiColWs[nBreeds * 2]
  const aiTotEach1 = aiColWs[nBreeds * 2 + 1]

  // ── AI in Cows ──
  y = sectionHeader(doc, y, 'A.I. WITH FROZEN SEMEN IN COWS')

  // Breed group headers
  cell(doc, MARGIN, y, labelW2, RH_HEAD, '', { bg: C_AMBER_L })
  let x = MARGIN + labelW2
  cowBreeds.forEach((b, i) => {
    cell(doc, x, y, aiBreedGroupWs[i], RH_HEAD, b.label, { bg: C_AMBER_L, bold: true, fontSize: FS_HEAD })
    x += aiBreedGroupWs[i]
  })
  cell(doc, x, y, aiTotEach0, RH_HEAD, 'Total AI',  { bg: C_AMBER_L, bold: true, fontSize: 5.5 })
  cell(doc, x + aiTotEach0, y, aiTotEach1, RH_HEAD, 'Total Cov', { bg: C_AMBER_L, bold: true, fontSize: 5.5 })
  y += RH_HEAD

  // Sub-labels: AI / Cov per breed
  cell(doc, MARGIN, y, labelW2, RH_HEAD, '', { bg: C_AMBER_L })
  x = MARGIN + labelW2
  cowBreeds.forEach((_, i) => {
    const w0 = aiColWs[i * 2], w1 = aiColWs[i * 2 + 1]
    cell(doc, x, y, w0, RH_HEAD, 'AI',  { bg: C_AMBER_L, bold: true, fontSize: 5.5 }); x += w0
    cell(doc, x, y, w1, RH_HEAD, 'Cov', { bg: C_AMBER_L, bold: true, fontSize: 5.5 }); x += w1
  })
  cell(doc, x, y, aiTotEach0, RH_HEAD, '', { bg: C_AMBER_L }); x += aiTotEach0
  cell(doc, x, y, aiTotEach1, RH_HEAD, '', { bg: C_AMBER_L })
  y += RH_HEAD

  ;[
    { label: 'During the Month',  src: 'thisMonth'   },
    { label: 'Progressive Total', src: 'progressive' },
  ].forEach(({ label, src }, ri) => {
    const bg = ri % 2 === 0 ? C_WHITE : C_AMBER_XL
    let tAI = 0, tCov = 0
    cell(doc, MARGIN, y, labelW2, rh, label, { bg: C_AMBER_L, bold: true, align: 'left', fontSize: FS_HEAD })
    x = MARGIN + labelW2
    cowBreeds.forEach((b, i) => {
      const e  = (data.aiCows?.[src] || []).find(r => r.code === b.code) || {}
      const w0 = aiColWs[i * 2], w1 = aiColWs[i * 2 + 1]
      cell(doc, x, y, w0, rh, n(e.ai),      { bg }); x += w0; tAI  += n(e.ai)
      cell(doc, x, y, w1, rh, n(e.covered), { bg }); x += w1; tCov += n(e.covered)
    })
    cell(doc, x, y, aiTotEach0, rh, tAI,  { bg: C_AMBER_MD, bold: true }); x += aiTotEach0
    cell(doc, x, y, aiTotEach1, rh, tCov, { bg: C_AMBER_MD, bold: true })
    y += rh
  })

  y += GAP

  // ── Pregnancy Diagnosis ──
  // 9 breeds × 2 sub-cols (Tested, +ve) = 18 cols
  const pdAvail = CONTENT_W - labelW2
  const pdWs    = cw(pdAvail, nBreeds * 2)   // 18 col widths
  // Breed group widths (sum of pairs):
  const pdGroupWs = cowBreeds.map((_, i) => pdWs[i*2] + pdWs[i*2+1])

  y = sectionHeader(doc, y, 'PREGNANCY DIAGNOSIS OF A.I. IN COWS')

  cell(doc, MARGIN, y, labelW2, RH_HEAD, '', { bg: C_AMBER_L })
  x = MARGIN + labelW2
  cowBreeds.forEach((b, i) => {
    cell(doc, x, y, pdGroupWs[i], RH_HEAD, b.label, { bg: C_AMBER_L, bold: true, fontSize: FS_HEAD })
    x += pdGroupWs[i]
  })
  y += RH_HEAD

  cell(doc, MARGIN, y, labelW2, RH_HEAD, '', { bg: C_AMBER_L })
  x = MARGIN + labelW2
  pdWs.forEach((w, i) => {
    cell(doc, x, y, w, RH_HEAD, i % 2 === 0 ? 'Tested' : '+ve', { bg: C_AMBER_L, bold: true, fontSize: 5.5 })
    x += w
  })
  y += RH_HEAD

  ;[
    { label: 'Cov 3 Months Ago',  src: 'threeMonthsAgo' },
    { label: 'During the Month',  src: 'thisMonth'      },
    { label: 'Progressive Total', src: 'progressive'    },
  ].forEach(({ label, src }, ri) => {
    const bg = ri % 2 === 0 ? C_WHITE : C_AMBER_XL
    cell(doc, MARGIN, y, labelW2, rh, label, { bg: C_AMBER_L, bold: true, align: 'left', fontSize: FS_HEAD })
    x = MARGIN + labelW2
    cowBreeds.forEach((b, i) => {
      const e = (data.pdCows?.[src] || []).find(r => r.code === b.code) || {}
      cell(doc, x, y, pdWs[i*2],   rh, n(e.tested),   { bg }); x += pdWs[i*2]
      cell(doc, x, y, pdWs[i*2+1], rh, n(e.positive), { bg }); x += pdWs[i*2+1]
    })
    y += rh
  })

  y += GAP

  // ── Calves Born ── (same grid as PD)
  y = sectionHeader(doc, y, 'CALVES BORN FROM A.I. IN COWS')

  cell(doc, MARGIN, y, labelW2, RH_HEAD, '', { bg: C_AMBER_L })
  x = MARGIN + labelW2
  cowBreeds.forEach((b, i) => {
    cell(doc, x, y, pdGroupWs[i], RH_HEAD, b.label, { bg: C_AMBER_L, bold: true, fontSize: FS_HEAD })
    x += pdGroupWs[i]
  })
  y += RH_HEAD

  cell(doc, MARGIN, y, labelW2, RH_HEAD, '', { bg: C_AMBER_L })
  x = MARGIN + labelW2
  pdWs.forEach((w, i) => {
    cell(doc, x, y, w, RH_HEAD, i % 2 === 0 ? 'Male' : 'Female', { bg: C_AMBER_L, bold: true, fontSize: 5.5 })
    x += w
  })
  y += RH_HEAD

  ;[
    { label: 'Cov 3 Months Ago',  src: 'threeMonthsAgo' },
    { label: 'During the Month',  src: 'thisMonth'      },
    { label: 'Progressive Total', src: 'progressive'    },
  ].forEach(({ label, src }, ri) => {
    const bg = ri % 2 === 0 ? C_WHITE : C_AMBER_XL
    cell(doc, MARGIN, y, labelW2, rh, label, { bg: C_AMBER_L, bold: true, align: 'left', fontSize: FS_HEAD })
    x = MARGIN + labelW2
    cowBreeds.forEach((b, i) => {
      const e = (data.calves?.[src] || []).find(r => r.code === b.code) || {}
      cell(doc, x, y, pdWs[i*2],   rh, n(e.male),   { bg }); x += pdWs[i*2]
      cell(doc, x, y, pdWs[i*2+1], rh, n(e.female), { bg }); x += pdWs[i*2+1]
    })
    y += rh
  })

  pageFooter(doc, data, 2)
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3 – Buffalo AI · Straw Account · Extension Camps
// ─────────────────────────────────────────────────────────────────────────────

function renderPage3(doc, data) {
  // 17 data rows (3 Buffalo + 11 Straw + 3 Extension); fixed = subH+gap + 3×(secH+headH) + 2×gap + footer
  const rh = pageRH((SUB_H + 6) + 3 * (SEC_H + RH_HEAD) + 2 * GAP + FOOTER_H, 17)
  let y = pageSubHeader(doc, data, 'BUFFALO AI  ·  STRAW ACCOUNT  ·  EXTENSION CAMPS', 3)

  const labelW3 = LW[3]

  // ── Buffalo AI — 18 cols, uniform width ──
  const bufWs = cw(CONTENT_W - labelW3, 18)
  const bufHeaders = [
    'Murrah AI','N-R AI','Sx MU AI','Sx N-R AI',
    'Murrah Cov','N-R Cov','Sx MU Cov','Sx N-R Cov',
    'Total AI','Total Cov',
    'Mu Tested','Mu +ve','N-R Tested','N-R +ve','Concep%',
    'Male Cal','Female Cal','Total Cal',
  ]

  y = sectionHeader(doc, y, 'A.I. DONE IN BUFFALOS')

  cell(doc, MARGIN, y, labelW3, RH_HEAD, '', { bg: C_AMBER_L })
  let x = MARGIN + labelW3
  bufWs.forEach((w, i) => {
    cell(doc, x, y, w, RH_HEAD, bufHeaders[i], { bg: C_AMBER_L, bold: true, fontSize: 5 }); x += w
  })
  y += RH_HEAD

  ;[
    { label: 'Cov 3 Months Ago',  src: 'threeMonthsAgo' },
    { label: 'During the Month',  src: 'thisMonth'      },
    { label: 'Progressive Total', src: 'progressive'    },
  ].forEach(({ label, src }, ri) => {
    const bg = ri % 2 === 0 ? C_WHITE : C_AMBER_XL
    const bd  = data.buffaloAI?.[src] || {}
    const mu  = bd.murrah        || {}
    const nr  = bd.niliRavi      || {}
    const mus = bd.murrahSexed   || {}
    const nrs = bd.niliRaviSexed || {}
    const totTested  = n(mu.tested)  + n(nr.tested)  + n(mus.tested)  + n(nrs.tested)
    const totPos     = n(mu.positive)+ n(nr.positive) + n(mus.positive)+ n(nrs.positive)
    const cr = totTested > 0 ? ((totPos / totTested) * 100).toFixed(1) + '%' : '0%'
    const vals = [
      n(mu.ai), n(nr.ai), n(mus.ai), n(nrs.ai),
      n(mu.covered), n(nr.covered), n(mus.covered), n(nrs.covered),
      n(mu.ai)+n(nr.ai)+n(mus.ai)+n(nrs.ai),
      n(mu.covered)+n(nr.covered)+n(mus.covered)+n(nrs.covered),
      n(mu.tested), n(mu.positive), n(nr.tested), n(nr.positive), cr,
      n(bd.calves?.male), n(bd.calves?.female),
      n(bd.calves?.male)+n(bd.calves?.female),
    ]
    cell(doc, MARGIN, y, labelW3, rh, label, { bg: C_AMBER_L, bold: true, align: 'left', fontSize: FS_HEAD })
    x = MARGIN + labelW3
    bufWs.forEach((w, i) => { cell(doc, x, y, w, rh, vals[i], { bg }); x += w })
    y += rh
  })

  y += GAP

  // ── Straw Account — 11 types, all using same labelW3 ──
  const strawTypes = [
    { code: 'HF_LOCAL',        label: 'HF'       },
    { code: 'JERSEY_LOCAL',    label: 'Jersey'   },
    { code: 'CB_LOCAL',        label: 'C.Breed'  },
    { code: 'SAHIWAL_LOCAL',   label: 'Sahiwal'  },
    { code: 'HF_ETT',          label: 'HF ETT'   },
    { code: 'JERSEY_ETT',      label: 'JR ETT'   },
    { code: 'HF_SEXED',        label: 'Sx HF'    },
    { code: 'JERSEY_SEXED',    label: 'Sx JR'    },
    { code: 'CB_SEXED',        label: 'Sx CB'    },
    { code: 'SAHIWAL_SEXED',   label: 'Sx Sahi'  },
    { code: 'MURRAH',          label: 'Murrah'   },
    { code: 'NILI_RAVI',       label: 'Nili-Ravi'},
    { code: 'MURRAH_SEXED',    label: 'Sx MU'    },
    { code: 'NILI_RAVI_SEXED', label: 'Sx N-R'   },
  ]
  const stWs = cw(CONTENT_W - labelW3, strawTypes.length)

  const strawRows = [
    { label: 'Last Year Balance',   key: 'lastYearBalance'   },
    { label: 'Last Month Balance',  key: 'lastMonthBalance'  },
    { label: 'Received This Month', key: 'receivedThisMonth' },
    { label: 'Used Local AI Month', key: 'usedAIMonth'       },
    { label: 'Used INAPH Month',    key: 'usedINAPHMonth'    },
    { label: 'Issued AIW Month',    key: 'issuedAIWMonth'    },
    { label: 'Received This Year',  key: 'receivedThisYear'  },
    { label: 'Used Local AI Year',  key: 'usedAIYear'        },
    { label: 'Used INAPH Year',     key: 'usedINAPHYear'     },
    { label: 'Issued AIW Year',     key: 'issuedAIWYear'     },
    { label: 'Balance In Hand',     key: 'balanceInHand',    bold: true },
  ]

  y = sectionHeader(doc, y, 'ACCOUNT OF STRAW RECORD DURING MONTH')

  cell(doc, MARGIN, y, labelW3, RH_HEAD, '', { bg: C_AMBER_L })
  x = MARGIN + labelW3
  stWs.forEach((w, i) => {
    cell(doc, x, y, w, RH_HEAD, strawTypes[i].label, { bg: C_AMBER_L, bold: true, fontSize: 5.5 }); x += w
  })
  y += RH_HEAD

  strawRows.forEach(({ label, key, bold }, ri) => {
    const isBold = !!bold
    const bg = isBold ? C_AMBER_MD : ri % 2 === 0 ? C_WHITE : C_AMBER_XL
    cell(doc, MARGIN, y, labelW3, rh, label, {
      bg: isBold ? C_AMBER_MD : C_AMBER_L, bold: isBold, align: 'left', fontSize: FS_HEAD,
    })
    x = MARGIN + labelW3
    stWs.forEach((w, i) => {
      const e = (data.strawAccount || []).find(r => r.code === strawTypes[i].code) || {}
      cell(doc, x, y, w, rh, n(e[key]), { bg, bold: isBold }); x += w
    })
    y += rh
  })

  y += GAP

  // ── Extension Camps — 4 data cols, same labelW3 ──
  const campCols = ['No. of Camps Held', 'Animals Treated', 'Farmers Attended', 'Ladies Attended']
  const campWs   = cw(CONTENT_W - labelW3, campCols.length)

  y = sectionHeader(doc, y, 'EXTENSION ACTIVITIES / FERTILITY CAMPS')

  cell(doc, MARGIN, y, labelW3, RH_HEAD, '', { bg: C_AMBER_L })
  x = MARGIN + labelW3
  campWs.forEach((w, i) => {
    cell(doc, x, y, w, RH_HEAD, campCols[i], { bg: C_AMBER_L, bold: true, fontSize: FS_HEAD }); x += w
  })
  y += RH_HEAD

  ;[
    { key: 'pldb',  label: 'Fertility Camps (PLDB)'  },
    { key: 'ascad', label: 'Fertility Camps (ASCAD)' },
    { key: 'other', label: 'Any Other Camps'         },
  ].forEach(({ key, label }, ri) => {
    const bg   = ri % 2 === 0 ? C_WHITE : C_AMBER_XL
    const camp = data.extensionCamps?.[key] || {}
    cell(doc, MARGIN, y, labelW3, rh, label, { bg: C_AMBER_L, bold: true, align: 'left', fontSize: FS_HEAD })
    x = MARGIN + labelW3
    ;[n(camp.camps),n(camp.animals),n(camp.farmers),n(camp.ladies)].forEach((v, i) => {
      cell(doc, x, y, campWs[i], rh, v, { bg }); x += campWs[i]
    })
    y += rh
  })

  pageFooter(doc, data, 3)
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 4 – Lab Tests · Fee Summary · Signature
// ─────────────────────────────────────────────────────────────────────────────

function renderPage4(doc, data) {
  // data rows: 4 lab + 1 lab-total + N fee institutes + 1 grand-total; fixed: subH+gap + 2×(secH+headH) + 2×gap + sig(70) + footer
  const nFeeInsts = Math.max(1, (data.feeSummary || []).length)
  const rh = pageRH((SUB_H + 6) + 2 * (SEC_H + RH_HEAD) + 2 * GAP + 90 + FOOTER_H, 4 + 1 + nFeeInsts + 1)
  let y = pageSubHeader(doc, data, 'LAB TEST REPORT  ·  TOTAL FEE DEPOSITED', 4)

  const labelW4 = LW[4]

  // ── Lab Tests ──
  // 6 columns: Test Name (labelW4) + 5 data cols
  const labDataCols = ['During Month','Fee/Test (Rs)','Month Fee (Rs)','Progressive','Prog. Fee (Rs)']
  const labDataWs   = cw(CONTENT_W - labelW4, labDataCols.length)

  y = sectionHeader(doc, y, 'LAB TEST REPORT')

  cell(doc, MARGIN, y, labelW4, RH_HEAD, 'Test', { bg: C_AMBER_L, bold: true, fontSize: FS_HEAD })
  let x = MARGIN + labelW4
  labDataWs.forEach((w, i) => {
    cell(doc, x, y, w, RH_HEAD, labDataCols[i], { bg: C_AMBER_L, bold: true, fontSize: FS_HEAD }); x += w
  })
  y += RH_HEAD

  let totalMonthFee = 0, totalProgFee = 0
  ;[
    { key: 'fecal', label: 'Faecal Test', feeCode: 'LAB_FECAL' },
    { key: 'blood', label: 'Blood Test',  feeCode: 'LAB_BLOOD' },
    { key: 'urine', label: 'Urine Test',  feeCode: 'LAB_URINE' },
    { key: 'milk',  label: 'Milk Test',   feeCode: 'LAB_MILK'  },
  ].forEach(({ key, label, feeCode }, ri) => {
    const bg    = ri % 2 === 0 ? C_WHITE : C_AMBER_XL
    const month = n((data.labTests?.thisMonth   || {})[key])
    const prog  = n((data.labTests?.progressive || {})[key])
    const rate  = n(data.feeRates?.[feeCode] || defaultRate(feeCode))
    const mFee  = month * rate
    const pFee  = prog  * rate
    totalMonthFee += mFee; totalProgFee += pFee
    cell(doc, MARGIN, y, labelW4, rh, label, { bg, align: 'left' })
    x = MARGIN + labelW4
    ;[month, rate, mFee, prog, pFee].forEach((v, i) => {
      cell(doc, x, y, labDataWs[i], rh, v, { bg }); x += labDataWs[i]
    })
    y += rh
  })

  // Lab totals
  const labTotalSpan = labelW4 + labDataWs[0] + labDataWs[1]
  cell(doc, MARGIN, y, labTotalSpan, rh, 'TOTAL LAB FEE', { bg: C_AMBER_MD, bold: true, align: 'right', fontSize: FS_HEAD })
  x = MARGIN + labTotalSpan
  cell(doc, x, y, labDataWs[2], rh, `Rs ${totalMonthFee}`, { bg: C_AMBER_MD, bold: true }); x += labDataWs[2]
  cell(doc, x, y, labDataWs[3], rh, '',                    { bg: C_AMBER_MD });              x += labDataWs[3]
  cell(doc, x, y, labDataWs[4], rh, `Rs ${totalProgFee}`,  { bg: C_AMBER_MD, bold: true })
  y += rh + GAP

  // ── Total Fee Deposited ──
  // Institute col (labelW4) + 16 data cols
  const feeDataWs = cw(CONTENT_W - labelW4, 16)
  const feeHeaders = [
    'OPD','OPD Dogs','Cast','PD','Lab','H.C.','Post Mort.',
    'Total OPD','Cow AI','ETT AI','Imp AI','Sexed AI',
    'Tot Cow AI','Buffalo AI','Total AI','Grand Total',
  ]

  y = sectionHeader(doc, y, 'TOTAL FEE DEPOSITED')

  cell(doc, MARGIN, y, labelW4, RH_HEAD, 'Institute', { bg: C_AMBER_L, bold: true, fontSize: FS_HEAD })
  x = MARGIN + labelW4
  feeDataWs.forEach((w, i) => {
    cell(doc, x, y, w, RH_HEAD, feeHeaders[i], { bg: C_AMBER_L, bold: true, fontSize: 5.5 }); x += w
  })
  y += RH_HEAD

  const feeSummary = data.feeSummary || []
  feeSummary.forEach((r, ri) => {
    const bg   = ri % 2 === 0 ? C_WHITE : C_AMBER_XL
    const name = (r.institute_name || r.instituteName || '').replace(/ - /g, '\n')
    cell(doc, MARGIN, y, labelW4, rh, r.institute_name || r.instituteName || '', { bg, align: 'left', fontSize: 6 })
    x = MARGIN + labelW4
    ;[n(r.opd_fee),n(r.opd_dogs_fee),n(r.cast_fee),n(r.pd_fee),n(r.lab_fee),n(r.hc_fee),n(r.pm_fee),
      n(r.total_opd_fee),n(r.cow_ai_fee),n(r.ett_ai_fee),n(r.imp_ai_fee),n(r.sexed_ai_fee),
      n(r.total_cow_ai),n(r.buff_ai_fee),n(r.total_ai_fee),n(r.grand_total)].forEach((v, i) => {
      cell(doc, x, y, feeDataWs[i], rh, v, { bg }); x += feeDataWs[i]
    })
    y += rh
  })

  // Grand Total row
  const gt = feeSummary.reduce((a, r) => ({
    opd: a.opd+n(r.opd_fee), dogs: a.dogs+n(r.opd_dogs_fee), cast: a.cast+n(r.cast_fee),
    pd: a.pd+n(r.pd_fee), lab: a.lab+n(r.lab_fee), hc: a.hc+n(r.hc_fee), pm: a.pm+n(r.pm_fee),
    totOpd: a.totOpd+n(r.total_opd_fee), cow: a.cow+n(r.cow_ai_fee), ett: a.ett+n(r.ett_ai_fee),
    imp: a.imp+n(r.imp_ai_fee), sexed: a.sexed+n(r.sexed_ai_fee), totCow: a.totCow+n(r.total_cow_ai),
    buff: a.buff+n(r.buff_ai_fee), totAI: a.totAI+n(r.total_ai_fee), grand: a.grand+n(r.grand_total),
  }), { opd:0,dogs:0,cast:0,pd:0,lab:0,hc:0,pm:0,totOpd:0,cow:0,ett:0,imp:0,sexed:0,totCow:0,buff:0,totAI:0,grand:0 })

  cell(doc, MARGIN, y, labelW4, rh, 'GRAND TOTAL', { bg: C_AMBER_D, fg: C_DARKEST, bold: true, fontSize: FS_BODY })
  x = MARGIN + labelW4
  ;[gt.opd,gt.dogs,gt.cast,gt.pd,gt.lab,gt.hc,gt.pm,gt.totOpd,gt.cow,gt.ett,
    gt.imp,gt.sexed,gt.totCow,gt.buff,gt.totAI,gt.grand].forEach((v, i) => {
    cell(doc, x, y, feeDataWs[i], rh, v, { bg: C_AMBER_D, fg: C_DARKEST, bold: true }); x += feeDataWs[i]
  })
  y += rh + GAP

  // ── Signature block ──
  const sigY = Math.min(y, PAGE_H - MARGIN - FOOTER_H - 80)
  const sigW = 200

  doc.font(F_REG).fontSize(7.5).fillColor(C_DARK)
  doc.text(`Slip Number: ${data.receiptNumber || '_______________'}`, MARGIN, sigY)
  doc.text(`Dated: ${fmtDate(data.endDate)}`,                        MARGIN, sigY + 14)
  doc.text('I have verified all data in this report.',               MARGIN, sigY + 28)

  const sigLineX = PAGE_W - MARGIN - sigW
  doc.save().moveTo(sigLineX, sigY + 52).lineTo(sigLineX + sigW, sigY + 52)
    .strokeColor(C_DARK).lineWidth(0.5).stroke().restore()
  doc.font(F_BOLD).fontSize(7.5).fillColor(C_DARKEST)
    .text(data.preparedByName || 'Incharge', sigLineX, sigY + 55, { width: sigW, align: 'center' })
  doc.font(F_REG).fontSize(7).fillColor(C_DARK)
    .text(data.designation   || '',          sigLineX, sigY + 66, { width: sigW, align: 'center' })
  doc.font(F_REG).fontSize(7).fillColor(C_DARK)
    .text(data.instituteName || '',          sigLineX, sigY + 77, { width: sigW, align: 'center' })

  pageFooter(doc, data, 4)
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function defaultRate(code) {
  return { LAB_FECAL: 40, LAB_BLOOD: 40, LAB_URINE: 2, LAB_MILK: 2 }[code] ?? 0
}

function fmtDate(d) {
  if (!d) return ''
  const dt = d instanceof Date ? d : new Date(d)
  if (isNaN(dt.getTime())) return String(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
