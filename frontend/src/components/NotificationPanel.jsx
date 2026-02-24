import React, { useEffect, useState, useRef } from 'react'
import { Bell, X, AlertTriangle, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import RiskBadge from './RiskBadge'
import { getAlerts } from '../api'

export default function NotificationPanel() {
  const [open, setOpen]       = useState(false)
  const [alerts, setAlerts]   = useState([])
  const [count, setCount]     = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const res = await getAlerts()
      setAlerts(res.data.students || [])
      setCount(res.data.count || 0)
    } catch (e) { /* silent */ }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000) // refresh every 30 s
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const go = (studentId) => {
    setOpen(false)
    navigate(`/student/${studentId}`)
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) load() }}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-white/10"
        title="Alerts"
      >
        <Bell size={16} className="text-white/50" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="notification-panel absolute left-0 top-11 w-72 rounded-2xl overflow-hidden z-50"
             style={{ background: 'rgba(15,12,41,0.98)', border: '1px solid rgba(244,63,94,0.2)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} className="text-rose-400" />
              <span className="text-white/80 font-bold text-sm">At-Risk Alerts</span>
              {count > 0 && (
                <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                  {count}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/70">
              <X size={13} />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-2">
                {[1,2].map(i => (
                  <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2"
                     style={{ background: 'rgba(16,185,129,0.1)' }}>
                  <span className="text-emerald-400 text-xs">✓</span>
                </div>
                <p className="text-white/40 text-xs">No at-risk alerts</p>
                <p className="text-white/20 text-[10px] mt-0.5">All students within safe range</p>
              </div>
            ) : (
              alerts.map(s => (
                <button key={s.student_id} onClick={() => go(s.student_id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] text-left">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
                    <AlertTriangle size={13} className="text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-xs font-bold truncate">{s.student_name}</p>
                    <p className="text-white/30 text-[10px] font-mono">{s.student_id}</p>
                    <p className="text-rose-400/70 text-[10px]">{s.consecutive_at_risk}× consecutive At Risk</p>
                  </div>
                  <ChevronRight size={11} className="text-white/20 flex-shrink-0" />
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/[0.06]">
              <button onClick={() => { setOpen(false); navigate('/analytics') }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
                View all in Analytics →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
