import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/Toast'
import { ModalProvider } from './components/ConfirmModal'
import Dashboard from './pages/Dashboard'
import PredictPage from './pages/PredictPage'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentHistory from './pages/StudentHistory'
import AboutPage from './pages/AboutPage'
import BatchUploadPage from './pages/BatchUploadPage'
import AnalyticsPage from './pages/AnalyticsPage'
import StudentProgressPage from './pages/StudentProgressPage'
import ModelInsightsPage from './pages/ModelInsightsPage'
import StudentClusters from './pages/StudentClusters'
import LoginPage from './pages/LoginPage'

// Authentication check with error handling for deployment
const isAuthenticated = () => {
  try {
    return localStorage.getItem('isAuthenticated') === 'true'
  } catch (e) {
    console.warn('localStorage not available:', e)
    return false
  }
}

// Get user role
const getUserRole = () => {
  try {
    return localStorage.getItem('userRole') || 'admin'
  } catch (e) {
    return 'admin'
  }
}

// Check if user is admin
export const isAdmin = () => {
  return getUserRole() === 'admin'
}

// Protected Route wrapper
function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation()
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  // If route is admin-only and user is student, redirect to predict
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/predict" replace />
  }
  
  return children
}

function AppRoutes() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'
  const auth = isAuthenticated()
  const role = getUserRole()

  // Default redirect based on role
  const defaultRoute = role === 'student' ? '/predict' : '/dashboard'

  return (
    <>
      {isLoginPage ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={auth ? <Navigate to={defaultRoute} replace /> : <Navigate to="/login" replace />} />
            <Route path="/login" element={auth ? <Navigate to={defaultRoute} replace /> : <LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
            <Route path="/predict" element={<ProtectedRoute><PredictPage /></ProtectedRoute>} />
            <Route path="/teacher" element={<ProtectedRoute adminOnly><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute adminOnly><StudentHistory /></ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute adminOnly><AboutPage /></ProtectedRoute>} />
            <Route path="/batch" element={<ProtectedRoute adminOnly><BatchUploadPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute adminOnly><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/student/:studentId" element={<ProtectedRoute adminOnly><StudentProgressPage /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute adminOnly><ModelInsightsPage /></ProtectedRoute>} />
            <Route path="/clusters" element={<ProtectedRoute adminOnly><StudentClusters /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to={auth ? defaultRoute : "/login"} replace />} />
          </Routes>
        </Layout>
      )}
    </>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <ModalProvider>
        <AppRoutes />
      </ModalProvider>
    </ToastProvider>
  )
}
