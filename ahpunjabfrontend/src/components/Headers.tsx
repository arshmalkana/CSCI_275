import { Menu, Bell, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../utils/api'

interface ProfileData {
  profilePictureUrl: string | null
}

interface MainHeaderProps {
  onMenuClick: () => void
  notifications?: number
}

interface BackHeaderProps {
  title: string
  onBack?: () => void
}

/**
 * MainHeader - Used on home and main screens
 * Features: Hamburger menu, title, notifications, profile picture
 */
export function MainHeader({ onMenuClick, notifications = 0 }: MainHeaderProps) {
  const navigate = useNavigate()
  const [profilePic, setProfilePic] = useState<string | null>(null)

  // Fetch profile picture on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await api.getProfile() as ProfileData
        if (profile.profilePictureUrl) {
          setProfilePic(profile.profilePictureUrl)
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
        // Silently fail - will show default avatar
      }
    }

    fetchProfile()
  }, [])

  return (
    <div className="Header w-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-md">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Hamburger Menu */}
        <button
          className="p-2 hover:bg-yellow-400 rounded-lg transition-colors"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={24} className="text-gray-800" />
        </button>

        {/* App Title */}
        <h1 className="text-gray-900 text-lg font-bold font-['Poppins']">
          AH Punjab
        </h1>

        {/* Right Icons */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <button
            className="relative p-2 hover:bg-yellow-400 rounded-lg transition-colors"
            onClick={() => navigate('/notifications')}
            aria-label="Notifications"
          >
            <Bell size={22} className="text-gray-800" />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </button>

          {/* Profile Icon */}
          <button
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            onClick={() => navigate('/profile')}
            aria-label="Profile"
          >
            {profilePic ? (
              <img
                src={profilePic}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * BackHeader - Used on detail/edit screens
 * Features: Back button, title
 */
export function BackHeader({ title, onBack }: BackHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="Header w-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-md">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="p-2 hover:bg-yellow-400 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={24} className="text-gray-800" />
        </button>

        {/* Title */}
        <h1 className="text-gray-900 text-lg font-bold font-['Poppins']">
          {title}
        </h1>

        {/* Spacer for centering */}
        <div className="w-10" />
      </div>
    </div>
  )
}