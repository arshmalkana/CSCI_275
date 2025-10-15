import { useState } from 'react'
import { BackButton } from '../components/Button'
import { NotificationIcon } from '../components/NotificationIcon'
import { Bell, X, ChevronUp, ChevronDown, CheckCheck } from 'lucide-react'

interface Notification {
  id: number
  heading: string
  content: string
  timestamp: string
  type: 'reminder' | 'info' | 'announcement' | 'urgent'
  isRead: boolean
  actualDate: Date // Add actual date for proper sorting
}

type SortOption = 'newest' | 'oldest' | 'unread' | 'urgent'

export default function NotificationsScreen() {
  // Helper function to convert relative time to actual date
  const getDateFromRelativeTime = (relativeTime: string): Date => {
    const now = new Date();
    const number = parseInt(relativeTime.match(/\d+/)?.[0] || '0');
    
    if (relativeTime.includes('hour')) {
      return new Date(now.getTime() - number * 60 * 60 * 1000);
    } else if (relativeTime.includes('day')) {
      return new Date(now.getTime() - number * 24 * 60 * 60 * 1000);
    } else if (relativeTime.includes('week')) {
      return new Date(now.getTime() - number * 7 * 24 * 60 * 60 * 1000);
    } else if (relativeTime.includes('month')) {
      return new Date(now.getTime() - number * 30 * 24 * 60 * 60 * 1000);
    }
    return now;
  };

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      heading: "Monthly Report Submission Reminder",
      content: "Please submit your monthly livestock report by the end of this week. All vaccination records and animal census data must be included.",
      timestamp: "2 hours ago",
      type: "urgent",
      isRead: false,
      actualDate: getDateFromRelativeTime("2 hours ago")
    },
    {
      id: 2,
      heading: "New Vaccine Batch Available",
      content: "A new batch of FMD vaccines has arrived at the district headquarters. CVH and CVD officers can collect their allocated stock from Monday to Friday.",
      timestamp: "1 day ago",
      type: "info",
      isRead: false,
      actualDate: getDateFromRelativeTime("1 day ago")
    },
    {
      id: 3,
      heading: "Training Program Announcement",
      content: "Department is organizing a training program on modern veterinary practices next month. All field officers are encouraged to participate.",
      timestamp: "3 days ago",
      type: "announcement",
      isRead: true,
      actualDate: getDateFromRelativeTime("3 days ago")
    },
    {
      id: 4,
      heading: "System Maintenance Notice",
      content: "The reporting system will be under maintenance this Sunday from 2 AM to 6 AM. Please plan your submissions accordingly.",
      timestamp: "1 week ago",
      type: "info",
      isRead: true,
      actualDate: getDateFromRelativeTime("1 week ago")
    }
  ])

  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showSortOptions, setShowSortOptions] = useState(false)

  const handleBack = () => {
    console.log('Navigate back')
    window.location.reload()
  }

  const handleNotificationClick = (notification: Notification) => {
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    )
    console.log('Notification clicked:', notification.id)
  }

  const deleteNotification = (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const clearAllNotifications = () => {
    if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      setNotifications([])
    }
  }

  const sortNotifications = (notifications: Notification[]): Notification[] => {
  const sorted = [...notifications];
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => b.actualDate.getTime() - a.actualDate.getTime());
    
    case 'oldest':
      return sorted.sort((a, b) => a.actualDate.getTime() - b.actualDate.getTime());
    
    case 'unread':
      return sorted.sort((a, b) => {
        if (!a.isRead && b.isRead) return -1;
        if (a.isRead && !b.isRead) return 1;
        return b.actualDate.getTime() - a.actualDate.getTime();
      });
    
    case 'urgent': {  // ← Added opening brace here
      const priority = { 'urgent': 0, 'reminder': 1, 'announcement': 2, 'info': 3 };
      return sorted.sort((a, b) => {
        const priorityDiff = priority[a.type] - priority[b.type];
        if (priorityDiff !== 0) return priorityDiff;
        return b.actualDate.getTime() - a.actualDate.getTime();
      });
    }  // ← Added closing brace here
    
    default:
      return sorted;
  }
}

  const sortedNotifications = sortNotifications(notifications)
  const unreadCount = notifications.filter(n => !n.isRead).length

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'unread', label: 'Unread First' },
    { value: 'urgent', label: 'Priority Order' }
  ]

  return (
    <div className="NotificationsScreen w-full max-w-md mx-auto bg-white h-screen flex flex-col">

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4 px-6 pt-4">
        <BackButton onClick={handleBack} />
        <div className="flex items-center space-x-2">
          <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 font-['Poppins']">Notifications</h1>
          {unreadCount > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
              {unreadCount}
            </div>
          )}
        </div>
        <div className="w-10"></div> {/* Spacer for balance */}
      </div>

      {/* Notifications Summary with Blue Border */}
      {unreadCount > 0 && (
        <div 
          className="flex-shrink-0 rounded-xl p-4 mb-2 mx-6"
          style={{
            background: 'linear-gradient(90deg, #CAE0FD 0%, #E4E2DF 100%)',
            border: '1px solid #77A7EA'
          }}
        >
          <div className="flex items-center space-x-3">
            {/* Bell Icon with Radial Gradient */}
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(50% 50% at 50% 50%, #F0B100 67.79%, #C99400 100%)'
              }}
            >
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              {/* Bold Text */}
              <p 
                className="font-semibold font-['Poppins']"
                style={{
                  color: '#894B00',
                  fontSize: '14px',
                  fontWeight: 600,
                  lineHeight: '100%'
                }}
              >
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
              {/* Normal Text */}
              <p 
                className="font-['Poppins']"
                style={{
                  color: '#A65F00',
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: '100%',
                  marginTop: '2px'
                }}
              >
                Stay updated with important department information
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Fixed alignment container */}
      {(notifications.length > 0 || unreadCount > 0) && (
        <div className="flex-shrink-0 px-6 mb-4">
          <div className="flex items-center justify-between">
            {/* Left side - Sort Button */}
            <div className="relative">
              <button
                onClick={() => setShowSortOptions(!showSortOptions)}
                className="flex items-center justify-center space-x-1 font-['Poppins'] transition-all duration-200 active:scale-95 border border-gray-400"
                style={{
                  background: 'linear-gradient(180deg, #E2E2E2 0%, #A4A4A4 100%)',
                  width: '81px',
                  height: '28px',
                  borderRadius: '5px',
                  fontWeight: 600,
                  fontSize: '8px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#FFFFFF'
                }}
              >
                <span>Sort</span>
                {/* Two arrows - up and down (larger and bolder) */}
                <div className="flex flex-col items-center -space-y-1">
                  <ChevronUp size={12} strokeWidth={3} className="text-white" />
                  <ChevronDown size={12} strokeWidth={3} className="text-white" />
                </div>
              </button>
              
              {/* Sort Dropdown */}
              {showSortOptions && (
                <div className="absolute left-0 top-8 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value)
                        setShowSortOptions(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-['Poppins'] transition-colors duration-150 ${
                        sortBy === option.value
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right side - Fixed width container to maintain alignment */}
            <div className="w-[196px] flex justify-end">
              <div className="flex items-center space-x-2">
                {/* Clear All Button */}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="flex items-center justify-center space-x-1 font-['Poppins'] transition-all duration-200 active:scale-95 border border-red-600"
                    style={{
                      background: 'linear-gradient(180deg, #FB2C36 0%, #BE2028 100%)',
                      width: '81px',
                      height: '28px',
                      borderRadius: '5px',
                      fontWeight: 600,
                      fontSize: '8px',
                      lineHeight: '100%',
                      letterSpacing: '0%',
                      color: '#FFFFFF'
                    }}
                  >
                    <span>Clear all</span>
                    {/* Cross icon (larger and bolder) */}
                    <X size={14} strokeWidth={3} className="text-white" />
                  </button>
                )}
                
                {/* Mark All Read Button */}
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center justify-center space-x-1 font-['Poppins'] transition-all duration-200 active:scale-95 border border-yellow-700"
                    style={{
                      background: 'linear-gradient(180deg, #D08700 0%, #956100 100%)',
                      width: '104px',
                      height: '28px',
                      borderRadius: '5px',
                      fontWeight: 600,
                      fontSize: '8px',
                      lineHeight: '100%',
                      letterSpacing: '0%',
                      color: '#FFFFFF'
                    }}
                  >
                    <span>Mark all read</span>
                    {/* Two ticks only (larger and bolder) */}
                    <CheckCheck size={14} strokeWidth={3} className="text-white" />
                  </button>
                )}
              </div>
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
        {sortedNotifications.length > 0 ? (
          sortedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`group rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer ${
                !notification.isRead
                  ? 'border border-[#FEF085]'
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
              style={
                !notification.isRead ? {
                  background: 'linear-gradient(90deg, #FEFCE9 0%, #FFEFDB 100%)'
                } : {}
              }
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-3">
                {/* Notification Icon */}
                <NotificationIcon type={notification.type as 'urgent' | 'info' | 'announcement' | 'default'} />

                {/* Notification Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 
                      className={`font-semibold font-['Poppins'] text-base leading-tight ${
                        !notification.isRead ? 'text-[#894B00]' : 'text-gray-700'
                      }`}
                    >
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

                  <p 
                    className={`font-['Poppins'] text-sm leading-relaxed mb-3 ${
                      !notification.isRead ? 'text-[#A65F00]' : 'text-gray-600'
                    }`}
                  >
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