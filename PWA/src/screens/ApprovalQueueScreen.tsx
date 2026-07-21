import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import api from '../utils/api'

interface QueueItem {
  report_id: number
  reporting_month: string
  submission_status: string
  submitted_at: string | null
  admin_comment: string | null
  institute_id: number
  org_id: string
  institute_name: string
  institute_type: string
  district_name: string
  tehsil_name: string
  prepared_by_name: string
  prepared_by_designation: string
}

function statusColor(status: string) {
  switch (status) {
    case 'Approved': return 'bg-green-100 text-green-700'
    case 'Rejected': return 'bg-red-100 text-red-700'
    case 'Submitted': return 'bg-yellow-100 text-yellow-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function RejectModal({
  item,
  onConfirm,
  onCancel,
  isPending,
}: {
  item: QueueItem
  onConfirm: (reason: string) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Reject Report</h3>
        <p className="text-sm text-gray-500 mb-4">
          {item.institute_name} — {item.reporting_month}
        </p>
        <textarea
          className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
          rows={4}
          placeholder="Reason for rejection (required, min 5 chars)…"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={reason.trim().length < 5 || isPending}
            className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
          >
            {isPending ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ApprovalQueueScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filterMonth, setFilterMonth] = useState('')
  const [rejectTarget, setRejectTarget] = useState<QueueItem | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const { data: queue = [], isLoading, error } = useQuery<QueueItem[]>({
    queryKey: ['approvalQueue', filterMonth],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (filterMonth) params.month = filterMonth
      const res = await api.getApprovalQueue(params) as { data?: QueueItem[] } | QueueItem[]
      return (Array.isArray(res) ? res : (res as { data?: QueueItem[] }).data) ?? []
    },
  })

  const approveMutation = useMutation({
    mutationFn: ({ month, instituteId }: { month: string; instituteId: number }) =>
      api.approveReport(month, instituteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvalQueue'] })
      showToast('Report approved successfully')
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ month, instituteId, reason }: { month: string; instituteId: number; reason: string }) =>
      api.rejectReport(month, instituteId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvalQueue'] })
      setRejectTarget(null)
      showToast('Report returned for revision')
    },
    onError: (err: Error) => {
      setRejectTarget(null)
      showToast(err.message, 'error')
    },
  })

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 pt-safe-top pb-4">
        <div className="flex items-center gap-3 pt-4">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-white/20">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-lg font-bold font-['Poppins']">Approval Queue</h1>
            <p className="text-xs text-yellow-100">Reports awaiting your review</p>
          </div>
        </div>

        {/* Month filter */}
        <div className="mt-3">
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm text-gray-800 bg-white/90 focus:outline-none focus:ring-2 focus:ring-yellow-200"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full" />
          </div>
        )}

        {error && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{(error as Error).message}</p>
          </div>
        )}

        {!isLoading && !error && queue.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <CheckCircle size={40} className="text-gray-200" />
            <p className="text-sm">No reports pending review</p>
          </div>
        )}

        <div className="px-4 py-4 space-y-3 pb-8">
          {queue.map(item => (
            <div key={item.report_id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.institute_name}</p>
                  <p className="text-xs text-gray-500">{item.district_name} › {item.tehsil_name}</p>
                </div>
                <span className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(item.submission_status)}`}>
                  {item.submission_status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {item.reporting_month}
                </span>
                <span>{item.prepared_by_name}</span>
              </div>

              {item.admin_comment && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">
                  {item.admin_comment}
                </p>
              )}

              {item.submission_status === 'Submitted' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMutation.mutate({ month: item.reporting_month, instituteId: item.institute_id })}
                    disabled={approveMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
                  >
                    <CheckCircle size={15} />
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectTarget(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-100 text-red-600 text-sm font-semibold hover:bg-red-200"
                  >
                    <XCircle size={15} />
                    Return
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-lg text-white text-sm font-medium z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          item={rejectTarget}
          isPending={rejectMutation.isPending}
          onConfirm={reason => rejectMutation.mutate({
            month: rejectTarget.reporting_month,
            instituteId: rejectTarget.institute_id,
            reason,
          })}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  )
}
