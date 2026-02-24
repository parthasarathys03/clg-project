import React from 'react'
import useCountUp from '../hooks/useCountUp'

const themes = {
  blue:   { bg: 'stat-card-blue',   text: '#818cf8', glow: 'rgba(99,102,241,0.35)'  },
  green:  { bg: 'stat-card-green',  text: '#34d399', glow: 'rgba(16,185,129,0.3)'   },
  amber:  { bg: 'stat-card-amber',  text: '#fbbf24', glow: 'rgba(245,158,11,0.3)'   },
  rose:   { bg: 'stat-card-rose',   text: '#fb7185', glow: 'rgba(244,63,94,0.3)'    },
  purple: { bg: 'stat-card-purple', text: '#c084fc', glow: 'rgba(168,85,247,0.35)'  },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', suffix = '' }) {
  const numericValue = typeof value === 'number' ? value : parseInt(value) || 0
  const animated     = useCountUp(numericValue)
  const theme        = themes[color] || themes.blue

  return (
    <div className={`${theme.bg} relative rounded-2xl p-5 overflow-hidden select-none
                    transition-all duration-300 hover:scale-[1.03] cursor-default`}
         style={{ boxShadow: `0 4px 24px ${theme.glow}, 0 1px 3px rgba(0,0,0,0.25)` }}>

      {/* Top shine line */}
      <div className="absolute top-0 left-0 right-0 h-px"
           style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)' }} />

      {/* Decorative bg circle */}
      <div className="absolute -right-5 -bottom-5 w-28 h-28 rounded-full pointer-events-none"
           style={{ background: theme.text, opacity: 0.08 }} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-white/45 text-[10px] font-bold uppercase tracking-[0.15em] leading-none select-none">
            {title}
          </p>
          <p className="mt-2.5 font-black text-white leading-none"
             style={{ fontSize: '1.85rem', letterSpacing: '-0.02em' }}>
            {animated.toLocaleString()}{suffix}
          </p>
          {subtitle && (
            <p className="mt-1.5 text-white/35 text-[11px] font-medium truncate">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{
                 background: 'rgba(255,255,255,0.08)',
                 border: '1px solid rgba(255,255,255,0.1)',
               }}>
            <Icon size={18} style={{ color: theme.text }} />
          </div>
        )}
      </div>
    </div>
  )
}
