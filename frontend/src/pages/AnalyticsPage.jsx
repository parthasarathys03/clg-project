import React, { useEffect, useState } from 'react'
import { Trophy, AlertTriangle, RefreshCw, TrendingUp, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import RiskBadge from '../components/RiskBadge'
import { getRankings, getAlerts } from '../api'

const MEDAL = ['🥇', '🥈', '🥉']

const riskColors = { Good: '#10b981', Average: '#f59e0b', 'At Risk': '#f43f5e' }

export default function AnalyticsPage() {
  const [rankings, setRankings]   = useState([])
  const [alerts, setAlerts]       = useState([])
  const [totalR, setTotalR]       = useState(0)
  const [loading, setLoading]     = useState(true)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const [rRes, aRes] = await Promise.all([getRankings(), getAlerts()])
      setRankings(rRes.data.rankings || [])
      setTotalR(rRes.data.total || 0)
      setAlerts(aRes.data.students || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Score histogram (buckets of 10)
  const histogram = Array.from({ length: 10 }, (_, i) => {
    const lo = i * 10, hi = lo + 10
    return {
      range: `${lo}-${hi}`,
      count: rankings.filter(r => r.composite_score >= lo && r.composite_score < hi).length,
    }
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', boxShadow: '0 0 24px rgba(245,158,11,0.4)' }}>
            <Trophy size={22} className="text-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-gray-800 text-xl">Analytics & Rankings</h2>
            <p className="text-gray-400 text-sm">{totalR} unique student{totalR !== 1 ? 's' : ''} ranked</p>
          </div>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-xs">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Alert banner */}
      {alerts.length > 0 && (
        <div className="rounded-2xl p-4 animate-fade-up"
             style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <p className="font-bold text-rose-600 text-sm flex items-center gap-2 mb-3">
            <AlertTriangle size={14} /> {alerts.length} student{alerts.length > 1 ? 's' : ''} with consecutive At Risk flags
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {alerts.map(s => (
              <button key={s.student_id} onClick={() => navigate(`/student/${s.student_id}`)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-200 hover:bg-rose-50"
                      style={{ background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.15)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(244,63,94,0.1)' }}>
                  <AlertTriangle size={12} className="text-rose-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-rose-700 text-xs truncate">{s.student_name}</p>
                  <p className="text-rose-400/70 text-[10px]">{s.consecutive_at_risk}× At Risk in a row</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: 'rgba(99,102,241,0.06)' }} />
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <div className="rounded-2xl p-16 text-center"
             style={{ background: 'rgba(99,102,241,0.04)', border: '1px dashed rgba(99,102,241,0.2)' }}>
          <Users size={36} style={{ color: 'rgba(99,102,241,0.3)', margin: '0 auto 12px' }} />
          <p className="text-gray-400 text-sm font-semibold">No predictions yet</p>
          <p className="text-gray-300 text-xs mt-1">Predict some students first to see rankings</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-up s1">

          {/* Rankings table */}
          <div className="lg:col-span-2 card" style={{ background: 'rgba(255,255,255,0.97)' }}>
            <p className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
              <Trophy size={14} className="text-amber-500" /> Class Leaderboard
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {['Rank','Student','Risk','Score','Attendance','Marks','Assign.','Study'].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-black uppercase tracking-wider pb-3 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankings.map(r => (
                    <tr key={r.student_id} className="tr-hover border-b border-gray-200">
                      <td className="py-2.5 pr-3">
                        <span className="text-base" title={`Rank ${r.rank}`}>
                          {r.rank <= 3 ? MEDAL[r.rank - 1] : (
                            <span className="font-bold text-gray-500">#{r.rank}</span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <button onClick={() => navigate(`/student/${r.student_id}`)}
                                className="text-left hover:text-indigo-700 transition-colors">
                          <p className="font-semibold text-black">{r.student_name}</p>
                          <p className="text-gray-600 font-mono text-[10px]">{r.student_id}</p>
                        </button>
                      </td>
                      <td className="py-2.5 pr-3"><RiskBadge level={r.risk_level} /></td>
                      <td className="py-2.5 pr-3">
                        <span className="font-black text-sm" style={{ color: riskColors[r.risk_level] }}>
                          {r.composite_score.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-black">{r.inputs?.attendance_percentage}%</td>
                      <td className="py-2.5 pr-3 text-black">{r.inputs?.internal_marks}</td>
                      <td className="py-2.5 pr-3 text-black">{r.inputs?.assignment_score}</td>
                      <td className="py-2.5 pr-3 text-black">{r.inputs?.study_hours_per_day}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Score distribution chart */}
          <div className="card card-dark"
               style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p className="section-title text-white flex items-center gap-2 mb-4">
              <TrendingUp size={11} /> Score Distribution
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={histogram} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="range" tick={{ fill: '#ffffff', fontSize: 9 }} />
                <YAxis tick={{ fill: '#ffffff', fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15,12,41,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, color: 'white', fontSize: 11 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {histogram.map((h, i) => {
                    const mid = i * 10 + 5
                    const c = mid >= 70 ? '#10b981' : mid >= 50 ? '#f59e0b' : '#f43f5e'
                    return <Cell key={h.range} fill={c} style={{ filter: `drop-shadow(0 0 3px ${c}88)` }} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Top 3 */}
            {rankings.slice(0, 3).length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.2] space-y-2">
                <p className="text-white text-[9px] font-bold uppercase tracking-widest">Top Performers</p>
                {rankings.slice(0, 3).map((r, i) => (
                  <div key={r.student_id} className="flex items-center gap-2">
                    <span className="text-sm">{MEDAL[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{r.student_name}</p>
                    </div>
                    <span className="text-white text-xs font-bold">{r.composite_score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
