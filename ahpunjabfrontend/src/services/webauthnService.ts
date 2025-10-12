// WebAuthn/Passkey service for frontend
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
import apiClient from '../utils/apiClient'

const API_BASE_URL = apiClient.getBaseUrl()

export interface PasskeyCredential {
  id: string
  deviceName: string
  createdAt: string
  lastUsedAt: string | null
}

export interface SetupPasskeyResponse {
  success: boolean
  message?: string
  credential?: {
    id: string
    deviceName: string
  }
}

export interface PasskeyLoginResponse {
  success: boolean
  message: string
  user?: {
    id: number
    username: string
    name: string
    role: string
    designation: string
    institute: string
    district: string
    mobile?: string
    email?: string
    isFirstTime: boolean
  }
  token?: string
  expiresIn?: string
}

class WebAuthnService {
  /**
   * Setup a new passkey for authenticated user
   */
  async setupPasskey(deviceName?: string): Promise<SetupPasskeyResponse> {
    try {
      // Step 1: Get registration options from server
      const optionsResponse = await apiClient.fetch(`${API_BASE_URL}/auth/webauthn/register/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      if (!optionsResponse.ok) {
        const error = await optionsResponse.json()
        return {
          success: false,
          message: error.message || 'Failed to get registration options'
        }
      }

      const { options } = await optionsResponse.json()

      // Step 2: Trigger browser WebAuthn prompt
      let attResp
      try {
        attResp = await startRegistration(options)
      } catch (error: unknown) {
        // User cancelled or browser doesn't support WebAuthn
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            return { success: false, message: 'Passkey setup was cancelled' }
          }
          return { success: false, message: error.message }
        }
        return { success: false, message: 'Failed to create passkey' }
      }

      // Step 3: Verify registration response with server
      const verifyResponse = await apiClient.fetch(`${API_BASE_URL}/auth/webauthn/register/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          response: attResp,
          deviceName
        })
      })

      const result = await verifyResponse.json()
      return result
    } catch (error) {
      console.error('Setup passkey error:', error)
      return {
        success: false,
        message: 'Network error. Please try again.'
      }
    }
  }

  /**
   * Login with passkey
   */
  async loginWithPasskey(username: string, rememberMe = false): Promise<PasskeyLoginResponse> {
    try {
      // Step 1: Get authentication options from server
      const optionsResponse = await fetch(`${API_BASE_URL}/auth/webauthn/login/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username })
      })

      if (!optionsResponse.ok) {
        const error = await optionsResponse.json()
        return {
          success: false,
          message: error.message || 'No passkeys found for this user'
        }
      }

      const { options } = await optionsResponse.json()

      // Step 2: Trigger browser WebAuthn authentication
      let asseResp
      try {
        asseResp = await startAuthentication(options)
      } catch (error: unknown) {
        // User cancelled or authentication failed
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            return { success: false, message: 'Authentication was cancelled' }
          }
          return { success: false, message: error.message }
        }
        return { success: false, message: 'Authentication failed' }
      }

      // Step 3: Verify authentication response with server
      const verifyResponse = await fetch(`${API_BASE_URL}/auth/webauthn/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username,
          response: asseResp,
          rememberMe
        })
      })

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json()
        return {
          success: false,
          message: error.message || 'Authentication failed'
        }
      }

      const result = await verifyResponse.json()

      // Store token and user data (same as password login)
      if (result.success && result.token) {
        localStorage.setItem('authToken', result.token)
        localStorage.setItem('tokenExpiry', String(Date.now() + 15 * 60 * 1000))
        localStorage.setItem('user', JSON.stringify(result.user))
      }

      return result
    } catch (error) {
      console.error('Passkey login error:', error)
      return {
        success: false,
        message: 'Network error. Please try again.'
      }
    }
  }

  /**
   * Check if user has passkeys registered
   */
  async hasPasskeys(username: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/webauthn/login/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username })
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * List user's registered passkeys (requires authentication)
   */
  async listPasskeys(): Promise<PasskeyCredential[]> {
    try {
      const response = await apiClient.fetch(
        `${API_BASE_URL}/auth/webauthn/credentials`,
        {
          method: 'GET'
        }
      )

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return data.credentials || []
    } catch (error) {
      console.error('List passkeys error:', error)
      return []
    }
  }

  /**
   * Delete a passkey (requires authentication)
   */
  async deletePasskey(credentialId: string): Promise<boolean> {
    try {
      const response = await apiClient.fetch(
        `${API_BASE_URL}/auth/webauthn/credentials/${credentialId}`,
        {
          method: 'DELETE'
        }
      )

      return response.ok
    } catch (error) {
      console.error('Delete passkey error:', error)
      return false
    }
  }

  /**
   * Check if browser supports WebAuthn
   */
  isSupported(): boolean {
    return (
      window.PublicKeyCredential !== undefined &&
      navigator.credentials !== undefined
    )
  }

  /**
   * Check if platform authenticator (Face ID, Windows Hello) is available
   */
  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false

    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch {
      return false
    }
  }
}

export default new WebAuthnService()
