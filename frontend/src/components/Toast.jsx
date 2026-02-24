import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />,
  error:   <XCircle     size={16} className="text-rose-400 flex-shrink-0" />,
  warning: <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />,
  info:    <Info        size={16} className="text-indigo-400 flex-shrink-0" />,
}

const BORDERS = {
  success: 'border-emerald-500/30',
  error:   'border-rose-500/30',
  warning: 'border-amber-500/30',
  info:    'border-indigo-500/30',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev.slice(-2), { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const remove = id => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast stack */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
               className={`toast-slide-in pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl
                           text-sm text-white max-w-sm border backdrop-blur-sm ${BORDERS[t.type]}`}
               style={{ background: 'rgba(15,12,41,0.96)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            {ICONS[t.type]}
            <span className="flex-1 leading-snug text-white/85">{t.message}</span>
            <button onClick={() => remove(t.id)}
                    className="text-white/30 hover:text-white/70 transition-colors mt-0.5 flex-shrink-0">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
