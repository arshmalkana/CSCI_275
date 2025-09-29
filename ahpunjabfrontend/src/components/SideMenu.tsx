import { useEffect, useState } from 'react'

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
        className={`fixed left-0 top-0 h-full w-80 bg-white z-50 shadow-2xl transform transition-all duration-500 ease-in-out ${
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
              <svg width="24" height="24" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 0C10.071 0.00454288 7.69573 0.704308 5.66355 2.01406C3.63137 3.32381 2.02998 5.18702 1.05444 7.37674C0.0788904 9.56647 -0.228707 11.9882 0.169111 14.3469C0.56693 16.7057 1.65299 18.8996 3.29502 20.6616C4.46777 21.9129 5.89112 22.9116 7.47538 23.5947C9.05963 24.2777 10.7704 24.6304 12.5 24.6304C14.2296 24.6304 15.9404 24.2777 17.5246 23.5947C19.1089 22.9116 20.5322 21.9129 21.705 20.6616C23.347 18.8996 24.4331 16.7057 24.8309 14.3469C25.2287 11.9882 24.9211 9.56647 23.9456 7.37674C22.97 5.18702 21.3686 3.32381 19.3364 2.01406C17.3043 0.704308 14.929 0.00454288 12.5 0ZM12.5 22.1903C9.90565 22.1864 7.41398 21.192 5.5493 19.4165C6.11543 18.0598 7.07849 16.8995 8.31612 16.0829C9.55375 15.2663 11.0101 14.8302 12.5 14.8302C13.9899 14.8302 15.4463 15.2663 16.6839 16.0829C17.9215 16.8995 18.8846 18.0598 19.4507 19.4165C17.586 21.192 15.0943 22.1864 12.5 22.1903ZM9.99524 9.86234C9.99524 9.37469 10.1421 8.898 10.4174 8.49253C10.6926 8.08707 11.0838 7.77105 11.5415 7.58444C11.9992 7.39782 12.5028 7.34899 12.9887 7.44413C13.4745 7.53926 13.9208 7.77409 14.2711 8.11891C14.6214 8.46373 14.86 8.90305 14.9566 9.38133C15.0533 9.8596 15.0037 10.3554 14.8141 10.8059C14.6245 11.2564 14.3035 11.6415 13.8916 11.9124C13.4797 12.1833 12.9954 12.3279 12.5 12.3279C11.8357 12.3279 11.1986 12.0682 10.7289 11.6058C10.2591 11.1434 9.99524 10.5163 9.99524 9.86234ZM21.1539 17.2591C20.035 15.3751 18.3128 13.9096 16.2571 13.0923C16.8948 12.3805 17.3103 11.5028 17.4537 10.5643C17.5972 9.62591 17.4625 8.66667 17.0659 7.80172C16.6692 6.93678 16.0274 6.20287 15.2175 5.68806C14.4077 5.17326 13.4641 4.89942 12.5 4.89942C11.5359 4.89942 10.5923 5.17326 9.78245 5.68806C8.97257 6.20287 8.33079 6.93678 7.93414 7.80172C7.53748 8.66667 7.4028 9.62591 7.54625 10.5643C7.6897 11.5028 8.10519 12.3805 8.74286 13.0923C6.68721 13.9096 4.96502 15.3751 3.84606 17.2591C2.9543 15.7638 2.48312 14.0618 2.48097 12.3279C2.48097 9.71227 3.53654 7.20374 5.41548 5.3542C7.29441 3.50465 9.84279 2.46558 12.5 2.46558C15.1572 2.46558 17.7056 3.50465 19.5845 5.3542C21.4635 7.20374 22.519 9.71227 22.519 12.3279C22.5169 14.0618 22.0457 15.7638 21.1539 17.2591Z" fill="white"/>
              </svg>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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