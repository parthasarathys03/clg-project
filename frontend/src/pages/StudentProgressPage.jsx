import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, BrainCircuit, Lightbulb, TrendingUp } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import RiskBadge from '../components/RiskBadge'
import ImprovementDelta from '../components/ImprovementDelta'
import { getStudentProgress } from '../api'

const riskTheme = {
  Good:     { accent: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
  Average:  { accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  'At Risk':{ accent: '#f43f5e', bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.2)'  },
}

function compositeScore(inputs = {}) {
  return (
    (inputs.attendance_percentage || 0) * 0.30 +
    (inputs.internal_marks || 0) * 0.35 +
    (inputs.assignment_score || 0) * 0.20 +
    (inputs.study_hours_per_day || 0) * 10 * 0.15
  )
}

export default function StudentProgressPage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getStudentProgress(studentId)
        setData(res.data)
      } catch (e) {
        setError(e.response?.data?.detail || 'Student not found')
      }
      setLoading(false)
    }
    load()
  }, [studentId])

  if (loading) return (
    <div className="space-y-4 max-w-4xl mx-auto animate-pulse">
      <div className="h-10 rounded-xl w-48" style={{ background: 'rgba(99,102,241,0.08)' }} />
      <div className="h-32 rounded-2xl" style={{ background: 'rgba(99,102,241,0.06)' }} />
      <div className="h-48 rounded-2xl" style={{ background: 'rgba(99,102,241,0.06)' }} />
    </div>
  )

  if (error) return (
    <div className="max-w-4xl mx-auto text-center py-20">
      <p className="text-gray-700 text-sm font-medium">{error}</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-4 text-xs">Go Back</button>
    </div>
  )

  const history  = data?.history || []
  const latest   = history[history.length - 1]
  const theme    = riskTheme[latest?.risk_level] || riskTheme.Average

  const chartData = history.map((h, i) => ({
    label:   `P${i + 1}`,
    score:   Math.round(compositeScore(h.inputs) * 10) / 10,
    date:    new Date(h.timestamp).toLocaleDateString(),
    risk:    h.risk_level,
  }))

  const CustomDot = (props) => {
    const { cx, cy, payload } = props
    const c = { Good: '#10b981', Average: '#f59e0b', 'At Risk': '#f43f5e' }[payload.risk] || '#818cf8'
    return <circle cx={cx} cy={cy} r={5} fill={c} stroke="white" strokeWidth={2} />
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Back */}
      <button onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors text-sm animate-fade-up">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Hero card */}
      <div className="rounded-2xl p-6 animate-fade-up"
           style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
               style={{ background: theme.accent + '22', border: `1px solid ${theme.accent}44` }}>
            <User size={20} style={{ color: theme.accent }} />
          </div>
          <div className="flex-1">
            <h2 className="font-extrabold text-gray-800 text-xl">{data?.student_name}</h2>
            <p className="font-mono text-gray-400 text-xs">{studentId}</p>
            <div className="flex items-center gap-3 mt-2">
              <RiskBadge level={latest?.risk_level} />
              <span className="text-xs text-gray-500">
                Confidence: <strong className="text-gray-700">{((latest?.confidence || 0) * 100).toFixed(1)}%</strong>
              </span>
              <span className="text-xs text-gray-400">{data?.total} prediction{data?.total !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Composite Score</p>
            <p className="text-3xl font-black mt-0.5" style={{ color: theme.accent }}>
              {Math.round(compositeScore(latest?.inputs) * 10) / 10}
            </p>
            <p className="text-[10px] text-gray-400">out of 100</p>
          </div>
        </div>
      </div>

      {/* Score trend chart */}
      {chartData.length > 1 && (
        <div className="card card-dark animate-fade-up s1"
             style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))', border: '1px solid rgba(99,102,241,0.15)' }}>
          <p className="section-title text-white flex items-center gap-2 mb-4">
            <TrendingUp size={11} /> Score Trend
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="label" tick={{ fill: '#ffffff', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#ffffff', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,12,41,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, color: 'white', fontSize: 11 }}
                formatter={(v, _, p) => [`${v} (${p.payload.risk})`, 'Score']}
                labelFormatter={l => `Prediction ${l.slice(1)}`}
              />
              <ReferenceLine y={60} stroke="rgba(245,158,11,0.4)" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2}
                    fill="url(#scoreGrad)" dot={<CustomDot />} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3 animate-fade-up s2">
        <p className="font-bold text-gray-700 text-sm">Prediction Timeline</p>
        {[...history].reverse().map((h, idx, arr) => {
          const prevH = arr[idx + 1]
          const t     = riskTheme[h.risk_level] || riskTheme.Average
          return (
            <div key={h.id} className="card"
                 style={{ background: 'rgba(255,255,255,0.97)', borderLeft: `3px solid ${t.accent}` }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <RiskBadge level={h.risk_level} />
                    <ImprovementDelta prev={prevH} curr={h} />
                    <span className="text-[10px] text-gray-400">{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-xs text-gray-500 mt-2">
                    <span>Attendance: <strong className="text-gray-700">{h.inputs?.attendance_percentage}%</strong></span>
                    <span>Marks: <strong className="text-gray-700">{h.inputs?.internal_marks}</strong></span>
                    <span>Assignments: <strong className="text-gray-700">{h.inputs?.assignment_score}</strong></span>
                    <span>Study: <strong className="text-gray-700">{h.inputs?.study_hours_per_day}h/day</strong></span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-gray-400">Score</p>
                  <p className="font-black text-lg" style={{ color: t.accent }}>
                    {Math.round(compositeScore(h.inputs) * 10) / 10}
                  </p>
                </div>
              </div>

              {/* Explanation snippet */}
              {h.explanation && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <BrainCircuit size={9} className="text-indigo-400" /> AI Explanation
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{h.explanation}</p>
                </div>
              )}

              {/* Recommendations */}
              {h.recommendations?.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Lightbulb size={9} className="text-emerald-400" /> Advisory
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {h.recommendations.slice(0, 4).map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-500">
                        <span className="text-emerald-500 flex-shrink-0">✓</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
