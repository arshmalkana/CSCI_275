import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  subMessage?: string
}

export function LoadingOverlay({ isLoading, message = 'Loading...', subMessage = 'Please wait' }: LoadingOverlayProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setIsAnimating(true)
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!isAnimating && !isLoading) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ease-in-out ${
          isLoading ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
      />

      {/* Loading Content */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out ${
          isLoading ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className={`bg-white rounded-xl p-6 shadow-2xl flex flex-col items-center space-y-3 max-w-xs mx-4 transform transition-all duration-300 ease-in-out ${
          isLoading ? 'scale-100' : 'scale-95'
        }`}>
          <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
          <div className="text-center">
            <p className="text-gray-900 font-semibold font-['Poppins'] text-lg">{message}</p>
            <p className="text-gray-600 font-['Poppins'] text-sm mt-1">{subMessage}</p>
          </div>
        </div>
      </div>
    </>
  )
}