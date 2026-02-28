import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, TrendingUp, BrainCircuit, Lightbulb,
  GraduationCap, Clock, Calendar,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import RiskBadge from '../components/RiskBadge'
import ImprovementDelta from '../components/ImprovementDelta'
import AIAdvisoryPanels from '../components/AIAdvisoryPanels'
import { getStudentProgress } from '../api'

const riskTheme = {
  Good:     { accent: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  grad: 'linear-gradient(135deg,#022c22,#064e3b)' },
  Average:  { accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',  grad: 'linear-gradient(135deg,#451a03,#78350f)' },
  'At Risk':{ accent: '#f43f5e', bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.2)',   grad: 'linear-gradient(135deg,#4c0519,#881337)' },
}

function compositeScore(inputs = {}) {
  return (
    (inputs.attendance_percentage || 0) * 0.30 +
    (inputs.internal_marks        || 0) * 0.35 +
    (inputs.assignment_score      || 0) * 0.20 +
    (inputs.study_hours_per_day   || 0) * 10 * 0.15
  ).toFixed(1)
}

function MetricPill({ label, value, color }) {
  return (
    <div className="flex flex-col items-center px-4 py-3 rounded-xl"
         style={{ background: color + '11', border: `1px solid ${color}30` }}>
      <span className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: color + 'cc' }}>{label}</span>
      <span className="text-xl font-black mt-0.5" style={{ color }}>{value}</span>
    </div>
  )
}

const CustomDot = (props) => {
  const { cx, cy, payload } = props
  const c = { Good: '#10b981', Average: '#f59e0b', 'At Risk': '#f43f5e' }[payload.risk] || '#818cf8'
  return <circle cx={cx} cy={cy} r={5} fill={c} stroke="white" strokeWidth={2} />
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
    <div className="space-y-4 max-w-5xl mx-auto animate-pulse">
      <div className="h-10 rounded-xl w-48" style={{ background: 'rgba(99,102,241,0.08)' }} />
      <div className="h-40 rounded-2xl" style={{ background: 'rgba(99,102,241,0.06)' }} />
      <div className="h-48 rounded-2xl" style={{ background: 'rgba(99,102,241,0.06)' }} />
      <div className="h-64 rounded-2xl" style={{ background: 'rgba(99,102,241,0.06)' }} />
    </div>
  )

  if (error) return (
    <div className="max-w-5xl mx-auto text-center py-20">
      <p className="text-gray-700 text-sm font-medium">{error}</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-4 text-xs">Go Back</button>
    </div>
  )

  const history = data?.history || []
  const latest  = history[history.length - 1]
  const theme   = riskTheme[latest?.risk_level] || riskTheme.Average
  const score   = compositeScore(latest?.inputs)

  const chartData = history.map((h, i) => ({
    label: `P${i + 1}`,
    score: parseFloat(compositeScore(h.inputs)),
    date:  new Date(h.timestamp).toLocaleDateString(),
    risk:  h.risk_level,
  }))

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Back */}
      <button onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors text-sm animate-fade-up">
        <ArrowLeft size={14} /> Back
      </button>

      {/* ── Hero card ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 animate-fade-up"
           style={{ background: theme.grad, border: `1px solid ${theme.accent}33`,
                    boxShadow: `0 8px 40px ${theme.accent}33` }}>
        {/* Top accent bar */}
        <div className="h-0.5 w-full rounded-full mb-5"
             style={{ background: `linear-gradient(90deg,${theme.accent},${theme.accent}44,transparent)` }} />

        <div className="flex flex-wrap items-start gap-6">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
               style={{ background: theme.accent + '22', border: `1px solid ${theme.accent}55` }}>
            <User size={28} style={{ color: theme.accent }} />
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Student Profile</p>
            <h2 className="font-extrabold text-white text-2xl mt-0.5 leading-tight">{data?.student_name}</h2>
            <p className="font-mono text-white/40 text-xs mt-0.5">{studentId}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <RiskBadge level={latest?.risk_level} size="lg" />
              {latest?.section && (
                <span className="text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
                      style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                  <GraduationCap size={10} /> {latest.section}
                </span>
              )}
              {latest?.department && (
                <span className="text-xs text-white/50">{latest.department}</span>
              )}
              {latest?.current_year && (
                <span className="text-xs text-white/50">Year {latest.current_year}</span>
              )}
              <span className="text-xs text-white/40">{data?.total} prediction{data?.total !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Composite score */}
          <div className="text-right flex-shrink-0">
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Composite Score</p>
            <p className="text-5xl font-black mt-1 leading-none" style={{ color: theme.accent }}>{score}</p>
            <p className="text-white/40 text-[10px] mt-1">out of 100</p>
          </div>
        </div>

        {/* Metric pills */}
        {latest?.inputs && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricPill label="Attendance"   value={`${latest.inputs.attendance_percentage}%`} color={theme.accent} />
            <MetricPill label="Int. Marks"   value={latest.inputs.internal_marks}               color={theme.accent} />
            <MetricPill label="Assignments"  value={latest.inputs.assignment_score}             color={theme.accent} />
            <MetricPill label="Study Hrs"    value={`${latest.inputs.study_hours_per_day}h`}   color={theme.accent} />
          </div>
        )}

        {/* Confidence bar */}
        <div className="mt-4">
          <div className="flex justify-between mb-1.5">
            <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Model Confidence</span>
            <span className="text-white/80 text-xs font-black">{((latest?.confidence || 0) * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-700"
                 style={{ width: `${(latest?.confidence || 0) * 100}%`,
                          background: `linear-gradient(90deg,${theme.accent},${theme.accent}88)`,
                          boxShadow: `0 0 8px ${theme.accent}66` }} />
          </div>
        </div>
      </div>

      {/* ── Score trend chart ──────────────────────────────────────────── */}
      {chartData.length > 1 && (
        <div className="card card-dark animate-fade-up s1"
             style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))', border: '1px solid rgba(99,102,241,0.15)' }}>
          <p className="text-white text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp size={12} className="text-indigo-400" /> Score Trend across {data?.total} Predictions
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
                labelFormatter={l => `Prediction ${l.slice(1)} — ${chartData[parseInt(l.slice(1))-1]?.date || ''}`}
              />
              <ReferenceLine y={60} stroke="rgba(245,158,11,0.4)" strokeDasharray="4 4" label={{ value: 'Average threshold', fill: 'rgba(245,158,11,0.6)', fontSize: 9 }} />
              <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2}
                    fill="url(#scoreGrad)" dot={<CustomDot />} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Full AI Advisory (latest prediction) ──────────────────────── */}
      {latest && (
        <div className="animate-fade-up s2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
              <BrainCircuit size={14} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">AI Advisory — Latest Prediction</p>
              <p className="text-gray-500 text-xs">{new Date(latest.timestamp).toLocaleString()}</p>
            </div>
          </div>
          <AIAdvisoryPanels result={latest} theme={theme} />
        </div>
      )}

      {/* ── Prediction Timeline ────────────────────────────────────────── */}
      {history.length > 1 && (
        <div className="space-y-3 animate-fade-up s3">
          <p className="font-bold text-gray-700 text-sm flex items-center gap-2">
            <Clock size={14} className="text-indigo-500" /> Prediction History ({data?.total} total)
          </p>
          {[...history].reverse().map((h, idx, arr) => {
            const prevH = arr[idx + 1]
            const t     = riskTheme[h.risk_level] || riskTheme.Average
            const isLatest = idx === 0
            return (
              <div key={h.id} className="card"
                   style={{ background: 'rgba(255,255,255,0.97)',
                            borderLeft: `3px solid ${t.accent}`,
                            opacity: isLatest ? 1 : 0.85 }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <RiskBadge level={h.risk_level} />
                      <ImprovementDelta prev={prevH} curr={h} />
                      {isLatest && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                          Latest
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Calendar size={9} /> {new Date(h.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-500">
                      <span>Attendance: <strong className="text-gray-700">{h.inputs?.attendance_percentage}%</strong></span>
                      <span>Marks: <strong className="text-gray-700">{h.inputs?.internal_marks}</strong></span>
                      <span>Assignments: <strong className="text-gray-700">{h.inputs?.assignment_score}</strong></span>
                      <span>Study: <strong className="text-gray-700">{h.inputs?.study_hours_per_day}h/day</strong></span>
                    </div>

                    {/* Explanation snippet (non-latest only) */}
                    {!isLatest && h.explanation && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                          <BrainCircuit size={9} className="text-indigo-400" /> AI Explanation
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{h.explanation}</p>
                      </div>
                    )}

                    {/* Recommendations (non-latest only, compact) */}
                    {!isLatest && h.recommendations?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                          <Lightbulb size={9} className="text-emerald-400" /> Advisory
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {h.recommendations.slice(0, 2).map((r, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-500">
                              <span className="text-emerald-500 flex-shrink-0">✓</span>
                              {typeof r === 'object' ? (r.action || '') : r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Score</p>
                    <p className="font-black text-2xl" style={{ color: t.accent }}>
                      {compositeScore(h.inputs)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {((h.confidence || 0) * 100).toFixed(0)}% conf
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
