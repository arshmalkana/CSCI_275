import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  Plus,
  Download,
  ChevronRight
} from 'lucide-react'

// Shared app components used across the app for consistent look & feel
import { SearchableSelect } from '../components/SearchableSelect'
import SideMenu from '../components/SideMenu'
import { MainHeader } from '../components/Headers'
import { InfoDialog } from '../components/DialogBox'
import api from '../utils/api'

// --- Types -----------------------------------------------------------------

type ReportStatus = 'Submitted' | 'Draft' | 'Rejected' | 'Approved'

type Report = {
  id: string
  reportId: number
  month: string // "YYYY-MM" format from backend
  reportingMonth: string
  status: ReportStatus
  submittedAt?: string | null
  createdAt: string
  updatedAt: string
}

// --- Small UI Building Blocks (encapsulation) ------------------------------

function InfoBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <FileText size={18} className="text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-blue-900 font-['Poppins'] font-semibold mb-1">Monthly Reports</p>
          <p className="text-xs text-blue-700 font-['Poppins'] leading-relaxed">
            Start a new report or continue a saved draft. Download previous reports or request them via email.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const map: Record<ReportStatus, { bg: string; text: string; label: string; dot: string }> = {
    'Submitted': { bg: 'bg-green-50', text: 'text-green-700', label: 'Submitted', dot: 'bg-green-500' },
    'Draft': { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Draft', dot: 'bg-gray-400' },
    'Rejected': { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected', dot: 'bg-red-500' },
    'Approved': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Approved', dot: 'bg-blue-500' }
  }
  const s = map[status] || map['Draft']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text} border ${s.text.replace('text-', 'border-').replace('700', '200').replace('800', '200')}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
      {s.label}
    </span>
  )
}

