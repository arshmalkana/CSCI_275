import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './screens/LoginScreen'
import DashboardScreen from './screens/DashboardScreen'
import ApprovalQueueScreen from './screens/ApprovalQueueScreen'
import ConsolidatedDashboardScreen from './screens/ConsolidatedDashboardScreen'
import PeriodManagementScreen from './screens/PeriodManagementScreen'
import InstituteManagementScreen from './screens/InstituteManagementScreen'
import MasterDataScreen from './screens/MasterDataScreen'
import TargetsScreen from './screens/TargetsScreen'
import UserManagementScreen from './screens/UserManagementScreen'
import authService from './services/authService'
import { isOversightRole } from './config/roles'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />
  const user = authService.getUser()
  if (user && !isOversightRole(user.role)) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  if (authService.isAuthenticated()) {
    const user = authService.getUser()
    if (user && isOversightRole(user.role)) return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"          element={<PublicRoute><LoginScreen /></PublicRoute>} />
        <Route path="/dashboard"      element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
        <Route path="/approval-queue" element={<ProtectedRoute><ApprovalQueueScreen /></ProtectedRoute>} />
        <Route path="/rollup"         element={<ProtectedRoute><ConsolidatedDashboardScreen /></ProtectedRoute>} />
        <Route path="/periods"        element={<ProtectedRoute><PeriodManagementScreen /></ProtectedRoute>} />
        <Route path="/institutes"     element={<ProtectedRoute><InstituteManagementScreen /></ProtectedRoute>} />
        <Route path="/master-data"    element={<ProtectedRoute><MasterDataScreen /></ProtectedRoute>} />
        <Route path="/targets"        element={<ProtectedRoute><TargetsScreen /></ProtectedRoute>} />
        <Route path="/admin"          element={<ProtectedRoute><UserManagementScreen /></ProtectedRoute>} />
        <Route path="/"               element={<Navigate to="/login" replace />} />
        <Route
          path="*"
          element={
            <div className="w-full h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-gray-600 mb-4">Page not found</p>
                <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Go to Login</a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
