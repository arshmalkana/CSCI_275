import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FloatingLabelField } from '../components/FloatingLabelField'
import { PrimaryButton } from '../components/Button'
import { BackHeader } from '../components/Headers'
import { Lock, CheckCircle } from 'lucide-react'
import api from '../utils/api'

export default function ResetPasswordScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  if (!token) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="text-center p-8 max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2 font-['Poppins']">Invalid Link</h2>
          <p className="text-gray-600 mb-6 font-['Poppins'] text-sm">
            This reset link is invalid or has expired.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-yellow-600 hover:text-yellow-700 font-medium font-['Poppins']"
          >
            Request a new link
          </button>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="text-center p-8 max-w-sm mx-auto">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2 font-['Poppins']">Password Updated</h2>
          <p className="text-gray-600 mb-6 font-['Poppins'] text-sm">
            Your password has been changed successfully. You can now log in with your new password.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-xl font-semibold font-['Poppins']"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const newErrors: { [key: string]: string } = {}
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsLoading(true)
    try {
      await api.resetPassword(token, formData.newPassword)
      setIsSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : 'Failed to reset password. The link may have expired.'
      setErrors({ newPassword: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-6 pt-8">
        <BackHeader title="Reset Password" onBack={() => navigate('/login')} />
      </div>

      <div
        className="flex-1 overflow-y-auto px-6"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        <p className="text-sm text-gray-500 mb-8 font-['Poppins']">
          Enter your new password below.
        </p>

        <div className="space-y-6 pb-32">
          <FloatingLabelField
            field="newPassword"
            label="New Password"
            type="password"
            required
            value={formData.newPassword}
            error={errors.newPassword}
            onChange={handleInputChange}
            showPasswordToggle
            icon={<Lock size={20} />}
          />
          <FloatingLabelField
            field="confirmPassword"
            label="Confirm New Password"
            type="password"
            required
            value={formData.confirmPassword}
            error={errors.confirmPassword}
            onChange={handleInputChange}
            showPasswordToggle
            icon={<Lock size={20} />}
          />
        </div>
      </div>

      <div
        className="flex-shrink-0 px-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <PrimaryButton onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Updating…' : 'Set New Password'}
        </PrimaryButton>
      </div>
    </div>
  )
}
