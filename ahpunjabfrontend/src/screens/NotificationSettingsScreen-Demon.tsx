import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton } from '../components/Button'
import { Bell, BellOff, TestTube } from 'lucide-react'
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushSubscribed
} from '../utils/pushNotifications'
import api from '../utils/api'

export default function NotificationSettingsScreen() {
  const navigate = useNavigate()
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [testStatus, setTestStatus] = useState<string | null>(null)

  useEffect(() => {
    checkPushStatus()
  }, [])

  const checkPushStatus = async () => {
    setIsLoading(true)
    const supported = isPushSupported()
    setIsSupported(supported)

    if (supported) {
      const perm = getNotificationPermission()
      setPermission(perm)

      const subscribed = await isPushSubscribed()
      setIsSubscribed(subscribed)
    }
    setIsLoading(false)
  }

  const handleEnablePush = async () => {
    setIsLoading(true)
    try {
      const success = await subscribeToPushNotifications()
      if (success) {
        setIsSubscribed(true)
        setPermission('granted')
      } else {
        alert('Failed to enable push notifications. Please check your browser settings.')
      }
    } catch (error) {
      console.error('Error enabling push:', error)
      alert('Failed to enable push notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisablePush = async () => {
    setIsLoading(true)
    try {
      const success = await unsubscribeFromPushNotifications()
      if (success) {
        setIsSubscribed(false)
      } else {
        alert('Failed to disable push notifications')
      }
    } catch (error) {
      console.error('Error disabling push:', error)
      alert('Failed to disable push notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendTest = async () => {
    setTestStatus('sending')
    try {
      console.log('[NotificationSettings] Sending test push notification...')
      const result = await api.sendTestPush()
      console.log('[NotificationSettings] Test push result:', result)
      setTestStatus('sent')
      setTimeout(() => setTestStatus(null), 3000)
    } catch (error) {
      console.error('[NotificationSettings] Error sending test notification:', error)
      setTestStatus('error')
      setTimeout(() => setTestStatus(null), 3000)
    }
  }

  return (
    <div className="NotificationSettingsScreen relative w-full max-w-md mx-auto bg-white h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-6 px-6 pt-4">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 font-['Poppins']">
          Push Notifications
        </h1>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin"></div>
          </div>
        ) : !isSupported ? (
          <div className="text-center py-12">
            <BellOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 font-['Poppins'] mb-2">
              Not Supported
            </h2>
            <p className="text-gray-500 font-['Poppins'] text-sm">
              Push notifications are not supported on this browser or device.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`rounded-xl p-4 ${
              isSubscribed
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                : 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'
            }`}>
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isSubscribed ? 'bg-green-500' : 'bg-yellow-500'
                }`}>
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 font-['Poppins']">
                    {isSubscribed ? 'Enabled' : 'Disabled'}
                  </h3>
                  <p className="text-sm text-gray-600 font-['Poppins']">
                    Push notifications are {isSubscribed ? 'active' : 'inactive'}
                  </p>
                </div>
              </div>
            </div>

            {/* Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 font-['Poppins'] mb-2">
                What are push notifications?
              </h3>
              <p className="text-sm text-blue-700 font-['Poppins'] mb-2">
                Get notified instantly when:
              </p>
              <ul className="text-sm text-blue-700 font-['Poppins'] space-y-1 ml-4">
                <li>• Reports are submitted or approved</li>
                <li>• Deadlines are approaching</li>
                <li>• New announcements are posted</li>
                <li>• Important updates are available</li>
              </ul>
              <p className="text-sm text-blue-700 font-['Poppins'] mt-2">
                Even when the app is closed!
              </p>
            </div>

            {/* Permission Status */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 font-['Poppins'] mb-2">
                Permission Status
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-['Poppins']">Browser Permission</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium font-['Poppins'] ${
                  permission === 'granted' ? 'bg-green-100 text-green-700' :
                  permission === 'denied' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {permission === 'granted' ? 'Granted' :
                   permission === 'denied' ? 'Denied' :
                   'Not requested'}
                </span>
              </div>
              {permission === 'denied' && (
                <p className="text-xs text-red-600 font-['Poppins'] mt-2">
                  Please enable notifications in your browser settings to use push notifications.
                </p>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-3">
              {isSubscribed ? (
                <button
                  onClick={handleDisablePush}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-xl font-semibold font-['Poppins'] transition-colors"
                >
                  Disable Push Notifications
                </button>
              ) : (
                <button
                  onClick={handleEnablePush}
                  disabled={isLoading || permission === 'denied'}
                  className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl font-semibold font-['Poppins'] transition-colors shadow-md"
                >
                  Enable Push Notifications
                </button>
              )}

              {isSubscribed && (
                <button
                  onClick={handleSendTest}
                  disabled={testStatus === 'sending'}
                  className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl font-semibold font-['Poppins'] transition-colors flex items-center justify-center gap-2"
                >
                  <TestTube className="w-5 h-5" />
                  {testStatus === 'sending' ? 'Sending...' :
                   testStatus === 'sent' ? 'Test Sent!' :
                   testStatus === 'error' ? 'Failed' :
                   'Send Test Notification'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
