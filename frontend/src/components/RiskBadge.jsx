import React from 'react'

const config = {
  'Good':     { cls: 'badge-good',    dot: 'bg-green-500'  },
  'Average':  { cls: 'badge-average', dot: 'bg-yellow-500' },
  'At Risk':  { cls: 'badge-risk',    dot: 'bg-red-500'    },
}

export default function RiskBadge({ level, size = 'md' }) {
  const { cls, dot } = config[level] || config['Average']
  return (
    <span className={`${cls} ${size === 'lg' ? 'text-sm px-3 py-1' : ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} inline-block mr-1`} />
      {level}
    </span>
  )
}
