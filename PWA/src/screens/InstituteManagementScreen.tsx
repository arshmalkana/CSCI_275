import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BackHeader } from '../components/Headers'
import { PrimaryButton } from '../components/Button'
import { FloatingLabelField } from '../components/FloatingLabelField'
import api from '../utils/api'

interface Institute {
  institute_id: number
  institute_name: string
  institute_type: string
  org_id: string | null
  is_active: boolean
  reporting_authority_id: number | null
  parent_name: string | null
  district_name: string | null
  tehsil_name: string | null
}

const INSTITUTE_TYPES = ['HQ', 'District_HQ', 'TehsilHQ', 'CVH', 'CVD', 'ASC']

export default function InstituteManagementScreen() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Institute | null>(null)
  const [toast, setToast] = useState('')

  const [form, setForm] = useState({
    instituteName: '',
    instituteType: 'CVD',
    orgId: '',
    reportingAuthorityId: ''
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const { data: institutes = [], isLoading } = useQuery({
    queryKey: ['institutes'],
    queryFn: () => api.listInstitutes() as Promise<Institute[]>
  })

  const createMutation = useMutation({
    mutationFn: () => api.createInstitute({
      instituteName: form.instituteName,
      instituteType: form.instituteType,
      orgId: form.orgId || undefined,
      reportingAuthorityId: form.reportingAuthorityId ? parseInt(form.reportingAuthorityId) : undefined
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institutes'] })
      setShowCreate(false)
      setForm({ instituteName: '', instituteType: 'CVD', orgId: '', reportingAuthorityId: '' })
      showToast('Institute created')
    },
    onError: (err: Error) => showToast(err.message)
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; changes: Record<string, unknown> }) =>
      api.updateInstitute(data.id, data.changes as Parameters<typeof api.updateInstitute>[1]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institutes'] })
      setEditTarget(null)
      showToast('Institute updated')
    },
    onError: (err: Error) => showToast(err.message)
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? api.reactivateInstitute(id) : api.deactivateInstitute(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institutes'] })
      showToast('Status updated')
    },
    onError: (err: Error) => showToast(err.message)
  })

  const activeList = institutes.filter(i => i.is_active)
  const inactiveList = institutes.filter(i => !i.is_active)

  return (
    <div className="w-full max-w-md mx-auto bg-white h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-4">
        <BackHeader title="Institute Management" onBack={() => navigate('/admin/panel')} />
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
        <div className="mt-4 mb-4">
          <PrimaryButton onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : '+ Add Institute'}
          </PrimaryButton>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="border border-yellow-200 rounded-xl p-4 mb-4 bg-yellow-50">
            <h3 className="font-semibold text-gray-800 font-['Poppins'] mb-3">New Institute</h3>
            <div className="space-y-4">
              <FloatingLabelField
                field="instituteName"
                label="Institute Name"
                value={form.instituteName}
                onChange={(_, v) => setForm(p => ({ ...p, instituteName: v }))}
                required
              />
              <div>
                <label className="text-xs text-gray-500 font-['Poppins']">Type</label>
                <select
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-['Poppins']"
                  value={form.instituteType}
                  onChange={e => setForm(p => ({ ...p, instituteType: e.target.value }))}
                >
                  {INSTITUTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <FloatingLabelField
                field="orgId"
                label="Org ID (optional)"
                value={form.orgId}
                onChange={(_, v) => setForm(p => ({ ...p, orgId: v }))}
              />
              <FloatingLabelField
                field="reportingAuthorityId"
                label="Parent Institute ID (optional)"
                value={form.reportingAuthorityId}
                onChange={(_, v) => setForm(p => ({ ...p, reportingAuthorityId: v }))}
              />
              <PrimaryButton
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.instituteName}
              >
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* Edit modal */}
        {editTarget && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
            <div className="w-full max-w-md bg-white rounded-t-2xl p-6">
              <h3 className="font-semibold text-gray-800 font-['Poppins'] mb-4">Edit Institute</h3>
              <div className="space-y-4">
                <FloatingLabelField
                  field="instituteName"
                  label="Name"
                  value={editTarget.institute_name}
                  onChange={(_, v) => setEditTarget(p => p ? { ...p, institute_name: v } : p)}
                  required
                />
                <div>
                  <label className="text-xs text-gray-500 font-['Poppins']">Type</label>
                  <select
                    className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-['Poppins']"
                    value={editTarget.institute_type}
                    onChange={e => setEditTarget(p => p ? { ...p, institute_type: e.target.value } : p)}
                  >
                    {INSTITUTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <FloatingLabelField
                  field="reportingAuthorityId"
                  label="Parent Institute ID"
                  value={String(editTarget.reporting_authority_id ?? '')}
                  onChange={(_, v) => setEditTarget(p => p ? { ...p, reporting_authority_id: v ? parseInt(v) : null } : p)}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditTarget(null)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-['Poppins']"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateMutation.mutate({
                      id: editTarget.institute_id,
                      changes: {
                        instituteName: editTarget.institute_name,
                        instituteType: editTarget.institute_type,
                        reportingAuthorityId: editTarget.reporting_authority_id ?? undefined
                      }
                    })}
                    disabled={updateMutation.isPending}
                    className="flex-1 py-2 bg-yellow-400 rounded-lg text-sm font-semibold font-['Poppins']"
                  >
                    {updateMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <p className="text-center text-gray-500 py-8 font-['Poppins']">Loading…</p>
        )}

        {/* Active institutes */}
        {activeList.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 font-['Poppins'] mb-2">Active ({activeList.length})</h3>
            <div className="space-y-2">
              {activeList.map(inst => (
                <div key={inst.institute_id} className="border border-gray-200 rounded-xl p-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 font-['Poppins'] truncate">{inst.institute_name}</p>
                      <p className="text-xs text-gray-500 font-['Poppins']">{inst.institute_type} • ID: {inst.institute_id}</p>
                      {inst.parent_name && (
                        <p className="text-xs text-gray-400 font-['Poppins']">↑ {inst.parent_name}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setEditTarget(inst)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-lg font-['Poppins']"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: inst.institute_id, active: false })}
                        disabled={toggleActiveMutation.isPending}
                        className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded-lg font-['Poppins']"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inactive institutes */}
        {inactiveList.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 font-['Poppins'] mb-2">Inactive ({inactiveList.length})</h3>
            <div className="space-y-2">
              {inactiveList.map(inst => (
                <div key={inst.institute_id} className="border border-gray-100 rounded-xl p-3 bg-gray-50 opacity-70">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600 font-['Poppins'] truncate">{inst.institute_name}</p>
                      <p className="text-xs text-gray-400 font-['Poppins']">{inst.institute_type}</p>
                    </div>
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: inst.institute_id, active: true })}
                      disabled={toggleActiveMutation.isPending}
                      className="px-2 py-1 text-xs border border-green-300 text-green-600 rounded-lg font-['Poppins']"
                    >
                      Reactivate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
