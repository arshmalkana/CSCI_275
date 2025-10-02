import { ArrowLeft } from 'lucide-react'

interface ButtonProps {
  onClick: () => void
  children: React.ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

export function PrimaryButton({ onClick, children, className = '', type = 'button', disabled = false }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-4 px-6 rounded-lg font-semibold text-lg font-['Poppins'] hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${className}`}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ onClick, children, className = '', type = 'button', disabled = false }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-white border-2 border-yellow-400 text-yellow-600 py-3 px-6 rounded-lg font-semibold text-base font-['Poppins'] hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${className}`}
    >
      {children}
    </button>
  )
}

interface BackButtonProps {
  onClick: () => void
  className?: string
}

export function BackButton({ onClick, className = '' }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors duration-200 active:scale-95 ${className}`}
    >
      <ArrowLeft size={20} />
    </button>
  )
}
