import React, { useEffect, useState } from 'react'
import {
  Users, TrendingUp, AlertTriangle, CheckCircle,
  BarChart2, RefreshCw, Search, Filter
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  Legend, AreaChart, Area
} from 'recharts'
import StatCard from '../components/StatCard'
import RiskBadge from '../components/RiskBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { getDashboard, getPredictions, getDatasetInfo } from '../api'

const PIE_COLORS = { Good: '#22c55e', Average: '#f59e0b', 'At Risk': '#ef4444' }

export default function TeacherDashboard() {
  const [stats, setStats]         = useState(null)
  const [dataset, setDataset]     = useState(null)
  const [predictions, setPreds]   = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterRisk, setFilterRisk] = useState('')
  const [page, setPage]           = useState(1)

  const PER_PAGE = 10

  const load = async () => {
    setLoading(true)
    try {
      const [d, p, ds] = await Promise.all([
        getDashboard(),
        getPredictions({ page, limit: PER_PAGE, risk_level: filterRisk || undefined, search: search || undefined }),
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

  if (loading) return <LoadingSpinner message="Loading teacher analytics…" size="lg" />

  const dist    = stats?.risk_distribution || { Good: 0, Average: 0, 'At Risk': 0 }
  const pieData = Object.entries(dist).map(([name, value]) => ({ name, value }))

  // Build time-series trend from recent predictions (newest first → reverse for chart)
  const trendData = [...(stats?.recent_predictions || [])].reverse().map((r, i) => ({
    index: i + 1,
    Good:    r.risk_level === 'Good' ? 1 : 0,
    Average: r.risk_level === 'Average' ? 1 : 0,
    AtRisk:  r.risk_level === 'At Risk' ? 1 : 0,
  }))

  // Dataset feature comparison bars
  const featureData = dataset?.feature_stats ? Object.entries(dataset.feature_stats).map(([k, v]) => ({
    feature: k.replace('_', ' ').replace('_', ' '),
    mean: v.mean,
    min: v.min,
    max: v.max,
  })) : []

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="space-y-6">

      {/* ── Page title ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Teacher Analytics Dashboard</h2>
          <p className="text-sm text-gray-400">Comprehensive view of student cohort performance</p>
        </div>
        <button onClick={load} className="btn-secondary text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students"   value={stats?.total_students || 0}    icon={Users}          color="blue" />
        <StatCard title="Good"             value={dist.Good || 0}                  icon={CheckCircle}    color="green" />
        <StatCard title="Average"          value={dist.Average || 0}               icon={TrendingUp}     color="yellow" />
        <StatCard title="At Risk"          value={dist['At Risk'] || 0}            icon={AlertTriangle}  color="red" />
      </div>

      {/* ── Metric averages ──────────────────────────────────────────────── */}
      {stats?.total_students > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Avg Attendance',    value: `${stats.average_attendance}%`,       color: 'text-blue-600'   },
            { label: 'Avg Internal Marks',value: `${stats.average_internal_marks}/100`, color: 'text-purple-600' },
            { label: 'Avg Assignments',   value: `${stats.average_assignment_score}/100`,color: 'text-cyan-600'  },
            { label: 'Avg Study Hours',   value: `${stats.average_study_hours} hrs`,    color: 'text-green-600'  },
          ].map(m => (
            <div key={m.label} className="card text-center">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{m.label}</p>
              <p className={`text-2xl font-bold mt-1 ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts ───────────────────────────────────────────────────────── */}
      {stats?.total_students > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm flex items-center gap-2">
              <BarChart2 size={14} className="text-blue-600" /> Risk Distribution
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={70}
                     dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map(entry => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Risk bar */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm">Risk Category Counts</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pieData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {pieData.map(entry => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Dataset info */}
          {dataset?.available && (
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-4 text-sm">Training Dataset</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total rows</span>
                  <span className="font-semibold">{dataset.total_rows}</span>
                </div>
                {Object.entries(dataset.label_distribution || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-gray-500">{k}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-100 rounded h-1.5">
                        <div className="h-1.5 rounded" style={{
                          width: `${(v / dataset.total_rows) * 100}%`,
                          background: PIE_COLORS[k]
                        }} />
                      </div>
                      <span className="font-semibold w-8 text-right">{v}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Feature Ranges</p>
                {featureData.map(f => (
                  <div key={f.feature} className="flex justify-between text-xs text-gray-500 py-0.5">
                    <span>{f.feature}</span>
                    <span>avg <b className="text-gray-700">{f.mean}</b> ({f.min}–{f.max})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Recent prediction trend (if ≥ 3 predictions) ─────────────────── */}
      {trendData.length >= 3 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">
            Prediction Trend (Last {trendData.length} predictions)
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="index" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="Good"    stroke="#22c55e" fill="#dcfce7" name="Good"    stackId="1" />
              <Area type="monotone" dataKey="Average" stroke="#f59e0b" fill="#fef9c3" name="Average" stackId="1" />
              <Area type="monotone" dataKey="AtRisk"  stroke="#ef4444" fill="#fee2e2" name="At Risk" stackId="1" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Predictions table with filter & search ───────────────────────── */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold text-gray-700">All Predictions</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search name / ID…"
                className="input-field pl-9 pr-4 py-2 text-sm w-52"
              />
            </div>
            <select
              value={filterRisk}
              onChange={e => { setFilterRisk(e.target.value); setPage(1) }}
              className="input-field py-2 text-sm w-36"
            >
              <option value="">All Risk Levels</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="At Risk">At Risk</option>
            </select>
          </div>
        </div>

        {predictions.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No predictions match the current filter.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['#', 'Student', 'Attendance', 'Marks', 'Assignments', 'Study Hrs', 'Risk', 'Confidence', 'Time'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {predictions.map((r, i) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-3 text-xs text-gray-400">{(page-1)*PER_PAGE + i + 1}</td>
                      <td className="py-3 pr-3">
                        <p className="font-medium text-gray-800 text-xs">{r.student_name}</p>
                        <p className="text-gray-400 text-xs font-mono">{r.student_id}</p>
                      </td>
                      <td className="py-3 pr-3 text-gray-600 text-xs">{r.inputs?.attendance_percentage}%</td>
                      <td className="py-3 pr-3 text-gray-600 text-xs">{r.inputs?.internal_marks}</td>
                      <td className="py-3 pr-3 text-gray-600 text-xs">{r.inputs?.assignment_score}</td>
                      <td className="py-3 pr-3 text-gray-600 text-xs">{r.inputs?.study_hours_per_day}h</td>
                      <td className="py-3 pr-3"><RiskBadge level={r.risk_level} /></td>
                      <td className="py-3 pr-3 text-gray-600 text-xs">{(r.confidence*100).toFixed(1)}%</td>
                      <td className="py-3 pr-3 text-gray-400 text-xs">
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, total)} of {total}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p-1))}
                          disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3">← Prev</button>
                  <span className="text-xs text-gray-500 flex items-center px-2">
                    Page {page} / {totalPages}
                  </span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p+1))}
                          disabled={page === totalPages} className="btn-secondary text-xs py-1.5 px-3">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
