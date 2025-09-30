import { useEffect, useState } from 'react'
import { User, X } from 'lucide-react'

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const [isAnimating, setIsAnimating] = useState(false);
//aiiiiiiiiiii
  const menuItems = [
    { name: "Home", icon: "🏠" },
    { name: "Monthly Reporting", icon: "📊" },
    { name: "Attendance Report", icon: "👥" },
    { name: "Vaccination Reports", icon: "💉" },
    { name: "Vaccine Distribution", icon: "🚚" },
    { name: "Semen Distribution", icon: "🐄" },
    { name: "Summary Report", icon: "📈" },
    { name: "Manage Transfer", icon: "🔄" },
    { name: "Contact other Institutes", icon: "📞" },
  ];

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleMenuItemClick = (item: string) => {
    console.log('Menu item clicked:', item);
    onClose(); // Close menu after selection
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    onClose();
  };

  if (!isAnimating && !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-500 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        style={{
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)'
        }}
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

        {/* Header with Close Button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div>
              <div className="text-black text-lg font-semibold font-['Poppins']">AH Punjab</div>
              <div className="text-gray-500 text-sm font-normal font-['Poppins']">Veterinary Institute</div>
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
        <div className="flex-1 py-4">
          <div className="px-4 space-y-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuItemClick(item.name)}
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
  );
}