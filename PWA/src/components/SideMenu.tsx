import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, X, Home, BarChart2, Truck, LogOut, Syringe, ClipboardList, type LucideIcon
} from 'lucide-react'
import authService from '../services/authService'

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  name: string
  icon: LucideIcon
  path: string
  roles?: string[]
}

const ALL_MENU_ITEMS: MenuItem[] = [
  { name: 'Home',                 icon: Home,          path: '/home' },
  { name: 'Monthly Reporting',    icon: BarChart2,     path: '/reports/monthly',        roles: ['CVD', 'CVH', 'PAIW'] },
  { name: 'Vaccine Distribution', icon: Truck,         path: '/vaccine-distribution',   roles: ['CVH', 'VaccineBank'] },
  { name: 'Semen Distribution',   icon: Syringe,       path: '/semen-distribution',     roles: ['SemenBank'] },
  { name: 'Semen Ledger',         icon: ClipboardList, path: '/semen-ledger',           roles: ['CVD', 'CVH', 'PAIW'] },
]

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const navigate = useNavigate()
  const [isAnimating, setIsAnimating] = useState(false)

  const user = authService.getUser()
  const MENU_ITEMS = ALL_MENU_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role ?? ''))

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

  const handleLogout = async () => {
    await authService.logout()
    onClose()
    navigate('/login')
  }

  const handleProfileClick = () => {
    navigate('/profile')
    onClose()
  }

  if (!isAnimating && !isOpen) return null

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-500 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      />

      <div
        className={`fixed left-0 top-0 safe-top h-full w-80 bg-white z-50 shadow-2xl transform transition-all duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
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
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => handleMenuItemClick(item.path)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg hover:bg-gray-50 hover:text-yellow-600 transition-all duration-200 group"
                >
                  <Icon size={20} className="text-gray-500 group-hover:text-yellow-600 transition-colors flex-shrink-0" />
                  <span className="text-gray-700 text-sm font-medium font-['Poppins'] group-hover:text-yellow-600">
                    {item.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Logout */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-3 px-4 rounded-lg font-semibold font-['Poppins'] hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </>
  )
}
