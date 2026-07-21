import { AlertTriangle, Info, Megaphone, Bell } from 'lucide-react'

interface NotificationIconProps {
  type: 'urgent' | 'info' | 'announcement' | 'default'
}

export function NotificationIcon({ type }: NotificationIconProps) {
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
