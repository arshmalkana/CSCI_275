import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { DatePickerInput } from '../components/Calendar'
import { PrimaryButton } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { SearchableSelect } from '../components/SearchableSelect'
import api from '../utils/api'

interface SemenType {
  semen_id: number
  semen_code: string
  semen_name: string
}

interface SemenStock {
  semen_type_id: number
  semen_code: string
  semen_name: string
  current_stock: number
}

interface Institute {
  institute_id: number
  institute_name: string
  org_id: string
  institute_type: string
}

function unwrap<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  const r = res as { data?: T[] }
  return r.data ?? []
}

export default function SemenDistributionScreen() {
  const navigate = useNavigate()
  const [selectedSemenName, setSelectedSemenName] = useState('')
  const [selectedInstituteName, setSelectedInstituteName] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [strawsIssued, setStrawsIssued] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState<Date | null>(null)
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState('')

  const { data: semenTypes = [] } = useQuery<SemenType[]>({
    queryKey: ['semenTypes'],
    queryFn: () => api.getSemenTypes().then(unwrap<SemenType>),
  })

  const { data: stock = [] } = useQuery<SemenStock[]>({
    queryKey: ['mySemenStock'],
    queryFn: () => api.getMySemenStock().then(unwrap<SemenStock>),
  })

  const { data: institutes = [] } = useQuery<Institute[]>({
    queryKey: ['semenReceivingInstitutes'],
    queryFn: () => api.getSemenReceivingInstitutes().then(unwrap<Institute>),
  })

  const issueMutation = useMutation({
    mutationFn: api.issueSemenDistribution,
    onSuccess: (res) => {
      const r = res as { transactionId: number; stockRemaining: number }
      setSuccessMsg(`Issued successfully. Remaining stock: ${r.stockRemaining} straws.`)
      setSelectedSemenName('')
      setSelectedInstituteName('')
      setSelectedDate(null)
      setStrawsIssued('')
      setBatchNumber('')
      setExpiryDate(null)
      setNotes('')
      setErrors({})
    },
    onError: (err: Error) => {
      setErrors({ submit: err.message })
    },
  })

  const selectedSemenType = semenTypes.find(s => s.semen_name === selectedSemenName) ?? null
  const selectedStockEntry = selectedSemenType ? stock.find(s => s.semen_type_id === selectedSemenType.semen_id) : null
  const currentStock = selectedStockEntry?.current_stock ?? null
  const selectedInstituteObj = institutes.find(i => i.institute_name === selectedInstituteName) ?? null

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {}
    if (!selectedSemenType) newErrors.semenType = 'Please select a semen type'
    if (!selectedDate) newErrors.date = 'Please select a distribution date'
    const straws = parseInt(strawsIssued)
    if (!strawsIssued || isNaN(straws) || straws <= 0) {
      newErrors.straws = 'Please enter a valid number of straws'
    } else if (currentStock !== null && straws > currentStock) {
      newErrors.straws = `Cannot exceed available stock (${currentStock} straws)`
    }
    if (!selectedInstituteObj) newErrors.institute = 'Please select an institute'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setSuccessMsg('')
    issueMutation.mutate({
      semenTypeId: selectedSemenType!.semen_id,
      toInstituteId: selectedInstituteObj!.institute_id,
      strawsIssued: straws,
      transactionDate: selectedDate!.toISOString().slice(0, 10),
      batchNumber: batchNumber.trim() || undefined,
      expiryDate: expiryDate ? expiryDate.toISOString().slice(0, 10) : undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
      <ScreenHeader title="Semen Distribution" onBack={() => navigate(-1)} />

      <div
        className="flex-1 overflow-y-auto px-6"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        <div className="space-y-4 pb-32 pt-4">
          {successMsg && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-['Poppins']">
              {successMsg}
            </div>
          )}

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-['Poppins']">
              {errors.submit}
            </div>
          )}

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <SearchableSelect
              value={selectedSemenName}
              onChange={(v) => { setSelectedSemenName(v); setErrors(e => ({ ...e, semenType: '' })) }}
              options={semenTypes.map(s => s.semen_name)}
              placeholder="Select semen type"
              error={errors.semenType}
              withSearch={true}
            />
          </div>

          {selectedSemenType && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 font-['Poppins'] mb-2">
                Available Stock
              </label>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-2xl font-bold text-gray-900 font-['Poppins'] text-center">
                  {currentStock !== null ? `${currentStock} straws` : 'No stock recorded'}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <DatePickerInput
              label="Distribution Date"
              placeholderText="Select date"
              required={false}
              onDateChange={(d) => { setSelectedDate(d); setErrors(e => ({ ...e, date: '' })) }}
              initialDate={selectedDate}
            />
            {errors.date && (
              <p className="text-sm text-red-600 font-['Poppins'] mt-1">{errors.date}</p>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <SearchableSelect
              value={selectedInstituteName}
              onChange={(v) => { setSelectedInstituteName(v); setErrors(e => ({ ...e, institute: '' })) }}
              options={institutes.map(i => i.institute_name)}
              placeholder="Issued to institute"
              error={errors.institute}
              withSearch={true}
            />
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 font-['Poppins'] mb-2">
              Number of Straws
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={strawsIssued}
              onChange={(e) => {
                const v = e.target.value
                if (v === '' || /^\d+$/.test(v)) {
                  setStrawsIssued(v)
                  setErrors(er => ({ ...er, straws: '' }))
                }
              }}
              placeholder="Enter number of straws"
              className={`w-full px-4 py-3 border ${errors.straws ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-gray-50 text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200`}
            />
            {errors.straws && (
              <p className="text-sm text-red-600 font-['Poppins'] mt-1">{errors.straws}</p>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 font-['Poppins'] mb-2">
              Batch Number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g. SB-2026-001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <DatePickerInput
              label="Expiry Date"
              placeholderText="Select expiry date (optional)"
              required={false}
              onDateChange={(d) => setExpiryDate(d)}
              initialDate={expiryDate}
            />
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 font-['Poppins'] mb-2">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes"
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>
        </div>
      </div>

      <div
        className="flex-shrink-0 px-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))', paddingTop: '1rem' }}
      >
        <PrimaryButton onClick={handleSubmit} disabled={issueMutation.isPending}>
          {issueMutation.isPending ? 'Issuing…' : 'Issue Semen'}
        </PrimaryButton>
      </div>
    </div>
  )
}
