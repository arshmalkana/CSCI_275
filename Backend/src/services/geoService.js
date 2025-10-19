import { query } from '../database/db.js'

/**
 * Get all districts in Punjab
 * @returns {Promise<Array>} List of districts
 */
export async function getAllDistricts() {
  try {
    const result = await query(`
      SELECT
        district_id,
        district_name,
        state_name
      FROM districts
      ORDER BY district_name ASC
    `)

    return result.rows.map(row => ({
      districtId: row.district_id,
      districtName: row.district_name,
      stateName: row.state_name
    }))
  } catch (error) {
    console.error('Error in getAllDistricts:', error)
    throw error
  }
}

/**
 * Get all tehsils in a specific district
 * @param {string} districtName - Name of the district
 * @returns {Promise<Array>} List of tehsils
 */
export async function getTehsilsByDistrict(districtName) {
  try {
    const result = await query(`
      SELECT
        t.tehsil_id,
        t.tehsil_name,
        t.district_id,
        d.district_name,
        d.state_name
      FROM tehsils t
      JOIN districts d ON t.district_id = d.district_id
      WHERE LOWER(d.district_name) = LOWER($1)
      ORDER BY t.tehsil_name ASC
    `, [districtName])

    if (result.rows.length === 0) {
      return null // District not found or has no tehsils
    }

    return {
      districtName: result.rows[0].district_name,
      stateName: result.rows[0].state_name,
      tehsils: result.rows.map(row => ({
        tehsilId: row.tehsil_id,
        tehsilName: row.tehsil_name
      }))
    }
  } catch (error) {
    console.error('Error in getTehsilsByDistrict:', error)
    throw error
  }
}

/**
 * Get all villages in a specific tehsil
 * @param {string} districtName - Name of the district
 * @param {string} tehsilName - Name of the tehsil
 * @returns {Promise<Array>} List of villages with population data
 */
export async function getVillagesByTehsil(districtName, tehsilName) {
  try {
    // First check if the tehsil exists
    const tehsilCheck = await query(`
      SELECT
        t.tehsil_id,
        t.tehsil_name,
        d.district_name,
        d.state_name
      FROM tehsils t
      JOIN districts d ON t.district_id = d.district_id
      WHERE LOWER(d.district_name) = LOWER($1)
        AND LOWER(t.tehsil_name) = LOWER($2)
    `, [districtName, tehsilName])

    if (tehsilCheck.rows.length === 0) {
      return null // Tehsil doesn't exist
    }

    // Get villages for this tehsil
    const result = await query(`
      SELECT
        v.village_id,
        v.village_name,
        v.pincode,
        v.latitude,
        v.longitude,
        v.human_population,
        v.equine,
        v.buffaloes,
        v.cows,
        v.pigs,
        v.goat,
        v.sheep,
        v.poultry_layers,
        v.poultry_broilers,
        v.dogs
      FROM villages v
      JOIN tehsils t ON v.tehsil_id = t.tehsil_id
      JOIN districts d ON v.district_id = d.district_id
      WHERE LOWER(d.district_name) = LOWER($1)
        AND LOWER(t.tehsil_name) = LOWER($2)
      ORDER BY v.village_name ASC
    `, [districtName, tehsilName])

    // Return tehsil info even if no villages
    return {
      districtName: tehsilCheck.rows[0].district_name,
      tehsilName: tehsilCheck.rows[0].tehsil_name,
      stateName: tehsilCheck.rows[0].state_name,
      villages: result.rows.map(row => ({
        villageId: row.village_id,
        villageName: row.village_name,
        pincode: row.pincode,
        latitude: row.latitude,
        longitude: row.longitude,
        population: {
          human: row.human_population,
          equine: row.equine,
          buffaloes: row.buffaloes,
          cows: row.cows,
          pigs: row.pigs,
          goat: row.goat,
          sheep: row.sheep,
          poultryLayers: row.poultry_layers,
          poultryBroilers: row.poultry_broilers,
          dogs: row.dogs
        }
      }))
    }
  } catch (error) {
    console.error('Error in getVillagesByTehsil:', error)
    throw error
  }
}

/**
 * Search villages by name (for autocomplete)
 * @param {string} searchQuery - Search term
 * @param {number} limit - Maximum results to return
 * @returns {Promise<Array>} List of matching villages
 */
export async function searchVillages(searchQuery, limit = 20) {
  try {
    const result = await query(`
      SELECT
        v.village_id,
        v.village_name,
        t.tehsil_name,
        d.district_name,
        d.state_name
      FROM villages v
      JOIN tehsils t ON v.tehsil_id = t.tehsil_id
      JOIN districts d ON v.district_id = d.district_id
      WHERE LOWER(v.village_name) LIKE LOWER($1)
      ORDER BY v.village_name ASC
      LIMIT $2
    `, [`%${searchQuery}%`, limit])

    return result.rows.map(row => ({
      villageId: row.village_id,
      villageName: row.village_name,
      tehsilName: row.tehsil_name,
      districtName: row.district_name,
      stateName: row.state_name,
      fullPath: `${row.state_name} > ${row.district_name} > ${row.tehsil_name} > ${row.village_name}`
    }))
  } catch (error) {
    console.error('Error in searchVillages:', error)
    throw error
  }
}

/**
 * Get complete hierarchy (for initial app load - cached)
 * Returns only district and tehsil names without villages
 * @returns {Promise<Object>} Complete geography hierarchy
 */
