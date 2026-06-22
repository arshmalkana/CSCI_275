import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, AlertCircle, ChevronDown, ChevronRight, Download } from 'lucide-react'
import api from '../utils/api'

interface InstituteStatus {
  institute_id: number
  org_id: string
  institute_name: string
  institute_type: string
  district_name: string
  tehsil_name: string
  status: string
  submitted_at: string | null
}

interface RollupData {
  month: string
  scope: { instituteCount: number; drill: number | null }
  institutes: InstituteStatus[]
  opd: { opd_type: string; case_category: string; total_cases: string; beneficiaries: string }[]
  ai: { semen_code: string; semen_name: string; species: string; total_ai_done: string; animals_covered: string }[]
  vaccinations: { vaccine_code: string; vaccine_name: string; doses_used: string; animals_vaccinated: string }[]
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Approved:  'bg-green-100 text-green-700',
    Submitted: 'bg-yellow-100 text-yellow-700',
    Rejected:  'bg-red-100 text-red-700',
    Missing:   'bg-gray-100 text-gray-500',
  }
  return map[status] || 'bg-gray-100 text-gray-500'
}

export default function ConsolidatedDashboardScreen() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [drill, setDrill] = useState<string | null>(null)
  const [showOPD, setShowOPD] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showVac, setShowVac] = useState(false)
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null)
  const [exportError, setExportError] = useState('')

  const handleExport = async (format: 'pdf' | 'csv') => {
    setExporting(format)
    setExportError('')
    try {
      const blob = await api.downloadExport({ month, format, drill: drill || undefined })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rollup-${month}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError((err as Error).message || 'Export failed')
    } finally {
      setExporting(null)
    }
  }

  const { data, isLoading, error } = useQuery<RollupData>({
    queryKey: ['rollup', month, drill],
    queryFn: () => api.getRollupSummary({ month, ...(drill ? { drill } : {}) }) as Promise<RollupData>,
  })

  const submitted  = data?.institutes.filter(i => i.status === 'Submitted').length  ?? 0
  const approved   = data?.institutes.filter(i => i.status === 'Approved').length   ?? 0
  const missing    = data?.institutes.filter(i => i.status === 'Missing').length     ?? 0
  const total      = data?.institutes.length ?? 0

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 pt-safe-top pb-4">
        <div className="flex items-center gap-3 pt-4">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-white/20">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-lg font-bold font-['Poppins']">Consolidated Dashboard</h1>
            <p className="text-xs text-yellow-100">
              {data ? `${data.scope.instituteCount} institutes` : 'Loading…'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <input
            type="month"
            value={month}
            onChange={e => { setMonth(e.target.value); setDrill(null) }}
            className="flex-1 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white/90 focus:outline-none"
          />
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null || !data}
            title="Export PDF"
            className="flex items-center gap-1 px-3 py-2 bg-white/90 text-gray-800 rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-white transition-colors"
          >
            <Download size={13} />
            {exporting === 'pdf' ? '…' : 'PDF'}
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting !== null || !data}
            title="Export CSV"
            className="flex items-center gap-1 px-3 py-2 bg-white/90 text-gray-800 rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-white transition-colors"
          >
            <Download size={13} />
            {exporting === 'csv' ? '…' : 'CSV'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
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
        {exportError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-3">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{exportError}</p>
          </div>
        )}

        {data && (
          <>
            {/* Drill-back breadcrumb */}
            {drill && (
              <button
                onClick={() => setDrill(null)}
                className="flex items-center gap-1 text-sm text-yellow-600 font-medium"
              >
                <ArrowLeft size={14} /> All institutes
              </button>
            )}

            {/* Submission summary cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Submitted', count: submitted, color: 'text-yellow-600' },
                { label: 'Approved',  count: approved,  color: 'text-green-600' },
                { label: 'Missing',   count: missing,   color: 'text-gray-500' },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Institute list */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                Institutes ({total})
              </h2>
              <div className="space-y-2">
                {data.institutes.map(inst => (
                  <button
                    key={inst.institute_id}
                    onClick={() => setDrill(String(inst.institute_id))}
                    className="w-full flex items-center justify-between bg-gray-50 rounded-xl px-3 py-3 hover:bg-yellow-50 transition-colors"
                  >
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{inst.institute_name}</p>
                      <p className="text-xs text-gray-500">{inst.district_name} › {inst.tehsil_name}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(inst.status)}`}>
                        {inst.status}
                      </span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* OPD Summary */}
            {data.opd.length > 0 && (
              <div className="bg-gray-50 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowOPD(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <span className="text-sm font-semibold text-gray-700">OPD Summary</span>
                  {showOPD ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {showOPD && (
                  <div className="px-4 pb-3 space-y-1">
                    {data.opd.map((row, i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-600 py-1 border-t border-gray-100">
                        <span>{row.opd_type} / {row.case_category}</span>
                        <span className="font-medium">{Number(row.total_cases).toLocaleString()} cases</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Summary */}
            {data.ai.length > 0 && (
              <div className="bg-gray-50 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowAI(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <span className="text-sm font-semibold text-gray-700">AI Summary</span>
                  {showAI ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {showAI && (
                  <div className="px-4 pb-3 space-y-1">
                    {data.ai.map((row, i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-600 py-1 border-t border-gray-100">
                        <span>{row.semen_name} ({row.species})</span>
                        <span className="font-medium">{Number(row.total_ai_done).toLocaleString()} AI</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vaccination Summary */}
            {data.vaccinations.length > 0 && (
              <div className="bg-gray-50 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowVac(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <span className="text-sm font-semibold text-gray-700">Vaccination Summary</span>
                  {showVac ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {showVac && (
                  <div className="px-4 pb-3 space-y-1">
                    {data.vaccinations.map((row, i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-600 py-1 border-t border-gray-100">
                        <span>{row.vaccine_name}</span>
                        <span className="font-medium">{Number(row.animals_vaccinated).toLocaleString()} animals</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="pb-8" />
      </div>
    </div>
  )
}
