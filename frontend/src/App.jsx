import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import PredictPage from './pages/PredictPage'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentHistory from './pages/StudentHistory'
import AboutPage from './pages/AboutPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"          element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/predict"   element={<PredictPage />} />
        <Route path="/teacher"   element={<TeacherDashboard />} />
        <Route path="/history"   element={<StudentHistory />} />
        <Route path="/about"     element={<AboutPage />} />
      </Routes>
    </Layout>
  )
}
