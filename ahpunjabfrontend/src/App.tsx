import { useEffect, useState } from 'react'

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Detect if running as installed PWA
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      document.referrer.includes('android-app://');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Status Bar Spacer for iOS PWA */}
      {isStandalone && (
        <div 
          className="bg-yellow-500" 
          style={{ height: 'env(safe-area-inset-top)' }}
        ></div>
      )}

      {/* Header - only show in PWA mode */}
      {isStandalone && (
        <div className="bg-yellow-500 text-white px-4 py-3 shadow-md">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">AH Punjab</h1>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs ${
              isOnline
                ? 'bg-green-500/20 text-green-100'
                : 'bg-red-500/20 text-red-100'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                isOnline ? 'bg-green-300' : 'bg-red-300'
              }`}></div>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      )}
      {/* Install prompt for browsers */}
      {!isStandalone && (
        <div className="mb-4 p-3 m-20 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700 text-xl font-bold mb-2">
            The app will only work after installing it
          </p>
          <p className="text-yellow-600 text-xs">
            Goto: Menu then "Install app" or "Share" then "Add to Home Screen"
          </p>
        </div>
      )}
      {/* Main Content */}
      {isStandalone && (<div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full place-self-center flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">AH</span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Welcome
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Animal Husbandry Department<br />Punjab Reporting System
            </p>

            <div className="space-y-3">
              <button className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg font-medium active:bg-yellow-600 transition duration-200 touch-manipulation">
                Login
              </button>
              <button className="w-full bg-white border border-yellow-500 text-yellow-600 py-3 px-4 rounded-lg font-medium active:bg-yellow-50 transition duration-200 touch-manipulation">
                Register
              </button>
            </div>

            {/* Debug info */}
            <div className="mt-4 text-xs text-gray-400">
              Mode: {isStandalone ? 'PWA App' : 'Browser'}
            </div>
          </div>
        </div>
      </div>
      
      )}

      {/* Bottom Safe Area for iOS PWA */}
      {isStandalone && <div className="h-safe-bottom bg-gray-50"></div>}
    </div>
  )
}

export default App
