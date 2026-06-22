import { query, getClient } from '../database/db.js'
import { getVisibleInstituteIds, assertInstituteInScope } from '../utils/scope.js'

export async function getVaccinesForDistribution() {
  const result = await query(`
    SELECT vaccine_id, vaccine_code, vaccine_name
    FROM vaccines
    WHERE is_active = TRUE
    ORDER BY vaccine_name
  `)
  return result.rows
}

export async function getMyVaccineStock(adminUser) {
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
  `, [adminUser.instituteId])
  return result.rows
}

export async function getReceivingInstitutes(adminUser) {
  const visibleIds = await getVisibleInstituteIds(adminUser)
  const ids = visibleIds.filter(id => id !== adminUser.instituteId)
  if (ids.length === 0) return []

  const result = await query(`
    SELECT institute_id, institute_name, org_id, institute_type
    FROM institutes
    WHERE institute_id = ANY($1) AND is_active = TRUE
    ORDER BY institute_name
  `, [ids])
  return result.rows
}

export async function issueVaccine(adminUser, { vaccineId, toInstituteId, dosesIssued, transactionDate, batchNumber }) {
  await assertInstituteInScope(adminUser, toInstituteId)

  const client = await getClient()
  try {
    await client.query('BEGIN')

    const stockRes = await client.query(
      'SELECT current_stock FROM vaccine_stock WHERE institute_id = $1 AND vaccine_id = $2',
      [adminUser.instituteId, vaccineId]
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
    `, [transactionDate, vaccineId, adminUser.instituteId, toInstituteId, dosesIssued, batchNumber || null])

    const transactionId = txRes.rows[0].transaction_id

    await client.query(`
      UPDATE vaccine_stock
      SET current_stock = current_stock - $1, last_updated = CURRENT_TIMESTAMP
      WHERE institute_id = $2 AND vaccine_id = $3
    `, [dosesIssued, adminUser.instituteId, vaccineId])

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
    `, [adminUser.staffId, String(transactionId)])

    await client.query('COMMIT')
    return { transactionId, stockRemaining: currentStock - dosesIssued }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