export async function getGeographyHierarchy() {
  try {
    const result = await query(`
      SELECT
        d.district_id,
        d.district_name,
        d.state_name,
        t.tehsil_id,
        t.tehsil_name
      FROM districts d
      LEFT JOIN tehsils t ON d.district_id = t.district_id
      ORDER BY d.district_name ASC, t.tehsil_name ASC
    `)

    // Group by districts
    const hierarchy = {}

    result.rows.forEach(row => {
      const districtKey = row.district_name

      if (!hierarchy[districtKey]) {
        hierarchy[districtKey] = {
          districtId: row.district_id,
          districtName: row.district_name,
          stateName: row.state_name,
          tehsils: []
        }
      }

      if (row.tehsil_id) {
        hierarchy[districtKey].tehsils.push({
          tehsilId: row.tehsil_id,
          tehsilName: row.tehsil_name
        })
      }
    })

    return {
      stateName: 'Punjab',
      districts: Object.values(hierarchy)
    }
  } catch (error) {
    console.error('Error in getGeographyHierarchy:', error)
    throw error
  }
}

/**
 * Get eligible parent/reporting institutes based on institute type and location
 * Logic:
 * - PAIW: Show CVD/CVH in same tehsil
 * - CVD: Show CVD/CVH in same district
 * - CVH: Show CVH in same district + District_HQ + TehsilHQ
 * @param {string} districtName - District name
 * @param {string} tehsilName - Tehsil name
 * @param {string} instituteType - Type of institute being registered
 * @returns {Promise<Array>} List of eligible parent institutes
 */
export async function getEligibleParentInstitutes(districtName, tehsilName, instituteType) {
  try {
    let queryText = ''
    let params = []

    if (instituteType === 'PAIW') {
      // PAIW: Show CVD/CVH in same tehsil
      queryText = `
        SELECT
          i.institute_id,
          i.institute_name,
          i.institute_type,
          v.village_name,
          t.tehsil_name,
          d.district_name
        FROM institutes i
        JOIN villages v ON i.village_id = v.village_id
        JOIN tehsils t ON i.tehsil_id = t.tehsil_id
        JOIN districts d ON i.district_id = d.district_id
        WHERE LOWER(d.district_name) = LOWER($1)
          AND LOWER(t.tehsil_name) = LOWER($2)
          AND i.institute_type IN ('CVD', 'CVH', 'CVH_Lab')
          AND i.is_active = TRUE
        ORDER BY
          CASE i.institute_type
            WHEN 'CVH' THEN 1
            WHEN 'CVH_Lab' THEN 2
            WHEN 'CVD' THEN 3
          END,
          i.institute_name
      `
      params = [districtName, tehsilName]
    } else if (instituteType === 'CVD') {
      // CVD: Show CVD/CVH in same district
      queryText = `
        SELECT
          i.institute_id,
          i.institute_name,
          i.institute_type,
          v.village_name,
          t.tehsil_name,
          d.district_name
        FROM institutes i
        JOIN villages v ON i.village_id = v.village_id
        JOIN tehsils t ON i.tehsil_id = t.tehsil_id
        JOIN districts d ON i.district_id = d.district_id
        WHERE LOWER(d.district_name) = LOWER($1)
          AND i.institute_type IN ('CVD', 'CVH', 'CVH_Lab')
          AND i.is_active = TRUE
        ORDER BY
          CASE i.institute_type
            WHEN 'CVH' THEN 1
            WHEN 'CVH_Lab' THEN 2
            WHEN 'CVD' THEN 3
          END,
          i.institute_name
      `
      params = [districtName]
    } else if (instituteType === 'CVH' || instituteType === 'CVH_Lab') {
      // CVH: Show CVH in same district + District_HQ + TehsilHQ
      queryText = `
        SELECT
          i.institute_id,
          i.institute_name,
          i.institute_type,
          v.village_name,
          t.tehsil_name,
          d.district_name
        FROM institutes i
        JOIN villages v ON i.village_id = v.village_id
        JOIN tehsils t ON i.tehsil_id = t.tehsil_id
        JOIN districts d ON i.district_id = d.district_id
        WHERE (
          (LOWER(d.district_name) = LOWER($1) AND i.institute_type IN ('CVH', 'CVH_Lab'))
          OR i.institute_type IN ('District_HQ', 'TehsilHQ')
        )
        AND i.is_active = TRUE
        ORDER BY
          CASE i.institute_type
            WHEN 'District_HQ' THEN 1
            WHEN 'TehsilHQ' THEN 2
            WHEN 'CVH' THEN 3
            WHEN 'CVH_Lab' THEN 4
          END,
          i.institute_name
      `
      params = [districtName]
    } else {
      // Default: Show all active institutes in same district
      queryText = `
        SELECT
          i.institute_id,
          i.institute_name,
          i.institute_type,
          v.village_name,
          t.tehsil_name,
          d.district_name
        FROM institutes i
        JOIN villages v ON i.village_id = v.village_id
        JOIN tehsils t ON i.tehsil_id = t.tehsil_id
        JOIN districts d ON i.district_id = d.district_id
        WHERE LOWER(d.district_name) = LOWER($1)
          AND i.is_active = TRUE
        ORDER BY i.institute_name
      `
      params = [districtName]
    }

    const result = await query(queryText, params)

    return result.rows.map(row => ({
      instituteId: row.institute_id,
      instituteName: row.institute_name,
      instituteType: row.institute_type,
      villageName: row.village_name,
      tehsilName: row.tehsil_name,
      districtName: row.district_name
    }))
  } catch (error) {
    console.error('Error in getEligibleParentInstitutes:', error)
    throw error
  }
}
