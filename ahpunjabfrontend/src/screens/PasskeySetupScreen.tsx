import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Fingerprint, ShieldCheck, Smartphone, X } from 'lucide-react'
import webauthnService from '../services/webauthnService'
import authService from '../services/authService'
import {PrimaryButton} from '../components/Button'

export default function PasskeySetupScreen() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [deviceName, setDeviceName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if WebAuthn is supported
    if (!webauthnService.isSupported()) {
      setIsSupported(false)
    }
  }, [])

  const handleSetupPasskey = async () => {
    setIsLoading(true)
    setError('')

    try {
      const user = authService.getUser()
      if (!user) {
        setError('User not found. Please log in again.')
        setIsLoading(false)
        return
      }

      const result = await webauthnService.setupPasskey(user.id, deviceName || undefined)

      if (result.success) {
        alert(`✅ Passkey Setup Successful!\n\nDevice: ${result.credential?.deviceName}\n\nYou can now use your biometrics to login faster and more securely.`)
        navigate('/home')
      } else {
        setError(result.message || 'Failed to setup passkey')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    navigate('/home')
  }

  if (!isSupported) {
    return (
      <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <X size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 font-['Poppins'] mb-2">
            Passkeys Not Supported
          </h2>
          <p className="text-gray-600 font-['Poppins'] mb-6">
            Your browser or device doesn't support passkeys. Please use a modern browser on a device with biometric authentication.
          </p>
          <PrimaryButton onClick={() => navigate('/home')}>
            Continue to Home
          </PrimaryButton>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-white rounded-full p-4">
            <Fingerprint size={48} className="text-yellow-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white font-['Poppins']">
          Setup Passkey
        </h1>
        <p className="text-yellow-50 font-['Poppins'] mt-2">
          Use your biometrics for faster, more secure login
        </p>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto px-6 py-8"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        <div className="space-y-6">
          {/* Benefits */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <ShieldCheck size={20} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 font-['Poppins']">
                  More Secure
                </h3>
                <p className="text-sm text-gray-600 font-['Poppins']">
                  Passkeys can't be phished, stolen, or reused
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Fingerprint size={20} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 font-['Poppins']">
                  Faster Login
                </h3>
                <p className="text-sm text-gray-600 font-['Poppins']">
                  Use Face ID, Touch ID, or Windows Hello
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Smartphone size={20} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 font-['Poppins']">
                  Works Everywhere
                </h3>
                <p className="text-sm text-gray-600 font-['Poppins']">
                  Use on this device or sync across your devices
                </p>
              </div>
            </div>
          </div>

          {/* Device Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 font-['Poppins'] mb-2">
              Device Name (Optional)
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g., My iPhone, Work Laptop"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 font-['Poppins'] mt-1">
              Help identify this passkey later
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 font-['Poppins']">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-['Poppins']">
              💡 <strong>Tip:</strong> You can always setup passkeys later from your profile settings, or use your password as a fallback.
            </p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div
        className="flex-shrink-0 px-6 pb-6 space-y-3"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <PrimaryButton
          onClick={handleSetupPasskey}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Setting up...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Fingerprint size={20} />
              Setup Passkey Now
            </span>
          )}
        </PrimaryButton>

        <button
          onClick={handleSkip}
          disabled={isLoading}
          className="w-full py-3 text-gray-600 font-medium font-['Poppins'] hover:text-gray-800 transition-colors disabled:opacity-50"
        >
          Skip for Now
        </button>
      </div>
    </div>
  )
}
