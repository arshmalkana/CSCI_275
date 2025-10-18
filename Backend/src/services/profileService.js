// src/services/profileService.js
import { query } from '../database/db.js'
import { NotFoundError } from '../utils/errors.js'

/**
 * Get user profile details
 * @param {string} userId - User ID from JWT
 * @returns {Promise<Object>} Profile data
 */
export async function getProfileByUserId(userId) {
  try {
    const profileQuery = `
      SELECT
        s.staff_id,
        s.user_id,
        s.full_name,
        s.designation,
        s.mobile,
        s.email,
        s.date_of_birth,
        s.user_role,
        s.created_at,
        s.profile_picture_url,
        i.institute_id,
        i.institute_name,
        i.institute_type,
        i.latitude,
        i.longitude,
        d.district_name,
        t.tehsil_name,
        v.village_name
      FROM staff s
      JOIN institutes i ON s.current_institute_id = i.institute_id
      LEFT JOIN districts d ON i.district_id = d.district_id
      LEFT JOIN tehsils t ON i.tehsil_id = t.tehsil_id
      LEFT JOIN villages v ON i.village_id = v.village_id
      WHERE s.user_id = $1 AND s.is_active = TRUE
    `

    const result = await query(profileQuery, [userId])

    if (result.rows.length === 0) {
      throw new NotFoundError('User profile', userId)
    }

    const profile = result.rows[0]

    // Get service villages for this user's institute
    const villagesQuery = `
      SELECT
        v.village_id,
        v.village_name,
        isv.is_primary
      FROM institute_service_villages isv
      JOIN villages v ON isv.village_id = v.village_id
      WHERE isv.institute_id = $1
      ORDER BY isv.is_primary DESC, v.village_name
    `

    const villagesResult = await query(villagesQuery, [profile.institute_id])

    return {
      userId: profile.user_id,
      staffId: profile.staff_id,
      fullName: profile.full_name,
      designation: profile.designation,
      mobile: profile.mobile,
      email: profile.email,
      dateOfBirth: profile.date_of_birth,
      dateOfJoining: profile.created_at, // Using created_at as joining date
      userRole: profile.user_role,
      profilePictureUrl: profile.profile_picture_url,
      institute: {
        instituteId: profile.institute_id,
        instituteName: profile.institute_name,
        instituteType: profile.institute_type,
        latitude: profile.latitude,
        longitude: profile.longitude,
        districtName: profile.district_name,
        tehsilName: profile.tehsil_name,
        villageName: profile.village_name
      },
      serviceVillages: villagesResult.rows.map(v => ({
        villageId: v.village_id,
        villageName: v.village_name,
        isPrimary: v.is_primary
      }))
    }
  } catch (error) {
    console.error('Error in getProfileByUserId:', error)
    throw error
  }
}

/**
 * Update user profile (only editable fields)
 * @param {string} userId - User ID from JWT
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateProfile(userId, updates) {
  try {
    const {
      fullName,
      mobile,
      email,
      dateOfBirth
    } = updates

    const updateQuery = `
      UPDATE staff
      SET
        full_name = COALESCE($2, full_name),
        mobile = COALESCE($3, mobile),
        email = COALESCE($4, email),
        date_of_birth = COALESCE($5, date_of_birth),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_active = TRUE
      RETURNING staff_id
    `

    const result = await query(updateQuery, [
      userId,
      fullName,
      mobile,
      email,
      dateOfBirth
    ])

    if (result.rows.length === 0) {
      throw new NotFoundError('User profile', userId)
    }

    // Return updated profile
    return await getProfileByUserId(userId)
  } catch (error) {
    console.error('Error in updateProfile:', error)
    throw error
  }
}

/**
 * Update institute location (only for authorized users)
 * @param {number} instituteId - Institute ID
 * @param {number} latitude - New latitude
 * @param {number} longitude - New longitude
 * @returns {Promise<Object>} Updated location
 */
export async function updateInstituteLocation(instituteId, latitude, longitude) {
  try {
    const updateQuery = `
      UPDATE institutes
      SET
        latitude = $2,
        longitude = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE institute_id = $1
      RETURNING institute_id, latitude, longitude
    `

    const result = await query(updateQuery, [instituteId, latitude, longitude])

    if (result.rows.length === 0) {
      throw new NotFoundError('Institute', instituteId)
    }

    return {
      instituteId: result.rows[0].institute_id,
      latitude: result.rows[0].latitude,
      longitude: result.rows[0].longitude
    }
  } catch (error) {
    console.error('Error in updateInstituteLocation:', error)
    throw error
  }
}

/**
 * Update profile picture URL
 * @param {string} userId - User ID from JWT
 * @param {string} pictureUrl - New profile picture URL
 * @returns {Promise<string>} Updated picture URL
 */
export async function updateProfilePicture(userId, pictureUrl) {
  try {
    const updateQuery = `
      UPDATE staff
      SET
        profile_picture_url = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_active = TRUE
      RETURNING profile_picture_url
    `

    const result = await query(updateQuery, [userId, pictureUrl])

    if (result.rows.length === 0) {
      throw new NotFoundError('User profile', userId)
    }

    return result.rows[0].profile_picture_url
  } catch (error) {
    console.error('Error in updateProfilePicture:', error)
    throw error
  }
}
