import { useState } from 'react'
import { FloatingLabelField } from '../components/FloatingLabelField'
import { PrimaryButton, SecondaryButton } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { IconWrapper } from '../components/IconWrapper'
import { validateEmail } from '../utils/validation'
import { CheckCircle2, Lock, Mail, AlertCircle } from 'lucide-react'

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
        <ScreenHeader title="Password Reset" onBack={handleBackToLogin} className="mb-8" />

        {/* Success Content */}
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">

          {/* Success Icon */}
          <IconWrapper size="md" bgColor="green" className="mb-4">
            <CheckCircle2 size={40} className="text-green-500" />
          </IconWrapper>

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
            <SecondaryButton onClick={handleResendEmail}>
              Resend Email
            </SecondaryButton>

            <PrimaryButton onClick={handleBackToLogin}>
              Back to Login
            </PrimaryButton>
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className="ForgetPasswordScreen w-full max-w-md mx-auto bg-white h-screen flex flex-col px-2 py-4 overflow-hidden">

      {/* Header */}
      <ScreenHeader title="Forgot Password" onBack={handleBack} className="mb-8" />
      
      {/* Illustration */}
      <div className="text-center mb-8">
        <IconWrapper size="lg" bgColor="yellow" className="mx-auto mb-6">
          <Lock size={48} className="text-yellow-500" />
        </IconWrapper>
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
        <PrimaryButton onClick={handleResetPassword}>
          Send Reset Link
        </PrimaryButton>
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