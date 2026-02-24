import React from 'react'

const cfg = {
  'Good':    { cls: 'badge-good',    dot: '#10b981', emoji: '✦' },
  'Average': { cls: 'badge-average', dot: '#f59e0b', emoji: '◈' },
  'At Risk': { cls: 'badge-risk',    dot: '#f43f5e', emoji: '▲' },
}

export default function RiskBadge({ level, size = 'md' }) {
  const { cls, dot, emoji } = cfg[level] || cfg['Average']
  const large = size === 'lg'
  return (
    <span className={`${cls} ${large ? 'text-sm px-4 py-1.5 gap-2' : 'text-xs px-2.5 py-0.5'}`}>
      <span style={{ color: dot, fontSize: large ? '10px' : '8px' }}>{emoji}</span>
      {level}
    </span>
  )
}
