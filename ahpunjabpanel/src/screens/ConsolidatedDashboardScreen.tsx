import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Lock } from 'lucide-react'
import * as api from '../utils/api'

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fmtNum(n: unknown) {
  if (n == null || n === '') return '—'
  return Number(n).toLocaleString('en-IN')
}

function fmtCurrency(n: unknown) {
  if (n == null || n === '') return '—'
  return '₹' + Number(n).toLocaleString('en-IN')
}

interface SummaryData {
  frozen?: boolean
  closedAt?: string
  totalFee?: number
  institutes?: unknown[]
  ai?: unknown[]
  opd?: unknown[]
  vaccinations?: unknown[]
}

export default function ConsolidatedDashboardScreen() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(currentMonth)
  const queryClient = useQueryClient()

  const { data: rollupData, isLoading, isError, error } = useQuery({
    queryKey: ['rollup', month],
    queryFn: () => api.getRollupSummary(month),
  })

  const summary = (rollupData?.data ?? {}) as SummaryData

  const closeMutation = useMutation({
    mutationFn: () => api.closePeriod(month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rollup'] })
      queryClient.invalidateQueries({ queryKey: ['approvalQueue'] })
    },
  })

  const [confirmClose, setConfirmClose] = useState(false)

  const handleClose = () => {
    if (!confirmClose) { setConfirmClose(true); return }
    closeMutation.mutate()
    setConfirmClose(false)
  }

  const aiRows = (summary.ai ?? []) as Array<{ semen_name: string; semen_code: string; total_ai_done: number; animals_covered: number }>
  const opdRows = (summary.opd ?? []) as Array<{ opd_type: string; case_category: string; total_cases: number; beneficiaries: number }>
  const vacRows = (summary.vaccinations ?? []) as Array<{ vaccine_name: string; doses_used: number; animals_vaccinated: number }>

  const totalAI = aiRows.reduce((sum, r) => sum + (Number(r.total_ai_done) || 0), 0)
  const totalOPD = opdRows.reduce((sum, r) => sum + (Number(r.total_cases) || 0), 0)
  const totalVac = vacRows.reduce((sum, r) => sum + (Number(r.doses_used) || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-gray-900">Consolidated Dashboard</h1>
          <div className="ml-auto flex items-center gap-3">
            {summary.frozen && (
              <span className="flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                <Lock size={11} /> Frozen
              </span>
            )}
            <label className="text-sm text-gray-500">Month</label>
            <input
              type="month"
              value={month}
              onChange={e => { setMonth(e.target.value); setConfirmClose(false) }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {isLoading && <div className="text-center py-12 text-gray-400 text-sm">Loading rollup…</div>}

        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {(error as Error).message}
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total AI', value: fmtNum(totalAI) },
                { label: 'Total OPD Cases', value: fmtNum(totalOPD) },
                { label: 'Vaccine Doses', value: fmtNum(totalVac) },
                { label: 'Total Fees', value: fmtCurrency(summary.totalFee) },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Frozen status */}
            {summary.frozen && summary.closedAt && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm text-indigo-800">
                Period closed on {new Date(summary.closedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}. Data is frozen.
              </div>
            )}

            {/* AI breakdown */}
            {aiRows.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700">AI Summary</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Semen Type</th>
                      <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">AI Done</th>
                      <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Animals Covered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {aiRows.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-700">{r.semen_name}</td>
                        <td className="px-4 py-2 text-right text-gray-900 font-medium">{fmtNum(r.total_ai_done)}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{fmtNum(r.animals_covered)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* OPD breakdown */}
            {opdRows.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700">OPD Summary</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Type</th>
                      <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Category</th>
                      <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Cases</th>
                      <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Beneficiaries</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {opdRows.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-700 capitalize">{r.opd_type}</td>
                        <td className="px-4 py-2 text-gray-600 capitalize">{r.case_category}</td>
                        <td className="px-4 py-2 text-right text-gray-900 font-medium">{fmtNum(r.total_cases)}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{fmtNum(r.beneficiaries)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Vaccination breakdown */}
            {vacRows.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700">Vaccination Summary</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Vaccine</th>
                      <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Doses</th>
                      <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Animals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {vacRows.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-700">{r.vaccine_name}</td>
                        <td className="px-4 py-2 text-right text-gray-900 font-medium">{fmtNum(r.doses_used)}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{fmtNum(r.animals_vaccinated)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Close period button */}
            {!summary.frozen && (
              <div className="flex items-center gap-3">
                {closeMutation.isError && (
                  <span className="text-sm text-red-600">{(closeMutation.error as Error).message}</span>
                )}
                <button
                  onClick={handleClose}
                  disabled={closeMutation.isPending}
                  className={`ml-auto px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                    confirmClose
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  } disabled:opacity-50`}
                >
                  <Lock size={15} />
                  {closeMutation.isPending ? 'Closing…' : confirmClose ? 'Confirm — Close Period' : 'Close Period'}
                </button>
                {confirmClose && (
                  <button onClick={() => setConfirmClose(false)} className="text-sm text-gray-500 hover:text-gray-700">
                    Cancel
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
