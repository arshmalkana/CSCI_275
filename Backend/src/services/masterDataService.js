import { query, getClient } from '../database/db.js'
import { getVisibleInstituteIds, assertInstituteInScope } from '../utils/scope.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function audit(client, adminUser, tableName, fieldName, oldValue, newValue, reason) {
  await client.query(
    `INSERT INTO report_edits_audit
       (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
     VALUES (0, $1, $2, $3, $4, $5, $6)`,
    [adminUser.staffId, tableName, fieldName, oldValue, newValue, reason]
  )
}

// ── Service Charges ───────────────────────────────────────────────────────────

export async function listServiceCharges() {
  const result = await query(
    `SELECT charge_id, service_code, service_name, category, current_rate, effective_from, is_active
     FROM service_charges
     ORDER BY category, service_name`
  )
  return result.rows
}

export async function createServiceCharge(adminUser, { serviceCode, serviceName, category, currentRate, effectiveFrom }) {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `INSERT INTO service_charges (service_code, service_name, category, current_rate, effective_from, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING *`,
      [serviceCode, serviceName, category, currentRate, effectiveFrom || new Date().toISOString().slice(0, 10)]
    )
    await audit(client, adminUser, 'service_charges', 'service_code', null,
      serviceCode, `Admin created service charge: ${serviceName}`)
    await client.query('COMMIT')
    return result.rows[0]
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') {
      const e = new Error('Service code already exists')
      e.statusCode = 409
      throw e
    }
    throw err
  } finally {
    client.release()
  }
}

