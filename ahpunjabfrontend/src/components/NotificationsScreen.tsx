import { useState } from 'react'
import { ArrowLeft, AlertTriangle, Info, Megaphone, Bell, X } from 'lucide-react'

interface Notification {
  id: number
  heading: string
  content: string
  timestamp: string
  type: 'reminder' | 'info' | 'announcement' | 'urgent'
  isRead: boolean
}

export default function NotificationsScreen() {
  // Chatgpt generated notifications data cuz m lazyyyyy
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      heading: "Monthly Report Submission Reminder",
      content: "Please submit your monthly livestock report by the end of this week. All vaccination records and animal census data must be included.",
      timestamp: "2 hours ago",
      type: "urgent",
      isRead: false
    },
    {
      id: 2,
      heading: "New Vaccine Batch Available",
      content: "A new batch of FMD vaccines has arrived at the district headquarters. CVH and CVD officers can collect their allocated stock from Monday to Friday.",
      timestamp: "1 day ago",
      type: "info",
      isRead: false
    },
    {
      id: 3,
      heading: "Training Program Announcement",
      content: "Department is organizing a training program on modern veterinary practices next month. All field officers are encouraged to participate.",
      timestamp: "3 days ago",
      type: "announcement",
      isRead: true
    },
    {
      id: 4,
      heading: "System Maintenance Notice",
      content: "The reporting system will be under maintenance this Sunday from 2 AM to 6 AM. Please plan your submissions accordingly.",
      timestamp: "1 week ago",
      type: "info",
      isRead: true
    }
  ])

  const handleBack = () => {
    console.log('Navigate back')
  }

  const handleNotificationClick = (notification: Notification) => {
    // see if read when clicked
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    )
    console.log('Notification clicked:', notification.id)
  }

  const deleteNotification = (notificationId: number, event: React.MouseEvent) => {
    // Prevent the notification click event from firing
    event.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const clearAllNotifications = () => {
    // if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      setNotifications([])
    // }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
        )
      case 'info':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
            <Info className="w-5 h-5 text-white" />
          </div>
        )
      case 'announcement':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
        )
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="NotificationsScreen w-full max-w-md mx-auto bg-white h-screen flex flex-col overflow-y-auto">

      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-gray-100 safe-top">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-gray-900 font-['Poppins']">Notifications</h1>
            {unreadCount > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                {unreadCount}
              </div>
            )}
          </div>
          <div className="w-10"></div>
        </div>

        <div className="flex items-center justify-end space-x-2">
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="text-red-600 hover:text-red-700 font-medium text-sm font-['Poppins'] transition-colors duration-200"
            >
              Clear all
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-yellow-600 hover:text-yellow-700 font-medium text-sm font-['Poppins'] transition-colors duration-200"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications Content */}
      <div className="px-6 py-4">
        {/* Notifications Summary */}
        {unreadCount > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6">
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
        <div className="space-y-3 pb-6">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`group bg-white rounded-xl p-4 shadow-sm border transition-all duration-200 hover:shadow-md cursor-pointer ${
                !notification.isRead
                  ? 'border-yellow-200 bg-gradient-to-r from-yellow-50/50 to-white'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-3">
                {/* Notification Icon */}
                {getNotificationIcon(notification.type)}

                {/* Notification Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-semibold font-['Poppins'] text-base leading-tight ${
                      !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {notification.heading}
                    </h3>
                    <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      )}
                      {/* Delete Button */}
                      <button
                        onClick={(e) => deleteNotification(notification.id, e)}
                        className="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-all duration-200 md:opacity-0 md:group-hover:opacity-100"
                        title="Delete notification"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  <p className={`font-['Poppins'] text-sm leading-relaxed mb-3 ${
                    !notification.isRead ? 'text-gray-700' : 'text-gray-600'
                  }`}>
                    {notification.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs font-['Poppins']">
                      {notification.timestamp}
                    </span>

                    {/* Type Badge */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium font-['Poppins'] ${
                      notification.type === 'urgent' ? 'bg-red-100 text-red-700' :
                      notification.type === 'info' ? 'bg-blue-100 text-blue-700' :
                      notification.type === 'announcement' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          // nothing there anymore
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 4h7m0 0v8m0-8l3 3m6 0V4a1.5 1.5 0 00-1.5-1.5H9.5A1.5 1.5 0 008 4v1m0 0l-3 3v8a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0019 15.5V8l-3-3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 font-['Poppins'] mb-2">No notifications</h3>
            <p className="text-gray-500 font-['Poppins'] text-sm">
              You're all caught up! We'll notify you when there's something new.
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}