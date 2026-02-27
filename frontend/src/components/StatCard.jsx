import React from 'react'
import useCountUp from '../hooks/useCountUp'

const themes = {
  blue:   { bg: 'stat-card-blue',   text: '#818cf8', border: 'rgba(99,102,241,0.3)'  },
  green:  { bg: 'stat-card-green',  text: '#34d399', border: 'rgba(16,185,129,0.3)'   },
  amber:  { bg: 'stat-card-amber',  text: '#fbbf24', border: 'rgba(245,158,11,0.3)'   },
  rose:   { bg: 'stat-card-rose',   text: '#fb7185', border: 'rgba(244,63,94,0.3)'    },
  purple: { bg: 'stat-card-purple', text: '#c084fc', border: 'rgba(168,85,247,0.3)'  },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', suffix = '' }) {
  const numericValue = typeof value === 'number' ? value : parseInt(value) || 0
  const animated     = useCountUp(numericValue)
  const theme        = themes[color] || themes.blue

  return (
    <div className={`${theme.bg} card-dark relative rounded-2xl p-5 overflow-hidden select-none
                    transition-all duration-300 hover:shadow-lg cursor-default`}
         style={{ 
           border: `1px solid ${theme.border}`,
           boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
         }}>

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-white text-[10px] font-bold uppercase tracking-[0.15em] leading-none select-none">
            {title}
          </p>
          <p className="mt-2.5 font-black text-white leading-none"
             style={{ fontSize: '1.85rem', letterSpacing: '-0.02em' }}>
            {animated.toLocaleString()}{suffix}
          </p>
          {subtitle && (
            <p className="mt-1.5 text-white text-[11px] font-medium truncate">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{
                 background: 'rgba(255,255,255,0.15)',
                 border: `1px solid ${theme.border}`,
               }}>
            <Icon size={18} style={{ color: theme.text }} />
          </div>
        )}
      </div>
    </div>
  )
}
