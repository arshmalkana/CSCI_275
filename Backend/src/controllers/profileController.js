// src/controllers/profileController.js
import * as profileService from '../services/profileService.js'
import { ValidationError, NotFoundError } from '../utils/errors.js'

/**
 * Get user profile details
 */
export async function getProfile(request, reply) {
  try {
    const { userId } = request.user

    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'User ID not found in token'
      })
    }

    const profile = await profileService.getProfileByUserId(userId)

    return reply.code(200).send({
      success: true,
      data: profile
    })
  } catch (error) {
    request.log.error({ error, userId: request.user?.userId }, 'Get profile error')

    if (error instanceof NotFoundError) {
      return reply.code(404).send({
        success: false,
        error: error.name,
        message: error.message
      })
    }

    return reply.code(500).send({
      success: false,
      error: 'InternalServerError',
      message: 'Failed to fetch profile'
    })
  }
}

/**
 * Update user profile
 */
export async function updateProfile(request, reply) {
  try {
    const { userId } = request.user
    const updates = request.body

    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'User ID not found in token'
      })
    }

    // Validate updates
    if (!updates || Object.keys(updates).length === 0) {
      throw new ValidationError('No updates provided', 'body')
    }

    // Validate email format if provided
    if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
      throw new ValidationError('Invalid email format', 'email')
    }

    // Validate mobile format if provided
    if (updates.mobile && !/^\+?[0-9\s-]{10,15}$/.test(updates.mobile)) {
      throw new ValidationError('Invalid mobile number format', 'mobile')
    }

    const profile = await profileService.updateProfile(userId, updates)

    return reply.code(200).send({
      success: true,
      data: profile,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    request.log.error({ error, userId: request.user?.userId }, 'Update profile error')

    if (error instanceof ValidationError) {
      return reply.code(400).send({
        success: false,
        error: error.name,
        message: error.message,
        field: error.field
      })
    }

    if (error instanceof NotFoundError) {
      return reply.code(404).send({
        success: false,
        error: error.name,
        message: error.message
      })
    }

    return reply.code(500).send({
      success: false,
      error: 'InternalServerError',
      message: 'Failed to update profile'
    })
  }
}

/**
 * Update institute location
 */
export async function updateLocation(request, reply) {
  try {
    const { userId } = request.user
    const { latitude, longitude } = request.body

    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'User ID not found in token'
      })
    }

    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new ValidationError('Latitude and longitude must be numbers', 'location')
    }

    if (latitude < -90 || latitude > 90) {
      throw new ValidationError('Latitude must be between -90 and 90', 'latitude')
    }

    if (longitude < -180 || longitude > 180) {
      throw new ValidationError('Longitude must be between -180 and 180', 'longitude')
    }

    // Get user's institute ID
    const profile = await profileService.getProfileByUserId(userId)
    const instituteId = profile.institute.instituteId

    const location = await profileService.updateInstituteLocation(
      instituteId,
      latitude,
      longitude
    )

    return reply.code(200).send({
      success: true,
      data: location,
      message: 'Institute location updated successfully'
    })
  } catch (error) {
    request.log.error({ error, userId: request.user?.userId }, 'Update location error')

    if (error instanceof ValidationError) {
      return reply.code(400).send({
        success: false,
        error: error.name,
        message: error.message,
        field: error.field
      })
    }

    if (error instanceof NotFoundError) {
      return reply.code(404).send({
        success: false,
        error: error.name,
        message: error.message
      })
    }

    return reply.code(500).send({
      success: false,
      error: 'InternalServerError',
      message: 'Failed to update location'
    })
  }
}

/**
 * Upload profile picture
 * For now, this expects a URL. In production, you'd handle file upload here.
 */
export async function uploadProfilePicture(request, reply) {
  try {
    const { userId } = request.user
    const { pictureUrl } = request.body

    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'User ID not found in token'
      })
    }

    if (!pictureUrl || typeof pictureUrl !== 'string') {
      throw new ValidationError('Picture URL is required', 'pictureUrl')
    }

    // Validate URL format
    try {
      new URL(pictureUrl)
    } catch {
      throw new ValidationError('Invalid URL format', 'pictureUrl')
    }

    const newPictureUrl = await profileService.updateProfilePicture(userId, pictureUrl)

    return reply.code(200).send({
      success: true,
      data: { profilePictureUrl: newPictureUrl },
      message: 'Profile picture updated successfully'
    })
  } catch (error) {
    request.log.error({ error, userId: request.user?.userId }, 'Upload profile picture error')

    if (error instanceof ValidationError) {
      return reply.code(400).send({
        success: false,
        error: error.name,
        message: error.message,
        field: error.field
      })
    }

    if (error instanceof NotFoundError) {
      return reply.code(404).send({
        success: false,
        error: error.name,
        message: error.message
      })
    }

    return reply.code(500).send({
      success: false,
      error: 'InternalServerError',
      message: 'Failed to upload profile picture'
    })
  }
}
