import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import ChangePasswordScreen from './screens/ChangePasswordScreen'
import ForgetPasswordScreen from './screens/ForgetPasswordScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'
import NotificationsScreen from './screens/NotificationsScreen'
import NotificationSettingsScreen from './screens/NotificationSettingsScreen'
import HomeScreen from './screens/HomeScreen'
import ProfileScreen from './screens/ProfileScreen'
import VaccineDistributionScreen from './screens/VaccineDistributionScreen'
import PasskeySetupScreen from './screens/PasskeySetupScreen'
import ManagePasskeysScreen from './screens/ManagePasskeysScreen'
import ActiveSessionsScreen from './screens/ActiveSessionsScreen'
import MonthlyReportScreen from './screens/MonthlyReportScreen'
import CreateReportScreen from './screens/CreateReportScreen'
import ApprovalQueueScreen from './screens/ApprovalQueueScreen'
import ConsolidatedDashboardScreen from './screens/ConsolidatedDashboardScreen'
import AdminPanelScreen from './screens/AdminPanelScreen'
import PeriodConfigScreen from './screens/PeriodConfigScreen'
import InstituteManagementScreen from './screens/InstituteManagementScreen'
import MasterDataScreen from './screens/MasterDataScreen'
import TargetsScreen from './screens/TargetsScreen'
import authService from './services/authService'
import { initializePushNotifications } from './utils/pushNotifications'
import { ADMIN_ROLES, HQ_ROLES } from './config/roles'

// Dev-only screen — lazy so the 440 duplicate lines aren't bundled in prod
const AllScreensScreen = lazy(() => import('./screens/AllScreensScreen'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  if (authService.isAuthenticated()) return <Navigate to="/home" replace />
  return <>{children}</>
}

function AdminRoute({ children, roles = ADMIN_ROLES }: { children: React.ReactNode; roles?: string[] }) {
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />
  const user = authService.getUser()
  if (!user || !roles.includes(user.role)) return <Navigate to="/home" replace />
  return <>{children}</>
}

export default function App() {
  useEffect(() => {
    if (authService.isAuthenticated()) {
      initializePushNotifications()
    }
  }, [])

  const isDev = import.meta.env.DEV

  return (
    <BrowserRouter>
      <div className="h-full w-full overflow-hidden bg-gray-100 font-sans">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterScreen /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgetPasswordScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />

          {/* Staff Protected Routes */}
          <Route path="/home" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePasswordScreen /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsScreen /></ProtectedRoute>} />
          <Route path="/notifications/settings" element={<ProtectedRoute><NotificationSettingsScreen /></ProtectedRoute>} />
          <Route path="/vaccine-distribution" element={<ProtectedRoute><VaccineDistributionScreen /></ProtectedRoute>} />
          <Route path="/reports/monthly" element={<ProtectedRoute><MonthlyReportScreen /></ProtectedRoute>} />
          <Route path="/reports/create" element={<ProtectedRoute><CreateReportScreen /></ProtectedRoute>} />

          {/* Passkey Routes */}
          <Route path="/setup-passkey" element={<ProtectedRoute><PasskeySetupScreen /></ProtectedRoute>} />
          <Route path="/manage-passkeys" element={<ProtectedRoute><ManagePasskeysScreen /></ProtectedRoute>} />
          <Route path="/active-sessions" element={<ProtectedRoute><ActiveSessionsScreen /></ProtectedRoute>} />

          {/* Admin Routes — Tehsil_Admin and above */}
          <Route
            path="/admin/approval-queue"
            element={<AdminRoute><ApprovalQueueScreen /></AdminRoute>}
          />
          <Route
            path="/admin/rollup"
            element={<AdminRoute><ConsolidatedDashboardScreen /></AdminRoute>}
          />

          {/* HQ / Super_Admin Routes */}
          <Route
            path="/admin/panel"
            element={<AdminRoute roles={HQ_ROLES}><AdminPanelScreen /></AdminRoute>}
          />
          <Route
            path="/admin/periods"
            element={<AdminRoute roles={HQ_ROLES}><PeriodConfigScreen /></AdminRoute>}
          />
          <Route
            path="/admin/institutes"
            element={<AdminRoute roles={HQ_ROLES}><InstituteManagementScreen /></AdminRoute>}
          />
          <Route
            path="/admin/master-data"
            element={<AdminRoute roles={HQ_ROLES}><MasterDataScreen /></AdminRoute>}
          />
          <Route
            path="/admin/targets"
            element={<AdminRoute><TargetsScreen /></AdminRoute>}
          />

          {/* Dev-only screen: guarded so it never ships to prod users */}
          {isDev && (
            <Route
              path="/all-screens"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
                    <AllScreensScreen />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          )}

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="*"
            element={
              <div className="w-full h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                  <p className="text-gray-600 mb-4">Page not found</p>
                  <a href="/login" className="text-yellow-600 hover:text-yellow-700 font-medium">
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
