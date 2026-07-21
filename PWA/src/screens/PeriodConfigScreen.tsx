import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AlertCircle, Lock, Unlock, Plus } from 'lucide-react'
import api from '../utils/api'

interface Period {
  periodId: number
  reportingMonth: string
  opensAt: string
  deadline: string
  closesAt: string | null
  isLocked: boolean
  lockedAt: string | null
  createdAt: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function PeriodConfigScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ reportingMonth: '', opensAt: '', deadline: '' })
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const { data: periods = [], isLoading, error } = useQuery<Period[]>({
    queryKey: ['periods'],
    queryFn: async () => {
      const res = await api.listPeriods() as { data?: Period[] } | Period[]
      return (Array.isArray(res) ? res : (res as { data?: Period[] }).data) ?? []
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.createPeriod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] })
      setShowForm(false)
      setForm({ reportingMonth: '', opensAt: '', deadline: '' })
      showToast('Period saved')
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  })

  const lockMutation = useMutation({
    mutationFn: (month: string) => api.lockPeriod(month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] })
      showToast('Period locked')
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  })

  const reopenMutation = useMutation({
    mutationFn: (month: string) => api.reopenPeriod(month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] })
      showToast('Period reopened')
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  })

  const handleReopenOrLock = (period: Period) => {
    if (period.isLocked) {
      reopenMutation.mutate(period.reportingMonth)
    } else {
      lockMutation.mutate(period.reportingMonth)
    }
  }

  const isFormValid = form.reportingMonth && form.opensAt && form.deadline

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 pt-safe-top pb-4">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-white/20">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-lg font-bold font-['Poppins']">Period Config</h1>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Create form */}
        {showForm && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4 space-y-3">
            <h3 className="text-sm font-semibold text-yellow-800">New / Update Period</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Reporting Month</label>
                <input
                  type="month"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  value={form.reportingMonth}
                  onChange={e => setForm(f => ({ ...f, reportingMonth: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Opens At</label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  value={form.opensAt}
                  onChange={e => setForm(f => ({ ...f, opensAt: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Deadline</label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
              >
                Cancel
              </button>
              <button
                disabled={!isFormValid || createMutation.isPending}
                onClick={() => createMutation.mutate({
                  ...form,
                  opensAt: new Date(form.opensAt).toISOString(),
                  deadline: new Date(form.deadline).toISOString(),
                })}
                className="flex-1 py-2 rounded-xl bg-yellow-500 text-white text-sm font-semibold disabled:opacity-50"
              >
                {createMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{(error as Error).message}</p>
          </div>
        )}

        <div className="space-y-3 pb-8">
          {periods.map(p => (
            <div key={p.periodId} className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-gray-800">{p.reportingMonth}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  p.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {p.isLocked ? 'Locked' : 'Open'}
                </span>
              </div>
              <p className="text-xs text-gray-500">Opens: {fmtDate(p.opensAt)}</p>
              <p className="text-xs text-gray-500">Deadline: {fmtDate(p.deadline)}</p>
              {p.closesAt && <p className="text-xs text-gray-500">Closed: {fmtDate(p.closesAt)}</p>}
              <button
                onClick={() => handleReopenOrLock(p)}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold ${
                  p.isLocked
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {p.isLocked ? <><Unlock size={14} /> Reopen</> : <><Lock size={14} /> Lock</>}
              </button>
            </div>
          ))}

          {!isLoading && periods.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No periods configured. Use + to add one.
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
