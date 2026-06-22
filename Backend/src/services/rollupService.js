/**
 * Rollup service — aggregates report data across an admin's visible institute set.
 *
 * All queries start from getVisibleInstituteIds() so data isolation is enforced
 * at a single chokepoint, not re-derived per query.
 */

import PDFDocument from 'pdfkit'
import { query } from '../database/db.js'
import { getVisibleInstituteIds } from '../utils/scope.js'

/**
 * Get summed report totals for all institutes visible to the admin for a given month.
 * Optionally drill into a single child institute (drill = institute_id to examine).
 */
export async function getRollupSummary(adminUser, { month, drill } = {}) {
  const visibleIds = await getVisibleInstituteIds(adminUser)
  if (visibleIds.length === 0) return null

  // If drilling into a specific institute, verify it's in scope
  const scopedIds = drill ? [parseInt(drill)] : visibleIds
  if (drill && !visibleIds.includes(parseInt(drill))) {
    const err = new Error('Drill target is outside your reporting scope')
    err.statusCode = 403
    throw err
  }

  // Default month to current
  const targetMonth = month || new Date().toISOString().slice(0, 7)

  // Aggregate OPD
  const opdRes = await query(`
    SELECT
      opd.opd_type,
      opd.case_category,
      SUM(opd.total_cases)            AS total_cases,
      SUM(opd.beneficiaries_covered)  AS beneficiaries
    FROM monthly_reports mr
    JOIN opd_report_details opd ON opd.report_id = mr.report_id
    WHERE mr.institute_id = ANY($1)
      AND mr.reporting_month = $2
      AND mr.submission_status IN ('Submitted', 'Approved')
    GROUP BY opd.opd_type, opd.case_category
    ORDER BY opd.opd_type, opd.case_category
  `, [scopedIds, targetMonth])

  // Aggregate AI
  const aiRes = await query(`
    SELECT
      st.semen_code,
      st.semen_name,
      st.species,
      SUM(ai.total_ai_done)      AS total_ai_done,
      SUM(ai.animals_covered)    AS animals_covered,
      SUM(ai.animals_tested)     AS animals_tested,
      SUM(ai.animals_positive)   AS animals_positive,
      SUM(ai.male_calves)        AS male_calves,
      SUM(ai.female_calves)      AS female_calves,
      SUM(ai.beneficiaries_covered) AS beneficiaries
    FROM monthly_reports mr
    JOIN ai_report_details ai ON ai.report_id = mr.report_id
    JOIN semen_types st ON ai.semen_type_id = st.semen_id
    WHERE mr.institute_id = ANY($1)
      AND mr.reporting_month = $2
      AND mr.submission_status IN ('Submitted', 'Approved')
    GROUP BY st.semen_code, st.semen_name, st.species
    ORDER BY st.species, st.semen_code
  `, [scopedIds, targetMonth])

  // Aggregate vaccinations
  const vacRes = await query(`
    SELECT
      v.vaccine_code,
      v.vaccine_name,
      SUM(vr.doses_received)    AS doses_received,
      SUM(vr.doses_used)        AS doses_used,
      SUM(vr.animals_vaccinated) AS animals_vaccinated
    FROM monthly_reports mr
    JOIN vaccination_report_details vr ON vr.report_id = mr.report_id
    JOIN vaccines v ON vr.vaccine_id = v.vaccine_id
    WHERE mr.institute_id = ANY($1)
      AND mr.reporting_month = $2
      AND mr.submission_status IN ('Submitted', 'Approved')
    GROUP BY v.vaccine_code, v.vaccine_name
    ORDER BY v.vaccine_code
  `, [scopedIds, targetMonth])

  // List of child institutes with their status (for drill-down table)
  const childRes = await query(`
    SELECT
      i.institute_id,
      i.org_id,
      i.institute_name,
      i.institute_type,
      d.district_name,
      t.tehsil_name,
      mr.submission_status,
      mr.submitted_at,
      mr.report_id
    FROM institutes i
    LEFT JOIN monthly_reports mr ON mr.institute_id = i.institute_id AND mr.reporting_month = $2
    LEFT JOIN districts d ON i.district_id = d.district_id
    LEFT JOIN tehsils   t ON i.tehsil_id   = t.tehsil_id
    WHERE i.institute_id = ANY($1)
      AND i.is_active = TRUE
    ORDER BY d.district_name, t.tehsil_name, i.institute_name
  `, [scopedIds, targetMonth])

  return {
    month: targetMonth,
    scope: { instituteCount: scopedIds.length, drill: drill ? parseInt(drill) : null },
    opd:          opdRes.rows,
    ai:           aiRes.rows,
    vaccinations: vacRes.rows,
    institutes:   childRes.rows.map(r => ({
      ...r,
      status: r.submission_status || 'Missing'
    }))
  }
}

