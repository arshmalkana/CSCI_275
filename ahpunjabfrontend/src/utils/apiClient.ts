// API Client with automatic token refresh
// Handles rolling JWT tokens and automatic retry on 401

const API_BASE_URL = import.meta.env.PROD
  ? 'https://api-ahpunjab.itsarsh.dev/v1'
  : '/v1'

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

/**
 * Centralized API client that handles:
 * - Automatic JWT token attachment
 * - Rolling token updates (saves new token from X-New-Token header)
 * - Automatic retry on 401 with token refresh
 * - Token expiry handling
 */
class ApiClient {
  /**
   * Make an authenticated API request
   */
  async fetch(url: string, options: RequestOptions = {}): Promise<Response> {
    const { skipAuth = false, ...fetchOptions } = options

    // Prepare headers
    const headers = new Headers(fetchOptions.headers)

    // Add JWT token for authenticated requests
    if (!skipAuth) {
      const token = localStorage.getItem('authToken')
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }

    // Make the request
    let response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include'
    })

    // Check for new token in response header (rolling token)
    const newToken = response.headers.get('X-New-Token')
    if (newToken) {
      localStorage.setItem('authToken', newToken)
      localStorage.setItem('tokenExpiry', String(Date.now() + 15 * 60 * 1000))
    }

    // Handle 401 Unauthorized - try to refresh token and retry
    if (response.status === 401 && !skipAuth && !url.includes('/auth/refresh')) {
      const refreshed = await this.refreshToken()

      if (refreshed) {
        // Retry the original request with new token
        const newToken = localStorage.getItem('authToken')
        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`)
        }

        response = await fetch(url, {
          ...fetchOptions,
          headers,
          credentials: 'include'
        })

        // Save new token from retry response
        const retryNewToken = response.headers.get('X-New-Token')
        if (retryNewToken) {
          localStorage.setItem('authToken', retryNewToken)
          localStorage.setItem('tokenExpiry', String(Date.now() + 15 * 60 * 1000))
        }
      } else {
        // Refresh failed - clear auth and redirect to login
        this.clearAuth()
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }

    return response
  }

  /**
   * Refresh the access token using the refresh token cookie
   */
  async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.token) {
          localStorage.setItem('authToken', data.token)
          localStorage.setItem('tokenExpiry', String(Date.now() + 15 * 60 * 1000))
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Token refresh error:', error)
      return false
    }
  }

  /**
   * Clear authentication data
   */
  clearAuth() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('tokenExpiry')
    localStorage.removeItem('user')
  }

  /**
   * Get the base URL for API requests
   */
  getBaseUrl(): string {
    return API_BASE_URL
  }
}

export default new ApiClient()
