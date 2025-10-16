import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Plus,
  Mail,
  ChevronRight,
  Menu,
  Bell,
  User
} from 'lucide-react'

// Shared app components used across the app for consistent look & feel
import { SearchableSelect } from '../components/SearchableSelect'
import SideMenu from '../components/SideMenu'

// --- Types -----------------------------------------------------------------

type ReportStatus = 'submitted' | 'draft' | 'rejected' | 'pending'

type Report = {
  id: string
  month: string
  year: string // e.g. "2024"
  status: ReportStatus
  submittedAt?: string
}

// --- Mock Data (replace with API) ------------------------------------------

const ACADEMIC_YEARS = ['2024-25', '2023-24', '2022-23', '2021-22']

const MOCK_REPORTS: Report[] = [
  // 2024-25 academic year reports
  { id: 'r8', month: 'June', year: '2024', status: 'submitted', submittedAt: '2024-07-05' },
  { id: 'r9', month: 'May', year: '2024', status: 'submitted', submittedAt: '2024-06-03' },
  { id: 'r10', month: 'April', year: '2024', status: 'submitted', submittedAt: '2024-05-02' },
  { id: 'r5', month: 'August', year: '2024', status: 'draft' },
  { id: 'r6', month: 'September', year: '2024', status: 'pending' },
  { id: 'r7', month: 'October', year: '2024', status: 'rejected' },
  // 2023-24 academic year reports
  { id: 'r1', month: 'June', year: '2023', status: 'submitted', submittedAt: '2023-07-02' },
  { id: 'r2', month: 'May', year: '2023', status: 'submitted', submittedAt: '2023-06-02' },
  { id: 'r3', month: 'April', year: '2023', status: 'submitted', submittedAt: '2023-05-02' },
  { id: 'r4', month: 'January', year: '2023', status: 'submitted', submittedAt: '2023-02-02' }
]

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
    submitted: { bg: 'bg-green-50', text: 'text-green-700', label: 'Submitted', dot: 'bg-green-500' },
    draft: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Draft', dot: 'bg-gray-400' },
    rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected', dot: 'bg-red-500' },
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-800', label: 'Pending', dot: 'bg-yellow-500' }
  }
  const s = map[status]
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
  return (
    <div className="group">
      <button
        className="w-full flex items-center justify-between py-3 px-3 hover:bg-gray-50 rounded-lg transition-colors"
        onClick={() => onOpen(report)}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center shadow-sm">
            <FileText size={18} className="text-yellow-700" />
          </div>
          <div className="text-left flex-1">
            <div className="text-sm font-semibold text-gray-900 font-['Poppins']">
              {report.month} {report.year}
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
          {report.status === 'submitted' && (
            <button
              className="p-2 rounded-lg hover:bg-yellow-100 transition-colors"
              aria-label="Request email"
              onClick={(e) => {
                e.stopPropagation()
                onDownload(report)
              }}
            >
              <Mail size={16} className="text-gray-600" />
            </button>
          )}
          <ChevronRight size={18} className="text-gray-400 group-hover:text-yellow-600 transition-colors" />
        </div>
      </button>
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
  const [notifications] = useState(3)

  // filters & selection
  const [selectedYear, setSelectedYear] = useState('2024-25')
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all')

  // Derived list based on filters
  const filteredReports = useMemo(() => {
    const [startYear] = selectedYear.split('-').map(Number)
    const reportsForYear = MOCK_REPORTS.filter(r => {
      const y = Number(r.year)
      // Include reports from the academic year (e.g., 2024-25 includes reports from 2024 and 2025)
      return y === startYear || y === (startYear + 1)
    })
    if (statusFilter === 'all') return reportsForYear
    return reportsForYear.filter(r => r.status === statusFilter)
  }, [selectedYear, statusFilter])

  // Count reports by status for the selected year
  const statusCounts = useMemo(() => {
    const [startYear] = selectedYear.split('-').map(Number)
    const yearReports = MOCK_REPORTS.filter(r => {
      const y = Number(r.year)
      return y === startYear || y === (startYear + 1)
    })
    return {
      all: yearReports.length,
      submitted: yearReports.filter(r => r.status === 'submitted').length,
      draft: yearReports.filter(r => r.status === 'draft').length,
      pending: yearReports.filter(r => r.status === 'pending').length,
      rejected: yearReports.filter(r => r.status === 'rejected').length
    }
  }, [selectedYear])

  // --- Actions -------------------------------------------------------------
  const handleNewReport = () => {
    // TODO: navigate('/reports/new')
    console.log('Create new report')
  }
  const handleOpenReport = (report: Report) => {
    // TODO: navigate(`/reports/${report.id}`)
    console.log(`Open report: ${report.id}`)
  }
  const handleDownloadReport = (report: Report) => {
    // TODO: API call to request email
    console.log(`Request email for report: ${report.id}`)
    alert(`Report for ${report.month} ${report.year} will be sent to your registered email.`)
  }

  return (
    <div className="MonthlyReportScreen w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
      {/* Header (same pattern as HomeScreen) */}
      <div className="Header w-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-md">
        <div className="flex items-center justify-between px-6 h-16">
          {/* Hamburger Menu */}
          <button
            className="p-2 hover:bg-yellow-400 rounded-lg transition-colors"
            onClick={() => setIsSideMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} className="text-gray-800" />
          </button>

          {/* App Title */}
          <h1 className="text-gray-900 text-lg font-bold font-['Poppins']">
            AH Punjab
          </h1>

          {/* Right Icons */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button
              className="relative p-2 hover:bg-yellow-400 rounded-lg transition-colors"
              onClick={() => navigate('/notifications')}
              aria-label="Notifications"
            >
              <Bell size={22} className="text-gray-800" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* Profile Icon */}
            <button
              className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
              onClick={() => navigate('/profile')}
              aria-label="Profile"
            >
              <User size={18} className="text-gray-700" />
            </button>
          </div>
        </div>
      </div>

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
            <SearchableSelect
              value={selectedYear}
              onChange={(val: string) => setSelectedYear(val)}
              options={ACADEMIC_YEARS}
              placeholder="Year"
            />
          </div>
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {(['all', 'submitted', 'draft', 'pending', 'rejected'] as const).map(tag => {
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
                {tag[0].toUpperCase() + tag.slice(1)} {count > 0 && `(${count})`}
              </button>
            )
          })}
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredReports.length === 0 ? (
            <EmptyState label={`No ${statusFilter === 'all' ? '' : statusFilter} reports for ${selectedYear}`} />
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredReports.map(r => (
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
    </div>
  )
}