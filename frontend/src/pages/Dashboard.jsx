import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, TrendingUp, AlertTriangle, CheckCircle,
  BrainCircuit, Database, RefreshCw, Activity
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import StatCard from '../components/StatCard'
import RiskBadge from '../components/RiskBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { getDashboard, getHealth, trainModel } from '../api'

const PIE_COLORS = { Good: '#22c55e', Average: '#f59e0b', 'At Risk': '#ef4444' }

export default function Dashboard() {
  const [stats, setStats]     = useState(null)
  const [health, setHealth]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [training, setTraining] = useState(false)
  const [trainMsg, setTrainMsg] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [d, h] = await Promise.all([getDashboard(), getHealth()])
      setStats(d.data)
      setHealth(h.data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleTrain = async () => {
    setTraining(true)
    setTrainMsg('')
    try {
      const res = await trainModel()
      setTrainMsg(
        `✔ Model trained — Accuracy: ${(res.data.accuracy * 100).toFixed(1)}%  |  ` +
        `Dataset: ${res.data.dataset_rows} rows`
      )
      load()
    } catch (e) {
      setTrainMsg('Training failed: ' + (e.response?.data?.detail || e.message))
    }
    setTraining(false)
  }

  if (loading) return <LoadingSpinner message="Loading dashboard…" size="lg" />

  const dist     = stats?.risk_distribution || { Good: 0, Average: 0, 'At Risk': 0 }
  const pieData  = Object.entries(dist).map(([name, value]) => ({ name, value }))
  const barData  = [
    { name: 'Attendance',      value: stats?.average_attendance      || 0, fill: '#3b82f6' },
    { name: 'Internal Marks',  value: stats?.average_internal_marks  || 0, fill: '#8b5cf6' },
    { name: 'Assignments',     value: stats?.average_assignment_score|| 0, fill: '#06b6d4' },
    { name: 'Study hrs×10',    value: (stats?.average_study_hours||0)*10,  fill: '#10b981' },
  ]

  return (
    <div className="space-y-6">

      {/* ── System status banner ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl border border-gray-100 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${health?.model_ready ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium text-gray-700">
            ML Model: {health?.model_ready ? 'Ready' : 'Not Trained'}
          </span>
          <span className="text-gray-300">|</span>
          <div className={`w-3 h-3 rounded-full ${health?.openai_configured ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-sm font-medium text-gray-700">
            AI Engine: {health?.openai_configured ? 'OpenAI Connected' : 'Rule-based Fallback'}
          </span>
        </div>
        <div className="flex gap-3">
          <button onClick={handleTrain} disabled={training}
                  className="btn-primary text-sm">
            {training
              ? <><RefreshCw size={14} className="animate-spin" /> Training…</>
              : <><Database size={14} /> {health?.model_ready ? 'Retrain Model' : 'Train Model'}</>
            }
          </button>
          <button onClick={load} className="btn-secondary text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>
      {trainMsg && (
        <div className={`text-sm px-4 py-3 rounded-lg ${
          trainMsg.startsWith('✔') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {trainMsg}
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Analyzed"  value={stats?.total_students || 0}
                  icon={Users}            color="blue" />
        <StatCard title="Good Standing"   value={dist.Good || 0}
                  icon={CheckCircle}      color="green"
                  subtitle={`${stats?.total_students ? Math.round((dist.Good/stats.total_students)*100) : 0}% of students`} />
        <StatCard title="Average"         value={dist.Average || 0}
                  icon={TrendingUp}       color="yellow"
                  subtitle={`${stats?.total_students ? Math.round((dist.Average/stats.total_students)*100) : 0}% of students`} />
        <StatCard title="At Risk"         value={dist['At Risk'] || 0}
                  icon={AlertTriangle}    color="red"
                  subtitle={`${stats?.total_students ? Math.round((dist['At Risk']/stats.total_students)*100) : 0}% of students`} />
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      {stats?.total_students > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Distribution Pie */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-blue-600" />
              Risk Distribution
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80}
                     dataKey="value" label={({ name, percent }) =>
                       `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map(entry => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Average Metrics Bar */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-600" />
              Cohort Averages
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n) => [n === 'Study hrs×10' ? (v/10).toFixed(1)+' hrs' : v, n]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map(entry => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Recent predictions table ─────────────────────────────────────── */}
      {stats?.recent_predictions?.length > 0 ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Recent Predictions</h3>
            <Link to="/history" className="text-sm text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Student ID', 'Name', 'Attendance', 'Marks', 'Assignments', 'Study Hrs', 'Risk Level', 'Confidence'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recent_predictions.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-500">{r.student_id}</td>
                    <td className="py-3 pr-4 font-medium text-gray-800">{r.student_name}</td>
                    <td className="py-3 pr-4 text-gray-600">{r.inputs?.attendance_percentage}%</td>
                    <td className="py-3 pr-4 text-gray-600">{r.inputs?.internal_marks}</td>
                    <td className="py-3 pr-4 text-gray-600">{r.inputs?.assignment_score}</td>
                    <td className="py-3 pr-4 text-gray-600">{r.inputs?.study_hours_per_day}h</td>
                    <td className="py-3 pr-4"><RiskBadge level={r.risk_level} /></td>
                    <td className="py-3 pr-4 text-gray-600">{(r.confidence * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 border-dashed border-2 border-gray-200">
          <BrainCircuit size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No predictions yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Go to{' '}
            <Link to="/predict" className="text-blue-600 hover:underline">Predict Student</Link>
            {' '}to get started.
          </p>
        </div>
      )}
    </div>
  )
}
