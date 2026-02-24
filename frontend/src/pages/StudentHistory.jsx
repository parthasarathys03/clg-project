import React, { useEffect, useState } from 'react'
import { Search, ChevronDown, ChevronUp, BrainCircuit, Lightbulb, ChevronRight } from 'lucide-react'
import RiskBadge from '../components/RiskBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { getPredictions } from '../api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

export default function StudentHistory() {
  const [items, setItems]         = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterRisk, setFilterRisk] = useState('')
  const [page, setPage]           = useState(1)
  const [expanded, setExpanded]   = useState(null)

  const PER_PAGE = 15

  const load = async () => {
    setLoading(true)
    try {
      const res = await getPredictions({
        page, limit: PER_PAGE,
        risk_level: filterRisk || undefined,
        search: search || undefined,
      })
      setItems(res.data.items)
      setTotal(res.data.total)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [page, filterRisk, search])

  const toggle = id => setExpanded(prev => prev === id ? null : id)

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Prediction History</h2>
        <p className="text-sm text-gray-400">All past student predictions with AI explanations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name or ID…"
            className="input-field pl-9 w-56 text-sm"
          />
        </div>
        <select
          value={filterRisk}
          onChange={e => { setFilterRisk(e.target.value); setPage(1) }}
          className="input-field text-sm w-40"
        >
          <option value="">All Risk Levels</option>
          <option>Good</option>
          <option>Average</option>
          <option>At Risk</option>
        </select>
        <span className="text-sm text-gray-400 flex items-center">{total} record{total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading history…" />
      ) : items.length === 0 ? (
        <div className="card text-center py-12 border-dashed border-2 border-gray-200">
          <p className="text-gray-400">No records found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(r => {
            const isOpen = expanded === r.id
            const inputBars = [
              { name: 'Attendance',  value: r.inputs?.attendance_percentage, fill: '#3b82f6' },
              { name: 'Int. Marks',  value: r.inputs?.internal_marks,        fill: '#8b5cf6' },
              { name: 'Assignments', value: r.inputs?.assignment_score,       fill: '#06b6d4' },
              { name: 'Study×10',    value: (r.inputs?.study_hours_per_day||0)*10, fill: '#10b981' },
            ]
            return (
              <div key={r.id} className="card p-0 overflow-hidden">
                {/* Row header */}
                <button
                  onClick={() => toggle(r.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{r.student_name}</p>
                      <p className="font-mono text-xs text-gray-400">{r.student_id}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <RiskBadge level={r.risk_level} />
                    </div>
                    <div className="text-sm text-gray-500">
                      Confidence: <span className="font-semibold text-gray-700">{(r.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(r.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-5 bg-gray-50 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Bar chart */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Input Profile</p>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={inputBars} margin={{ left: -25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v, n) => [n === 'Study×10' ? (v/10).toFixed(1)+' hrs' : v, n]} />
                          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                            {inputBars.map(b => <Cell key={b.name} fill={b.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Explanation */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                        <BrainCircuit size={12} /> AI Explanation
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">{r.explanation}</p>
                      {r.key_factors?.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {r.key_factors.slice(0, 3).map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                              <ChevronRight size={11} className="text-blue-400 mt-0.5" />{f}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Recommendations */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                        <Lightbulb size={12} /> Recommendations
                      </p>
                      <ul className="space-y-2">
                        {(r.recommendations || []).map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-600 bg-white rounded px-2 py-1.5 border border-gray-100">
                            <span className="text-green-500 mt-0.5">✓</span> {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                    className="btn-secondary text-xs px-3 py-1.5">← Prev</button>
            <span className="text-xs text-gray-500 flex items-center px-2">
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                    className="btn-secondary text-xs px-3 py-1.5">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
