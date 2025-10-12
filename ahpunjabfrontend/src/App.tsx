import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import ChangePasswordScreen from './screens/ChangePasswordScreen'
import ForgetPasswordScreen from './screens/ForgetPasswordScreen'
import NotificationsScreen from './screens/NotificationsScreen'
import HomeScreen from './screens/HomeScreen'
import ProfileScreen from './screens/ProfileScreen'
import VaccineDistributionScreen from './screens/VaccineDistributionScreen'
import PasskeySetupScreen from './screens/PasskeySetupScreen'
import ManagePasskeysScreen from './screens/ManagePasskeysScreen'
import AllScreensScreen from './screens/AllScreensScreen'
import authService from './services/authService'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authService.isAuthenticated()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public Route Component (redirect if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authService.isAuthenticated()

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="h-full w-full overflow-hidden bg-gray-100 font-sans">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginScreen />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterScreen />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={<ForgetPasswordScreen />}
          />

          {/* Protected Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomeScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vaccine-distribution"
            element={
              <ProtectedRoute>
                <VaccineDistributionScreen />
              </ProtectedRoute>
            }
          />

          {/* Passkey Routes */}
          <Route
            path="/setup-passkey"
            element={
              <ProtectedRoute>
                <PasskeySetupScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-passkeys"
            element={
              <ProtectedRoute>
                <ManagePasskeysScreen />
              </ProtectedRoute>
            }
          />

          {/* Development Route */}
          <Route path="/all-screens" element={<AllScreensScreen />} />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 404 - Not Found */}
          <Route
            path="*"
            element={
              <div className="w-full h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                  <p className="text-gray-600 mb-4">Page not found</p>
                  <a
                    href="/login"
                    className="text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Go to Login
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
