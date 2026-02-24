import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BrainCircuit, GraduationCap,
  ClipboardList, BookOpen, Menu, X, Bell,
  Sparkles, User, ChevronRight
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard',         icon: LayoutDashboard, color: '#818cf8' },
  { to: '/predict',   label: 'Predict Student',   icon: BrainCircuit,    color: '#a78bfa' },
  { to: '/teacher',   label: 'Teacher Analytics', icon: GraduationCap,   color: '#c084fc' },
  { to: '/history',   label: 'History',           icon: ClipboardList,   color: '#f472b6' },
  { to: '/about',     label: 'About / IEEE',      icon: BookOpen,        color: '#60a5fa' },
]

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const currentPage = navItems.find(n => location.pathname.startsWith(n.to))

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`${collapsed ? 'w-[72px]' : 'w-64'} flex-shrink-0 sidebar-bg
                    transition-all duration-300 ease-in-out flex flex-col relative z-20`}
      >
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-10 w-56 h-56 rounded-full opacity-20"
               style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
          <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full opacity-15"
               style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
        </div>

        {/* Logo */}
        <div className={`relative flex items-center gap-3 px-4 py-5
                        border-b border-white/[0.06] ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex-shrink-0 relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                          boxShadow: '0 0 20px rgba(99,102,241,0.6)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-extrabold text-white text-sm tracking-tight leading-none">
                Academi<span style={{
                  background: 'linear-gradient(135deg,#818cf8,#c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Q</span>
              </p>
              <p className="text-white/35 text-[10px] mt-0.5 font-medium tracking-wider uppercase">
                AI Advisory System
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 px-2.5 space-y-1">
          {!collapsed && (
            <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.2em] px-3 mb-3 select-none">
              Main Menu
            </p>
          )}
          {navItems.map(({ to, label, icon: Icon, color }, i) => (
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
                   : 'text-white/40 hover:text-white/80 hover:bg-white/[0.06]'
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
                      {isActive && <ChevronRight size={12} className="text-white/30" />}
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
                 style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.18)' }}>
              <p className="text-white/35 text-[9px] font-bold uppercase tracking-wider">Final Year Project</p>
              <p className="text-indigo-300 text-xs font-semibold mt-0.5">IEEE Enhanced System</p>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden main-content-bg">

        {/* Topbar */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-3.5
                           bg-white/70 backdrop-blur-md border-b border-gray-200/60 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400
                         hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
            >
              {collapsed ? <Menu size={18} /> : <X size={18} />}
            </button>
            <div>
              <h1 className="font-bold text-gray-800 text-[15px] leading-tight">
                {currentPage?.label ?? 'AcademiQ'}
              </h1>
              <p className="text-gray-400 text-[11px]">
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

            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400
                               hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200">
              <Bell size={17} />
            </button>

            <div className="flex items-center gap-2 bg-white/90 border border-gray-200/80
                            rounded-xl px-3 py-2 cursor-pointer hover:border-indigo-200
                            hover:shadow-md transition-all duration-200">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                   style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                <User size={13} />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-gray-700 leading-none">Instructor</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Admin</p>
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
