import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Fingerprint, Trash2, Plus, Smartphone } from 'lucide-react'
import webauthnService,  { type PasskeyCredential } from '../services/webauthnService'
import authService from '../services/authService'
import { ScreenHeader } from '../components/ScreenHeader'
// import {PrimaryButton} from '../components/Button'

export default function ManagePasskeysScreen() {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState<PasskeyCredential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [deviceName, setDeviceName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadCredentials()
  }, [])

  const loadCredentials = async () => {
    setIsLoading(true)
    try {
      const user = authService.getUser()
      if (user) {
        const creds = await webauthnService.listPasskeys()
        setCredentials(creds)
      }
    } catch (err) {
      console.error('Failed to load passkeys:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPasskey = async () => {
    setIsAdding(true)
    setError('')

    try {
      const user = authService.getUser()
      if (!user) {
        setError('User not found')
        return
      }

      const result = await webauthnService.setupPasskey(deviceName || undefined)

      if (result.success) {
        alert(`✅ Passkey Added!\n\nDevice: ${result.credential?.deviceName}`)
        setDeviceName('')
        await loadCredentials()
      } else {
        setError(result.message || 'Failed to add passkey')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeletePasskey = async (credentialId: string, deviceName: string) => {
    if (!confirm(`Delete passkey for "${deviceName}"?\n\nYou won't be able to use this device for biometric login anymore.`)) {
      return
    }

    try {
      const user = authService.getUser()
      if (!user) return

      const success = await webauthnService.deletePasskey(credentialId)

      if (success) {
        alert('✅ Passkey deleted successfully')
        await loadCredentials()
      } else {
        alert('❌ Failed to delete passkey')
      }
    } catch (err) {
      console.error('Delete passkey error:', err)
      alert('❌ An error occurred')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <ScreenHeader
        title="Manage Passkeys"
        onBack={() => navigate(-1)}
      />

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto px-6 py-6"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Fingerprint size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 font-['Poppins']">
                About Passkeys
              </p>
              <p className="text-xs text-blue-700 font-['Poppins'] mt-1">
                Passkeys use your device's biometrics (Face ID, Touch ID, Windows Hello) for secure, passwordless login.
              </p>
            </div>
          </div>
        </div>

        {/* Add New Passkey Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 font-['Poppins'] mb-3">
            Add New Passkey
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Device name (optional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              disabled={isAdding}
            />
            <button
              onClick={handleAddPasskey}
              disabled={isAdding}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-3 px-4 rounded-lg font-semibold font-['Poppins'] hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Setting up...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Add Passkey
                </>
              )}
            </button>
            {error && (
              <p className="text-sm text-red-600 font-['Poppins']">{error}</p>
            )}
          </div>
        </div>

        {/* Existing Passkeys */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 font-['Poppins'] mb-3">
            Your Passkeys ({credentials.length})
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-yellow-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : credentials.length === 0 ? (
            <div className="text-center py-12">
              <Smartphone size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-['Poppins']">
                No passkeys registered yet
              </p>
              <p className="text-sm text-gray-400 font-['Poppins'] mt-1">
                Add one above to enable biometric login
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Fingerprint size={20} className="text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 font-['Poppins'] truncate">
                          {cred.deviceName || 'Unknown Device'}
                        </p>
                        <p className="text-xs text-gray-500 font-['Poppins'] mt-1">
                          Added {formatDate(cred.createdAt)}
                        </p>
                        <p className="text-xs text-gray-400 font-['Poppins']">
                          Last used: {formatDate(cred.lastUsedAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePasskey(cred.id, cred.deviceName)}
                      className="flex-shrink-0 ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete passkey"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Warning */}
        {credentials.length > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-['Poppins']">
              ⚠️ <strong>Note:</strong> Deleting a passkey will prevent you from logging in with that device's biometrics. You can always use your password as a fallback.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}