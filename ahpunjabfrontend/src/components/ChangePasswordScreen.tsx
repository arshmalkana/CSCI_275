import { useState } from 'react'
import { FloatingLabelField } from './FloatingLabelField'

export default function ChangePasswordScreen() {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validatePasswords = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.oldPassword) {
      newErrors.oldPassword = 'Current password is required'
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (formData.oldPassword === formData.newPassword && formData.oldPassword && formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChangePassword = () => {
    if (validatePasswords()) {
      // Add change password logic here
      console.log('Change password:', formData)
    }
  }

  const handleBack = () => {
    // Navigate back to profile
    console.log('Navigate back to profile')
  }

  const handleForgetPassword = () => {
    // Navigate to forget password screen
    console.log('Navigate to forget password')
  }

  return (
    <div className="ChangePasswordScreen w-full max-w-md mx-auto bg-white h-screen flex flex-col px-6 py-8 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900 font-['Poppins']">Change Password</h1>
        <div className="w-10"></div> {/* Spacer for center alignment */}
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded-r-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
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

        {/* Current Password Input */}
        <FloatingLabelField
          field="oldPassword"
          label="Current Password"
          type="password"
          required
          value={formData.oldPassword}
          error={errors.oldPassword}
          onChange={handleInputChange}
          showPasswordToggle
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />

        {/* New Password Input */}
        <FloatingLabelField
          field="newPassword"
          label="New Password"
          type="password"
          required
          value={formData.newPassword}
          error={errors.newPassword}
          onChange={handleInputChange}
          showPasswordToggle
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />

        {/* Confirm Password Input */}
        <FloatingLabelField
          field="confirmPassword"
          label="Confirm New Password"
          type="password"
          required
          value={formData.confirmPassword}
          error={errors.confirmPassword}
          onChange={handleInputChange}
          showPasswordToggle
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
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
        <button
          onClick={handleChangePassword}
          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-4 px-6 rounded-lg font-semibold text-lg font-['Poppins'] hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Update Password
        </button>
      </div>

    </div>
  )
}