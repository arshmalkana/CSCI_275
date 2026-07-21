import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FloatingLabelField } from '../components/FloatingLabelField'
import { PrimaryButton, SecondaryButton } from '../components/Button'
import { User, Lock, Fingerprint } from 'lucide-react'
import authService from '../services/authService'
import webauthnService from '../services/webauthnService'
import { SuccessDialog } from '../components/DialogBox'
import { isFieldRole } from '../config/roles'

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
  const [successDialogState, setSuccessDialog] = useState({ isOpen: false, message: '', userName: '' })

  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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
    const trimmedUsername = formData.username.trim()
    if (!trimmedUsername) {
      setErrors({ username: 'Username is required' })
      return
    }

    setFormData(prev => ({ ...prev, username: trimmedUsername }))
    setErrors({})
    setIsLoading(true)

    try {
      // Try to get passkey options to check if user has passkeys
      const response = await fetch('/v1/auth/webauthn/login/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: trimmedUsername })
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
      const trimmedUsername = formData.username.trim()
      const response = await authService.login(
        trimmedUsername,
        formData.password,
        rememberMe
      )

      if (response.success && response.user) {
        if (!isFieldRole(response.user.role)) {
          await authService.logout()
          setErrors({ general: 'This account uses the oversight panel, not the field app.' })
          return
        }

        localStorage.setItem('rememberedUsername', trimmedUsername)

        // Check if first time login - redirect to passkey setup
        if (response.user.isFirstTime && passkeySupported) {
          setSuccessDialog({
            isOpen: true,
            message: `First time login detected. Let's setup a passkey for faster login next time.`,
            userName: response.user.name
          })
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
    const trimmedUsername = formData.username.trim()
    if (!trimmedUsername) {
      setErrors({ username: 'Username is required for passkey login' })
      return
    }

    setIsPasskeyLoading(true)
    setErrors({})

    try {
      const response = await webauthnService.loginWithPasskey(trimmedUsername, rememberMe)

      if (response.success && response.user) {
        if (!isFieldRole(response.user.role)) {
          await authService.logout()
          setErrors({ general: 'This account uses the oversight panel, not the field app.' })
          return
        }

        localStorage.setItem('rememberedUsername', trimmedUsername)

        navigate('/home')
      } else if (response.message?.toLowerCase().includes('no passkeys')) {
        // Backend correctly says this user has no passkeys — fall through to password silently
        setShowPasskeyOption(false)
        setUsePasswordMode(true)
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

  // Shared form steps — used in both mobile and desktop renders
  const formSteps = useMemo(() => (
    <div className="space-y-4">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600 font-['Poppins'] text-center">{errors.general}</p>
        </div>
      )}

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
          <PrimaryButton onClick={handleNextStep} disabled={isLoading}>
            {isLoading ? 'Checking...' : 'Continue'}
          </PrimaryButton>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400 font-['Poppins']">OR</span>
            </div>
          </div>
          <SecondaryButton onClick={handleRegister}>Create New Account</SecondaryButton>
        </>
      )}

      {step === 2 && (
        <>
          <button
            onClick={handleBackToStep1}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 font-['Poppins'] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="bg-amber-50 border border-amber-200 rounded-lg pl-12 pr-4 py-3 relative flex items-center min-h-[52px]">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600">
              <User size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-['Poppins'] leading-none mb-1">Logging in as</p>
              <p className="text-base font-semibold text-gray-900 font-['Poppins'] leading-tight">{formData.username}</p>
            </div>
          </div>

          {showPasskeyOption && !usePasswordMode && (
            <>
              <button
                onClick={handlePasskeyLogin}
                disabled={isPasskeyLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold font-['Poppins'] hover:from-blue-600 hover:to-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <><Fingerprint size={20} /> Login with Passkey</>
                )}
              </button>
              <button
                onClick={() => setUsePasswordMode(true)}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium font-['Poppins'] transition-colors text-center w-full"
              >
                Use password instead
              </button>
            </>
          )}

          {(usePasswordMode || !showPasskeyOption) && (
            <>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-['Poppins']">Remember me</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500" />
                  </label>
                </div>
                <button onClick={handleForgotPassword} className="text-sm text-amber-600 hover:text-amber-700 font-medium font-['Poppins'] transition-colors">
                  Forgot password?
                </button>
              </div>
              <PrimaryButton onClick={handleLogin} disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </PrimaryButton>
              {showPasskeyOption && (
                <button onClick={() => setUsePasswordMode(false)} className="text-sm text-blue-600 hover:text-blue-700 font-medium font-['Poppins'] transition-colors text-center w-full">
                  Use passkey instead
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [step, errors, formData, isLoading, isPasskeyLoading, rememberMe, showPasskeyOption, usePasswordMode])

  const successDialog = (
    <SuccessDialog
      isOpen={successDialogState.isOpen}
      title={`Welcome ${successDialogState.userName}!`}
      message={successDialogState.message}
      onClose={() => {
        setSuccessDialog({ isOpen: false, message: '', userName: '' })
        navigate('/setup-passkey')
      }}
    />
  )

  // ── Desktop layout ────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        background: '#ffffff',
        fontFamily: "'Poppins', sans-serif",
      }}>
        {/* Main row */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '780px', maxWidth: '90vw' }}>

            {/* Left — portal info */}
            <div style={{ flex: 1, paddingRight: '48px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <img src="/favicon.svg" alt="AH Punjab" style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 16 }} />
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px', fontFamily: "'Poppins', sans-serif" }}>AH Punjab</h1>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 28px', fontFamily: "'Poppins', sans-serif" }}>Oversight Portal</p>

              <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 8px', fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Desktop access is for</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 28px', fontFamily: "'Poppins', sans-serif" }}>Oversight users only</p>

              <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 8px', fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Field staff — use the mobile app</p>
              <p style={{ fontSize: 13, color: '#374151', margin: 0, fontFamily: "'Poppins', sans-serif", lineHeight: 1.7 }}>
                CVD &nbsp;·&nbsp; CVH &nbsp;·&nbsp; PAIW<br />SemenBank &nbsp;·&nbsp; VaccineBank
              </p>
            </div>

            {/* Vertical separator */}
            <div style={{ width: '3px', alignSelf: 'stretch', background: '#E9BE28', borderRadius: '2px', flexShrink: 0 }} />

            {/* Right — form */}
            <div style={{ flex: 1, paddingLeft: '48px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 20, fontFamily: "'Poppins', sans-serif" }}>Sign in to your account</p>
              {formSteps}
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <div style={{ textAlign: 'center', padding: '16px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, fontFamily: "'Poppins', sans-serif" }}>
            Punjab Animal Husbandry Department &nbsp;·&nbsp; Government of Punjab, India
          </p>
        </div>

        {successDialog}
      </div>
    )
  }

  // ── Mobile layout (unchanged) ─────────────────────────────────────────────
  return (
    <div className="LoginScreen w-full max-w-md mx-auto bg-white h-screen flex flex-col justify-center px-6 py-4 overflow-hidden">
      <div className="text-center items-center mb-6">
        <div className="w-24 h-24 flex items-center justify-center mx-auto p-2">
          <img src="/favicon.svg" alt="AH Punjab Logo" className="w-full h-full object-fill" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 font-['Poppins'] mb-1">AH Punjab</h1>
        <p className="text-sm text-gray-600 font-['Poppins']">Veterinary Reporting System</p>
      </div>
      {formSteps}
      <div className="text-center mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 font-['Poppins']">Punjab Animal Husbandry Department</p>
        <p className="text-xs text-gray-400 font-['Poppins'] mt-1">Government of Punjab, India</p>
      </div>
      {successDialog}
    </div>
  )
}