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

// Authentication check
const isAuthenticated = () => {
  return localStorage.getItem('isAuthenticated') === 'true'
}

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const location = useLocation()
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return children
}

function AppRoutes() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/predict" element={<ProtectedRoute><PredictPage /></ProtectedRoute>} />
            <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><StudentHistory /></ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
            <Route path="/batch" element={<ProtectedRoute><BatchUploadPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/student/:studentId" element={<ProtectedRoute><StudentProgressPage /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute><ModelInsightsPage /></ProtectedRoute>} />
            <Route path="/clusters" element={<ProtectedRoute><StudentClusters /></ProtectedRoute>} />
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
