import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BrainCircuit, GraduationCap,
  ClipboardList, BookOpen, Menu, X, Bell, User
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/predict',   label: 'Predict Student',  icon: BrainCircuit     },
  { to: '/teacher',   label: 'Teacher Analytics',icon: GraduationCap    },
  { to: '/history',   label: 'History',          icon: ClipboardList    },
  { to: '/about',     label: 'About / IEEE',     icon: BookOpen         },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  const currentTitle = navItems.find(n => location.pathname.startsWith(n.to))?.label ?? 'System'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 bg-blue-900 text-white
                    transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-blue-800">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <GraduationCap size={18} />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm leading-tight">AcademiQ</p>
              <p className="text-blue-300 text-xs">AI Advisory System</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150
                 ${isActive
                   ? 'bg-blue-700 text-white'
                   : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                 }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-t border-blue-800">
            <p className="text-blue-400 text-xs">Final Year AI Project</p>
            <p className="text-blue-300 text-xs font-medium">IEEE Enhanced System</p>
          </div>
        )}
      </aside>

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className="font-semibold text-gray-800 text-lg leading-none">{currentTitle}</h1>
              <p className="text-gray-400 text-xs mt-0.5">AI-Based Student Performance Prediction System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Instructor</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
