import { useState } from 'react'
import { FloatingLabelField } from './FloatingLabelField'

export default function LoginScreen() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = () => {
    if (validateForm()) {
      console.log('Login attempt:', formData)
      // Add login logic
    }
  }

  const handleRegister = () => {
    // Add register navigation
    console.log('Navigate to register')
  }

  const handleForgotPassword = () => {
    // Add forgot password navigation
    console.log('Navigate to forgot password')
  }

  return (
    <div className="LoginScreen w-full max-w-md mx-auto bg-white min-h-screen flex flex-col justify-center px-8 py-12">

      {/* App Logo/Header */}
      <div className="text-center items-center mb-12">
        <div className="w-40 h-40 flex items-center justify-center mx-auto p-3">
          <img
            src="/favicon.svg"
            alt="AH Punjab Logo"
            className="w-full h-full object-fill"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 font-['Poppins'] mb-2">AH Punjab</h1>
        <p className="text-lg text-gray-600 font-['Poppins']">Veterinary Reporting System</p>
      </div>

      {/* Login Form */}
      <div className="space-y-6">

        {/* Welcome Message */}
        {/* <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 font-['Poppins'] mb-2">Welcome Back</h2>
          <p className="text-gray-600 font-['Poppins']">Sign in to your account to continue</p>
        </div> */}

        {/* Username Input */}
        <FloatingLabelField
          field="username"
          label="Username"
          type="text"
          required
          value={formData.username}
          error={errors.username}
          onChange={handleInputChange}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />

        {/* Password Input */}
        <FloatingLabelField
          field="password"
          label="Password"
          type="password"
          required
          value={formData.password}
          error={errors.password}
          onChange={handleInputChange}
          showPasswordToggle
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />

        {/* Forgot Password Link */}
        <div className="text-right">
          <button
            onClick={handleForgotPassword}
            className="text-sm text-yellow-600 hover:text-yellow-700 font-medium font-['Poppins'] transition-colors duration-200"
          >
            Forgot your password?
          </button>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-4 px-6 rounded-lg font-semibold text-lg font-['Poppins'] hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Sign In
        </button>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 font-['Poppins']">OR</span>
          </div>
        </div>

        {/* Register Button */}
        <button
          onClick={handleRegister}
          className="w-full bg-white border-2 border-yellow-400 text-yellow-600 py-4 px-6 rounded-lg font-semibold text-lg font-['Poppins'] hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
        >
          Create New Account
        </button>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 font-['Poppins']">
            Punjab Animal Husbandry Department
          </p>
          <p className="text-xs text-gray-400 font-['Poppins'] mt-1">
            {/* Government of Punjab, India */}
            CSCI 275 - Team 404
          </p>
        </div>

      </div>
    </div>
  )
}