import { query, getClient } from '../database/db.js'

export async function getVaccinesForDistribution() {
  const result = await query(`
    SELECT vaccine_id, vaccine_code, vaccine_name
    FROM vaccines
    WHERE is_active = TRUE
    ORDER BY vaccine_name
  `)
  return result.rows
}

export async function getMyVaccineStock(user) {
  const result = await query(`
    SELECT
      vs.vaccine_id,
      vs.current_stock,
      v.vaccine_code,
      v.vaccine_name
    FROM vaccine_stock vs
    JOIN vaccines v ON vs.vaccine_id = v.vaccine_id
    WHERE vs.institute_id = $1
      AND v.is_active = TRUE
    ORDER BY v.vaccine_name
  `, [user.instituteId])
  return result.rows
}

// Direct children of the issuing institute
// - VaccineBank → its CVH children
// - CVH → its CVD children
// - SemenBank → its PAIW/CVD children
export async function getReceivingInstitutes(user) {
  const result = await query(`
    SELECT institute_id, institute_name, org_id, institute_type
    FROM institutes
    WHERE parent_institute_id = $1 AND is_active = TRUE
    ORDER BY institute_name
  `, [user.instituteId])
  return result.rows
}

export async function issueVaccine(user, { vaccineId, toInstituteId, dosesIssued, transactionDate, batchNumber }) {
  const childRes = await query(
    'SELECT institute_id FROM institutes WHERE institute_id = $1 AND parent_institute_id = $2 AND is_active = TRUE',
    [toInstituteId, user.instituteId]
  )
  if (!childRes.rows.length) {
    const e = new Error('Target institute is not a direct child of your institute')
    e.statusCode = 403
    throw e
  }

  const client = await getClient()
  try {
    await client.query('BEGIN')

    const stockRes = await client.query(
      'SELECT current_stock FROM vaccine_stock WHERE institute_id = $1 AND vaccine_id = $2',
      [user.instituteId, vaccineId]
    )
    const currentStock = stockRes.rows[0]?.current_stock ?? 0
    if (currentStock < dosesIssued) {
      const e = new Error(`Insufficient stock: ${currentStock} doses available`)
      e.statusCode = 409
      throw e
    }

    const txRes = await client.query(`
      INSERT INTO vaccine_transactions
        (transaction_date, vaccine_id, issuing_institute_id, receiving_institute_id, doses_issued, batch_number, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING transaction_id
    `, [transactionDate, vaccineId, user.instituteId, toInstituteId, dosesIssued, batchNumber || null])

    const transactionId = txRes.rows[0].transaction_id

    await client.query(`
      UPDATE vaccine_stock
      SET current_stock = current_stock - $1, last_updated = CURRENT_TIMESTAMP
      WHERE institute_id = $2 AND vaccine_id = $3
    `, [dosesIssued, user.instituteId, vaccineId])

    await client.query(`
      INSERT INTO vaccine_stock (institute_id, vaccine_id, doses_received, doses_used, current_stock, last_updated)
      VALUES ($1, $2, $3, 0, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (institute_id, vaccine_id) DO UPDATE
      SET doses_received = vaccine_stock.doses_received + $3,
          current_stock  = vaccine_stock.current_stock  + $3,
          last_updated   = CURRENT_TIMESTAMP
    `, [toInstituteId, vaccineId, dosesIssued])

    await client.query(`
      INSERT INTO report_edits_audit
        (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
      VALUES (0, $1, 'vaccine_transactions', 'transaction_id', NULL, $2, 'Vaccine distribution issued')
    `, [user.staffId, String(transactionId)])

    await client.query('COMMIT')
    return { transactionId, stockRemaining: currentStock - dosesIssued }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function getMyVaccineReceipts(user) {
  const result = await query(`
    SELECT
      vt.transaction_id,
      vt.transaction_date,
      vt.doses_issued,
      vt.batch_number,
      v.vaccine_name,
      v.vaccine_code,
      i.institute_name AS from_institute
    FROM vaccine_transactions vt
    JOIN vaccines v ON vt.vaccine_id = v.vaccine_id
    JOIN institutes i ON vt.issuing_institute_id = i.institute_id
    WHERE vt.receiving_institute_id = $1
    ORDER BY vt.transaction_date DESC
    LIMIT 50
  `, [user.instituteId])
  return result.rows
}

// ─── Semen distribution ───────────────────────────────────────────────────────

export async function getSemenTypes() {
  const result = await query(`
    SELECT semen_id, semen_code, semen_name
    FROM semen_types
    WHERE is_active = TRUE
    ORDER BY semen_name
  `)
  return result.rows
}

export async function getMySemenStock(user) {
  const result = await query(`
    SELECT
      ss.semen_type_id,
      ss.current_stock,
      st.semen_name,
      st.semen_code
    FROM semen_stock ss
    JOIN semen_types st ON ss.semen_type_id = st.semen_id
    WHERE ss.institute_id = $1
      AND st.is_active = TRUE
    ORDER BY st.semen_name
  `, [user.instituteId])
  return result.rows
}

export async function getSemenReceivingInstitutes(user) {
  const result = await query(`
    SELECT institute_id, institute_name, org_id, institute_type
    FROM institutes
    WHERE parent_institute_id = $1 AND is_active = TRUE
    ORDER BY institute_name
  `, [user.instituteId])
  return result.rows
}

export async function issueSemen(user, { semenTypeId, toInstituteId, strawsIssued, transactionDate, batchNumber, expiryDate, notes }) {
  const childRes = await query(
    'SELECT institute_id FROM institutes WHERE institute_id = $1 AND parent_institute_id = $2 AND is_active = TRUE',
    [toInstituteId, user.instituteId]
  )
  if (!childRes.rows.length) {
    const e = new Error('Target institute is not a direct child of your institute')
    e.statusCode = 403
    throw e
  }

  const client = await getClient()
  try {
    await client.query('BEGIN')

    const stockRes = await client.query(
      'SELECT current_stock FROM semen_stock WHERE institute_id = $1 AND semen_type_id = $2',
      [user.instituteId, semenTypeId]
    )
    const currentStock = stockRes.rows[0]?.current_stock ?? 0
    if (currentStock < strawsIssued) {
      const e = new Error(`Insufficient stock: ${currentStock} straws available`)
      e.statusCode = 409
      throw e
    }

    const txRes = await client.query(`
      INSERT INTO semen_distribution_transactions
        (transaction_date, semen_type_id, issuing_institute_id, receiving_institute_id,
         straws_issued, batch_number, expiry_date, issued_by, notes, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING transaction_id
    `, [transactionDate, semenTypeId, user.instituteId, toInstituteId,
        strawsIssued, batchNumber || null, expiryDate || null, user.staffId, notes || null])

    const transactionId = txRes.rows[0].transaction_id

    await client.query(`
      UPDATE semen_stock
      SET current_stock = current_stock - $1, last_updated = CURRENT_TIMESTAMP
      WHERE institute_id = $2 AND semen_type_id = $3
    `, [strawsIssued, user.instituteId, semenTypeId])

    await client.query(`
      INSERT INTO semen_stock (institute_id, semen_type_id, current_stock, last_updated)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (institute_id, semen_type_id) DO UPDATE
      SET current_stock = semen_stock.current_stock + $3, last_updated = CURRENT_TIMESTAMP
    `, [toInstituteId, semenTypeId, strawsIssued])

    await client.query('COMMIT')
    return { transactionId, stockRemaining: currentStock - strawsIssued }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function getMySemenReceipts(user) {
  const result = await query(`
    SELECT
      sdt.transaction_id,
      sdt.transaction_date,
      sdt.straws_issued,
      sdt.batch_number,
      sdt.expiry_date,
      sdt.notes,
      st.semen_name,
      st.semen_code,
      i.institute_name AS from_institute
    FROM semen_distribution_transactions sdt
    JOIN semen_types st ON sdt.semen_type_id = st.semen_id
    JOIN institutes i ON sdt.issuing_institute_id = i.institute_id
    WHERE sdt.receiving_institute_id = $1
    ORDER BY sdt.transaction_date DESC
    LIMIT 50
  `, [user.instituteId])
  return result.rows
}
