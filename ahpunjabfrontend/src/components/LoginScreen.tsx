import { useState } from 'react'

export default function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = () => {
    // Add login logic here
    console.log('Login attempt:', { username, password })
  }

  const handleRegister = () => {
    // Add register navigation here
    console.log('Navigate to register')
  }

  const handleForgotPassword = () => {
    // Add forgot password navigation here
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
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 font-['Poppins']">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-base font-['Poppins'] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 font-['Poppins']">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-base font-['Poppins'] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-lg transition-colors duration-200"
            >
              {showPassword ? (
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

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
            Government of Punjab, India
          </p>
        </div>

      </div>
    </div>
  )
}