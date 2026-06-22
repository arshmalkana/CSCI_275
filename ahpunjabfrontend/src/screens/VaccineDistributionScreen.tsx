import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { DatePickerInput } from '../components/Calendar'
import { PrimaryButton } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { SearchableSelect } from '../components/SearchableSelect'
import api from '../utils/api'

interface Vaccine {
  vaccine_id: number
  vaccine_code: string
  vaccine_name: string
}

interface VaccineStock {
  vaccine_id: number
  vaccine_code: string
  vaccine_name: string
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

export default function VaccineDistributionScreen() {
  const navigate = useNavigate()
  const [selectedVaccineName, setSelectedVaccineName] = useState('')
  const [selectedInstituteName, setSelectedInstituteName] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dosesIssued, setDosesIssued] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState('')

  const { data: vaccines = [] } = useQuery<Vaccine[]>({
    queryKey: ['distributionVaccines'],
    queryFn: () => api.getDistributionVaccines().then(unwrap<Vaccine>),
  })

  const { data: stock = [] } = useQuery<VaccineStock[]>({
    queryKey: ['myVaccineStock'],
    queryFn: () => api.getMyVaccineStock().then(unwrap<VaccineStock>),
  })

  const { data: institutes = [] } = useQuery<Institute[]>({
    queryKey: ['distributionInstitutes'],
    queryFn: () => api.getDistributionInstitutes().then(unwrap<Institute>),
  })

  const issueMutation = useMutation({
    mutationFn: api.issueVaccineDistribution,
    onSuccess: (res) => {
      const r = res as { transactionId: number; stockRemaining: number }
      setSuccessMsg(`Issued successfully. Remaining stock: ${r.stockRemaining} doses.`)
      setSelectedVaccineName('')
      setSelectedInstituteName('')
      setSelectedDate(null)
      setDosesIssued('')
      setBatchNumber('')
      setErrors({})
    },
    onError: (err: Error) => {
      setErrors({ submit: err.message })
    },
  })

  const selectedVaccine = vaccines.find(v => v.vaccine_name === selectedVaccineName) ?? null
  const selectedStockEntry = selectedVaccine ? stock.find(s => s.vaccine_id === selectedVaccine.vaccine_id) : null
  const currentStock = selectedStockEntry?.current_stock ?? null
  const selectedInstituteObj = institutes.find(i => i.institute_name === selectedInstituteName) ?? null

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {}
    if (!selectedVaccine) newErrors.vaccine = 'Please select a vaccine'
    if (!selectedDate) newErrors.date = 'Please select a distribution date'
    const doses = parseInt(dosesIssued)
    if (!dosesIssued || isNaN(doses) || doses <= 0) {
      newErrors.doses = 'Please enter a valid number of doses'
    } else if (currentStock !== null && doses > currentStock) {
      newErrors.doses = `Cannot exceed available stock (${currentStock} doses)`
    }
    if (!selectedInstituteObj) newErrors.institute = 'Please select an institute'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setSuccessMsg('')
    issueMutation.mutate({
      vaccineId: selectedVaccine!.vaccine_id,
      toInstituteId: selectedInstituteObj!.institute_id,
      dosesIssued: doses,
      transactionDate: selectedDate!.toISOString().slice(0, 10),
      batchNumber: batchNumber.trim() || undefined,
    })
  }

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
      <ScreenHeader title="Vaccine Distribution" onBack={() => navigate(-1)} />

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
              value={selectedVaccineName}
              onChange={(v) => { setSelectedVaccineName(v); setErrors(e => ({ ...e, vaccine: '' })) }}
              options={vaccines.map(v => v.vaccine_name)}
              placeholder="Select vaccine"
              error={errors.vaccine}
              withSearch={true}
            />
          </div>

          {selectedVaccine && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 font-['Poppins'] mb-2">
                Available Stock
              </label>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-2xl font-bold text-gray-900 font-['Poppins'] text-center">
                  {currentStock !== null ? `${currentStock} doses` : 'No stock recorded'}
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
              Number of Doses
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={dosesIssued}
              onChange={(e) => {
                const v = e.target.value
                if (v === '' || /^\d+$/.test(v)) {
                  setDosesIssued(v)
                  setErrors(er => ({ ...er, doses: '' }))
                }
              }}
              placeholder="Enter number of doses"
              className={`w-full px-4 py-3 border ${errors.doses ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-gray-50 text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200`}
            />
            {errors.doses && (
              <p className="text-sm text-red-600 font-['Poppins'] mt-1">{errors.doses}</p>
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
              placeholder="e.g. BN-2024-001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <div
        className="flex-shrink-0 px-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))', paddingTop: '1rem' }}
      >
        <PrimaryButton onClick={handleSubmit} disabled={issueMutation.isPending}>
          {issueMutation.isPending ? 'Issuing…' : 'Issue Vaccine'}
        </PrimaryButton>
      </div>
    </div>
  )
}
