import React from 'react'

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   text: 'text-blue-700'   },
    green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600', text: 'text-green-700'  },
    yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600',text: 'text-yellow-700' },
    red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',     text: 'text-red-700'    },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600',text: 'text-purple-700' },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`card ${c.bg} border-0`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${c.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
          <span className={trend >= 0 ? 'text-green-600' : 'text-red-600'}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
          <span>vs last session</span>
        </div>
      )}
    </div>
  )
}
