import { useState } from 'react'

export default function ForgetPasswordScreen() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleResetPassword = () => {
    const newErrors: {[key: string]: string} = {}

    if (!email) {
      newErrors.email = 'Email address is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      // Add reset password logic here
      console.log('Reset password for:', email)
      setIsSubmitted(true)
    }
  }

  const handleBack = () => {
    // Navigate back to login
    console.log('Navigate back to login')
  }

  const handleResendEmail = () => {
    // Resend reset email
    console.log('Resend reset email for:', email)
  }

  const handleBackToLogin = () => {
    setIsSubmitted(false)
    setEmail('')
    setErrors({})
    handleBack()
  }

  if (isSubmitted) {
    return (
      <div className="ForgetPasswordScreen w-full max-w-md mx-auto bg-white h-screen flex flex-col px-6 py-8 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBackToLogin}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900 font-['Poppins']">Password Reset</h1>
          <div className="w-10"></div>
        </div>

        {/* Success Content */}
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">

          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Success Message */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 font-['Poppins']">Check Your Email</h2>
            <p className="text-gray-600 font-['Poppins'] leading-relaxed">
              We've sent a password reset link to
            </p>
            <p className="text-yellow-600 font-medium font-['Poppins']">
              {email}
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
    <div className="ForgetPasswordScreen w-full max-w-md mx-auto bg-white h-screen flex flex-col px-6 py-8 overflow-hidden">

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
        <h1 className="text-xl font-semibold text-gray-900 font-['Poppins']">Forgot Password</h1>
        <div className="w-10"></div> {/* Spacer for center alignment */}
      </div>

      {/* Illustration */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 9h.01" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 font-['Poppins'] mb-3">Reset Your Password</h2>
        <p className="text-gray-600 font-['Poppins'] leading-relaxed">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">

        {/* Email Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 font-['Poppins']">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-gray-50 text-gray-900 text-base font-['Poppins'] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200`}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600 font-['Poppins']">{errors.email}</p>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
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