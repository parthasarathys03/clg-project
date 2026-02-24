import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * Shows the composite score delta between two consecutive predictions.
 * prev and curr are prediction record objects.
 */
function compositeScore(inputs = {}) {
  const att    = inputs.attendance_percentage || 0
  const marks  = inputs.internal_marks || 0
  const assign = inputs.assignment_score || 0
  const hours  = inputs.study_hours_per_day || 0
  return att * 0.30 + marks * 0.35 + assign * 0.20 + hours * 10 * 0.15
}

export default function ImprovementDelta({ prev, curr, className = '' }) {
  if (!prev || !curr) return null

  const prevScore = compositeScore(prev.inputs)
  const currScore = compositeScore(curr.inputs)
  const delta     = currScore - prevScore

  if (Math.abs(delta) < 0.5) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 ${className}`}>
        <Minus size={10} /> 0.0
      </span>
    )
  }

  if (delta > 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 ${className}`}>
        <TrendingUp size={10} /> +{delta.toFixed(1)}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 ${className}`}>
      <TrendingDown size={10} /> {delta.toFixed(1)}
    </span>
  )
}
