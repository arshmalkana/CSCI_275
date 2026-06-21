import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, X } from 'lucide-react'
import authService from '../services/authService'

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADMIN_ROLES = ['Tehsil_Admin', 'District_Admin', 'HQ_Admin', 'Super_Admin']
const HQ_ROLES = ['HQ_Admin', 'Super_Admin']

interface MenuItem {
  name: string
  icon: string
  path: string
  roles?: string[]
}

const ALL_MENU_ITEMS: MenuItem[] = [
  { name: 'Home',                   icon: '🏠',  path: '/home' },
  { name: 'Monthly Reporting',      icon: '📊',  path: '/reports/monthly' },
  { name: 'Vaccine Distribution',   icon: '🚚',  path: '/vaccine-distribution' },
  // Admin-only items
  { name: 'Approval Queue',         icon: '✅',  path: '/admin/approval-queue',  roles: ADMIN_ROLES },
  { name: 'Consolidated Dashboard', icon: '📈',  path: '/admin/rollup',           roles: ADMIN_ROLES },
  { name: 'Admin Panel',            icon: '⚙️',  path: '/admin/panel',            roles: HQ_ROLES },
  { name: 'Period Config',          icon: '📅',  path: '/admin/periods',          roles: HQ_ROLES },
  { name: 'Institutes',             icon: '🏛️',  path: '/admin/institutes',        roles: HQ_ROLES },
]

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const navigate = useNavigate()
  const [isAnimating, setIsAnimating] = useState(false)

  const user = authService.getUser()
  const userRole = user?.role || ''

  const menuItems = ALL_MENU_ITEMS.filter(item =>
    !item.roles || item.roles.includes(userRole)
  )

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleMenuItemClick = (path: string) => {
    onClose()
    navigate(path)
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
    onClose()
  }

  const handleProfileClick = () => {
    navigate('/profile')
    onClose()
  }

  if (!isAnimating && !isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-500 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      />

      {/* Side Menu */}
      <div
        className={`fixed left-0 top-0 safe-top h-full w-80 bg-white z-50 shadow-2xl transform transition-all duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          transitionProperty: 'transform, opacity',
          transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleProfileClick}>
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors">
              <User size={24} className="text-white" />
            </div>
            <div>
              <div className="text-black text-lg font-semibold font-['Poppins']">
                {user?.name || 'AH Punjab'}
              </div>
              <div className="text-gray-500 text-sm font-normal font-['Poppins']">
                {user?.role || 'Veterinary Institute'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 py-4 overflow-y-auto">
          <div className="px-4 space-y-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuItemClick(item.path)}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg hover:bg-gray-50 hover:text-yellow-600 transition-all duration-200 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform duration-200">
                  {item.icon}
                </span>
                <span className="text-gray-700 text-sm font-medium font-['Poppins'] group-hover:text-yellow-600">
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-3 px-4 rounded-lg font-semibold font-['Poppins'] hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  )
}
