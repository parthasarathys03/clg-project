import React, { createContext, useContext, useState, useCallback } from 'react'
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react'

const ModalContext = createContext(null)

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null)
  const [resolveRef, setResolveRef] = useState(null)

  const confirm = useCallback(({ 
    title = 'Confirm Action', 
    message, 
    confirmText = 'OK', 
    cancelText = 'Cancel',
    type = 'warning',
    confirmButtonClass = ''
  }) => {
    return new Promise((resolve) => {
      setResolveRef(() => resolve)
      setModal({ title, message, confirmText, cancelText, type, confirmButtonClass })
    })
  }, [])

  const alert = useCallback(({ 
    title = 'Notice', 
    message, 
    confirmText = 'OK',
    type = 'info'
  }) => {
    return new Promise((resolve) => {
      setResolveRef(() => resolve)
      setModal({ title, message, confirmText, cancelText: null, type, confirmButtonClass: '' })
    })
  }, [])

  const close = useCallback((result) => {
    setModal(null)
    if (resolveRef) {
      resolveRef(result)
      setResolveRef(null)
    }
  }, [resolveRef])

  const handleConfirm = () => close(true)
  const handleCancel = () => close(false)

  const typeStyles = {
    warning: {
      icon: <AlertTriangle size={28} className="text-amber-400" />,
      iconBg: 'bg-amber-500/15',
      confirmBtn: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25',
      border: 'border-amber-500/20'
    },
    danger: {
      icon: <AlertTriangle size={28} className="text-rose-400" />,
      iconBg: 'bg-rose-500/15',
      confirmBtn: 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white shadow-lg shadow-rose-500/25',
      border: 'border-rose-500/20'
    },
    info: {
      icon: <Info size={28} className="text-indigo-400" />,
      iconBg: 'bg-indigo-500/15',
      confirmBtn: 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg shadow-indigo-500/25',
      border: 'border-indigo-500/20'
    },
    success: {
      icon: <CheckCircle size={28} className="text-emerald-400" />,
      iconBg: 'bg-emerald-500/15',
      confirmBtn: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25',
      border: 'border-emerald-500/20'
    }
  }

  const style = modal ? typeStyles[modal.type] : typeStyles.info

  return (
    <ModalContext.Provider value={{ confirm, alert }}>
      {children}

      {/* Modal Overlay */}
      {modal && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(15, 12, 41, 0.85)', backdropFilter: 'blur(8px)' }}
          onClick={modal.cancelText ? handleCancel : handleConfirm}
        >
          <div 
            className={`relative w-full max-w-md rounded-2xl overflow-hidden animate-scale-in border ${style.border}`}
            style={{ 
              background: 'linear-gradient(145deg, rgba(30, 27, 75, 0.98), rgba(15, 12, 41, 0.98))',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top accent line */}
            <div 
              className="h-1 w-full"
              style={{ 
                background: modal.type === 'warning' ? 'linear-gradient(90deg, #f59e0b, #f97316)' :
                           modal.type === 'danger' ? 'linear-gradient(90deg, #f43f5e, #ec4899)' :
                           modal.type === 'success' ? 'linear-gradient(90deg, #10b981, #14b8a6)' :
                           'linear-gradient(90deg, #6366f1, #a855f7)'
              }}
            />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${style.iconBg}`}>
                  {style.icon}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {modal.title}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {modal.message}
                  </p>
                </div>
                {modal.cancelText && (
                  <button 
                    onClick={handleCancel}
                    className="text-white/30 hover:text-white/70 transition-colors p-1 -mr-2 -mt-2"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end mt-6">
                {modal.cancelText && (
                  <button
                    onClick={handleCancel}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/80
                             bg-white/5 hover:bg-white/10 border border-white/10
                             transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    {modal.cancelText}
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold
                           transition-all duration-200 hover:scale-105 active:scale-95
                           ${modal.confirmButtonClass || style.confirmBtn}`}
                >
                  {modal.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used inside <ModalProvider>')
  return ctx
}