function ReportRow({ report, onOpen, onDownload }: {
  report: Report
  onOpen: (r: Report) => void
  onDownload: (r: Report) => void
}) {
  // Format YYYY-MM to "Month Year"
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="group">
      <div
        className="w-full flex items-center justify-between py-3 px-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
        onClick={() => onOpen(report)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(report);
          }
        }}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center shadow-sm">
            <FileText size={18} className="text-yellow-700" />
          </div>
          <div className="text-left flex-1">
            <div className="text-sm font-semibold text-gray-900 font-['Poppins']">
              {formatMonth(report.month)}
            </div>
            <div className="text-xs text-gray-500 font-['Poppins'] mt-0.5">
              {report.submittedAt
                ? `Submitted ${new Date(report.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                : 'Not submitted'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={report.status} />
          {(report.status === 'Submitted' || report.status === 'Approved') && (
            <button
              className="p-2 rounded-lg hover:bg-yellow-100 transition-colors"
              aria-label="Download PDF"
              onClick={(e) => {
                e.stopPropagation()
                onDownload(report)
              }}
            >
              <Download size={16} className="text-gray-600" />
            </button>
          )}
          <ChevronRight size={18} className="text-gray-400 group-hover:text-yellow-600 transition-colors" />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <FileText size={28} className="text-gray-400" />
      </div>
      <p className="text-gray-500 font-['Poppins'] text-sm font-medium">{label}</p>
      <p className="text-gray-400 font-['Poppins'] text-xs mt-1">Try adjusting your filters</p>
    </div>
  )
}

// --- Main Screen -----------------------------------------------------------

export default function MonthlyReportScreen() {
  const navigate = useNavigate()

  // side menu & notifications to match HomeScreen header
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)

  // Fetch unread notification count
  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ['unreadNotificationCount'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await api.getUnreadCount() as any
      return data
    },
    staleTime: 0, // Always treat as stale, refetch immediately when invalidated
    refetchInterval: 60 * 1000, // Auto-refetch every minute
    retry: 1,
  })

  const notifications = unreadCountData?.count || 0

  // filters & selection
  const [statusFilter, setStatusFilter] = useState<'all' | 'Submitted' | 'Draft' | 'Rejected' | 'Approved'>('all')

  // Dialog state
  const [infoDialog, setInfoDialog] = useState({ isOpen: false, message: '' })

  // Fetch fiscal years from API
  const { data: fiscalYears = [], isLoading: isLoadingYears } = useQuery({
    queryKey: ['fiscalYears'],
    queryFn: () => api.getFiscalYears()
  })

  // Default to first fiscal year (most recent)
  const [selectedYear, setSelectedYear] = useState('')

  // Set default year once fiscal years are loaded
  if (fiscalYears.length > 0 && !selectedYear) {
    setSelectedYear(fiscalYears[0])
  }

  // Fetch reports from API
  const { data: reports = [], isLoading: isLoadingReports } = useQuery<Report[]>({
    queryKey: ['monthlyReports', selectedYear, statusFilter],
    queryFn: async () => {
      const data = await api.listMonthlyReports({
        fiscalYear: selectedYear,
        status: statusFilter
      })
      return data as Report[]
    },
    enabled: !!selectedYear // Only fetch when fiscal year is selected
  })

  const isLoading = isLoadingYears || isLoadingReports

  // Count reports by status for the selected year
  const statusCounts = useMemo(() => {
    return {
      all: reports.length,
      Submitted: reports.filter(r => r.status === 'Submitted').length,
      Draft: reports.filter(r => r.status === 'Draft').length,
      Approved: reports.filter(r => r.status === 'Approved').length,
      Rejected: reports.filter(r => r.status === 'Rejected').length
    }
  }, [reports])

  // --- Actions -------------------------------------------------------------
  const handleNewReport = () => {
    navigate('/reports/create')
  }
  const handleOpenReport = (report: Report) => {
    // Only navigate with month for drafts (more secure than reportId)
    if (report.status === 'Draft') {
      navigate(`/reports/create?month=${report.month}`)
    } else {
      // For submitted/approved reports, just navigate to view mode (to be implemented)
      navigate('/reports/create')
    }
  }
  const handleDownloadReport = async (report: Report) => {
    try {
      const blob = await api.downloadReportPDF(report.month)
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `Monthly_Report_${report.month}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      setInfoDialog({ isOpen: true, message: 'Could not download the report. Please try again.' })
    }
  }

  return (
    <div className="MonthlyReportScreen w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <MainHeader
        onMenuClick={() => setIsSideMenuOpen(true)}
        notifications={notifications}
      />

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        <InfoBanner />

        {/* Quick Action */}
        <div className="mb-6">
          <button
            onClick={handleNewReport}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 active:scale-98 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus size={22} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-base font-bold text-white font-['Poppins']">Create New Report</div>
              <div className="text-xs text-white/90 font-['Poppins']">Start a fresh monthly report</div>
            </div>
          </button>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 font-['Poppins']">Previous Reports</h2>
          <div className="w-32">
            {isLoadingYears ? (
              <div className="h-9 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <SearchableSelect
                value={selectedYear}
                onChange={(val: string) => setSelectedYear(val)}
                options={fiscalYears}
                placeholder="Year"
              />
            )}
          </div>
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {(['all', 'Submitted', 'Draft', 'Approved', 'Rejected'] as const).map(tag => {
            const count = statusCounts[tag]
            return (
              <button
                key={tag}
                onClick={() => setStatusFilter(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-['Poppins'] font-medium border whitespace-nowrap transition-all duration-200 ${
                  statusFilter === tag
                    ? 'bg-yellow-100 border-yellow-400 text-yellow-800 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {tag === 'all' ? 'All' : tag} {count > 0 && `(${count})`}
              </button>
            )
          })}
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-gray-400 animate-pulse" />
              </div>
              <p className="text-gray-500 font-['Poppins'] text-sm font-medium">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <EmptyState label={`No ${statusFilter === 'all' ? '' : statusFilter} reports for ${selectedYear}`} />
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.map(r => (
                <ReportRow
                  key={r.id}
                  report={r}
                  onOpen={handleOpenReport}
                  onDownload={handleDownloadReport}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom callout */}
        <div className="mt-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <Mail size={16} className="text-yellow-600" />
            </div>
            <p className="text-xs text-yellow-900 font-['Poppins'] leading-relaxed">
              <span className="font-semibold">Need a copy?</span> Tap the mail icon next to any submitted report and we'll send it to your registered email address.
            </p>
          </div>
        </div>

        {/* Spacer for bottom safe area */}
        <div className="pb-8" />
      </div>

      {/* Side Menu */}
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
      />

      {/* Info Dialog */}
      <InfoDialog
        isOpen={infoDialog.isOpen}
        message={infoDialog.message}
        onClose={() => setInfoDialog({ isOpen: false, message: '' })}
      />
    </div>
  )
}