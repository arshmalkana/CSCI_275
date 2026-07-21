import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, User, Building2, CheckCircle, XCircle, UserMinus, UserCheck, Plus, ChevronDown } from 'lucide-react'
import api from '../utils/api'

type Tab = 'registrations' | 'users'

interface Registration {
  institute_id: number
  org_id: string
  institute_name: string
  institute_type: string
  district_name: string
  tehsil_name: string
  staff_id: number
  full_name: string
  designation: string
  mobile: string
  email: string
  user_role: string
  created_at: string
}

interface StaffUser {
  staff_id: number
  user_id: string
  full_name: string
  designation: string
  user_role: string
  mobile: string
  email: string
  is_active: boolean
  institute_name: string
  district_name: string
  tehsil_name: string
}

interface Institute {
  institute_id: number
  institute_name: string
}

function CreateUserModal({
  institutes,
  onConfirm,
  onCancel,
  isPending,
}: {
  institutes: Institute[]
  onConfirm: (data: { fullName: string; userId: string; password: string; role: string; instituteId: number }) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [fullName, setFullName] = useState('')
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('INAPH')
  const [instituteId, setInstituteId] = useState('')
  const validRoles = ['INAPH', 'AIW', 'Tehsil_Admin', 'District_Admin', 'HQ_Admin']
  const isValid = fullName.trim().length >= 2 && userId.trim().length >= 3 && password.length >= 8 && instituteId !== ''

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-3">
        <h3 className="text-base font-bold text-gray-900">Create User</h3>
        <input
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Full name"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
        />
        <input
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="User ID (login name)"
          value={userId}
          onChange={e => setUserId(e.target.value)}
        />
        <input
          type="password"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <select
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          {validRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
          value={instituteId}
          onChange={e => setInstituteId(e.target.value)}
        >
          <option value="">Select institute</option>
          {institutes.map(i => <option key={i.institute_id} value={i.institute_id}>{i.institute_name}</option>)}
        </select>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
            Cancel
          </button>
          <button
            disabled={!isValid || isPending}
            onClick={() => onConfirm({ fullName: fullName.trim(), userId: userId.trim(), password, role, instituteId: parseInt(instituteId) })}
            className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-white text-sm font-semibold disabled:opacity-50"
          >
            {isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditUserModal({
  user,
  institutes,
  onConfirm,
  onCancel,
  isPending,
}: {
  user: StaffUser
  institutes: Institute[]
  onConfirm: (data: { user_role?: string; current_institute_id?: number }) => void
  onCancel: () => void
  isPending: boolean
}) {
  const validRoles = ['INAPH', 'AIW', 'Tehsil_Admin', 'District_Admin', 'HQ_Admin']
  const [role, setRole] = useState(user.user_role)
  const [instituteId, setInstituteId] = useState(String(
    institutes.find(i => i.institute_name === user.institute_name)?.institute_id ?? ''
  ))
  const dirty = role !== user.user_role || (instituteId !== '' && Number(instituteId) !== institutes.find(i => i.institute_name === user.institute_name)?.institute_id)

  const handleSave = () => {
    const updates: { user_role?: string; current_institute_id?: number } = {}
    if (role !== user.user_role) updates.user_role = role
    const parsedId = parseInt(instituteId)
    if (!isNaN(parsedId) && parsedId !== institutes.find(i => i.institute_name === user.institute_name)?.institute_id) {
      updates.current_institute_id = parsedId
    }
    onConfirm(updates)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-3">
        <h3 className="text-base font-bold text-gray-900">Edit User</h3>
        <p className="text-sm text-gray-500">{user.full_name}</p>
        <div>
          <p className="text-xs text-gray-500 mb-1">Role</p>
          <select
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            {validRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Institute</p>
          <select
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
            value={instituteId}
            onChange={e => setInstituteId(e.target.value)}
          >
            <option value="">— no change —</option>
            {institutes.map(i => <option key={i.institute_id} value={i.institute_id}>{i.institute_name}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">Current: {user.institute_name}</p>
        </div>
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          Changing role or institute forces the user to log in again.
        </p>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
            Cancel
          </button>
          <button
            disabled={!dirty || isPending}
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-white text-sm font-semibold disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ApproveRegistrationModal({
  reg,
  onConfirm,
  onCancel,
  isPending,
}: {
  reg: Registration
  onConfirm: (data: { userId: string; password: string; role: string; instituteId: number }) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('INAPH')
  const validRoles = ['INAPH', 'AIW', 'Tehsil_Admin', 'District_Admin', 'HQ_Admin']

  const isValid = userId.trim().length >= 3 && password.length >= 8

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900">Approve Registration</h3>
        <p className="text-sm text-gray-500">{reg.institute_name} — {reg.full_name}</p>

        <div className="space-y-3">
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Assign user ID"
            value={userId}
            onChange={e => setUserId(e.target.value)}
          />
          <input
            type="password"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Temporary password (min 8 chars)"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <select
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            {validRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
            Cancel
          </button>
          <button
            disabled={!isValid || isPending}
            onClick={() => onConfirm({ userId: userId.trim(), password, role, instituteId: reg.institute_id })}
            className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold disabled:opacity-50"
          >
            {isPending ? 'Approving…' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPanelScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('registrations')
  const [approveTarget, setApproveTarget] = useState<Registration | null>(null)
  const [editTarget, setEditTarget] = useState<StaffUser | null>(null)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Registrations ──────────────────────────────────────────────────────────
  const { data: regs = [], isLoading: regsLoading } = useQuery<Registration[]>({
    queryKey: ['pendingRegistrations'],
    queryFn: async () => {
      const res = await api.getPendingRegistrations() as { data?: Registration[] } | Registration[]
      return (Array.isArray(res) ? res : (res as { data?: Registration[] }).data) ?? []
    },
    enabled: tab === 'registrations',
  })

  const approveRegMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { userId: string; password: string; role: string; instituteId: number } }) =>
      api.approveRegistration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRegistrations'] })
      setApproveTarget(null)
      showToast('Registration approved — institute is now active')
    },
    onError: (err: Error) => { setApproveTarget(null); showToast(err.message, 'error') },
  })

  const rejectRegMutation = useMutation({
    mutationFn: ({ id }: { id: number }) =>
      api.rejectRegistration(id, 'Rejected by admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRegistrations'] })
      showToast('Registration rejected')
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  })

  // ── Users ──────────────────────────────────────────────────────────────────
  const { data: users = [], isLoading: usersLoading } = useQuery<StaffUser[]>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await api.listUsers() as { data?: StaffUser[] } | StaffUser[]
      return (Array.isArray(res) ? res : (res as { data?: StaffUser[] }).data) ?? []
    },
    enabled: tab === 'users',
  })

  const toggleUserMutation = useMutation({
    mutationFn: ({ staffId, active }: { staffId: number; active: boolean }) =>
      active ? api.reactivateUser(staffId) : api.deactivateUser(staffId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      showToast(vars.active ? 'User reactivated' : 'User deactivated')
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ staffId, data }: { staffId: number; data: unknown }) =>
      api.updateUser(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      setEditTarget(null)
      showToast('User updated — they will need to log in again')
    },
    onError: (err: Error) => { setEditTarget(null); showToast(err.message, 'error') },
  })

  const createUserMutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      setShowCreateUser(false)
      showToast('User created')
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  })

  const { data: allInstitutes = [] } = useQuery<Institute[]>({
    queryKey: ['allInstitutes'],
    queryFn: async () => {
      const res = await api.listInstitutes() as { data?: Institute[] } | Institute[]
      return (Array.isArray(res) ? res : (res as { data?: Institute[] }).data) ?? []
    },
    enabled: tab === 'users' || showCreateUser,
  })

  const isLoading = tab === 'registrations' ? regsLoading : usersLoading

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 pt-safe-top pb-4">
        <div className="flex items-center gap-3 pt-4">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-white/20">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-bold font-['Poppins'] flex-1">Admin Panel</h1>
          {tab === 'users' && (
            <button
              onClick={() => setShowCreateUser(true)}
              className="flex items-center gap-1 text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg"
            >
              <Plus size={13} /> New User
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 bg-white/20 rounded-xl p-1">
          {(['registrations', 'users'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
                tab === t ? 'bg-white text-yellow-600' : 'text-white/80 hover:text-white'
              }`}
            >
              {t === 'registrations' ? `Registrations (${regs.length})` : `Users (${users.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Registrations tab */}
        {!isLoading && tab === 'registrations' && (
          <>
            {regs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                <Building2 size={40} className="text-gray-200" />
                <p className="text-sm">No pending registrations</p>
              </div>
            ) : (
              <div className="space-y-3 pb-8">
                {regs.map(reg => (
                  <div key={reg.institute_id} className="bg-gray-50 rounded-2xl p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{reg.institute_name}</p>
                        <p className="text-xs text-gray-500">{reg.district_name} › {reg.tehsil_name}</p>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                        Pending
                      </span>
                    </div>
                    {reg.full_name && (
                      <p className="text-xs text-gray-600">
                        Staff: {reg.full_name} ({reg.designation})
                      </p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setApproveTarget(reg)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button
                        onClick={() => rejectRegMutation.mutate({ id: reg.institute_id })}
                        disabled={rejectRegMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-100 text-red-600 text-sm font-semibold hover:bg-red-200 disabled:opacity-50"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Users tab */}
        {!isLoading && tab === 'users' && (
          <>
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                <User size={40} className="text-gray-200" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              <div className="space-y-2 pb-8">
                {users.map(u => (
                  <div key={u.staff_id} className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{u.full_name}</p>
                        <p className="text-xs text-gray-500">{u.user_role} · {u.designation}</p>
                        <p className="text-xs text-gray-400 truncate">{u.institute_name}</p>
                      </div>
                      <span className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditTarget(u)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                      >
                        <ChevronDown size={14} /> Edit Role
                      </button>
                      <button
                        onClick={() => toggleUserMutation.mutate({ staffId: u.staff_id, active: !u.is_active })}
                        disabled={toggleUserMutation.isPending}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 ${
                          u.is_active
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {u.is_active
                          ? <><UserMinus size={14} /> Deactivate</>
                          : <><UserCheck size={14} /> Reactivate</>
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Approve modal */}
      {approveTarget && (
        <ApproveRegistrationModal
          reg={approveTarget}
          isPending={approveRegMutation.isPending}
          onConfirm={data => approveRegMutation.mutate({ id: approveTarget.institute_id, data })}
          onCancel={() => setApproveTarget(null)}
        />
      )}

      {/* Edit role/institute modal */}
      {editTarget && (
        <EditUserModal
          user={editTarget}
          institutes={allInstitutes}
          isPending={updateUserMutation.isPending}
          onConfirm={data => updateUserMutation.mutate({ staffId: editTarget.staff_id, data })}
          onCancel={() => setEditTarget(null)}
        />
      )}

      {/* Create user modal */}
      {showCreateUser && (
        <CreateUserModal
          institutes={allInstitutes}
          isPending={createUserMutation.isPending}
          onConfirm={data => createUserMutation.mutate(data)}
          onCancel={() => setShowCreateUser(false)}
        />
      )}
    </div>
  )
}
