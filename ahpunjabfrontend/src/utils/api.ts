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

  // Admin: approve / reject a report from a sub-institute
  approveReport: (month: string, instituteId: number) =>
    apiRequest(`/reports/monthly/${month}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ instituteId }),
    }),

  rejectReport: (month: string, instituteId: number, reason: string) =>
    apiRequest(`/reports/monthly/${month}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ instituteId, reason }),
    }),

  // Admin: list pending reports across visible scope
  getApprovalQueue: (params?: { status?: string }) => {
    const q = new URLSearchParams()
    if (params?.status) q.append('status', params.status)
    return apiGet(`/admin/reports/queue${q.toString() ? `?${q}` : ''}`)
  },

  // Admin: registration queue
  getPendingRegistrations: () => apiGet('/admin/registrations'),
  approveRegistration: (registrationId: number, data: { userId: string; password: string; role: string; instituteId: number }) =>
    apiRequest(`/admin/registrations/${registrationId}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  rejectRegistration: (registrationId: number, reason: string) =>
    apiRequest(`/admin/registrations/${registrationId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Admin: user management
  listUsers: () => apiGet('/admin/users'),
  getUser: (staffId: number) => apiGet(`/admin/users/${staffId}`),
  updateUser: (staffId: number, data: unknown) =>
    apiRequest(`/admin/users/${staffId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deactivateUser: (staffId: number) =>
    apiRequest(`/admin/users/${staffId}/deactivate`, { method: 'POST', body: JSON.stringify({}) }),
  reactivateUser: (staffId: number) =>
    apiRequest(`/admin/users/${staffId}/reactivate`, { method: 'POST', body: JSON.stringify({}) }),

  // Consolidated rollup (admin)
  getRollupSummary: (params?: { month?: string; drill?: string }) => {
    const q = new URLSearchParams()
    if (params?.month) q.append('month', params.month)
    if (params?.drill) q.append('drill', params.drill)
    return apiGet(`/rollup/summary${q.toString() ? `?${q}` : ''}`)
  },
  getSubmissionStatus: (month: string) => apiGet(`/admin/reports/submission-status?month=${month}`),

  // Reporting periods
  listPeriods: () => apiGet('/periods'),
  createPeriod: (data: unknown) => apiPost('/periods', data),
  reopenPeriod: (month: string) =>
    apiRequest(`/periods/${month}/reopen`, { method: 'POST', body: JSON.stringify({}) }),
  lockPeriod: (month: string) =>
    apiRequest(`/periods/${month}/lock`, { method: 'POST', body: JSON.stringify({}) }),

  // Forgot password / reset password / change password
  forgotPassword: (email: string) => apiPost('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    apiPost('/auth/reset-password', { token, newPassword }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Institute CRUD (HQ_Admin+)
  listInstitutes: () => apiGet('/admin/institutes'),
  createInstitute: (data: {
    instituteName: string
    instituteType: string
    orgId?: string
    reportingAuthorityId?: number
    districtId?: number
    tehsilId?: number
    villageId?: number
  }) => apiPost('/admin/institutes', data),
  updateInstitute: (instituteId: number, data: {
    instituteName?: string
    instituteType?: string
    orgId?: string
    reportingAuthorityId?: number
  }) => apiRequest(`/admin/institutes/${instituteId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deactivateInstitute: (instituteId: number) =>
    apiRequest(`/admin/institutes/${instituteId}/deactivate`, { method: 'POST', body: JSON.stringify({}) }),
  reactivateInstitute: (instituteId: number) =>
    apiRequest(`/admin/institutes/${instituteId}/reactivate`, { method: 'POST', body: JSON.stringify({}) }),

  // Send reminder (replaces the handleSendReminder stub)
  sendReminder: (instituteId: number, month: string) =>
    apiPost('/admin/remind', { instituteId, month }),

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