// API base URL (use proxy in development)
const API_BASE_URL = import.meta.env.PROD
  ? 'https://api-ahpunjab.itsarsh.dev/v1'
  : '/v1'

export interface LoginCredentials {
  username: string
  password: string
}

export interface User {
  id: number
  username: string
  name: string
  role: string
  designation: string
  institute: string
  instituteType?: string
  district: string
  tehsil?: string
  mobile?: string
  email?: string
  isFirstTime: boolean
}

export interface LoginResponse {
  success: boolean
  message: string
  user?: User
  token?: string
  expiresIn?: string
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
      // const response = await fetch(`http://127.0.0.1:8080/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for refresh token
        body: JSON.stringify(credentials),
      })

      // Check if response has content
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response:', await response.text())
        return {
          success: false,
          message: 'Server error. Please try again.',
        }
      }

      const data = await response.json()

      if (response.ok) {
        // Store access token and user data in localStorage
        if (data.token) {
          localStorage.setItem('authToken', data.token)
          localStorage.setItem('tokenExpiry', String(Date.now() + 15 * 60 * 1000)) // 15 minutes
          localStorage.setItem('user', JSON.stringify(data.user))
        }
        return data
      } else {
        // This should now properly show the error message from backend
        return {
          success: false,
          message: data.message || 'Login failed',
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      }
    }
  }

  async logout() {
    try {
      // Call logout endpoint to clear refresh token cookie
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage
      localStorage.removeItem('authToken')
      localStorage.removeItem('tokenExpiry')
      localStorage.removeItem('user')
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Send refresh token cookie
      })

      const data = await response.json()

      if (response.ok && data.token) {
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('tokenExpiry', String(Date.now() + 15 * 60 * 1000))
        return true
      }
      return false
    } catch (error) {
      console.error('Token refresh error:', error)
      return false
    }
  }

  getToken(): string | null {
    return localStorage.getItem('authToken')
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }

  isAuthenticated(): boolean {
    const token = this.getToken()
    const expiry = localStorage.getItem('tokenExpiry')

    if (!token || !expiry) return false

    // Check if token is expired
    if (Date.now() > parseInt(expiry)) {
      // Token expired, try to refresh
      this.refreshAccessToken()
      return false
    }

    return true
  }
}

export default new AuthService()
