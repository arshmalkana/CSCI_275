import apiClient from './apiClient'

const BASE = apiClient.getBaseUrl()

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await apiClient.fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error((body as { message?: string }).message || `HTTP ${res.status}`)
    ;(err as Error & { statusCode: number }).statusCode = res.status
    throw err
  }
  return res.json()
}

const get  = (path: string) => apiFetch(path)
const post = (path: string, body?: unknown) => apiFetch(path, { method: 'POST', body: JSON.stringify(body ?? {}) })
const patch = (path: string, body?: unknown) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) })

// ── Approval queue ─────────────────────────────────────────────────────────────

export interface SectionStatus {
  section: string
  status: string
  reason: string | null
}

export interface QueueEntry {
  report_id: number
  reporting_month: string
  submission_status: string
  submitted_at: string | null
  admin_comment: string | null
  institute_id: number
  org_id: string
  institute_name: string
  institute_type: string
  district_name: string | null
  tehsil_name: string | null
  prepared_by_name: string
  prepared_by_designation: string
  section_statuses: SectionStatus[]
}

export function getApprovalQueue(month?: string, status?: string): Promise<{ success: boolean; data: QueueEntry[]; count: number }> {
  const params = new URLSearchParams()
  if (month) params.set('month', month)
  if (status) params.set('status', status)
  const qs = params.toString()
  return get(`/admin/reports/queue${qs ? '?' + qs : ''}`)
}

export function getSubmissionStatus(month: string): Promise<{ success: boolean; data: unknown[] }> {
  return get(`/admin/reports/submission-status?month=${month}`)
}

export function approveSections(month: string, instituteId: number, sections: string[]): Promise<unknown> {
  return patch(`/reports/monthly/${month}/approve-sections`, { instituteId, sections })
}

export function rejectSection(month: string, instituteId: number, section: string, reason: string): Promise<unknown> {
  return patch(`/reports/monthly/${month}/reject-section`, { instituteId, section, reason })
}

export function closePeriod(month: string): Promise<unknown> {
  return post(`/reports/monthly/${month}/close-period`)
}

// ── Rollup ─────────────────────────────────────────────────────────────────────

export function getRollupSummary(month?: string): Promise<{ success: boolean; data: unknown }> {
  const qs = month ? `?month=${month}` : ''
  return get(`/rollup/summary${qs}`)
}

// ── Periods ────────────────────────────────────────────────────────────────────

export interface Period {
  periodId: number
  reportingMonth: string
  opensAt: string | null
  deadline: string | null
  closesAt: string | null
  isLocked: boolean
  lockedAt: string | null
  createdAt: string
}

export function listPeriods(): Promise<{ success: boolean; data: Period[] }> {
  return get('/periods/')
}

export function createPeriod(data: {
  reportingMonth: string
  opensAt: string
  deadline: string
  closesAt?: string
}): Promise<unknown> {
  return post('/periods/', data)
}

export function lockPeriod(month: string): Promise<unknown> {
  return post(`/periods/${month}/lock`)
}

export function reopenPeriod(month: string): Promise<unknown> {
  return post(`/periods/${month}/reopen`)
}

// ── Admin users / registrations ────────────────────────────────────────────────

export function getPendingRegistrations(): Promise<{ success: boolean; data: unknown[] }> {
  return get('/admin/registrations')
}

export function approveRegistration(id: number, body: {
  userId: string; password: string; role: string; instituteId: number
}): Promise<unknown> {
  return post(`/admin/registrations/${id}/approve`, body)
}

export function rejectRegistration(id: number, reason: string): Promise<unknown> {
  return post(`/admin/registrations/${id}/reject`, { reason })
}

export function listUsers(): Promise<{ success: boolean; data: unknown[] }> {
  return get('/admin/users')
}

// ── Institutes ─────────────────────────────────────────────────────────────────

export function listInstitutes(): Promise<{ success: boolean; data: unknown[] }> {
  return get('/admin/institutes')
}
