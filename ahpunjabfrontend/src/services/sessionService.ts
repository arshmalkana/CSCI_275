// Session management service
import apiClient from '../utils/apiClient'

const API_BASE_URL = apiClient.getBaseUrl()

export interface Session {
  token_id: number
  device_name: string
  device_info: string
  ip_address: string
  created_at: string
  last_used_at: string
  expires_at: string
  is_current: boolean
}

class SessionService {
  /**
   * Get all active sessions for the authenticated user
   */
  async getSessions(): Promise<Session[]> {
    try {
      const response = await apiClient.fetch(`${API_BASE_URL}/auth/sessions`, {
        method: 'GET'
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return data.sessions || []
    } catch (error) {
      console.error('Get sessions error:', error)
      return []
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(tokenId: number): Promise<boolean> {
    try {
      const response = await apiClient.fetch(
        `${API_BASE_URL}/auth/sessions/${tokenId}`,
        {
          method: 'DELETE'
        }
      )

      return response.ok
    } catch (error) {
      console.error('Revoke session error:', error)
      return false
    }
  }

  /**
   * Revoke all other sessions except the current one
   */
  async revokeAllOtherSessions(): Promise<boolean> {
    try {
      const response = await apiClient.fetch(
        `${API_BASE_URL}/auth/sessions/revoke-all-others`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      return response.ok
    } catch (error) {
      console.error('Revoke all other sessions error:', error)
      return false
    }
  }
}

export default new SessionService()
