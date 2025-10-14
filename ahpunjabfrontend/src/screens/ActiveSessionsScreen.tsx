import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, Monitor, Trash2, Shield, AlertTriangle, Clock, MapPin } from 'lucide-react'
import sessionService, { type Session } from '../services/sessionService'
import { ScreenHeader } from '../components/ScreenHeader'

export default function ActiveSessionsScreen() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<number | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const sessionsData = await sessionService.getSessions()
      setSessions(sessionsData)
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeSession = async (tokenId: number, deviceName: string) => {
    if (!confirm(`Revoke session for "${deviceName}"?\n\nYou will be logged out from that device.`)) {
      return
    }

    setRevokingId(tokenId)
    try {
      const success = await sessionService.revokeSession(tokenId)

      if (success) {
        alert('✅ Session revoked successfully')
        await loadSessions()
      } else {
        alert('❌ Failed to revoke session')
      }
    } catch (err) {
      console.error('Revoke session error:', err)
      alert('❌ An error occurred')
    } finally {
      setRevokingId(null)
    }
  }

  const handleRevokeAllOthers = async () => {
    const otherSessionsCount = sessions.filter(s => !s.is_current).length

    if (otherSessionsCount === 0) {
      alert('No other sessions to revoke')
      return
    }

    if (!confirm(
      `Logout from all other devices?\n\n` +
      `This will revoke ${otherSessionsCount} other session(s).\n\n` +
      `You will remain logged in on this device.`
    )) {
      return
    }

    setIsLoading(true)
    try {
      const success = await sessionService.revokeAllOtherSessions()

      if (success) {
        alert(`✅ ${otherSessionsCount} session(s) revoked successfully`)
        await loadSessions()
      } else {
        alert('❌ Failed to revoke sessions')
      }
    } catch (err) {
      console.error('Revoke all sessions error:', err)
      alert('❌ An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    // For very recent times (< 1 minute), show actual time
    if (diffMins < 1) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffDays < 30) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.toLowerCase().includes('iphone') ||
        deviceName.toLowerCase().includes('android') ||
        deviceName.toLowerCase().includes('mobile')) {
      return <Smartphone size={20} className="text-yellow-600" />
    }
    return <Monitor size={20} className="text-yellow-600" />
  }

  const currentSession = sessions.find(s => s.is_current)
  const otherSessions = sessions.filter(s => !s.is_current)

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <ScreenHeader
        title="Active Sessions"
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
            <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 font-['Poppins']">
                Manage Your Sessions
              </p>
              <p className="text-xs text-blue-700 font-['Poppins'] mt-1">
                These are all devices where you're currently logged in. Revoke any suspicious sessions immediately.
              </p>
            </div>
          </div>
        </div>

        {isLoading && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-yellow-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            {/* Current Session */}
            {currentSession && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 font-['Poppins'] mb-3">
                  Current Session
                </h3>
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        {getDeviceIcon(currentSession.device_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 font-['Poppins'] truncate">
                            {currentSession.device_name}
                          </p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-medium font-['Poppins'] rounded-full">
                            <Shield size={12} />
                            This Device
                          </span>
                        </div>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-1 text-xs text-gray-600 font-['Poppins']">
                            <MapPin size={12} />
                            {currentSession.ip_address}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600 font-['Poppins']">
                            <Clock size={12} />
                            Last active: {formatDate(currentSession.last_used_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other Sessions */}
            {otherSessions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 font-['Poppins']">
                    Other Sessions ({otherSessions.length})
                  </h3>
                  {otherSessions.length > 1 && (
                    <button
                      onClick={handleRevokeAllOthers}
                      disabled={isLoading}
                      className="text-sm text-red-600 hover:text-red-700 font-medium font-['Poppins'] transition-colors disabled:opacity-50"
                    >
                      Logout All
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {otherSessions.map((session) => (
                    <div
                      key={session.token_id}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            {getDeviceIcon(session.device_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 font-['Poppins'] truncate">
                              {session.device_name}
                            </p>
                            <div className="mt-1 space-y-1">
                              <div className="flex items-center gap-1 text-xs text-gray-600 font-['Poppins']">
                                <MapPin size={12} />
                                {session.ip_address}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-600 font-['Poppins']">
                                <Clock size={12} />
                                Last active: {formatDate(session.last_used_at)}
                              </div>
                              <p className="text-xs text-gray-500 font-['Poppins']">
                                Created: {formatDate(session.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevokeSession(session.token_id, session.device_name)}
                          disabled={revokingId === session.token_id}
                          className="flex-shrink-0 ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Revoke session"
                        >
                          {revokingId === session.token_id ? (
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Other Sessions */}
            {otherSessions.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <Shield size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-['Poppins']">
                  No other active sessions
                </p>
                <p className="text-sm text-gray-400 font-['Poppins'] mt-1">
                  You're only logged in on this device
                </p>
              </div>
            )}

            {/* Security Warning */}
            {otherSessions.length > 0 && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-['Poppins'] font-medium">
                      Security Tip
                    </p>
                    <p className="text-xs text-yellow-700 font-['Poppins'] mt-1">
                      Don't recognize a session? Revoke it immediately and consider changing your password.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
