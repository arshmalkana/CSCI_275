import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Plus, Lock, Unlock } from 'lucide-react'
import * as api from '../utils/api'
import type { Period } from '../utils/api'

function fmt(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function PeriodRow({ period, onLock, onReopen, isPending }: {
  period: Period
  onLock: () => void
  onReopen: () => void
  isPending: boolean
}) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 font-medium text-gray-900 text-sm">{period.reportingMonth}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{fmt(period.opensAt)}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{fmt(period.deadline)}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{fmt(period.closesAt)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
          period.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {period.isLocked ? <><Lock size={10} /> Locked</> : <><Unlock size={10} /> Open</>}
        </span>
      </td>
      <td className="px-4 py-3">
        {period.isLocked ? (
          <button
            onClick={onReopen}
            disabled={isPending}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100 text-gray-700 disabled:opacity-50 transition-colors"
          >
            Reopen
          </button>
        ) : (
          <button
            onClick={onLock}
            disabled={isPending}
            className="text-xs px-3 py-1.5 bg-red-50 border border-red-200 rounded hover:bg-red-100 text-red-700 disabled:opacity-50 transition-colors"
          >
            Lock
          </button>
        )}
      </td>
    </tr>
  )
}

export default function PeriodManagementScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['periods'],
    queryFn: () => api.listPeriods(),
  })

  const periods = data?.data ?? []

  const lockMutation = useMutation({
    mutationFn: (month: string) => api.lockPeriod(month),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['periods'] }),
  })

  const reopenMutation = useMutation({
    mutationFn: (month: string) => api.reopenPeriod(month),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['periods'] }),
  })

  // Create period form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ reportingMonth: '', opensAt: '', deadline: '' })
  const [formError, setFormError] = useState('')

  const createMutation = useMutation({
    mutationFn: () => api.createPeriod({
      reportingMonth: form.reportingMonth,
      opensAt: new Date(form.opensAt).toISOString(),
      deadline: new Date(form.deadline).toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] })
      setShowForm(false)
      setForm({ reportingMonth: '', opensAt: '', deadline: '' })
      setFormError('')
    },
    onError: (err: Error) => setFormError(err.message),
  })

  const handleCreate = () => {
    if (!form.reportingMonth || !form.opensAt || !form.deadline) {
      setFormError('All fields are required')
      return
    }
    setFormError('')
    createMutation.mutate()
  }

  const actionPending = lockMutation.isPending || reopenMutation.isPending

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-gray-900">Period Management</h1>
          <button
            onClick={() => setShowForm(f => !f)}
            className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} /> Add Period
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Create period form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">New Reporting Period</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Month (YYYY-MM)</label>
                <input
                  type="month"
                  value={form.reportingMonth}
                  onChange={e => setForm(f => ({ ...f, reportingMonth: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Opens At</label>
                <input
                  type="datetime-local"
                  value={form.opensAt}
                  onChange={e => setForm(f => ({ ...f, opensAt: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Deadline</label>
                <input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {formError && <p className="text-xs text-red-600 mt-2">{formError}</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? 'Creating…' : 'Create Period'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Mutation errors */}
        {(lockMutation.isError || reopenMutation.isError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {(lockMutation.error as Error | null)?.message ?? (reopenMutation.error as Error | null)?.message}
          </div>
        )}

        {isLoading && <div className="text-center py-12 text-gray-400 text-sm">Loading periods…</div>}

        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {(error as Error).message}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Month</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Opens</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Deadline</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Closes</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {periods.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No periods configured.</td></tr>
                )}
                {periods.map(p => (
                  <PeriodRow
                    key={p.periodId}
                    period={p}
                    onLock={() => lockMutation.mutate(p.reportingMonth)}
                    onReopen={() => reopenMutation.mutate(p.reportingMonth)}
                    isPending={actionPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
