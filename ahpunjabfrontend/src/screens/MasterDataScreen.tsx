import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BackHeader } from '../components/Headers'
import { PrimaryButton } from '../components/Button'
import { FloatingLabelField } from '../components/FloatingLabelField'
import api from '../utils/api'

type Tab = 'charges' | 'semen' | 'vaccines'

interface ServiceCharge {
  charge_id: number
  service_code: string
  service_name: string
  category: string
  current_rate: number
  effective_from: string
  is_active: boolean
}

interface SemenType {
  semen_id: number
  semen_code: string
  semen_name: string
  species: string
  semen_category: string
  is_active: boolean
}

interface Vaccine {
  vaccine_id: number
  vaccine_code: string
  vaccine_name: string
  service_charge_id: number | null
  charge_name: string | null
  is_active: boolean
}

const SPECIES = ['Cattle', 'Buffalo']
const CATEGORIES = ['OPD', 'AI', 'Certificate', 'Vaccine', 'Other']

function Toast({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div className="mx-4 mt-2 px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg text-sm text-yellow-800 font-['Poppins']">
      {msg}
    </div>
  )
}

// ── Service Charges Tab ───────────────────────────────────────────────────────

function ChargesTab() {
  const qc = useQueryClient()
  const [toast, setToast] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [rateModal, setRateModal] = useState<ServiceCharge | null>(null)
  const [createForm, setCreateForm] = useState({ serviceCode: '', serviceName: '', category: 'OPD', currentRate: '' })
  const [rateForm, setRateForm] = useState({ newRate: '', effectiveMonth: new Date().toISOString().slice(0, 7) })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const { data: charges = [], isLoading, error } = useQuery({
    queryKey: ['serviceCharges'],
    queryFn: () => api.listServiceCharges() as Promise<ServiceCharge[]>
  })

  const createMutation = useMutation({
    mutationFn: () => api.createServiceCharge({
      serviceCode: createForm.serviceCode,
      serviceName: createForm.serviceName,
      category: createForm.category,
      currentRate: parseFloat(createForm.currentRate)
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['serviceCharges'] })
      setShowCreate(false)
      setCreateForm({ serviceCode: '', serviceName: '', category: 'OPD', currentRate: '' })
      showToast('Service charge created')
    },
    onError: (err: Error) => showToast(err.message)
  })

  const rateMutation = useMutation({
    mutationFn: (charge: ServiceCharge) =>
      api.updateServiceChargeRate(charge.charge_id, {
        newRate: parseFloat(rateForm.newRate),
        effectiveMonth: rateForm.effectiveMonth
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['serviceCharges'] })
      setRateModal(null)
      showToast('Rate updated')
    },
    onError: (err: Error) => showToast(err.message)
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? api.activateServiceCharge(id) : api.deactivateServiceCharge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['serviceCharges'] })
      showToast('Status updated')
    },
    onError: (err: Error) => showToast(err.message)
  })

  const openRateModal = (charge: ServiceCharge) => {
    setRateForm({ newRate: String(charge.current_rate), effectiveMonth: new Date().toISOString().slice(0, 7) })
    setRateModal(charge)
  }

  const active = charges.filter(c => c.is_active)
  const inactive = charges.filter(c => !c.is_active)

  return (
    <div className="space-y-3">
      <Toast msg={toast} />

      <PrimaryButton onClick={() => setShowCreate(!showCreate)}>
        {showCreate ? 'Cancel' : '+ Add Charge'}
      </PrimaryButton>

      {showCreate && (
        <div className="border border-yellow-200 rounded-xl p-4 bg-yellow-50 space-y-3">
          <h3 className="font-semibold text-gray-800 font-['Poppins']">New Service Charge</h3>
          <FloatingLabelField field="serviceCode" label="Code (e.g. OPD_LARGE)" value={createForm.serviceCode}
            onChange={(_, v) => setCreateForm(p => ({ ...p, serviceCode: v }))} required />
          <FloatingLabelField field="serviceName" label="Name" value={createForm.serviceName}
            onChange={(_, v) => setCreateForm(p => ({ ...p, serviceName: v }))} required />
          <div>
            <label className="text-xs text-gray-500 font-['Poppins']">Category</label>
            <select className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-['Poppins']"
              value={createForm.category} onChange={e => setCreateForm(p => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <FloatingLabelField field="currentRate" label="Rate (₹)" value={createForm.currentRate}
            onChange={(_, v) => setCreateForm(p => ({ ...p, currentRate: v }))} required />
          <PrimaryButton onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !createForm.serviceCode || !createForm.serviceName || !createForm.currentRate}>
            {createMutation.isPending ? 'Creating…' : 'Create'}
          </PrimaryButton>
        </div>
      )}

      {isLoading && <p className="text-center text-gray-500 py-6 font-['Poppins']">Loading…</p>}
      {error && <p className="text-center text-red-500 py-6 font-['Poppins']">Failed to load</p>}

      {active.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 font-['Poppins'] mb-2">Active ({active.length})</p>
          {active.map(charge => (
            <div key={charge.charge_id} className="border border-gray-200 rounded-xl p-3 mb-2 bg-white">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 font-['Poppins']">{charge.service_name}</p>
                  <p className="text-xs text-gray-500 font-['Poppins']">{charge.service_code} · {charge.category}</p>
                  <p className="text-base font-bold text-yellow-600 font-['Poppins']">₹{charge.current_rate}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => openRateModal(charge)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-lg font-['Poppins']">
                    Rate
                  </button>
                  <button onClick={() => toggleMutation.mutate({ id: charge.charge_id, active: false })}
                    disabled={toggleMutation.isPending}
                    className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded-lg font-['Poppins']">
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 font-['Poppins'] mb-2">Inactive ({inactive.length})</p>
          {inactive.map(charge => (
            <div key={charge.charge_id} className="border border-gray-100 rounded-xl p-3 mb-2 bg-gray-50 opacity-70">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-600 font-['Poppins']">{charge.service_name}</p>
                  <p className="text-xs text-gray-400 font-['Poppins']">{charge.service_code} · ₹{charge.current_rate}</p>
                </div>
                <button onClick={() => toggleMutation.mutate({ id: charge.charge_id, active: true })}
                  disabled={toggleMutation.isPending}
                  className="px-2 py-1 text-xs border border-green-300 text-green-600 rounded-lg font-['Poppins']">
                  Activate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && charges.length === 0 && (
        <p className="text-center text-gray-400 py-8 font-['Poppins']">No service charges yet</p>
      )}

      {/* Rate update modal */}
      {rateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 font-['Poppins']">Update Rate: {rateModal.service_name}</h3>
            <p className="text-xs text-gray-500 font-['Poppins']">Current rate: ₹{rateModal.current_rate}</p>
            <FloatingLabelField field="newRate" label="New Rate (₹)" value={rateForm.newRate}
              onChange={(_, v) => setRateForm(p => ({ ...p, newRate: v }))} required />
            <div>
              <label className="text-xs text-gray-500 font-['Poppins']">Effective From (Month)</label>
              <input type="month" className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-['Poppins']"
                value={rateForm.effectiveMonth}
                onChange={e => setRateForm(p => ({ ...p, effectiveMonth: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRateModal(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-['Poppins']">
                Cancel
              </button>
              <button onClick={() => rateMutation.mutate(rateModal)}
                disabled={rateMutation.isPending || !rateForm.newRate}
                className="flex-1 py-2 bg-yellow-400 rounded-lg text-sm font-semibold font-['Poppins']">
                {rateMutation.isPending ? 'Saving…' : 'Save Rate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Semen Types Tab ───────────────────────────────────────────────────────────

function SemenTab() {
  const qc = useQueryClient()
  const [toast, setToast] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<SemenType | null>(null)
  const [createForm, setCreateForm] = useState({ semenCode: '', semenName: '', species: 'Cattle', semenCategory: '' })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const { data: semenTypes = [], isLoading, error } = useQuery({
    queryKey: ['semenTypes'],
    queryFn: () => api.listSemenTypes() as Promise<SemenType[]>
  })

  const createMutation = useMutation({
    mutationFn: () => api.createSemenType(createForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['semenTypes'] })
      setShowCreate(false)
      setCreateForm({ semenCode: '', semenName: '', species: 'Cattle', semenCategory: '' })
      showToast('Semen type created')
    },
    onError: (err: Error) => showToast(err.message)
  })

  const updateMutation = useMutation({
    mutationFn: (st: SemenType) => api.updateSemenType(st.semen_id, {
      semenName: st.semen_name, species: st.species, semenCategory: st.semen_category
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['semenTypes'] })
      setEditTarget(null)
      showToast('Semen type updated')
    },
    onError: (err: Error) => showToast(err.message)
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? api.activateSemenType(id) : api.deactivateSemenType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['semenTypes'] })
      showToast('Status updated')
    },
    onError: (err: Error) => showToast(err.message)
  })

  const active = semenTypes.filter(s => s.is_active)
  const inactive = semenTypes.filter(s => !s.is_active)

  return (
    <div className="space-y-3">
      <Toast msg={toast} />

      <PrimaryButton onClick={() => setShowCreate(!showCreate)}>
        {showCreate ? 'Cancel' : '+ Add Semen Type'}
      </PrimaryButton>

      {showCreate && (
        <div className="border border-yellow-200 rounded-xl p-4 bg-yellow-50 space-y-3">
          <h3 className="font-semibold text-gray-800 font-['Poppins']">New Semen Type</h3>
          <FloatingLabelField field="semenCode" label="Code (e.g. HF_LOCAL)" value={createForm.semenCode}
            onChange={(_, v) => setCreateForm(p => ({ ...p, semenCode: v }))} required />
          <FloatingLabelField field="semenName" label="Name" value={createForm.semenName}
            onChange={(_, v) => setCreateForm(p => ({ ...p, semenName: v }))} required />
          <div>
            <label className="text-xs text-gray-500 font-['Poppins']">Species</label>
            <select className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-['Poppins']"
              value={createForm.species} onChange={e => setCreateForm(p => ({ ...p, species: e.target.value }))}>
              {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <FloatingLabelField field="semenCategory" label="Category (e.g. Local, ETT, Imported)" value={createForm.semenCategory}
            onChange={(_, v) => setCreateForm(p => ({ ...p, semenCategory: v }))} required />
          <PrimaryButton onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !createForm.semenCode || !createForm.semenName || !createForm.semenCategory}>
            {createMutation.isPending ? 'Creating…' : 'Create'}
          </PrimaryButton>
        </div>
      )}

      {isLoading && <p className="text-center text-gray-500 py-6 font-['Poppins']">Loading…</p>}
      {error && <p className="text-center text-red-500 py-6 font-['Poppins']">Failed to load</p>}

      {active.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 font-['Poppins'] mb-2">Active ({active.length})</p>
          {active.map(st => (
            <div key={st.semen_id} className="border border-gray-200 rounded-xl p-3 mb-2 bg-white">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 font-['Poppins']">{st.semen_name}</p>
                  <p className="text-xs text-gray-500 font-['Poppins']">{st.semen_code} · {st.species} · {st.semen_category}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => setEditTarget({ ...st })}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-lg font-['Poppins']">Edit</button>
                  <button onClick={() => toggleMutation.mutate({ id: st.semen_id, active: false })}
                    disabled={toggleMutation.isPending}
                    className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded-lg font-['Poppins']">Deactivate</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 font-['Poppins'] mb-2">Inactive ({inactive.length})</p>
          {inactive.map(st => (
            <div key={st.semen_id} className="border border-gray-100 rounded-xl p-3 mb-2 bg-gray-50 opacity-70">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-600 font-['Poppins']">{st.semen_name}</p>
                  <p className="text-xs text-gray-400 font-['Poppins']">{st.semen_code} · {st.species}</p>
                </div>
                <button onClick={() => toggleMutation.mutate({ id: st.semen_id, active: true })}
                  disabled={toggleMutation.isPending}
                  className="px-2 py-1 text-xs border border-green-300 text-green-600 rounded-lg font-['Poppins']">Activate</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && semenTypes.length === 0 && (
        <p className="text-center text-gray-400 py-8 font-['Poppins']">No semen types yet</p>
      )}

      {editTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 font-['Poppins']">Edit: {editTarget.semen_code}</h3>
            <FloatingLabelField field="semenName" label="Name" value={editTarget.semen_name}
              onChange={(_, v) => setEditTarget(p => p ? { ...p, semen_name: v } : p)} required />
            <div>
              <label className="text-xs text-gray-500 font-['Poppins']">Species</label>
              <select className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-['Poppins']"
                value={editTarget.species} onChange={e => setEditTarget(p => p ? { ...p, species: e.target.value } : p)}>
                {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <FloatingLabelField field="semenCategory" label="Category" value={editTarget.semen_category}
              onChange={(_, v) => setEditTarget(p => p ? { ...p, semen_category: v } : p)} required />
            <div className="flex gap-3">
              <button onClick={() => setEditTarget(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-['Poppins']">Cancel</button>
              <button onClick={() => updateMutation.mutate(editTarget)} disabled={updateMutation.isPending}
                className="flex-1 py-2 bg-yellow-400 rounded-lg text-sm font-semibold font-['Poppins']">
                {updateMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Vaccines Tab ──────────────────────────────────────────────────────────────

function VaccinesTab() {
  const qc = useQueryClient()
  const [toast, setToast] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Vaccine | null>(null)
  const [createForm, setCreateForm] = useState({ vaccineCode: '', vaccineName: '' })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const { data: vaccines = [], isLoading, error } = useQuery({
    queryKey: ['vaccines'],
    queryFn: () => api.listVaccines() as Promise<Vaccine[]>
  })

  const createMutation = useMutation({
    mutationFn: () => api.createVaccine({ vaccineCode: createForm.vaccineCode, vaccineName: createForm.vaccineName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vaccines'] })
      setShowCreate(false)
      setCreateForm({ vaccineCode: '', vaccineName: '' })
      showToast('Vaccine created')
    },
    onError: (err: Error) => showToast(err.message)
  })

  const updateMutation = useMutation({
    mutationFn: (v: Vaccine) => api.updateVaccine(v.vaccine_id, { vaccineName: v.vaccine_name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vaccines'] })
      setEditTarget(null)
      showToast('Vaccine updated')
    },
    onError: (err: Error) => showToast(err.message)
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? api.activateVaccine(id) : api.deactivateVaccine(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vaccines'] })
      showToast('Status updated')
    },
    onError: (err: Error) => showToast(err.message)
  })

  const active = vaccines.filter(v => v.is_active)
  const inactive = vaccines.filter(v => !v.is_active)

  return (
    <div className="space-y-3">
      <Toast msg={toast} />

      <PrimaryButton onClick={() => setShowCreate(!showCreate)}>
        {showCreate ? 'Cancel' : '+ Add Vaccine'}
      </PrimaryButton>

      {showCreate && (
        <div className="border border-yellow-200 rounded-xl p-4 bg-yellow-50 space-y-3">
          <h3 className="font-semibold text-gray-800 font-['Poppins']">New Vaccine</h3>
          <FloatingLabelField field="vaccineCode" label="Code (e.g. FMD)" value={createForm.vaccineCode}
            onChange={(_, v) => setCreateForm(p => ({ ...p, vaccineCode: v }))} required />
          <FloatingLabelField field="vaccineName" label="Name" value={createForm.vaccineName}
            onChange={(_, v) => setCreateForm(p => ({ ...p, vaccineName: v }))} required />
          <PrimaryButton onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !createForm.vaccineCode || !createForm.vaccineName}>
            {createMutation.isPending ? 'Creating…' : 'Create'}
          </PrimaryButton>
        </div>
      )}

      {isLoading && <p className="text-center text-gray-500 py-6 font-['Poppins']">Loading…</p>}
      {error && <p className="text-center text-red-500 py-6 font-['Poppins']">Failed to load</p>}

      {active.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 font-['Poppins'] mb-2">Active ({active.length})</p>
          {active.map(v => (
            <div key={v.vaccine_id} className="border border-gray-200 rounded-xl p-3 mb-2 bg-white">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 font-['Poppins']">{v.vaccine_name}</p>
                  <p className="text-xs text-gray-500 font-['Poppins']">{v.vaccine_code}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => setEditTarget({ ...v })}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-lg font-['Poppins']">Edit</button>
                  <button onClick={() => toggleMutation.mutate({ id: v.vaccine_id, active: false })}
                    disabled={toggleMutation.isPending}
                    className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded-lg font-['Poppins']">Deactivate</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 font-['Poppins'] mb-2">Inactive ({inactive.length})</p>
          {inactive.map(v => (
            <div key={v.vaccine_id} className="border border-gray-100 rounded-xl p-3 mb-2 bg-gray-50 opacity-70">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-600 font-['Poppins']">{v.vaccine_name}</p>
                  <p className="text-xs text-gray-400 font-['Poppins']">{v.vaccine_code}</p>
                </div>
                <button onClick={() => toggleMutation.mutate({ id: v.vaccine_id, active: true })}
                  disabled={toggleMutation.isPending}
                  className="px-2 py-1 text-xs border border-green-300 text-green-600 rounded-lg font-['Poppins']">Activate</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && vaccines.length === 0 && (
        <p className="text-center text-gray-400 py-8 font-['Poppins']">No vaccines yet</p>
      )}

      {editTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="w-full max-w-md bg-white rounded-t-2xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 font-['Poppins']">Edit: {editTarget.vaccine_code}</h3>
            <FloatingLabelField field="vaccineName" label="Name" value={editTarget.vaccine_name}
              onChange={(_, v) => setEditTarget(p => p ? { ...p, vaccine_name: v } : p)} required />
            <div className="flex gap-3">
              <button onClick={() => setEditTarget(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-['Poppins']">Cancel</button>
              <button onClick={() => updateMutation.mutate(editTarget)} disabled={updateMutation.isPending}
                className="flex-1 py-2 bg-yellow-400 rounded-lg text-sm font-semibold font-['Poppins']">
                {updateMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Root Screen ───────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: 'charges',  label: 'Charges' },
  { key: 'semen',    label: 'Semen' },
  { key: 'vaccines', label: 'Vaccines' },
]

export default function MasterDataScreen() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('charges')

  return (
    <div className="w-full max-w-md mx-auto bg-white h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-4">
        <BackHeader title="Master Data" onBack={() => navigate('/admin/panel')} />
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0 flex border-b border-gray-200 mx-4 mt-3">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-sm font-semibold font-['Poppins'] transition-colors ${
              activeTab === tab.key
                ? 'text-yellow-600 border-b-2 border-yellow-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        {activeTab === 'charges'  && <ChargesTab />}
        {activeTab === 'semen'    && <SemenTab />}
        {activeTab === 'vaccines' && <VaccinesTab />}
      </div>
    </div>
  )
}
