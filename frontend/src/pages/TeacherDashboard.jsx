import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, TrendingUp, AlertTriangle, CheckCircle,
  BarChart2, RefreshCw, Search, GraduationCap
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, Cell,
  PieChart, Pie, Legend, AreaChart, Area
} from 'recharts'
import StatCard from '../components/StatCard'
import RiskBadge from '../components/RiskBadge'
import ExportButton from '../components/ExportButton'
import { getDashboard, getPredictions, getDatasetInfo } from '../api'

const PIE_COLORS = { Good: '#10b981', Average: '#f59e0b', 'At Risk': '#f43f5e' }

export default function TeacherDashboard() {
  const [stats, setStats]       = useState(null)
  const [dataset, setDataset]   = useState(null)
  const [predictions, setPreds] = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterRisk, setFilter] = useState('')
  const [page, setPage]         = useState(1)
  const PER = 10

  const load = async () => {
    setLoading(true)
    try {
      const [d, p, ds] = await Promise.all([
        getDashboard(),
        getPredictions({ page, limit: PER, risk_level: filterRisk || undefined, search: search || undefined }),
        getDatasetInfo(),
      ])
      setStats(d.data)
      setPreds(p.data.items)
      setTotal(p.data.total)
      setDataset(ds.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [page, filterRisk, search])

  const dist    = stats?.risk_distribution || { Good: 0, Average: 0, 'At Risk': 0 }
  const pieData = Object.entries(dist).map(([name, value]) => ({ name, value }))
  const totalPages = Math.ceil(total / PER)

  // Radial bar for risk
  const radialData = pieData.map(p => ({
    ...p,
    fill: PIE_COLORS[p.name],
    max: stats?.total_students || 1,
  }))

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}>
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-gray-800 text-xl">Teacher Analytics</h2>
            <p className="text-gray-400 text-sm">Live cohort performance overview</p>
          </div>
        </div>
        <button onClick={load} className="btn-secondary">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ── Dark stat cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up s1">
        <StatCard title="Total Students" value={stats?.total_students || 0}   icon={Users}         color="blue"   />
        <StatCard title="Good"           value={dist.Good || 0}                icon={CheckCircle}   color="green"  />
        <StatCard title="Average"        value={dist.Average || 0}             icon={TrendingUp}    color="amber"  />
        <StatCard title="At Risk"        value={dist['At Risk'] || 0}          icon={AlertTriangle} color="rose"   />
      </div>

      {/* ── Metric averages ──────────────────────────────────────────────── */}
      {(stats?.total_students || 0) > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up s2">
          {[
            { label: 'Avg Attendance',   value: `${stats.average_attendance}%`,        color: '#818cf8' },
            { label: 'Avg Int. Marks',   value: `${stats.average_internal_marks}/100`, color: '#a78bfa' },
            { label: 'Avg Assignments',  value: `${stats.average_assignment_score}/100`,color: '#c084fc' },
            { label: 'Avg Study Hours',  value: `${stats.average_study_hours} hrs/day`, color: '#f472b6' },
          ].map((m, i) => (
            <div key={m.label} className="card text-center"
                 style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(229,231,235,0.7)', animationDelay: `${i*0.05}s` }}>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{m.label}</p>
              <p className="text-2xl font-black mt-1.5 leading-none" style={{ color: m.color }}>{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts grid ──────────────────────────────────────────────────── */}
      {(stats?.total_students || 0) > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-up s3">

          {/* Donut pie */}
          <div className="card"
               style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p className="section-title text-white/40 flex items-center gap-2">
              <BarChart2 size={11} /> Risk Distribution
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                     dataKey="value" paddingAngle={4}>
                  {pieData.map(e => (
                    <Cell key={e.name} fill={PIE_COLORS[e.name]}
                          style={{ filter: `drop-shadow(0 0 6px ${PIE_COLORS[e.name]}aa)` }} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15,12,41,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', color: 'white' }} />
                <Legend iconType="circle" iconSize={8}
                  formatter={v => <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart */}
          <div className="card"
               style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p className="section-title text-white/40">Count by Category</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pieData} margin={{ left: -25, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'rgba(15,12,41,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', color: 'white' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {pieData.map(e => (
                    <Cell key={e.name} fill={PIE_COLORS[e.name]}
                          style={{ filter: `drop-shadow(0 0 4px ${PIE_COLORS[e.name]}88)` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Dataset info */}
          {dataset?.available && (
            <div className="card"
                 style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))', border: '1px solid rgba(99,102,241,0.15)' }}>
              <p className="section-title text-white/40">Training Dataset</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40 font-medium">Total rows</span>
                  <span className="text-indigo-300 font-bold">{(dataset.total_rows || 0).toLocaleString()}</span>
                </div>
                {Object.entries(dataset.label_distribution || {}).map(([k, v]) => (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/40">{k}</span>
                      <span className="text-white/70 font-bold">{v}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="animated-bar h-full rounded-full"
                           style={{ '--target-width': `${(v/dataset.total_rows)*100}%`, width: `${(v/dataset.total_rows)*100}%`,
                                    background: PIE_COLORS[k], boxShadow: `0 0 6px ${PIE_COLORS[k]}88` }} />
                    </div>
                  </div>
                ))}

                <div className="border-t border-white/[0.06] pt-3 space-y-1.5">
                  <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Feature Averages</p>
                  {Object.entries(dataset.feature_stats || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[10px]">
                      <span className="text-white/35 capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="text-white/60 font-bold">{v.mean}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Predictions table ─────────────────────────────────────────────── */}
      <div className="card animate-fade-up s4"
           style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(229,231,235,0.7)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <BarChart2 size={15} className="text-indigo-500" /> All Predictions
            <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-100">{total}</span>
          </p>
          <div className="flex items-center gap-3">
            <ExportButton />
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                     placeholder="Search name / ID…" className="input-field pl-9 py-2 text-xs w-48" />
            </div>
            <select value={filterRisk} onChange={e => { setFilter(e.target.value); setPage(1) }}
                    className="input-field text-xs w-36 py-2">
              <option value="">All Levels</option>
              <option>Good</option>
              <option>Average</option>
              <option>At Risk</option>
            </select>
          </div>
        </div>

        {predictions.length === 0 ? (
          <div className="text-center py-12 rounded-xl"
               style={{ background: 'rgba(99,102,241,0.03)', border: '1px dashed rgba(99,102,241,0.15)' }}>
            <p className="text-gray-400 text-sm">No predictions match the filter.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {['#', 'Student', 'Att.', 'Marks', 'Assign.', 'Hrs', 'Risk', 'Conf.', 'Time'].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-300 uppercase tracking-wider pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {predictions.map((r, i) => (
                  <tr key={r.id} className="tr-hover border-b border-gray-50">
                    <td className="py-3 pr-4 text-gray-300">{(page-1)*PER + i + 1}</td>
                    <td className="py-3 pr-4">
                      <Link to={`/student/${r.student_id}`} className="hover:text-indigo-600 transition-colors">
                        <p className="font-semibold text-gray-800">{r.student_name}</p>
                        <p className="text-gray-300 font-mono text-[10px]">{r.student_id}</p>
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{r.inputs?.attendance_percentage}%</td>
                    <td className="py-3 pr-4 text-gray-500">{r.inputs?.internal_marks}</td>
                    <td className="py-3 pr-4 text-gray-500">{r.inputs?.assignment_score}</td>
                    <td className="py-3 pr-4 text-gray-500">{r.inputs?.study_hours_per_day}h</td>
                    <td className="py-3 pr-4"><RiskBadge level={r.risk_level} /></td>
                    <td className="py-3 pr-4 font-bold text-gray-700">{(r.confidence*100).toFixed(0)}%</td>
                    <td className="py-3 pr-4 text-gray-300">{new Date(r.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="text-[11px] text-gray-400">
                  {(page-1)*PER+1}–{Math.min(page*PER,total)} of {total}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                          className="btn-secondary text-[11px] py-1.5 px-3">← Prev</button>
                  <span className="text-[11px] text-gray-400 px-2">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                          className="btn-secondary text-[11px] py-1.5 px-3">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
