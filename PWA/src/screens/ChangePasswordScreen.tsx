import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FloatingLabelField } from '../components/FloatingLabelField'
import { PrimaryButton } from '../components/Button'
import { Lock, User, CheckCircle, AlertTriangle } from 'lucide-react'
import { BackHeader } from '../components/Headers'
import api from '../utils/api'

export default function ChangePasswordScreen() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validatePasswords = () => {
    const newErrors: {[key: string]: string} = {}
    if (!formData.oldPassword) newErrors.oldPassword = 'Current password is required'
    if (!formData.newPassword) newErrors.newPassword = 'New password is required'
    else if (formData.newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters'
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your new password'
    else if (formData.newPassword !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (formData.oldPassword === formData.newPassword && formData.oldPassword && formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChangePassword = async () => {
    if (!validatePasswords()) return
    setIsLoading(true)
    setSuccessMessage('')
    try {
      await api.changePassword(formData.oldPassword, formData.newPassword)
      setSuccessMessage('Password updated successfully.')
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password'
      setErrors({ oldPassword: message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => navigate(-1)
  const handleForgetPassword = () => navigate('/forgot-password')

  return (
    <div className="ChangePasswordScreen w-full max-w-md mx-auto bg-white h-screen flex flex-col px-6 py-8 overflow-hidden"
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      {/* Header */}
      <BackHeader title="Change Password" onBack={handleBack}/>

      {/* Success banner */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 rounded-r-lg">
          <p className="text-sm text-green-800 font-['Poppins']">{successMessage}</p>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded-r-lg">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 font-['Poppins']">Security Tip</h3>
            <p className="text-sm text-blue-700 font-['Poppins'] mt-1">
              Use a strong password with at least 8 characters, including letters, numbers, and symbols.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">

        {/* Current Password Input , hope it works now*/}
        <FloatingLabelField
          field="oldPassword"
          label="Current Password"
          type="password"
          required
          value={formData.oldPassword}
          error={errors.oldPassword}
          onChange={handleInputChange}
          showPasswordToggle
          icon={<Lock size={20} />}
        />

        {/* New Password Input , please workkkkk*/}
        <FloatingLabelField
          field="newPassword"
          label="New Password"
          type="password"
          required
          value={formData.newPassword}
          error={errors.newPassword}
          onChange={handleInputChange}
          showPasswordToggle
          icon={<User size={20} />}
        />

        {/* Confirm krja Password */}
        <FloatingLabelField
          field="confirmPassword"
          label="Confirm New Password"
          type="password"
          required
          value={formData.confirmPassword}
          error={errors.confirmPassword}
          onChange={handleInputChange}
          showPasswordToggle
          icon={<CheckCircle size={20} />}
        />

        {/* Forgot Password Link */}
        <div className="text-center">
          <button
            onClick={handleForgetPassword}
            className="text-sm text-yellow-600 hover:text-yellow-700 font-medium font-['Poppins'] transition-colors duration-200"
          >
            Can't remember your current password?
          </button>
        </div>

      </div>

      {/* Update Password Button */}
      <div className="mt-8">
        <PrimaryButton onClick={handleChangePassword} disabled={isLoading}>
          {isLoading ? 'Updating…' : 'Update Password'}
        </PrimaryButton>
      </div>

    </div>
  )
}