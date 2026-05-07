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
  // Only set Content-Type header if there's a body
  const headers: HeadersInit = options.body
    ? {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    : {
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

  // Profile
  getProfile: () => apiGet('/profile'),

  updateProfile: (updates: {
    fullName?: string
    mobile?: string
    email?: string
    whatsappNumber?: string
    dateOfBirth?: string
  }) => apiPut('/profile', updates),

  updateLocation: (location: { latitude: number; longitude: number }) =>
    apiPut('/profile/location', location),

  uploadProfilePicture: (pictureUrl: string) =>
    apiPost('/profile/picture', { pictureUrl }),

  // Monthly Reports
  getFiscalYears: () =>
    apiGet<string[]>('/reports/fiscal-years'),

  listMonthlyReports: (filters?: { status?: string; year?: string; fiscalYear?: string }) => {
    const queryParams = new URLSearchParams()
    if (filters?.status) queryParams.append('status', filters.status)
    if (filters?.year) queryParams.append('year', filters.year)
    if (filters?.fiscalYear) queryParams.append('fiscalYear', filters.fiscalYear)

    const queryString = queryParams.toString()
    return apiGet(`/reports/monthly${queryString ? `?${queryString}` : ''}`)
  },

  submitMonthlyReport: (reportData: unknown) =>
    apiPost('/reports/monthly', reportData),

  getMonthlyReport: (month: string) =>
    apiGet(`/reports/monthly/${month}`),

  // Download monthly report PDF (returns a Blob for saving to disk)
  downloadReportPDF: async (month: string): Promise<Blob> => {
    const url = `${apiClient.getBaseUrl()}/reports/monthly/${month}/pdf`
    const response = await apiClient.fetch(url, { method: 'GET' })
    if (!response.ok) throw new Error(`PDF download failed: ${response.statusText}`)
    return response.blob()
  },

  // NOTE: getReportDetails removed for security - use getMonthlyReport instead
  // Numeric IDs are sequential and expose internal database structure

  // Notifications
  getNotifications: (params?: { limit?: number; offset?: number; unreadOnly?: boolean }) => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true')

    const queryString = queryParams.toString()
    return apiGet(`/notifications${queryString ? `?${queryString}` : ''}`)
  },

  getUnreadCount: () =>
    apiGet<{ count: number }>('/notifications/unread-count'),

  markNotificationAsRead: (notificationId: number) =>
    apiRequest(`/notifications/${notificationId}/read`, { method: 'PATCH' }),

  markAllNotificationsAsRead: () =>
    apiRequest('/notifications/read-all', { method: 'PATCH' }),

  deleteNotification: (notificationId: number) =>
    apiDelete(`/notifications/${notificationId}`),

  // Push Notifications
  getVapidPublicKey: () =>
    apiGet('/push/vapid-public-key'),

  subscribePush: (subscription: unknown) =>
    apiPost('/push/subscribe', { subscription }),

  unsubscribePush: (endpoint: string) =>
    apiPost('/push/unsubscribe', { endpoint }),

  sendTestPush: () =>
    apiPost('/push/test', {})
}

export default api