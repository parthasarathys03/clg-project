import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronDown, ChevronUp, BrainCircuit, Lightbulb, ChevronRight, ClipboardList, Trash2 } from 'lucide-react'
import RiskBadge from '../components/RiskBadge'
import ImprovementDelta from '../components/ImprovementDelta'
import { useModal } from '../components/ConfirmModal'
import { getPredictions, deletePrediction } from '../api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const riskTheme = {
  Good:     { accent: '#10b981', bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.15)' },
  Average:  { accent: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)' },
  'At Risk':{ accent: '#f43f5e', bg: 'rgba(244,63,94,0.06)',  border: 'rgba(244,63,94,0.15)'  },
}
const BAR_COLORS = ['#818cf8', '#a78bfa', '#c084fc', '#f472b6']

export default function StudentHistory() {
  const [items, setItems]     = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('')
  const [page, setPage]       = useState(1)
  const [expanded, setExpand] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const { confirm, alert: showAlert } = useModal()
  const PER = 15

  const load = async () => {
    setLoading(true)
    try {
      const res = await getPredictions({ page, limit: PER, risk_level: filter || undefined, search: search || undefined })
      setItems(res.data.items)
      setTotal(res.data.total)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [page, filter, search])

  // Auto-refresh when a prediction is saved or deleted
  useEffect(() => {
    const onSaved = () => { if (page === 1) load() }
    window.addEventListener('predictionSaved', onSaved)
    window.addEventListener('predictionDeleted', onSaved)
    return () => {
      window.removeEventListener('predictionSaved', onSaved)
      window.removeEventListener('predictionDeleted', onSaved)
    }
  }, [page, filter, search])

  const toggle = id => setExpand(p => p === id ? null : id)
  const totalPages = Math.ceil(total / PER)

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    const confirmed = await confirm({
      title: 'Delete Prediction',
      message: 'Delete this prediction permanently? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    })
    if (!confirmed) return
    setDeleting(id)
    try {
      await deletePrediction(id)
      setItems(prev => prev.filter(r => r.id !== id))
      setTotal(prev => prev - 1)
      window.dispatchEvent(new CustomEvent('predictionDeleted'))
    } catch (err) {
      console.error(err)
      await showAlert({
        title: 'Error',
        message: 'Failed to delete. Please try again.',
        type: 'error'
      })
    }
    setDeleting(null)
  }

  const toggleSelect = (e, id) => {
    e.stopPropagation()
    setSelected(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items.map(r => r.id)))
    }
  }

  const handleBatchDelete = async () => {
    if (selected.size === 0) return
    const confirmed = await confirm({
      title: 'Batch Delete',
      message: `Delete ${selected.size} predictions permanently? This cannot be undone.`,
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      type: 'danger'
    })
    if (!confirmed) return
    
    const idsToDelete = Array.from(selected)
    let deletedCount = 0
    
    for (const id of idsToDelete) {
      try {
        await deletePrediction(id)
        deletedCount++
      } catch (err) {
        console.error('Failed to delete:', id, err)
      }
    }
    
    setItems(prev => prev.filter(r => !selected.has(r.id)))
    setTotal(prev => prev - deletedCount)
    setSelected(new Set())
    window.dispatchEvent(new CustomEvent('predictionDeleted'))
    
    if (deletedCount < idsToDelete.length) {
      await showAlert({
        title: 'Partial Deletion',
        message: `Deleted ${deletedCount} of ${idsToDelete.length} predictions. Some deletions failed.`,
        type: 'warning'
      })
    }
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-up">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg,#f472b6,#c084fc)', boxShadow: '0 0 24px rgba(244,114,182,0.4)' }}>
          <ClipboardList size={22} className="text-white" />
        </div>
        <div>
          <h2 className="font-extrabold text-gray-900 text-xl">Prediction History</h2>
          <p className="text-gray-700 text-sm">{total} prediction{total !== 1 ? 's' : ''} — all AI explanations stored</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 animate-fade-up s1 items-center justify-between">
        <div className="flex gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                   placeholder="Search name or ID…" className="input-field pl-9 w-52 text-sm" />
          </div>
          <div className="flex gap-2">
            {['', 'Good', 'Average', 'At Risk'].map(l => (
              <button key={l}
                      onClick={() => { setFilter(l); setPage(1) }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 border
                        ${filter === l
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                          : 'bg-white/90 text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                        }`}>
                {l || 'All'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Batch Delete Controls */}
        {items.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {selected.size === items.length ? 'Deselect All' : 'Select All'}
            </button>
            {selected.size > 0 && (
              <button
                onClick={handleBatchDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors"
              >
                <Trash2 size={12} /> Delete ({selected.size})
              </button>
            )}
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse"
                 style={{ background: 'rgba(99,102,241,0.06)' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl p-16 text-center animate-fade-up"
             style={{ background: 'rgba(99,102,241,0.04)', border: '1px dashed rgba(99,102,241,0.2)' }}>
          <ClipboardList size={40} style={{ color: 'rgba(129,140,248,0.3)', margin: '0 auto 12px' }} />
          <p className="text-gray-400 font-semibold text-sm">No records found</p>
        </div>
      ) : (
        <div className="space-y-2 animate-fade-up s2">
          {items.map((r, idx) => {
            const isOpen  = expanded === r.id
            const theme   = riskTheme[r.risk_level] || riskTheme.Average
            const bars    = [
              { n: 'Attendance',  v: r.inputs?.attendance_percentage, c: BAR_COLORS[0] },
              { n: 'Int Marks',   v: r.inputs?.internal_marks,        c: BAR_COLORS[1] },
              { n: 'Assignments', v: r.inputs?.assignment_score,       c: BAR_COLORS[2] },
              { n: 'Study×10',    v: (r.inputs?.study_hours_per_day||0)*10, c: BAR_COLORS[3] },
            ]
            return (
              <div key={r.id} className="rounded-2xl overflow-hidden transition-all duration-300"
                   style={{ background: isOpen ? theme.bg : 'rgba(255,255,255,0.97)',
                            border: `1px solid ${isOpen ? theme.border : 'rgba(229,231,235,0.7)'}`,
                            boxShadow: isOpen ? `0 4px 24px ${theme.accent}22` : 'none',
                            animationDelay: `${idx * 0.03}s` }}>

                {/* Row */}
                <button onClick={() => toggle(r.id)}
                        className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-black/[0.02] transition-colors text-left">
                  {/* Checkbox */}
                  <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={e => toggleSelect(e, r.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-6 gap-3 items-center">
                    <div>
                      <Link to={`/student/${r.student_id}`} className="hover:text-indigo-600 transition-colors" onClick={e => e.stopPropagation()}>
                        <p className="font-bold text-gray-900 text-sm leading-tight">{r.student_name}</p>
                        <p className="font-mono text-gray-700 text-[10px]">{r.student_id}</p>
                      </Link>
                    </div>
                    <div className="hidden sm:block">
                      <p className="font-bold text-gray-900 text-sm">{r.section || '-'}</p>
                      <p className="text-gray-500 text-[10px]">Section</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="font-bold text-gray-900 text-sm">{r.current_year ? `${r.current_year} Year` : '-'}</p>
                      <p className="text-gray-500 text-[10px]">Year</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={r.risk_level} />
                      <ImprovementDelta prev={items[idx + 1]} curr={r} />
                    </div>
                    <div className="text-sm text-gray-800 hidden sm:block">
                      Confidence: <span className="font-bold text-gray-900">{(r.confidence*100).toFixed(1)}%</span>
                    </div>
                    <p className="text-gray-500 text-xs hidden sm:block">
                      {new Date(r.timestamp).toLocaleString('en-US', { hour12: true, year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={e => handleDelete(e, r.id)}
                      disabled={deleting === r.id}
                      className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-rose-50 transition-colors group"
                      title="Delete prediction"
                    >
                      <Trash2 size={12} className={deleting === r.id ? 'text-gray-400' : 'text-gray-500 group-hover:text-rose-600 transition-colors'} />
                    </button>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200"
                         style={{ background: isOpen ? theme.bg : 'rgba(99,102,241,0.06)' }}>
                      {isOpen
                        ? <ChevronUp size={13} style={{ color: theme.accent }} />
                        : <ChevronDown size={13} className="text-gray-400" />
                      }
                    </div>
                  </div>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className="border-t px-5 py-5 grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-up"
                       style={{ borderColor: theme.border }}>

                    {/* Bar chart */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-800 uppercase tracking-widest mb-3">Input Profile</p>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={bars} margin={{ left: -28 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                          <XAxis dataKey="n" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                          <Tooltip
                            contentStyle={{ background: 'rgba(15,12,41,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', color: 'white', fontSize: 11 }}
                            formatter={(v, n) => [n === 'Study×10' ? (v/10).toFixed(1)+' hrs' : v, n]}
                          />
                          <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                            {bars.map(b => (
                              <Cell key={b.n} fill={b.c} style={{ filter: `drop-shadow(0 0 3px ${b.c}88)` }} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Explanation */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-800 uppercase tracking-widest mb-3 flex items-center gap-1">
                        <BrainCircuit size={10} className="text-indigo-500" /> AI Explanation
                      </p>
                      <p className="text-sm text-gray-900 leading-relaxed">{r.explanation}</p>
                      {r.key_factors?.slice(0,2).map((f, i) => (
                        <div key={i} className="flex items-start gap-1.5 mt-2 text-xs text-gray-700">
                          <ChevronRight size={10} className="text-indigo-400 mt-0.5 flex-shrink-0" />{f}
                        </div>
                      ))}
                    </div>

                    {/* Recommendations */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-800 uppercase tracking-widest mb-3 flex items-center gap-1">
                        <Lightbulb size={10} className="text-emerald-500" /> Advisory
                      </p>
                      <ul className="space-y-2">
                        {(r.recommendations || []).map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs text-gray-800"
                              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                            <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                            {typeof rec === 'object' ? (rec.action || rec.category || '') : rec}
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
        <div className="flex items-center justify-between animate-fade-up">
          <span className="text-xs text-gray-700">{(page-1)*PER+1}–{Math.min(page*PER,total)} of {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                    className="btn-secondary text-xs px-3 py-1.5">← Prev</button>
            <span className="text-xs text-gray-700 flex items-center px-2">{page}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                    className="btn-secondary text-xs px-3 py-1.5">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
