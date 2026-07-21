import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function InstituteManagementScreen() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-gray-900">Institute Management</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center text-gray-400 text-sm">
        Coming soon.
      </main>
    </div>
  )
}
