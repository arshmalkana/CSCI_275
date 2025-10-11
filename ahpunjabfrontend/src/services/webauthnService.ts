// WebAuthn/Passkey service for frontend
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'

const API_BASE_URL = import.meta.env.PROD
  ? 'https://api-ahpunjab.itsarsh.dev/v1'
  : '/v1'

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
  // ---------- NEW: usernameless probe (does a true “do we have a local passkey?” check)
  async probeLocalPasskeyForThisRP(): Promise<{ hasDiscoverablePasskey: boolean; note?: string ,  resss?: string }> {
    try {
      const r = await fetch(`${API_BASE_URL}/auth/webauthn/test/usernameless-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}), 
      })
      if (!r.ok) throw new Error('Probe route failed')
      const { options } = await r.json()

      // Force usernameless (no allowCredentials)
      const testOptions = { ...options, allowCredentials: undefined as any }

      try {
        // You can cancel the sheet; appearance is what matters for the probe.
        const asseResp = await startAuthentication(testOptions)
        return { hasDiscoverablePasskey: true, note: 'Passkey UI appeared (user may have completed it).' , resss: JSON.stringify(asseResp)}
      } catch (e: any) {
        // If you visually saw “No passkeys available for <RP>”, that’s the confirmation.
        return {
          hasDiscoverablePasskey: false,
          note: e?.name === 'NotAllowedError'
            ? 'No local discoverable passkey OR user cancelled immediately.'
            : (e?.message || String(e)),
        }
      }
    } catch (err: any) {
      return { hasDiscoverablePasskey: false, note: err?.message || 'Network error during probe' }
    }
  }

  // ---------- Helper: prefer internal transports first, keep original as fallback
  private platformPreferred(options: any) {
    const platformOnly = {
      ...options,
      allowCredentials: options.allowCredentials?.map((c: any) => ({
        ...c,
        transports: ['internal'],
      })),
    }
    return { platformOnly, original: options }
  }

  /**
   * Setup a new passkey for authenticated user
   * Forces a platform + resident credential on the client (safe tightening).
   */
  async setupPasskey(staffId: number, deviceName?: string): Promise<SetupPasskeyResponse> {
    try {
      const optionsResponse = await fetch(`${API_BASE_URL}/auth/webauthn/register/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ staffId })
      })

      if (!optionsResponse.ok) {
        const error = await optionsResponse.json()
        return {
          success: false,
          message: error.message || 'Failed to get registration options'
        }
      }

      const { options } = await optionsResponse.json()
      console.log('setup OPTIONS:', options);


      // ---- Belt & suspenders: ensure platform + resident (discoverable) on client
      options.authenticatorSelection = {
        ...(options.authenticatorSelection ?? {}),
        authenticatorAttachment: 'platform',
        residentKey: 'required',
        requireResidentKey: true,
        userVerification: 'required',
      }
      options.extensions = { ...(options.extensions ?? {}), credProps: true }

      // Trigger browser WebAuthn prompt
      let attResp
      try {
        attResp = await startRegistration(options)
      } catch (error: any) {
        if (error?.name === 'NotAllowedError') {
          return { success: false, message: 'Passkey setup was cancelled' }
        }
        return { success: false, message: error?.message || 'Failed to create passkey' }
      }

      // Include helpful metadata (server may ignore unknown fields; that’s fine)
      const clientExtras = {
        authenticatorAttachment: (attResp as any).authenticatorAttachment,
        clientExtensionResults: (attResp as any).clientExtensionResults,
        transports: (attResp as any).response?.getTransports?.() ?? (attResp as any).transports
      }

      const verifyResponse = await fetch(`${API_BASE_URL}/auth/webauthn/register/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          staffId,
          response: attResp,
          deviceName,
          // Optional breadcrumbs so server can store rk/attachment/transports
          ...clientExtras,
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
   * Try platform-only first (Windows Hello). If no local match, fall back to original (hybrid allowed).
   */
  async loginWithPasskey(username: string): Promise<PasskeyLoginResponse> {
    try {
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
      console.log('LOGIN OPTIONS:', options);
      const hasAllowCreds = Array.isArray(options.allowCredentials) && options.allowCredentials.length > 0;
      const platformOnly = hasAllowCreds
        ? {
            ...options,
            allowCredentials: options.allowCredentials.map((c: any) => ({
              ...c,
              transports: ['internal'], // force platform-first for this attempt
            })),
          }
        : options; // if no allowCredentials, just use options as-is


      let asseResp
      // try {
      //   const { platformOnly, original } = this.platformPreferred(options)
      //   try {
      //     // Prefer Windows Hello if a local passkey exists
      //     asseResp = await startAuthentication(platformOnly)
      //   } catch {
      //     // Fall back to original options (may include 'hybrid' → QR flow)
      //     asseResp = await startAuthentication(original)
      //   }
      // } catch (error: any) {
      //   if (error?.name === 'NotAllowedError') {
      //     return { success: false, message: 'Authentication was cancelled' }
      //   }
      //   return { success: false, message: error?.message || 'Authentication failed' }
      // }
      try {
        // 1) Try platform-only (Windows Hello)
        asseResp = await startAuthentication(platformOnly);
      } catch {
        // 2) Fall back to your original options (may include 'hybrid' → QR flow)
        asseResp = await startAuthentication(options);
      }

      const verifyResponse = await fetch(`${API_BASE_URL}/auth/webauthn/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, response: asseResp }),
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json()
        return {
          success: false,
          message: error.message || 'Authentication failed'
        }
      }

      const result = await verifyResponse.json()

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

  async listPasskeys(staffId: number): Promise<PasskeyCredential[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/webauthn/credentials?staffId=${staffId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }
      )

      if (!response.ok) return []
      const data = await response.json()
      return data.credentials || []
    } catch (error) {
      console.error('List passkeys error:', error)
      return []
    }
  }

  async deletePasskey(credentialId: string, staffId: number): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/webauthn/credentials/${credentialId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ staffId })
        }
      )
      return response.ok
    } catch (error) {
      console.error('Delete passkey error:', error)
      return false
    }
  }

  isSupported(): boolean {
    return (
      window.PublicKeyCredential !== undefined &&
      navigator.credentials !== undefined
    )
  }

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
