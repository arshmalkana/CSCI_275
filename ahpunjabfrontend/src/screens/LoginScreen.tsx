import { useState } from 'react'
import { FloatingLabelField } from '../components/FloatingLabelField'
import { PrimaryButton, SecondaryButton } from '../components/Button'
import { User, Lock } from 'lucide-react'

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
    <div className="LoginScreen w-full max-w-md mx-auto bg-white h-screen flex flex-col justify-center px-6 py-4 overflow-hidden">

      {/* App Logo/Header */}
      <div className="text-center items-center mb-6">
        <div className="w-24 h-24 flex items-center justify-center mx-auto p-2">
          <img
            src="/favicon.svg"
            alt="AH Punjab Logo"
            className="w-full h-full object-fill"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 font-['Poppins'] mb-1">AH Punjab</h1>
        <p className="text-sm text-gray-600 font-['Poppins']">Veterinary Reporting System</p>
      </div>

      {/* Login Form */}
      <div className="space-y-4">

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
          icon={<User size={20} />}
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
          icon={<Lock size={20} />}
        />

        {/* Forgot Password Link */}
        <div className="text-right">
          <button
            onClick={handleForgotPassword}
            className="text-xs text-yellow-600 hover:text-yellow-700 font-medium font-['Poppins'] transition-colors duration-200"
          >
            Forgot your password?
          </button>
        </div>

        {/* Login Button */}
        <PrimaryButton onClick={handleLogin}>
          Sign In
        </PrimaryButton>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-4 bg-white text-gray-500 font-['Poppins']">OR</span>
          </div>
        </div>

        {/* Register Button */}
        <SecondaryButton onClick={handleRegister}>
          Create New Account
        </SecondaryButton>

        {/* Footer */}
        <div className="text-center mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 font-['Poppins']">
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