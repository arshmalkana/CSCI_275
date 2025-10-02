import { useState } from 'react'
import { FloatingLabelField } from './FloatingLabelField'
import { ArrowLeft, CheckCircle2, Lock, Mail, AlertCircle } from 'lucide-react'

export default function ForgetPasswordScreen() {
  const [formData, setFormData] = useState({
    email: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleResetPassword = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.email) {
      newErrors.email = 'Email address is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      // Add reset password logic here laterrrrrrrrr
      console.log('Reset password for:', formData.email)
      setIsSubmitted(true)
    }
  }

  const handleBack = () => {
    // Navigate back to login but how!
    console.log('Navigate back to login')
  }

  const handleResendEmail = () => {
    // Resend reset email
    console.log('Resend reset email for:', formData.email)
  }

  const handleBackToLogin = () => {
    setIsSubmitted(false)
    setFormData({ email: '' })
    setErrors({})
    handleBack()
  }

  if (isSubmitted) {
    return (
      <div className="ForgetPasswordScreen w-full max-w-md mx-auto bg-white h-full flex flex-col px-6 py-8 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBackToLogin}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 font-['Poppins']">Password Reset</h1>
          <div className="w-10"></div>
        </div>

        {/* Success Content */}
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">

          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>

          {/* Success Message */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 font-['Poppins']">Check Your Email</h2>
            <p className="text-gray-600 font-['Poppins'] leading-relaxed">
              We've sent a password reset link to
            </p>
            <p className="text-yellow-600 font-medium font-['Poppins']">
              {formData.email}
            </p>
            <p className="text-gray-600 font-['Poppins'] leading-relaxed">
              Click the link in the email to reset your password. If you don't see the email, check your spam folder.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-4 w-full">
            <button
              onClick={handleResendEmail}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium text-base font-['Poppins'] hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
            >
              Resend Email
            </button>

            <button
              onClick={handleBackToLogin}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-4 px-6 rounded-lg font-semibold text-lg font-['Poppins'] hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Back to Login
            </button>
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className="ForgetPasswordScreen w-full max-w-md mx-auto bg-white h-full flex flex-col px-6 py-8 overflow-y-auto"
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 font-['Poppins']">Forgot Password</h1>
        <div className="w-10"></div> {/* Spacer for center alignment */}
      </div>

      {/* Illustration */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={48} className="text-yellow-500" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 font-['Poppins'] mb-3">Reset Your Password</h2>
        <p className="text-gray-600 font-['Poppins'] leading-relaxed">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">

        {/* Email Input */}
        <FloatingLabelField
          field="email"
          label="Email Address"
          type="email"
          required
          value={formData.email}
          error={errors.email}
          onChange={handleInputChange}
          icon={<Mail size={20} />}
        />

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800 font-['Poppins']">Important Note</h3>
              <p className="text-sm text-blue-700 font-['Poppins'] mt-1">
                The reset link will expire in 15 minutes for security reasons. Make sure to check your spam folder if you don't receive the email.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Reset Password Button */}
      <div className="mt-8">
        <button
          onClick={handleResetPassword}
          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-4 px-6 rounded-lg font-semibold text-lg font-['Poppins'] hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Send Reset Link
        </button>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500 font-['Poppins']">
          Remember your password?{' '}
          <button
            onClick={handleBack}
            className="text-yellow-600 hover:text-yellow-700 font-medium transition-colors duration-200"
          >
            Back to Login
          </button>
        </p>
      </div>

    </div>
  )
}