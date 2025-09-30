import { useEffect, useState } from 'react'
// CHATGPT GENERATED: no idea how it works and it doesnt even work for every feature its supposed to work!!!!!
interface PWAWrapperProps {
  children: React.ReactNode
}

export default function PWAWrapper({ children }: PWAWrapperProps) {
  const [showInstallPopup, setShowInstallPopup] = useState(false)

  // Detect if running as installed PWA
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://');

  // Show install popup after 2 seconds if not standalone
  useEffect(() => {
    if (!isStandalone) {
      const timer = setTimeout(() => {
        setShowInstallPopup(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isStandalone])

  // If not PWA mode, show install-only screen
  if (!isStandalone) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        {/* Install Required Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 m-4 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">AH</span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Installation Required
            </h2>

            <p className="text-gray-600 mb-4 text-sm">
              This app only works when installed as a Progressive Web App
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-yellow-700 text-sm font-medium mb-2">
                How to Install:
              </p>
              <div className="text-yellow-600 text-xs space-y-1">
                <p><strong>IOS:</strong> Menu → Share → "Add to Home Screen"</p>
                <p><strong>Desktop:</strong> Address bar → Install icon</p>
                <p><strong>Android:</strong> Menu → "Install app/Add to Home Screen"</p>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Current mode: Browser | Required: PWA App
            </div>
          </div>
        </div>
      </div>
    )
  }

  // PWA mode - show success message briefly then render app
  return (
    <div className="min-h-screen">
      {/* PWA Success Popup */}
      {showInstallPopup && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <div className="bg-green-500 text-white rounded-lg p-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs font-bold">✓</span>
                </div>
                <span className="text-sm font-medium">App installed successfully!</span>
              </div>
              <button
                onClick={() => setShowInstallPopup(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render the actual app */}
      {children}
    </div>
  )
}