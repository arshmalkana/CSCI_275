import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { BackButton } from '../components/Button'
import { NotificationIcon } from '../components/NotificationIcon'
import { Bell, X } from 'lucide-react'
import api from '../utils/api'

interface NotificationAction {
  label: string
  type: 'navigate'
  path: string
  requiredPermission?: string
}

interface Notification {
  notification_id: number
  category: string
  title: string
  message: string
  priority: string
  actions?: NotificationAction[]
  is_read: boolean
  created_at: string
  sender_name?: string
}

export default function NotificationsScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true)
        setError(null)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await api.getNotifications() as any
        setNotifications(Array.isArray(data) ? data : [])
      } catch (err) {
        setError('Failed to load notifications')
        console.error('Error fetching notifications:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const handleBack = () => {
    navigate(-1)
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await api.markNotificationAsRead(notification.notification_id)
        setNotifications(prev =>
          prev.map(n => n.notification_id === notification.notification_id ? { ...n, is_read: true } : n)
        )
        // Invalidate unread count cache to refresh the count on HomeScreen
        queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] })
      } catch (err) {
        console.error('Error marking notification as read:', err)
      }
    }

    // Handle action buttons
    if (notification.actions && notification.actions.length > 0) {
      const firstAction = notification.actions[0]
      if (firstAction.type === 'navigate') {
        navigate(firstAction.path)
      }
    }
  }

  const deleteNotification = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await api.deleteNotification(notificationId)
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId))
      // Invalidate unread count cache
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] })
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      // Invalidate unread count cache
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] })
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const clearAllNotifications = async () => {
    try {
      // Delete all notifications one by one
      await Promise.all(notifications.map(n => api.deleteNotification(n.notification_id)))
      setNotifications([])
      // Invalidate unread count cache
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] })
    } catch (err) {
      console.error('Error clearing notifications:', err)
    }
  }

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  // Map category to notification type for icon
  const getCategoryType = (category: string): 'urgent' | 'info' | 'announcement' | 'default' => {
    if (category === 'deadline_reminder' || category === 'report_rejected') return 'urgent'
    if (category === 'announcement' || category === 'target_achievement') return 'announcement'
    return 'info'
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="NotificationsScreen relative w-full max-w-md mx-auto bg-white h-screen flex flex-col">

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-6 px-6 pt-4">
        <BackButton onClick={handleBack} />
        <div className="flex items-center space-x-2">
          <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 font-['Poppins']">Notifications</h1>
          {unreadCount > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
              {unreadCount}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="text-red-600 hover:text-red-700 font-medium text-xs font-['Poppins'] transition-colors duration-200 text-center leading-tight"
            >
              Clear<br/>all
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-yellow-600 hover:text-yellow-700 font-medium text-xs font-['Poppins'] transition-colors duration-200 text-center leading-tight"
            >
              Mark all<br/>read
            </button>
          )}
        </div>
      </div>

      {/* Notifications Summary */}
      {unreadCount > 0 && (
        <div className="flex-shrink-0 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6 mx-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-yellow-800 font-semibold font-['Poppins']">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
              <p className="text-yellow-700 text-sm font-['Poppins']">
                Stay updated with important department information
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div
        className="flex-1 overflow-y-auto px-6 pb-4 space-y-3"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-['Poppins']">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 font-['Poppins'] mb-2">Error</h3>
            <p className="text-gray-500 font-['Poppins'] text-sm">{error}</p>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => {
            const categoryType = getCategoryType(notification.category)
            return (
              <div
                key={notification.notification_id}
                className={`group bg-white rounded-xl p-4 shadow-sm border transition-all duration-200 hover:shadow-md cursor-pointer ${
                  !notification.is_read
                    ? 'border-yellow-200 bg-gradient-to-r from-yellow-50/50 to-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  <NotificationIcon type={categoryType} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-semibold font-['Poppins'] text-base leading-tight ${
                        !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        )}
                        <button
                          onClick={(e) => deleteNotification(notification.notification_id, e)}
                          className="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-all duration-200 md:opacity-0 md:group-hover:opacity-100"
                          title="Delete notification"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>

                    <p className={`font-['Poppins'] text-sm leading-relaxed mb-3 ${
                      !notification.is_read ? 'text-gray-700' : 'text-gray-600'
                    }`}>
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs font-['Poppins']">
                        {formatTimestamp(notification.created_at)}
                      </span>

                      <span className={`px-2 py-1 rounded-full text-xs font-medium font-['Poppins'] ${
                        notification.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        notification.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        notification.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {notification.actions.map((action, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (action.type === 'navigate') {
                                navigate(action.path)
                              }
                            }}
                            className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-medium font-['Poppins'] transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 font-['Poppins'] mb-2">No notifications</h3>
            <p className="text-gray-500 font-['Poppins'] text-sm">
              You're all caught up! We'll notify you when there's something new.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}