import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FloatingLabelField } from '../components/FloatingLabelField'
import { PrimaryButton, SecondaryButton } from '../components/Button'
import { User, Lock, Fingerprint } from 'lucide-react'
import authService from '../services/authService'
import webauthnService from '../services/webauthnService'

export default function LoginScreen() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  const [showPasskeyOption, setShowPasskeyOption] = useState(false)
  const [passkeySupported, setPasskeySupported] = useState(false)
  const [usePasswordMode, setUsePasswordMode] = useState(false)

  useEffect(() => {
    // Check if WebAuthn is supported
    setPasskeySupported(webauthnService.isSupported())

    // Load remembered username
    const rememberedUsername = localStorage.getItem('rememberedUsername')
    if (rememberedUsername) {
      setFormData(prev => ({ ...prev, username: rememberedUsername }))
    }
  }, [])

  const handleNextStep = async () => {
    if (!formData.username.trim()) {
      setErrors({ username: 'Username is required' })
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      // Try to get passkey options to check if user has passkeys
      const response = await fetch('/v1/auth/webauthn/login/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: formData.username })
      })

      if (response.ok) {
        setShowPasskeyOption(true)
        setUsePasswordMode(false)
      } else {
        setShowPasskeyOption(false)
        setUsePasswordMode(true)
      }
      setStep(2)
    } catch {
      // On error, default to password mode
      setShowPasskeyOption(false)
      setUsePasswordMode(true)
      setStep(2)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToStep1 = () => {
    setStep(1)
    setErrors({})
    setUsePasswordMode(false)
    setShowPasskeyOption(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

  const handleLogin = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await authService.login(
        formData.username,
        formData.password,
        rememberMe
      )

      if (response.success && response.user) {
        console.log('Login successful:', response.user)

        // Save username for future logins
        localStorage.setItem('rememberedUsername', formData.username)

        // Check if first time login - redirect to passkey setup
        if (response.user.isFirstTime && passkeySupported) {
          alert(`✅ Welcome ${response.user.name}!\n\nFirst time login detected. Let's setup a passkey for faster login next time.`)
          navigate('/setup-passkey')
        } else {
          navigate('/home')
        }
      } else {
        setErrors({ general: response.message })
      }
    } catch {
      setErrors({ general: 'An unexpected error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasskeyLogin = async () => {
    if (!formData.username.trim()) {
      setErrors({ username: 'Username is required for passkey login' })
      return
    }

    setIsPasskeyLoading(true)
    setErrors({})

    try {
      const response = await webauthnService.loginWithPasskey(formData.username, rememberMe)

      if (response.success && response.user) {
        console.log('Passkey login successful:', response.user)

        // Save username for future logins
        localStorage.setItem('rememberedUsername', formData.username)

        navigate('/home')
      } else {
        setErrors({ general: response.message })
      }
    } catch (err) {
      console.error('Passkey login error:', err)
      setErrors({ general: 'Passkey authentication failed' })
    } finally {
      setIsPasskeyLoading(false)
    }
  }

  const handleRegister = () => {
    navigate('/register')
  }

  const handleForgotPassword = () => {
    navigate('/forgot-password')
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

        {/* General Error Message */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600 font-['Poppins'] text-center">{errors.general}</p>
          </div>
        )}

        {/* Step 1: Username Input */}
        {step === 1 && (
          <>
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

            {/* Login Button */}
            <PrimaryButton onClick={handleNextStep} disabled={isLoading}>
              {isLoading ? 'Checking...' : 'Login'}
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
          </>
        )}

        {/* Step 2: Authentication Method */}
        {step === 2 && (
          <>
            {/* Back Button */}
            <button
              onClick={handleBackToStep1}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 font-['Poppins'] transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {/* Show username (read-only) */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg pl-12 pr-4 py-3 relative flex items-center min-h-[52px]">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-yellow-600">
                <User size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-['Poppins'] leading-none mb-1">Logging in as</p>
                <p className="text-base font-semibold text-gray-900 font-['Poppins'] leading-tight">{formData.username}</p>
              </div>
            </div>

            {/* Passkey Login Button (if available) */}
            {showPasskeyOption && !usePasswordMode && (
              <>
                <button
                  onClick={handlePasskeyLogin}
                  disabled={isPasskeyLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold font-['Poppins'] hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPasskeyLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Fingerprint size={20} />
                      Login with Passkey
                    </>
                  )}
                </button>

                {/* Switch to Password Link */}
                <button
                  onClick={() => setUsePasswordMode(true)}
                  className="text-sm text-yellow-600 hover:text-yellow-700 font-medium font-['Poppins'] transition-colors duration-200 text-center w-full"
                >
                  Use password instead
                </button>
              </>
            )}

            {/* Password Login (if no passkey or user chose password) */}
            {(usePasswordMode || !showPasskeyOption) && (
              <>
                {/* Divider (if switching from passkey) */}
                {//showPasskeyOption && (
                  // <div className="relative my-4">
                  //   <div className="absolute inset-0 flex items-center">
                  //     <div className="w-full border-t border-gray-300"></div>
                  //   </div>
                  //   <div className="relative flex justify-center text-xs">
                  //     <span className="px-4 bg-white text-gray-500 font-['Poppins']">OR USE PASSWORD</span>
                  //   </div>
                  // </div>
                //)
                }

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

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 font-['Poppins']">Remember me</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                    </label>
                  </div>
                  <button
                    onClick={handleForgotPassword}
                    className="text-sm text-yellow-600 hover:text-yellow-700 font-medium font-['Poppins'] transition-colors duration-200"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Login Button */}
                <PrimaryButton onClick={handleLogin} disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In with Password'}
                </PrimaryButton>

                {/* Switch to Passkey Link (if available) */}
                {showPasskeyOption && (
                  <button
                    onClick={() => setUsePasswordMode(false)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium font-['Poppins'] transition-colors duration-200 text-center w-full"
                  >
                    Use passkey instead
                  </button>
                )}
              </>
            )}
          </>
        )}

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