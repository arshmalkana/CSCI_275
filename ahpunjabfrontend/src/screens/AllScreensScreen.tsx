import { useNavigate } from 'react-router-dom'
import { PrimaryButton } from '../components/Button'

export default function AllScreensScreen() {
  const navigate = useNavigate()

  const screens = [
    { name: 'Login', path: '/login' },
    { name: 'Register', path: '/register' },
    { name: 'Forgot Password', path: '/forgot-password' },
    { name: 'Home', path: '/home' },
    { name: 'Profile', path: '/profile' },
    { name: 'Change Password', path: '/change-password' },
    { name: 'Notifications', path: '/notifications' },
    { name: 'Vaccine Distribution', path: '/vaccine-distribution' },
    { name: 'Setup Passkey', path: '/setup-passkey' },
    { name: 'Manage Passkeys', path: '/manage-passkeys' },
  ]

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-yellow-500 p-6">
        <h1 className="text-2xl font-bold text-black font-['Poppins']">
          🧪 All Screens (Dev)
        </h1>
        <p className="text-sm text-gray-700 font-['Poppins'] mt-1">
          Development screen for testing
        </p>
      </div>

      {/* Scrollable Content */}
      <div
        className="flex-1 overflow-y-auto p-6"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <div className="space-y-3 pb-8">
          {screens.map((screen) => (
            <button
              key={screen.path}
              onClick={() => navigate(screen.path)}
              className="w-full bg-white hover:bg-gray-50 active:bg-gray-100 border-2 border-gray-200 text-gray-900 py-4 px-6 rounded-xl font-semibold font-['Poppins'] transition-all duration-200 shadow-sm hover:shadow-md hover:border-yellow-400 text-left flex items-center justify-between group"
            >
              <span>{screen.name}</span>
              <span className="text-yellow-500 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
          ))}

          <div className="pt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800 font-['Poppins']">
                <strong>Tip:</strong> This screen is only for development. You can quickly navigate to any screen to test UI/UX.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
