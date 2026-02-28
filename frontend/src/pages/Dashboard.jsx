import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users, TrendingUp, AlertTriangle, CheckCircle,
  BrainCircuit, Database, RefreshCw, ArrowRight, Zap, Activity
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts'
import StatCard from '../components/StatCard'
import RiskBadge from '../components/RiskBadge'
import { useModal } from '../components/ConfirmModal'
import { useClusterPrecompute } from '../hooks/useClusterCache'
import { getDashboard, getHealth, trainModel, resetDemoData } from '../api'

const PIE_COLORS   = { Good: '#10b981', Average: '#f59e0b', 'At Risk': '#f43f5e' }
const PIE_GLOW     = { Good: 'rgba(16,185,129,0.6)', Average: 'rgba(245,158,11,0.6)', 'At Risk': 'rgba(244,63,94,0.6)' }

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
  if (percent < 0.05) return null
  const RAD  = Math.PI / 180
  // Position label in the middle of the donut slice (between inner and outer radius)
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x    = cx + radius * Math.cos(-midAngle * RAD)
  const y    = cy + radius * Math.sin(-midAngle * RAD)
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
          fill="#ffffff" fontSize={12} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const Shimmer = () => (
  <div className="animate-pulse space-y-4">
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
      ))}
    </div>
    <div className="h-64 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
  </div>
)