// ── Export helpers ────────────────────────────────────────────────────────────

function n(val) { return Number(val || 0).toLocaleString('en-IN') }

function pdfTable(doc, headers, colWidths, rows, startY) {
  const LEFT = 40
  let y = startY

  // Header row
  doc.font('Helvetica-Bold').fontSize(8)
  let x = LEFT
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x, y, { width: colWidths[i], lineBreak: false })
    x += colWidths[i]
  }
  y += 14
  const totalW = colWidths.reduce((a, b) => a + b, 0)
  doc.moveTo(LEFT, y).lineTo(LEFT + totalW, y).strokeColor('#CCCCCC').lineWidth(0.5).stroke()
  y += 4

  // Data rows
  doc.font('Helvetica').fontSize(8).strokeColor('#000000')
  for (const row of rows) {
    if (y > 760) { doc.addPage(); y = 40 }
    x = LEFT
    for (let i = 0; i < row.length; i++) {
      doc.text(String(row[i] ?? '—'), x, y, { width: colWidths[i], lineBreak: false })
      x += colWidths[i]
    }
    y += 14
  }
  return y + 8
}

export async function generateExportPdf(adminUser, { month, drill } = {}) {
  const summary = await getRollupSummary(adminUser, { month, drill })
  if (!summary) throw Object.assign(new Error('No data'), { statusCode: 404 })

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' })
    const chunks = []
    doc.on('data', c => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const generated = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })

    // ── Title ──────────────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1a1a1a')
      .text('Punjab Animal Husbandry Department', { align: 'center' })
    doc.font('Helvetica-Bold').fontSize(11)
      .text('Monthly Consolidated Report', { align: 'center' })
    doc.font('Helvetica').fontSize(9).fillColor('#555555')
      .text(`Month: ${summary.month}   |   ${summary.scope.instituteCount} institutes   |   Generated: ${generated}`, { align: 'center' })
    doc.moveDown(1)

    // ── Submission Status ──────────────────────────────────────────────────────
    const submitted = summary.institutes.filter(i => i.status === 'Submitted').length
    const approved  = summary.institutes.filter(i => i.status === 'Approved').length
    const missing   = summary.institutes.filter(i => i.status === 'Missing').length

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1a1a1a').text('Submission Summary')
    doc.font('Helvetica').fontSize(9).fillColor('#333333')
      .text(`Submitted: ${submitted}   Approved: ${approved}   Missing: ${missing}   Total: ${summary.institutes.length}`)
    doc.moveDown(0.6)

    // ── Institute List ─────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1a1a1a').text('Institutes')
    doc.moveDown(0.3)
    let y = pdfTable(doc,
      ['Institute', 'District', 'Tehsil', 'Status'],
      [220, 110, 110, 75],
      summary.institutes.map(i => [i.institute_name, i.district_name || '—', i.tehsil_name || '—', i.status]),
      doc.y
    )
    doc.y = y

    // ── OPD Summary ───────────────────────────────────────────────────────────
    if (summary.opd.length > 0) {
      doc.moveDown(0.6).font('Helvetica-Bold').fontSize(10).fillColor('#1a1a1a').text('OPD Summary')
      doc.moveDown(0.3)
      y = pdfTable(doc,
        ['Type', 'Category', 'Cases', 'Beneficiaries'],
        [160, 130, 115, 110],
        summary.opd.map(r => [r.opd_type, r.case_category, n(r.total_cases), n(r.beneficiaries)]),
        doc.y
      )
      doc.y = y
    }

    // ── AI Summary ────────────────────────────────────────────────────────────
    if (summary.ai.length > 0) {
      doc.moveDown(0.6).font('Helvetica-Bold').fontSize(10).fillColor('#1a1a1a').text('Artificial Insemination Summary')
      doc.moveDown(0.3)
      y = pdfTable(doc,
        ['Semen Type', 'Species', 'Total AI', 'Animals Covered'],
        [200, 90, 100, 125],
        summary.ai.map(r => [r.semen_name, r.species, n(r.total_ai_done), n(r.animals_covered)]),
        doc.y
      )
      doc.y = y
    }

    // ── Vaccination Summary ───────────────────────────────────────────────────
    if (summary.vaccinations.length > 0) {
      doc.moveDown(0.6).font('Helvetica-Bold').fontSize(10).fillColor('#1a1a1a').text('Vaccination Summary')
      doc.moveDown(0.3)
      pdfTable(doc,
        ['Vaccine', 'Received', 'Used', 'Animals Vaccinated'],
        [200, 100, 100, 115],
        summary.vaccinations.map(r => [r.vaccine_name, n(r.doses_received), n(r.doses_used), n(r.animals_vaccinated)]),
        doc.y
      )
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const pages = doc.bufferedPageRange()
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i)
      doc.font('Helvetica').fontSize(7).fillColor('#888888')
        .text(`Page ${i + 1} of ${pages.count} — AH Punjab Reporting System`, 40, 820, { align: 'center', width: 515 })
    }

    doc.end()
  })
}

