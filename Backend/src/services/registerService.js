import { query } from '../database/db.js'

/**
 * Create a new institute registration
 * Inserts institute, incharge staff, employees, and updates village populations
 * All records are marked as inactive pending admin approval
 */
export async function createRegistration(data) {
  try {
    // Start transaction
    await query('BEGIN')

    // 1. Get geographic IDs
    const geoResult = await query(`
      SELECT
        v.village_id,
        v.tehsil_id,
        v.district_id
      FROM villages v
      JOIN tehsils t ON v.tehsil_id = t.tehsil_id
      JOIN districts d ON v.district_id = d.district_id
      WHERE LOWER(v.village_name) = LOWER($1)
        AND LOWER(t.tehsil_name) = LOWER($2)
        AND LOWER(d.district_name) = LOWER($3)
    `, [data.village, data.tehsil, data.district])

    if (geoResult.rows.length === 0) {
      throw new Error(`Village '${data.village}' in tehsil '${data.tehsil}', district '${data.district}' not found`)
    }

    const { village_id, tehsil_id, district_id } = geoResult.rows[0]

    // 2. Generate org_id (temporary, will be updated by admin)
    const orgIdResult = await query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(org_id FROM '[0-9]+') AS INTEGER)), 0) + 1 as next_id
      FROM institutes
      WHERE org_id ~ '^PENDING[0-9]+'
    `)
    const nextId = orgIdResult.rows[0].next_id
    const orgId = `PENDING${String(nextId).padStart(4, '0')}`

    // 3. Generate institute name
    const instituteTypeNames = {
      'CVH': 'Veterinary Hospital',
      'CVD': 'Veterinary Dispensary',
      'PAIW': 'Private AI Worker',
      'CVH_Lab': 'Veterinary Hospital with Lab',
      'Semen_Cluster': 'Semen Cluster'
    }
    const instituteName = `${instituteTypeNames[data.instituteType] || data.instituteType} - ${data.village}`

    // 4. Insert institute (is_active = FALSE)
    const instituteResult = await query(`
      INSERT INTO institutes (
        org_id,
        institute_name,
        institute_type,
        village_id,
        tehsil_id,
        district_id,
        latitude,
        longitude,
        is_cluster_available,
        is_lab_available,
        is_tehsil_hq,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING institute_id, institute_name
    `, [
      orgId,
      instituteName,
      data.instituteType,
      village_id,
      tehsil_id,
      district_id,
      data.latitude ? parseFloat(data.latitude) : null,
      data.longitude ? parseFloat(data.longitude) : null,
      data.isClusterAvailable || false,
      data.isLabAvailable || false,
      data.isTehsilHQ || false,
      false // is_active = false (pending approval)
    ])

    const institute_id = instituteResult.rows[0].institute_id
    const institute_name = instituteResult.rows[0].institute_name

    // 5. Insert incharge staff (is_active = FALSE, no user_id/password yet)
    const inchargeResult = await query(`
      INSERT INTO staff (
        full_name,
        designation,
        mobile,
        email,
        user_role,
        current_institute_id,
        is_active,
        is_first_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING staff_id
    `, [
      data.incharge.name,
      data.incharge.type,
      data.incharge.mobile,
      data.incharge.email,
      'INAPH', // Institute In-charge role
      institute_id,
      false, // is_active = false (pending approval)
      true
    ])

    const incharge_staff_id = inchargeResult.rows[0].staff_id

    // 6. Update institute's current_incharge_id
    await query(`
      UPDATE institutes
      SET current_incharge_id = $1
      WHERE institute_id = $2
    `, [incharge_staff_id, institute_id])

    // 7. Insert other employees (is_active = FALSE)
    if (data.employees && data.employees.length > 0) {
      for (const employee of data.employees) {
        await query(`
          INSERT INTO staff (
            full_name,
            designation,
            mobile,
            email,
            user_role,
            current_institute_id,
            is_active,
            is_first_time
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          employee.name,
          employee.type,
          employee.mobile,
          employee.email || null,
          'AIW', // Default role for other employees
          institute_id,
          false, // is_active = false (pending approval)
          true
        ])
      }
    }

    // 8. Update village populations
    if (data.villagePopulations) {
      for (const [villageName, populations] of Object.entries(data.villagePopulations)) {
        // Get village_id for this village
        const villageIdResult = await query(`
          SELECT v.village_id
          FROM villages v
          JOIN tehsils t ON v.tehsil_id = t.tehsil_id
          JOIN districts d ON v.district_id = d.district_id
          WHERE LOWER(v.village_name) = LOWER($1)
            AND LOWER(t.tehsil_name) = LOWER($2)
            AND LOWER(d.district_name) = LOWER($3)
        `, [villageName, data.tehsil, data.district])

        if (villageIdResult.rows.length > 0) {
          const targetVillageId = villageIdResult.rows[0].village_id

          await query(`
            UPDATE villages
            SET
              equine = $1,
              buffaloes = $2,
              cows = $3,
              pigs = $4,
              goat = $5,
              sheep = $6,
              poultry_layers = $7,
              poultry_broilers = $8
            WHERE village_id = $9
          `, [
            parseInt(populations.equine) || 0,
            parseInt(populations.buffaloes) || 0,
            parseInt(populations.cows) || 0,
            parseInt(populations.pigs) || 0,
            parseInt(populations.goat) || 0,
            parseInt(populations.sheep) || 0,
            parseInt(populations.poultryLayers) || 0,
            parseInt(populations.poultryBroilers) || 0,
            targetVillageId
          ])
        }
      }
    }

    // 9. Insert service villages relationships
    if (data.serviceVillages && data.serviceVillages.length > 0) {
      for (const serviceVillageName of data.serviceVillages) {
        // Get village_id for this service village
        const serviceVillageResult = await query(`
          SELECT v.village_id
          FROM villages v
          JOIN tehsils t ON v.tehsil_id = t.tehsil_id
          JOIN districts d ON v.district_id = d.district_id
          WHERE LOWER(v.village_name) = LOWER($1)
            AND LOWER(t.tehsil_name) = LOWER($2)
            AND LOWER(d.district_name) = LOWER($3)
        `, [serviceVillageName, data.tehsil, data.district])

        if (serviceVillageResult.rows.length > 0) {
          const serviceVillageId = serviceVillageResult.rows[0].village_id

          await query(`
            INSERT INTO institute_service_villages (
              institute_id,
              village_id,
              is_primary
            ) VALUES ($1, $2, $3)
            ON CONFLICT (institute_id, village_id) DO NOTHING
          `, [institute_id, serviceVillageId, false])
        }
      }
    }

    // 10. Also add the establishment village as a service village (primary)
    await query(`
      INSERT INTO institute_service_villages (
        institute_id,
        village_id,
        is_primary
      ) VALUES ($1, $2, $3)
      ON CONFLICT (institute_id, village_id) DO NOTHING
    `, [institute_id, village_id, true])

    // Commit transaction
    await query('COMMIT')

    return {
      registrationId: institute_id,
      instituteName: institute_name,
      orgId,
      status: 'Pending Approval'
    }
  } catch (error) {
    // Rollback on error
    await query('ROLLBACK')
    console.error('Error in createRegistration:', error)
    throw error
  }
}