export default function Dashboard() {
  const [stats, setStats]       = useState(null)
  const [health, setHealth]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [training, setTraining] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [trainMsg, setTrainMsg] = useState(null)
  const { confirm } = useModal()
  const navigate = useNavigate()
  
  // Pre-compute clusters in background so they're ready when user clicks Behaviour Clusters
  useClusterPrecompute()

  const load = async () => {
    setLoading(true)
    try {
      const [d, h] = await Promise.all([getDashboard(), getHealth()])
      setStats(d.data)
      setHealth(h.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // Auto-refresh whenever a prediction is saved or deleted
    const onChange = () => load()
    window.addEventListener('predictionSaved', onChange)
    window.addEventListener('predictionDeleted', onChange)
    return () => {
      window.removeEventListener('predictionSaved', onChange)
      window.removeEventListener('predictionDeleted', onChange)
    }
  }, [])

  const handleTrain = async () => {
    setTraining(true)
    setTrainMsg(null)
    try {
      const res = await trainModel()
      setTrainMsg({ ok: true, text: `Model trained — Accuracy: ${(res.data.accuracy * 100).toFixed(1)}%  |  Dataset: ${res.data.dataset_rows.toLocaleString()} rows` })
      load()
    } catch (e) {
      setTrainMsg({ ok: false, text: e.response?.data?.detail || e.message })
    }
    setTraining(false)
  }

  const handleReset = async () => {
    const confirmed = await confirm({
      title: 'Reset Demo Data',
      message: 'Reset all predictions and re-seed 25 demo students? This will clear all existing data.',
      confirmText: 'Reset',
      cancelText: 'Cancel',
      type: 'danger'
    })
    if (!confirmed) return
    setResetting(true)
    setTrainMsg(null)
    try {
      const res = await resetDemoData()
      setTrainMsg({ ok: true, text: `Demo reset complete — ${res.data.students_seeded} students seeded` })
      load()
    } catch (e) {
      setTrainMsg({ ok: false, text: e.response?.data?.detail || 'Reset failed' })
    }
    setResetting(false)
  }

  const dist    = stats?.risk_distribution || { Good: 0, Average: 0, 'At Risk': 0 }
  const pieData = Object.entries(dist).map(([name, value]) => ({ name, value }))
  const hasData = (stats?.total_students || 0) > 0

  // Build mini trend from recent predictions
  const trendData = [...(stats?.recent_predictions || [])].reverse().map((r, i) => ({
    n: i + 1,
    Good:    r.risk_level === 'Good' ? 1 : 0,
    Average: r.risk_level === 'Average' ? 1 : 0,
    AtRisk:  r.risk_level === 'At Risk' ? 1 : 0,
  }))

  return (
    <div className="space-y-6">

      {/* ── Hero system bar ──────────────────────────────────────────────── */}
      <div className="relative rounded-2xl p-5 overflow-hidden animate-fade-up"
           style={{
             background: 'linear-gradient(135deg, #1e1b4b 0%, #2d1b69 55%, #1a1040 100%)',
             border: '1px solid rgba(99,102,241,0.35)',
             boxShadow: '0 4px 32px rgba(99,102,241,0.2)',
           }}>
        {/* Animated gradient strip */}
        <div className="absolute top-0 left-0 right-0 h-0.5 animated-gradient"
             style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1)', backgroundSize: '200% 100%' }} />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            {/* Model status */}
            <div className="flex items-center gap-2">
              <div className={`relative w-2.5 h-2.5 rounded-full ${health?.model_ready ? 'bg-emerald-400' : 'bg-rose-400'}`}>
                {health?.model_ready && (
                  <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ring-pulse" />
                )}
              </div>
              <span className="text-sm font-semibold text-white/80">
                ML Model: <span className={health?.model_ready ? 'text-emerald-400' : 'text-rose-400'}>
                  {health?.model_ready ? 'Ready' : 'Not Trained'}
                </span>
              </span>
            </div>

            {/* AI status */}
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${health?.openai_configured ? 'bg-violet-400' : 'bg-amber-400'}`} />
              <span className="text-sm font-semibold text-white/80">
                AI Engine: <span className={health?.openai_configured ? 'text-violet-400' : 'text-amber-400'}>
                  {health?.ai_provider === 'gemini' ? 'Gemini AI'
                    : health?.ai_provider === 'openai' ? 'OpenAI GPT'
                    : 'Rule-based'}
                </span>
              </span>
            </div>

            {/* Predictions count */}
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-indigo-400" />
              <span className="text-sm font-semibold text-white/80">
                <span className="text-indigo-300">{health?.predictions_stored || 0}</span> predictions stored
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleTrain} disabled={training} className="btn-primary text-sm">
              {training
                ? <><RefreshCw size={14} className="animate-spin" /> Training…</>
                : <><Database size={14} /> {health?.model_ready ? 'Retrain' : 'Train Model'}</>
              }
            </button>
            <button onClick={load} className="btn-secondary text-sm">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={handleReset} disabled={resetting}
                    className="btn-secondary text-sm flex items-center gap-1.5"
                    style={{ borderColor: 'rgba(244,63,94,0.4)', color: '#fda4af' }}>
              {resetting
                ? <><RefreshCw size={14} className="animate-spin" /> Resetting…</>
                : <><RefreshCw size={14} /> Reset Demo</>
              }
            </button>
          </div>
        </div>

        {/* Train result */}
        {trainMsg && (
          <div className={`mt-3 flex items-center gap-2 text-sm font-medium rounded-xl px-4 py-2.5
                          ${trainMsg.ok
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                          }`}>
            <Zap size={14} />
            {trainMsg.text}
          </div>
        )}
      </div>

      {loading ? <Shimmer /> : (
        <>
          {/* ── Stat cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="animate-fade-up s1">
              <StatCard title="Total Analyzed" value={stats?.total_students || 0}
                        icon={Users} color="blue" />
            </div>
            <div className="animate-fade-up s2">
              <StatCard title="Good Standing" value={dist.Good || 0}
                        icon={CheckCircle} color="green"
                        subtitle={hasData ? `${Math.round((dist.Good/(stats?.total_students||1))*100)}% of cohort` : ''} />
            </div>
            <div className="animate-fade-up s3">
              <StatCard title="Average" value={dist.Average || 0}
                        icon={TrendingUp} color="amber"
                        subtitle={hasData ? `${Math.round((dist.Average/(stats?.total_students||1))*100)}% of cohort` : ''} />
            </div>
            <div className="animate-fade-up s4">
              <StatCard title="At Risk" value={dist['At Risk'] || 0}
                        icon={AlertTriangle} color="rose"
                        subtitle={hasData ? `${Math.round((dist['At Risk']/(stats?.total_students||1))*100)}% of cohort` : ''} />
            </div>
          </div>

          {/* ── Charts row ──────────────────────────────────────────────── */}
          {hasData ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 animate-fade-up s3">

              {/* Pie — 2 cols */}
              <div className="lg:col-span-2 card card-dark"
                   style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))', border: '1px solid rgba(99,102,241,0.15)' }}>
                <p className="text-white text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity size={12} className="text-indigo-400" /> Risk Distribution
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                         dataKey="value" paddingAngle={3} labelLine={false}
                         label={<CustomPieLabel />}>
                      {pieData.map(entry => (
                        <Cell key={entry.name} fill={PIE_COLORS[entry.name]}
                              style={{ filter: `drop-shadow(0 0 8px ${PIE_GLOW[entry.name]})` }} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgba(15,12,41,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', color: 'white' }}
                      formatter={(v, n) => [v, n]}
                    />
                    <Legend iconType="circle" iconSize={8}
                      formatter={(v) => <span style={{ color: '#ffffff', fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Averages — 3 cols */}
              <div className="lg:col-span-3 card card-dark"
                   style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))', border: '1px solid rgba(99,102,241,0.15)' }}>
                <p className="text-white text-xs font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
                  <TrendingUp size={12} className="text-purple-400" /> Cohort Averages
                </p>
                <div className="space-y-4">
                  {[
                    { label: 'Attendance',       value: stats?.average_attendance      || 0, max: 100, color: '#818cf8' },
                    { label: 'Internal Marks',   value: stats?.average_internal_marks  || 0, max: 100, color: '#a78bfa' },
                    { label: 'Assignment Score', value: stats?.average_assignment_score|| 0, max: 100, color: '#c084fc' },
                    { label: 'Study Hrs (×10)',  value: (stats?.average_study_hours||0)*10, max: 100, color: '#f472b6' },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-white text-xs font-semibold">{m.label}</span>
                        <span className="text-white text-xs font-bold">
                          {m.label.includes('×10') ? (m.value / 10).toFixed(1) + ' hrs' : m.value + (m.label.includes('Attendance') ? '%' : '/100')}
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden"
                           style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="animated-bar h-full rounded-full"
                             style={{ '--target-width': `${m.value}%`, background: `linear-gradient(90deg, ${m.color}, ${m.color}88)`,
                                      boxShadow: `0 0 8px ${m.color}88`, width: `${m.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── Empty state ──────────────────────────────────────────────── */
            <div className="rounded-2xl p-16 text-center animate-fade-up s2 relative overflow-hidden"
                 style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.85),rgba(30,27,75,0.8))', border: '1px dashed rgba(99,102,241,0.3)' }}>
              <div className="animate-float inline-block mb-5">
                <BrainCircuit size={52} style={{ color: 'rgba(129,140,248,0.5)' }} />
              </div>
              <p className="text-white/60 text-lg font-bold">No predictions yet</p>
              <p className="text-white/30 text-sm mt-2">Train the model then go to Predict Student to get started.</p>
              <Link to="/predict" className="inline-flex items-center gap-2 mt-5 btn-primary text-sm">
                Go to Prediction <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* ── Trend area chart (if ≥ 3 predictions) ──────────────────── */}
          {trendData.length >= 3 && (
            <div className="card card-dark animate-fade-up s4"
                 style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))', border: '1px solid rgba(99,102,241,0.15)' }}>
              <p className="text-white text-xs font-bold uppercase tracking-widest mb-4">
                Session Prediction Trend
              </p>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={trendData} margin={{ left: -30, right: 10 }}>
                  <defs>
                    <linearGradient id="cGood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="cAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="cRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="n" tick={{ fill: '#ffffff', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#ffffff', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'rgba(15,12,41,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', color: 'white' }} />
                  <Area type="monotone" dataKey="Good"    stroke="#10b981" fill="url(#cGood)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Average" stroke="#f59e0b" fill="url(#cAvg)"  strokeWidth={2} />
                  <Area type="monotone" dataKey="AtRisk"  stroke="#f43f5e" fill="url(#cRisk)" strokeWidth={2} name="At Risk" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Recent predictions table ─────────────────────────────────── */}
          {hasData && stats?.recent_predictions?.length > 0 && (
            <div className="card animate-fade-up s5"
                 style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(229,231,235,0.6)' }}>
              <div className="flex items-center justify-between mb-5">
                <p className="font-bold text-black text-sm flex items-center gap-2">
                  <Activity size={15} className="text-indigo-500" /> Recent Predictions
                </p>
                <Link to="/history"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      {['Student', 'Attendance', 'Marks', 'Assignments', 'Study Hrs', 'Risk Level', 'Confidence'].map(h => (
                        <th key={h} className="text-left text-[10px] font-bold text-black uppercase tracking-wider pb-3 pr-5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_predictions.map((r, idx) => (
                      <tr key={r.id} className="tr-hover border-b border-gray-200 cursor-pointer"
                          style={{ animationDelay: `${idx * 0.04}s` }}
                          onClick={() => navigate(`/student/${r.student_id}`)}>
                        <td className="py-3 pr-5">
                          <Link to={`/student/${r.student_id}`} onClick={e => e.stopPropagation()}
                                className="hover:text-indigo-700 transition-colors">
                            <p className="font-semibold text-black text-xs">{r.student_name}</p>
                            <p className="font-mono text-gray-600 text-[10px]">{r.student_id}</p>
                          </Link>
                        </td>
                        <td className="py-3 pr-5 text-black text-xs">{r.inputs?.attendance_percentage}%</td>
                        <td className="py-3 pr-5 text-black text-xs">{r.inputs?.internal_marks}</td>
                        <td className="py-3 pr-5 text-black text-xs">{r.inputs?.assignment_score}</td>
                        <td className="py-3 pr-5 text-black text-xs">{r.inputs?.study_hours_per_day}h</td>
                        <td className="py-3 pr-5"><RiskBadge level={r.risk_level} /></td>
                        <td className="py-3 pr-5">
                          <span className="text-xs font-bold text-black">{(r.confidence * 100).toFixed(1)}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
