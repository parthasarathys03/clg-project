import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/Toast'
import Dashboard from './pages/Dashboard'
import PredictPage from './pages/PredictPage'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentHistory from './pages/StudentHistory'
import AboutPage from './pages/AboutPage'
import BatchUploadPage from './pages/BatchUploadPage'
import AnalyticsPage from './pages/AnalyticsPage'
import StudentProgressPage from './pages/StudentProgressPage'
import ModelInsightsPage from './pages/ModelInsightsPage'

export default function App() {
  return (
    <ToastProvider>
      <Layout>
        <Routes>
          <Route path="/"                   element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"          element={<Dashboard />} />
          <Route path="/predict"            element={<PredictPage />} />
          <Route path="/teacher"            element={<TeacherDashboard />} />
          <Route path="/history"            element={<StudentHistory />} />
          <Route path="/about"              element={<AboutPage />} />
          <Route path="/batch"              element={<BatchUploadPage />} />
          <Route path="/analytics"          element={<AnalyticsPage />} />
          <Route path="/student/:studentId" element={<StudentProgressPage />} />
          <Route path="/insights"           element={<ModelInsightsPage />} />
        </Routes>
      </Layout>
    </ToastProvider>
  )
}
