import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

// Dialog Types
export type DialogType = 'success' | 'error' | 'warning' | 'info' | 'confirm'

interface DialogBoxProps {
  isOpen: boolean
  type: DialogType
  title: string
  message: string
  onClose: () => void
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
}

// Icon and color configuration based on dialog type
const dialogConfig = {
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    bgGradient: 'from-green-50 to-emerald-50',
    iconBg: 'bg-green-100',
    buttonGradient: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-600',
    bgGradient: 'from-red-50 to-pink-50',
    iconBg: 'bg-red-100',
    buttonGradient: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    bgGradient: 'from-orange-50 to-red-50',
    iconBg: 'bg-orange-100',
    buttonGradient: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    bgGradient: 'from-blue-50 to-indigo-50',
    iconBg: 'bg-blue-100',
    buttonGradient: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
  },
  confirm: {
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    bgGradient: 'from-orange-50 to-red-50',
    iconBg: 'bg-orange-100',
    buttonGradient: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
  }
}

export default function DialogBox({
  isOpen,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false
}: DialogBoxProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isAnimating && !isOpen) return null

  const config = dialogConfig[type]
  const Icon = config.icon

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    } else {
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
      />

      {/* Dialog */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon Header */}
          <div className={`bg-gradient-to-br ${config.bgGradient} p-6 flex justify-center`}>
            <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center`}>
              <Icon size={32} className={config.iconColor} />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 font-['Poppins'] text-center mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 font-['Poppins'] text-center leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className={`flex gap-3 p-6 pt-0 ${showCancel || type === 'confirm' ? '' : 'justify-center'}`}>
            {(showCancel || type === 'confirm') && (
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-xl font-['Poppins'] transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`${showCancel || type === 'confirm' ? 'flex-1' : 'w-full'} bg-gradient-to-r ${config.buttonGradient} text-white font-semibold py-3 px-4 rounded-xl font-['Poppins'] transition-colors`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// Specialized dialog components for common use cases

interface DiscardChangesDialogProps {
  isOpen: boolean
  onDiscard: () => void
  onCancel: () => void
}

export function DiscardChangesDialog({
  isOpen,
  onDiscard,
  onCancel
}: DiscardChangesDialogProps) {
  return (
    <DialogBox
      isOpen={isOpen}
      type="confirm"
      title="Discard Changes?"
      message="You have unsaved changes. If you go back now, all your changes will be lost."
      onClose={onCancel}
      onConfirm={onDiscard}
      confirmText="Discard"
      cancelText="Keep Editing"
      showCancel={true}
    />
  )
}

interface SuccessDialogProps {
  isOpen: boolean
  title?: string
  message: string
  onClose: () => void
  buttonText?: string
}

export function SuccessDialog({
  isOpen,
  title = 'Success',
  message,
  onClose,
  buttonText = 'OK'
}: SuccessDialogProps) {
  return (
    <DialogBox
      isOpen={isOpen}
      type="success"
      title={title}
      message={message}
      onClose={onClose}
      confirmText={buttonText}
    />
  )
}

interface ErrorDialogProps {
  isOpen: boolean
  title?: string
  message: string
  onClose: () => void
  buttonText?: string
}

export function ErrorDialog({
  isOpen,
  title = 'Error',
  message,
  onClose,
  buttonText = 'OK'
}: ErrorDialogProps) {
  return (
    <DialogBox
      isOpen={isOpen}
      type="error"
      title={title}
      message={message}
      onClose={onClose}
      confirmText={buttonText}
    />
  )
}

interface InfoDialogProps {
  isOpen: boolean
  title?: string
  message: string
  onClose: () => void
  buttonText?: string
}

export function InfoDialog({
  isOpen,
  title = 'Information',
  message,
  onClose,
  buttonText = 'OK'
}: InfoDialogProps) {
  return (
    <DialogBox
      isOpen={isOpen}
      type="info"
      title={title}
      message={message}
      onClose={onClose}
      confirmText={buttonText}
    />
  )
}
