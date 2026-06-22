import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BackHeader } from '../components/Headers'
import { PrimaryButton } from '../components/Button'
import api from '../utils/api'

interface Institute {
  institute_id: number
  institute_name: string
  institute_type: string
}

interface Target {
  target_id: number
  target_type: 'OPD' | 'AI_Cattle' | 'AI_Buffalo' | 'Vaccine'
  vaccine_id: number | null
  vaccine_name: string | null
  annual_target: number
  effective_from: string
  effective_until: string | null
  financial_year: string
}

const TARGET_TYPES: Array<{ key: 'OPD' | 'AI_Cattle' | 'AI_Buffalo'; label: string }> = [
  { key: 'OPD',        label: 'OPD (Cases)' },
  { key: 'AI_Cattle',  label: 'AI — Cattle' },
  { key: 'AI_Buffalo', label: 'AI — Buffalo' },
]

function currentFinancialYear(): string {
  const now = new Date()
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return `${year}-${String(year + 1).slice(-2)}`
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function TargetsScreen() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [selectedInstituteId, setSelectedInstituteId] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  const [financialYear, setFinancialYear] = useState(currentFinancialYear())
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const { data: institutes = [], isLoading: institutesLoading } = useQuery({
    queryKey: ['institutes'],
    queryFn: () => api.listInstitutes() as Promise<Institute[]>
  })

  const { data: targets = [], isLoading: targetsLoading } = useQuery({
    queryKey: ['targets', selectedInstituteId],
    queryFn: () => api.getTargetsForInstitute(selectedInstituteId!) as Promise<Target[]>,
    enabled: selectedInstituteId !== null
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const promises = TARGET_TYPES
        .filter(t => editForm[t.key] !== undefined && editForm[t.key] !== '')
        .map(t =>
          api.setTarget({
            instituteId: selectedInstituteId!,
            targetType: t.key,
            annualTarget: parseInt(editForm[t.key]),
            effectiveFrom: todayISO(),
            financialYear
          })
        )
      await Promise.all(promises)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['targets', selectedInstituteId] })
      setDirty(false)
      showToast('Targets saved')
    },
    onError: (err: Error) => showToast(err.message)
  })

  const handleInstituteChange = (id: number) => {
    setSelectedInstituteId(id)
    setEditForm({})
    setDirty(false)
  }

  const getActiveTarget = (type: string): number | null => {
    const match = targets.find(t => t.target_type === type)
    return match ? match.annual_target : null
  }

  const handleFieldChange = (key: string, value: string) => {
    setEditForm(p => ({ ...p, [key]: value }))
    setDirty(true)
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-4">
        <BackHeader title="Institute Targets" onBack={() => navigate('/home')} />
      </div>

      {toast && (
        <div className="mx-4 mt-2 px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg text-sm text-yellow-800 font-['Poppins']">
          {toast}
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto px-4 pb-4"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        {/* Institute selector */}
        <div className="mt-4 mb-4">
          <label className="text-xs text-gray-500 font-['Poppins'] mb-1 block">Select Institute</label>
          {institutesLoading ? (
            <p className="text-sm text-gray-400 font-['Poppins']">Loading institutes…</p>
          ) : (
            <select
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm font-['Poppins'] bg-white"
              value={selectedInstituteId ?? ''}
              onChange={e => handleInstituteChange(parseInt(e.target.value))}
            >
              <option value="">— choose an institute —</option>
              {institutes.map(i => (
                <option key={i.institute_id} value={i.institute_id}>
                  {i.institute_name} ({i.institute_type})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Financial year */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 font-['Poppins'] mb-1 block">Financial Year</label>
          <input
            type="text"
            placeholder="e.g. 2025-26"
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm font-['Poppins']"
            value={financialYear}
            onChange={e => setFinancialYear(e.target.value)}
          />
        </div>

        {selectedInstituteId === null && (
          <div className="text-center py-16">
            <p className="text-gray-400 font-['Poppins'] text-sm">Select an institute above to view and set targets</p>
          </div>
        )}

        {selectedInstituteId !== null && targetsLoading && (
          <p className="text-center text-gray-500 py-8 font-['Poppins']">Loading targets…</p>
        )}

        {selectedInstituteId !== null && !targetsLoading && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 font-['Poppins']">Annual Targets</h3>

            {TARGET_TYPES.map(t => {
              const current = getActiveTarget(t.key)
              const inputVal = editForm[t.key] !== undefined ? editForm[t.key] : (current !== null ? String(current) : '')
              return (
                <div key={t.key} className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-800 font-['Poppins']">{t.label}</p>
                    {current !== null && (
                      <span className="text-xs text-gray-500 font-['Poppins']">Current: {current.toLocaleString()}</span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Annual target"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-['Poppins']"
                    value={inputVal}
                    onChange={e => handleFieldChange(t.key, e.target.value)}
                  />
                </div>
              )
            })}

            {targets.length === 0 && !dirty && (
              <p className="text-center text-gray-400 text-sm font-['Poppins'] py-2">
                No targets set yet for this institute
              </p>
            )}
          </div>
        )}
      </div>

      {/* Save button — only shown when an institute is selected */}
      {selectedInstituteId !== null && (
        <div
          className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-gray-100"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <PrimaryButton
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !dirty}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Targets'}
          </PrimaryButton>
        </div>
      )}
    </div>
  )
}
