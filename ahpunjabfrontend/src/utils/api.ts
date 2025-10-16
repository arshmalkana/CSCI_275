/**
 * API utility for making authenticated requests to the backend
 * Uses the existing apiClient for token management and automatic refresh
 */

import apiClient from './apiClient'

const API_BASE_URL = apiClient.getBaseUrl()

interface ApiError {
  error: string
  message: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Make an authenticated API request using the centralized apiClient
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const url = `${API_BASE_URL}${endpoint}`

  try {
    // Use the centralized apiClient which handles authentication, token refresh, etc.
    const response = await apiClient.fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: 'Unknown Error',
        message: `HTTP ${response.status}: ${response.statusText}`,
      }))

      throw new Error(errorData.message || errorData.error)
    }

    const data: ApiResponse<T> = await response.json()

    if (data.success && data.data) {
      return data.data
    }

    throw new Error(data.message || 'API request failed')
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error)
    throw error
  }
}

/**
 * GET request
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' })
}

/**
 * POST request
 */
export async function apiPost<T>(
  endpoint: string,
  data: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * PUT request
 */
export async function apiPut<T>(
  endpoint: string,
  data: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' })
}

/**
 * API endpoints
 */
export const api = {
  // Home
  getHomeData: () => apiGet('/home'),

  // Auth
  login: (credentials: { userId: string; password: string }) =>
    apiPost('/auth/login', credentials),

  register: (userData: unknown) =>
    apiPost('/auth/register', userData),

  logout: () => apiPost('/auth/logout', {}),

  // Add more endpoints as needed
}

export default api