export function generateExportCsv(summary) {
  const lines = []

  const esc = v => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const row = (...cols) => lines.push(cols.map(esc).join(','))

  row('Punjab Animal Husbandry Department — Monthly Consolidated Report')
  row(`Month: ${summary.month}`)
  row(`Generated: ${new Date().toISOString()}`)
  row(`Institutes in scope: ${summary.scope.instituteCount}`)
  lines.push('')

  // Submission status
  row('SUBMISSION STATUS')
  row('Institute', 'District', 'Tehsil', 'Status', 'Submitted At')
  for (const i of summary.institutes) {
    row(i.institute_name, i.district_name || '', i.tehsil_name || '', i.status, i.submitted_at || '')
  }
  lines.push('')

  // OPD
  if (summary.opd.length > 0) {
    row('OPD SUMMARY')
    row('Type', 'Category', 'Total Cases', 'Beneficiaries')
    for (const r of summary.opd) {
      row(r.opd_type, r.case_category, r.total_cases, r.beneficiaries)
    }
    lines.push('')
  }

  // AI
  if (summary.ai.length > 0) {
    row('AI SUMMARY')
    row('Semen Type', 'Species', 'Total AI Done', 'Animals Covered', 'Animals Tested', 'Animals Positive')
    for (const r of summary.ai) {
      row(r.semen_name, r.species, r.total_ai_done, r.animals_covered, r.animals_tested, r.animals_positive)
    }
    lines.push('')
  }

  // Vaccination
  if (summary.vaccinations.length > 0) {
    row('VACCINATION SUMMARY')
    row('Vaccine', 'Doses Received', 'Doses Used', 'Animals Vaccinated')
    for (const r of summary.vaccinations) {
      row(r.vaccine_name, r.doses_received, r.doses_used, r.animals_vaccinated)
    }
  }

  return lines.join('\n')
}
