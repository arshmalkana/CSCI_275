import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'

const PANEL_SECTIONS = [
  { title: 'Approval Queue',         description: 'Review and approve submitted field reports',      path: '/approval-queue',   color: 'bg-blue-500' },
  { title: 'Consolidated Dashboard', description: 'View compiled rollup data for your Tehsil',       path: '/rollup',           color: 'bg-indigo-500' },
  { title: 'Period Management',      description: 'Open, close, and lock reporting periods',         path: '/periods',          color: 'bg-purple-500' },
  { title: 'Institute Management',   description: 'Manage institutes in your reporting hierarchy',   path: '/institutes',       color: 'bg-emerald-500' },
  { title: 'Master Data',            description: 'Service charges, semen types, vaccines',          path: '/master-data',      color: 'bg-orange-500' },
  { title: 'Targets',                description: 'Set annual targets for field institutes',          path: '/targets',          color: 'bg-rose-500' },
  { title: 'User Management',        description: 'Approve registrations and manage staff accounts', path: '/admin',            color: 'bg-gray-500' },
]

export default function DashboardScreen() {
  const navigate = useNavigate()
  const user = authService.getUser()

  const handleLogout = async () => {
    await authService.logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-900">AH Punjab — Oversight Panel</span>
            {user?.institute && (
              <span className="ml-3 text-sm text-gray-500">{user.institute}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Panel Sections</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PANEL_SECTIONS.map(section => (
            <button
              key={section.path}
              onClick={() => navigate(section.path)}
              className="text-left bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group"
            >
              <div className={`w-10 h-10 ${section.color} rounded-lg flex items-center justify-center mb-3`}>
                <div className="w-5 h-5 bg-white/30 rounded" />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {section.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{section.description}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
