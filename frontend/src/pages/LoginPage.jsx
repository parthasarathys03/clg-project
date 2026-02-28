import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, Eye, EyeOff, GraduationCap, Shield } from 'lucide-react'
import skpLogo from '../assets/skp-logo.png'

const ADMIN_USERNAME = 'Pavithra'
const ADMIN_PASSWORD = 'Pavithra@123'

export default function LoginPage() {
  const navigate = useNavigate()
  const [loginType, setLoginType] = useState('student') // 'student' or 'admin'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Auto-fill password for student login
  useEffect(() => {
    if (loginType === 'student' && username.trim()) {
      setPassword(`${username.trim()}@123`)
    } else if (loginType === 'student') {
      setPassword('')
    }
  }, [username, loginType])

  // Clear fields when switching login type
  useEffect(() => {
    setUsername('')
    setPassword('')
    setError('')
  }, [loginType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 500))

    const trimmedUsername = username.trim()
    const trimmedPassword = password.trim()

    if (loginType === 'admin') {
      // Admin login validation
      if (trimmedUsername === ADMIN_USERNAME && trimmedPassword === ADMIN_PASSWORD) {
        try {
          localStorage.setItem('isAuthenticated', 'true')
          localStorage.setItem('username', trimmedUsername)
          localStorage.setItem('userRole', 'admin')
          navigate('/dashboard', { replace: true })
        } catch (err) {
          setError('Login failed. Please try again.')
        }
      } else {
        setError('Invalid admin credentials')
      }
    } else {
      // Student login validation - name + name@123
      const expectedPassword = `${trimmedUsername}@123`
      if (trimmedUsername && trimmedPassword === expectedPassword) {
        try {
          localStorage.setItem('isAuthenticated', 'true')
          localStorage.setItem('username', trimmedUsername)
          localStorage.setItem('userRole', 'student')
          localStorage.setItem('studentName', trimmedUsername)
          navigate('/predict', { replace: true })
        } catch (err) {
          setError('Login failed. Please try again.')
        }
      } else {
        setError('Please enter your name correctly')
      }
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center login-gradient">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative w-full max-w-md px-6">
        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Logo Section */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <img 
                src={skpLogo} 
                alt="SKP Logo" 
                className="w-28 h-28 object-contain rounded-lg"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              SKP ENGINEERING COLLEGE
            </h1>
            <p className="text-white/60 text-sm">
              AI Student Performance Advisory System
            </p>
          </div>

          {/* Login Type Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
            <button
              type="button"
              onClick={() => setLoginType('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all duration-200
                ${loginType === 'student' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'}`}
            >
              <GraduationCap size={18} />
              Student Login
            </button>
            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all duration-200
                ${loginType === 'admin' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'}`}
            >
              <Shield size={18} />
              Admin Login
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username/Name Field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                <User size={20} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={loginType === 'student' ? 'Enter Your Name' : 'Admin Username'}
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                readOnly={loginType === 'student'}
                className={`w-full bg-white/10 border border-white/20 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all
                  ${loginType === 'student' ? 'cursor-not-allowed opacity-70' : ''}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Student hint */}
            {loginType === 'student' && (
              <p className="text-white/50 text-xs text-center">
                Password is auto-generated as: <span className="text-emerald-300 font-mono">YourName@123</span>
              </p>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-3 text-red-200 text-sm text-center">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-semibold py-3.5 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg
                ${loginType === 'student' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/25'}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                loginType === 'student' ? 'Login as Student' : 'Login as Admin'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-white/40 text-xs">
              {loginType === 'student' 
                ? 'Students can only access the Prediction page' 
                : 'Full system access for administrators'}
            </p>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-center text-white/30 text-xs mt-6">
          SKP Group of Institutions - Tiruvannamalai
        </p>
      </div>
    </div>
  )
}
