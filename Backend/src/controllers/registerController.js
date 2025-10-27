import * as registerService from '../services/registerService.js'

/**
 * POST /register
 * Submit new institute registration for admin approval
 */
export async function submitRegistration(request, reply) {
  try {
    const registrationData = request.body

    // Submit registration (validation handled by Fastify schema)
    const result = await registerService.createRegistration(registrationData)

    return reply.code(201).send({
      success: true,
      message: 'Registration submitted successfully. Please wait for admin approval.',
      data: result
    })
  } catch (error) {
    request.log.error('Registration submission error:', error)

    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return reply.code(400).send({
        success: false,
        message: error.message
      })
    }

    return reply.code(500).send({
      success: false,
      message: 'Failed to submit registration. Please try again later.'
    })
  }
}