export async function updateServiceChargeRate(adminUser, chargeId, { newRate, effectiveMonth }) {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const current = await client.query(
      'SELECT charge_id, service_code, current_rate FROM service_charges WHERE charge_id = $1',
      [chargeId]
    )
    if (current.rows.length === 0) {
      const e = new Error('Service charge not found'); e.statusCode = 404; throw e
    }
    const { current_rate: oldRate, service_code: code } = current.rows[0]

    await client.query(
      `INSERT INTO fee_changes_history (charge_id, month, old_rate, new_rate, changed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [chargeId, effectiveMonth, oldRate, newRate, adminUser.staffId]
    )
    await client.query(
      'UPDATE service_charges SET current_rate = $1 WHERE charge_id = $2',
      [newRate, chargeId]
    )
    await audit(client, adminUser, 'service_charges', 'current_rate',
      String(oldRate), String(newRate), `Rate change for ${code}, effective ${effectiveMonth}`)
    await client.query('COMMIT')
    return { chargeId, serviceCode: code, oldRate, newRate, effectiveMonth }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function setServiceChargeActive(adminUser, chargeId, active) {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      'UPDATE service_charges SET is_active = $1 WHERE charge_id = $2 RETURNING service_code',
      [active, chargeId]
    )
    if (result.rows.length === 0) {
      const e = new Error('Service charge not found'); e.statusCode = 404; throw e
    }
    await audit(client, adminUser, 'service_charges', 'is_active',
      String(!active), String(active), active ? 'Admin activated charge' : 'Admin deactivated charge')
    await client.query('COMMIT')
    return { chargeId, active }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ── Semen Types ───────────────────────────────────────────────────────────────

export async function listSemenTypes() {
  const result = await query(
    `SELECT semen_id, semen_code, semen_name, species, semen_category, is_active
     FROM semen_types
     ORDER BY species, semen_category, semen_name`
  )
  return result.rows
}

export async function createSemenType(adminUser, { semenCode, semenName, species, semenCategory }) {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `INSERT INTO semen_types (semen_code, semen_name, species, semen_category, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING *`,
      [semenCode, semenName, species, semenCategory]
    )
    await audit(client, adminUser, 'semen_types', 'semen_code', null,
      semenCode, `Admin created semen type: ${semenName}`)
    await client.query('COMMIT')
    return result.rows[0]
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') {
      const e = new Error('Semen code already exists'); e.statusCode = 409; throw e
    }
    throw err
  } finally {
    client.release()
  }
}

export async function updateSemenType(adminUser, semenId, updates) {
  const setClauses = []
  const params = []
  const snakeMap = { semenName: 'semen_name', species: 'species', semenCategory: 'semen_category' }
  for (const [k, v] of Object.entries(updates)) {
    const col = snakeMap[k]
    if (!col) continue
    params.push(v)
    setClauses.push(`${col} = $${params.length}`)
  }
  if (setClauses.length === 0) return { updated: false }
  params.push(semenId)
  const result = await query(
    `UPDATE semen_types SET ${setClauses.join(', ')} WHERE semen_id = $${params.length} RETURNING semen_id`,
    params
  )
  if (result.rows.length === 0) {
    const e = new Error('Semen type not found'); e.statusCode = 404; throw e
  }
  await query(
    `INSERT INTO report_edits_audit (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
     VALUES (0, $1, 'semen_types', 'multi', NULL, $2, 'Admin updated semen type')`,
    [adminUser.staffId, JSON.stringify(updates)]
  )
  return { updated: true }
}

export async function setSemenTypeActive(adminUser, semenId, active) {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      'UPDATE semen_types SET is_active = $1 WHERE semen_id = $2 RETURNING semen_code',
      [active, semenId]
    )
    if (result.rows.length === 0) {
      const e = new Error('Semen type not found'); e.statusCode = 404; throw e
    }
    await audit(client, adminUser, 'semen_types', 'is_active',
      String(!active), String(active), active ? 'Admin activated semen type' : 'Admin deactivated semen type')
    await client.query('COMMIT')
    return { semenId, active }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ── Vaccines ──────────────────────────────────────────────────────────────────

export async function listVaccines() {
  const result = await query(
    `SELECT v.vaccine_id, v.vaccine_code, v.vaccine_name, v.service_charge_id,
            sc.service_name AS charge_name, v.is_active
     FROM vaccines v
     LEFT JOIN service_charges sc ON v.service_charge_id = sc.charge_id
     ORDER BY v.vaccine_name`
  )
  return result.rows
}

export async function createVaccine(adminUser, { vaccineCode, vaccineName, serviceChargeId }) {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `INSERT INTO vaccines (vaccine_code, vaccine_name, service_charge_id, is_active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING *`,
      [vaccineCode, vaccineName, serviceChargeId || null]
    )
    await audit(client, adminUser, 'vaccines', 'vaccine_code', null,
      vaccineCode, `Admin created vaccine: ${vaccineName}`)
    await client.query('COMMIT')
    return result.rows[0]
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') {
      const e = new Error('Vaccine code already exists'); e.statusCode = 409; throw e
    }
    throw err
  } finally {
    client.release()
  }
}

export async function updateVaccine(adminUser, vaccineId, { vaccineName, serviceChargeId }) {
  const setClauses = []
  const params = []
  if (vaccineName !== undefined) { params.push(vaccineName); setClauses.push(`vaccine_name = $${params.length}`) }
  if (serviceChargeId !== undefined) { params.push(serviceChargeId || null); setClauses.push(`service_charge_id = $${params.length}`) }
  if (setClauses.length === 0) return { updated: false }
  params.push(vaccineId)
  const result = await query(
    `UPDATE vaccines SET ${setClauses.join(', ')} WHERE vaccine_id = $${params.length} RETURNING vaccine_id`,
    params
  )
  if (result.rows.length === 0) {
    const e = new Error('Vaccine not found'); e.statusCode = 404; throw e
  }
  await query(
    `INSERT INTO report_edits_audit (report_id, edited_by, table_name, field_name, old_value, new_value, edit_reason)
     VALUES (0, $1, 'vaccines', 'multi', NULL, $2, 'Admin updated vaccine')`,
    [adminUser.staffId, JSON.stringify({ vaccineId, vaccineName, serviceChargeId })]
  )
  return { updated: true }
}

export async function setVaccineActive(adminUser, vaccineId, active) {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      'UPDATE vaccines SET is_active = $1 WHERE vaccine_id = $2 RETURNING vaccine_code',
      [active, vaccineId]
    )
    if (result.rows.length === 0) {
      const e = new Error('Vaccine not found'); e.statusCode = 404; throw e
    }
    await audit(client, adminUser, 'vaccines', 'is_active',
      String(!active), String(active), active ? 'Admin activated vaccine' : 'Admin deactivated vaccine')
    await client.query('COMMIT')
    return { vaccineId, active }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ── Institute Targets ─────────────────────────────────────────────────────────

export async function listTargets(adminUser, { instituteId } = {}) {
  const visibleIds = await getVisibleInstituteIds(adminUser)
  if (visibleIds.length === 0) return []

  const params = [visibleIds]
  let extra = ''
  if (instituteId) {
    params.push(instituteId)
    extra = `AND it.institute_id = $${params.length}`
  }

  const result = await query(
    `SELECT
       it.target_id, it.institute_id, i.institute_name, it.target_type,
       it.vaccine_id, v.vaccine_name, it.annual_target,
       it.effective_from, it.effective_until, it.financial_year
     FROM institute_targets it
     JOIN institutes i ON i.institute_id = it.institute_id
     LEFT JOIN vaccines v ON v.vaccine_id = it.vaccine_id
     WHERE it.institute_id = ANY($1) ${extra}
     ORDER BY i.institute_name, it.target_type`,
    params
  )
  return result.rows
}

export async function getTargetsForInstitute(adminUser, instituteId) {
  await assertInstituteInScope(adminUser, instituteId)
  const result = await query(
    `SELECT
       it.target_id, it.target_type, it.vaccine_id, v.vaccine_name,
       it.annual_target, it.effective_from, it.effective_until, it.financial_year
     FROM institute_targets it
     LEFT JOIN vaccines v ON v.vaccine_id = it.vaccine_id
     WHERE it.institute_id = $1
     ORDER BY it.target_type`,
    [instituteId]
  )
  return result.rows
}

export async function setTarget(adminUser, { instituteId, targetType, vaccineId, annualTarget, effectiveFrom, financialYear }) {
  await assertInstituteInScope(adminUser, instituteId)

  const client = await getClient()
  try {
    await client.query('BEGIN')

    // Look for an existing row for the same institute / type / financial year
    const existing = await client.query(
      `SELECT target_id, annual_target FROM institute_targets
       WHERE institute_id = $1 AND target_type = $2 AND financial_year = $3
         AND ($4::INTEGER IS NULL OR vaccine_id = $4)`,
      [instituteId, targetType, financialYear, vaccineId || null]
    )

    let result
    if (existing.rows.length > 0) {
      const { target_id: targetId, annual_target: oldTarget } = existing.rows[0]
      result = await client.query(
        `UPDATE institute_targets
         SET annual_target = $1, effective_from = $2
         WHERE target_id = $3
         RETURNING *`,
        [annualTarget, effectiveFrom, targetId]
      )
      await audit(client, adminUser, 'institute_targets', 'annual_target',
        String(oldTarget), String(annualTarget),
        `Target update for institute ${instituteId} type ${targetType} FY ${financialYear}`)
    } else {
      result = await client.query(
        `INSERT INTO institute_targets
           (institute_id, target_type, vaccine_id, annual_target, effective_from, financial_year, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [instituteId, targetType, vaccineId || null, annualTarget, effectiveFrom, financialYear, adminUser.staffId]
      )
      await audit(client, adminUser, 'institute_targets', 'annual_target',
        null, String(annualTarget),
        `Target created for institute ${instituteId} type ${targetType} FY ${financialYear}`)
    }

    await client.query('COMMIT')
    return result.rows[0]
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
