import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import * as api from '../utils/api'

const SECTIONS = ['ai_report', 'vaccination_report', 'camp_report', 'opd_report', 'lab_report'] as const
const SECTION_LABELS: Record<string, string> = {
  ai_report:            'AI Report',
  vaccination_report:   'Vaccination Report',
  camp_report:          'Camp Report',
  opd_report:           'OPD Report',
  lab_report:           'Lab Report',
}

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Submitted: 'bg-blue-100 text-blue-800',
    Approved:  'bg-green-100 text-green-800',
    Rejected:  'bg-red-100 text-red-800',
    Pending:   'bg-gray-100 text-gray-600',
    Draft:     'bg-yellow-100 text-yellow-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

interface SectionRowProps {
  entry: api.QueueEntry
  sectionKey: string
  currentStatus: string
  rejectionReason: string | null
  onApprove: () => void
  onReject: (reason: string) => void
  isPending: boolean
}

function SectionRow({ entry: _entry, sectionKey, currentStatus, rejectionReason, onApprove, onReject, isPending }: SectionRowProps) {
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [reason, setReason] = useState('')

  const handleReject = () => {
    if (reason.trim().length < 5) return
    onReject(reason.trim())
    setReason('')
    setShowRejectInput(false)
  }

  return (
    <div className="border border-gray-100 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-800 w-44">{SECTION_LABELS[sectionKey]}</span>
          <StatusBadge status={currentStatus} />
          {currentStatus === 'Rejected' && rejectionReason && (
            <span className="text-xs text-red-500 italic truncate max-w-xs">{rejectionReason}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentStatus !== 'Approved' && (
            <button
              onClick={onApprove}
              disabled={isPending}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Check size={12} /> Approve
            </button>
          )}
          {currentStatus !== 'Rejected' && !showRejectInput && (
            <button
              onClick={() => setShowRejectInput(true)}
              disabled={isPending}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              <X size={12} /> Reject
            </button>
          )}
        </div>
      </div>

      {showRejectInput && (
        <div className="flex gap-2 items-end pt-1">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for rejection (min 5 characters)…"
            rows={2}
            className="flex-1 text-sm border border-red-200 rounded px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-red-400"
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={handleReject}
              disabled={reason.trim().length < 5 || isPending}
              className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => { setShowRejectInput(false); setReason('') }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface ReportCardProps {
  entry: api.QueueEntry
  month: string
}

function ReportCard({ entry, month }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false)
  const queryClient = useQueryClient()

  const sectionMap = Object.fromEntries(entry.section_statuses.map(s => [s.section, s]))

  const approveMutation = useMutation({
    mutationFn: (sections: string[]) => api.approveSections(month, entry.institute_id, sections),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approvalQueue'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ section, reason }: { section: string; reason: string }) =>
      api.rejectSection(month, entry.institute_id, section, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approvalQueue'] }),
  })

  const pendingSections = SECTIONS.filter(s => (sectionMap[s]?.status ?? 'Pending') !== 'Approved')
  const isPending = approveMutation.isPending || rejectMutation.isPending

  const handleApproveAll = () => {
    if (pendingSections.length === 0) return
    approveMutation.mutate([...pendingSections])
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header row */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-xl"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{entry.institute_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {entry.org_id} · {entry.institute_type} · {entry.tehsil_name ?? entry.district_name ?? ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">Submitted</p>
            <p className="text-xs text-gray-700">{fmt(entry.submitted_at)}</p>
          </div>
          <StatusBadge status={entry.submission_status} />
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {SECTIONS.map(s => {
              const st = sectionMap[s]?.status ?? 'Pending'
              return <span key={s} title={SECTION_LABELS[s]} className={`w-2 h-2 rounded-full ${st === 'Approved' ? 'bg-green-500' : st === 'Rejected' ? 'bg-red-400' : 'bg-gray-300'}`} />
            })}
          </div>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {/* Expanded section review */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">
              Prepared by <span className="font-medium text-gray-700">{entry.prepared_by_name}</span>
              {entry.prepared_by_designation && ` · ${entry.prepared_by_designation}`}
            </p>
            {pendingSections.length > 0 && (
              <button
                onClick={handleApproveAll}
                disabled={isPending}
                className="flex items-center gap-1 px-4 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Check size={13} /> Approve All Pending ({pendingSections.length})
              </button>
            )}
          </div>

          {(approveMutation.isError || rejectMutation.isError) && (
            <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded border border-red-200">
              {(approveMutation.error as Error)?.message ?? (rejectMutation.error as Error)?.message}
            </div>
          )}

          <div className="space-y-2">
            {SECTIONS.map(sectionKey => {
              const sectionData = sectionMap[sectionKey]
              const status = sectionData?.status ?? 'Pending'
              const rejectionReason = sectionData?.reason ?? null
              return (
                <SectionRow
                  key={sectionKey}
                  entry={entry}
                  sectionKey={sectionKey}
                  currentStatus={status}
                  rejectionReason={rejectionReason}
                  onApprove={() => approveMutation.mutate([sectionKey])}
                  onReject={reason => rejectMutation.mutate({ section: sectionKey, reason })}
                  isPending={isPending}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ApprovalQueueScreen() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(currentMonth)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['approvalQueue', month],
    queryFn: () => api.getApprovalQueue(month),
  })

  const queue = data?.data ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-gray-900">Approval Queue</h1>
          <div className="ml-auto flex items-center gap-3">
            <label className="text-sm text-gray-500">Month</label>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {isLoading && (
          <div className="text-center py-12 text-gray-400 text-sm">Loading queue…</div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {(error as Error).message}
          </div>
        )}

        {!isLoading && !isError && queue.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No submitted reports awaiting approval for {month}.
          </div>
        )}

        {!isLoading && !isError && queue.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-4">{queue.length} report{queue.length !== 1 ? 's' : ''} awaiting review</p>
            {queue.map(entry => (
              <ReportCard key={entry.report_id} entry={entry} month={month} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
