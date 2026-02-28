import React, { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BrainCircuit, GraduationCap,
  ClipboardList, BookOpen, Menu, X,
  User, ChevronRight,
  Upload, Trophy, Cpu, Network,
  LogOut,
} from 'lucide-react'
import NotificationPanel from './NotificationPanel'
import skpLogo from '../assets/skp-logo.png'

// Global cache check for cluster ready state
let globalClusterReady = false

export function setClusterReady(ready) {
  globalClusterReady = ready
}

export function isClusterReady() {
  return globalClusterReady
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard',         icon: LayoutDashboard, color: '#818cf8' },
  { to: '/predict',   label: 'Predict Student',   icon: BrainCircuit,    color: '#a78bfa' },
  { to: '/teacher',   label: 'Teacher Analytics', icon: GraduationCap,   color: '#c084fc' },
  { to: '/history',   label: 'History',           icon: ClipboardList,   color: '#f472b6' },
]

const navItemsExtra = [
  { to: '/batch',     label: 'Batch Upload',      icon: Upload,          color: '#34d399' },
  { to: '/analytics', label: 'Analytics',         icon: Trophy,          color: '#fbbf24' },
  { to: '/insights',  label: 'Model Insights',    icon: Cpu,             color: '#38bdf8' },
  { to: '/clusters',  label: 'Behaviour Clusters',icon: Network,         color: '#a78bfa' },
  { to: '/about',     label: 'About / IEEE',      icon: BookOpen,        color: '#60a5fa' },
]

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [clusterReady, setClusterReadyState] = useState(globalClusterReady)
  const location = useLocation()
  const navigate = useNavigate()
  const currentPage = [...navItems, ...navItemsExtra].find(n => location.pathname.startsWith(n.to))

  // Poll for cluster ready state
  useEffect(() => {
    const interval = setInterval(() => {
      setClusterReadyState(globalClusterReady)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    try {
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('username')
    } catch (e) {
      console.warn('localStorage not available during logout:', e)
    }
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`${collapsed ? 'w-[72px]' : 'w-64'} flex-shrink-0 sidebar-bg
                    transition-all duration-300 ease-in-out flex flex-col relative z-20`}
      >
        {/* Subtle gradient overlays — no circles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-40"
               style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, transparent 55%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-40 opacity-30"
               style={{ background: 'linear-gradient(0deg, rgba(168,85,247,0.18), transparent)' }} />
        </div>

        {/* Logo */}
        <div className={`relative flex items-center gap-3 px-4 py-4
                        border-b border-white/[0.06] ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex-shrink-0 relative">
            <img 
              src={skpLogo} 
              alt="SKP Logo" 
              className={`${collapsed ? 'w-14 h-14' : 'w-16 h-16'} object-contain rounded-lg`}
            />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-extrabold text-white text-sm tracking-tight leading-none">
                <span style={{ color: '#f472b6' }}>S</span>
                <span style={{ color: '#818cf8' }}>K</span>
                <span style={{ color: '#34d399' }}>P</span>
                <span className="text-white"> </span>
                Academi<span style={{
                  background: 'linear-gradient(135deg,#818cf8,#c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Q</span>
              </p>
              <p className="text-white/60 text-[10px] mt-0.5 font-medium tracking-wider uppercase">
                IT Dept · SKP Engg. College
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 px-2.5 space-y-1 overflow-y-auto">
          {!collapsed && (
            <p className="text-white/50 text-[9px] font-bold uppercase tracking-[0.2em] px-3 mb-3 select-none">
              Main Menu
            </p>
          )}
          {navItems.map(({ to, label, icon: Icon, color }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl
                 transition-all duration-200 relative select-none
                 ${collapsed ? 'justify-center' : ''}
                 ${isActive
                   ? 'nav-link-active text-white'
                   : 'text-white/70 hover:text-white hover:bg-white/[0.08]'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !collapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                          style={{ background: color }} />
                  )}
                  <Icon
                    size={17}
                    className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                    style={{ color: isActive ? color : 'currentColor' }}
                  />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 truncate">{label}</span>
                      {isActive && <ChevronRight size={12} className="text-white/50" />}
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Divider */}
          <div className={`py-2 ${collapsed ? 'px-1' : 'px-3'}`}>
            <div className="border-t border-white/[0.08]" />
          </div>

          {!collapsed && (
            <p className="text-white/50 text-[9px] font-bold uppercase tracking-[0.2em] px-3 mb-2 select-none">
              SaaS Features
            </p>
          )}
          {navItemsExtra.map(({ to, label, icon: Icon, color }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl
                 transition-all duration-200 relative select-none
                 ${collapsed ? 'justify-center' : ''}
                 ${isActive
                   ? 'nav-link-active text-white'
                   : 'text-white/70 hover:text-white hover:bg-white/[0.08]'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !collapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                          style={{ background: color }} />
                  )}
                  <Icon
                    size={17}
                    className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                    style={{ color: isActive ? color : 'currentColor' }}
                  />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 truncate">{label}</span>
                      {to === '/clusters' && clusterReady && !isActive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Ready" />
                      )}
                      {isActive && <ChevronRight size={12} className="text-white/50" />}
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer badge */}
        {!collapsed && (
          <div className="px-3 pb-4">
            <div className="rounded-xl p-3"
                 style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <p className="text-white/55 text-[9px] font-bold uppercase tracking-wider">Final Year Project</p>
              <p className="text-indigo-200 text-xs font-semibold mt-0.5">IEEE Enhanced System</p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className={`px-3 pb-4 ${collapsed ? 'px-2' : ''}`}>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                       text-white/70 hover:text-white hover:bg-red-500/20 hover:border-red-500/30
                       border border-transparent ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={17} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden main-content-bg">

        {/* Topbar */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-3.5
                           bg-white/70 backdrop-blur-md border-b border-gray-200/60 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-700
                         hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
            >
              {collapsed ? <Menu size={18} /> : <X size={18} />}
            </button>
            <div>
              <h1 className="font-bold text-gray-800 text-[15px] leading-tight">
                {currentPage?.label ?? 'AcademiQ'}
              </h1>
              <p className="text-gray-700 text-[11px]">
                AI-Based Student Performance Advisory System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80
                            px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-600">System Live</span>
            </div>

            <NotificationPanel />

            <div className="flex items-center gap-2 bg-white/90 border border-gray-200/80
                            rounded-xl px-3 py-2 cursor-pointer hover:border-indigo-200
                            hover:shadow-md transition-all duration-200">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                   style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                <User size={13} />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-gray-900 leading-none">RAJI (HOD)</p>
                <p className="text-[10px] text-gray-700 mt-0.5">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-6" key={location.pathname}>
          <div className="animate-fade-up max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
