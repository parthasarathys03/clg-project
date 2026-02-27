import React, { useEffect, useState } from 'react'
import { Cpu, RefreshCw, CheckCircle, Clock, Database, BarChart2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { getModelInsights } from '../api'

const FEAT_LABELS = {
  attendance_percentage: 'Attendance %',
  internal_marks:        'Internal Marks',
  assignment_score:      'Assignment Score',
  study_hours_per_day:   'Study Hours/Day',
}
const BAR_COLORS = ['#6366f1', '#a78bfa', '#c084fc', '#f472b6']

export default function ModelInsightsPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getModelInsights()
      setData(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const fiData = data?.feature_importances
    ? Object.entries(data.feature_importances)
        .map(([k, v], i) => ({ name: FEAT_LABELS[k] || k, value: v, color: BAR_COLORS[i % BAR_COLORS.length] }))
        .sort((a, b) => b.value - a.value)
    : []

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#06b6d4,#6366f1)', boxShadow: '0 0 24px rgba(6,182,212,0.4)' }}>
            <Cpu size={22} className="text-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-gray-800 text-xl">Model Insights</h2>
            <p className="text-gray-400 text-sm">RandomForest performance & feature analysis</p>
          </div>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-xs">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-48 rounded-2xl" style={{ background: 'rgba(99,102,241,0.06)' }} />
          <div className="h-32 rounded-2xl" style={{ background: 'rgba(99,102,241,0.06)' }} />
        </div>
      ) : (
        <>
          {/* Model health cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up s1">
            {[
              {
                label: 'Current Accuracy',
                value: data?.current_accuracy ? `${(data.current_accuracy * 100).toFixed(2)}%` : '—',
                icon: CheckCircle, color: '#10b981',
              },
              {
                label: 'Last Trained',
                value: data?.last_trained
                  ? new Date(data.last_trained).toLocaleDateString()
                  : 'Never',
                icon: Clock, color: '#6366f1',
              },
              {
                label: 'Training Runs',
                value: data?.training_history?.length || 0,
                icon: Database, color: '#a78bfa',
              },
              {
                label: 'Features',
                value: Object.keys(data?.feature_importances || {}).length || 4,
                icon: BarChart2, color: '#f472b6',
              },
            ].map((m, i) => (
              <div key={m.label} className="card card-dark"
                   style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))', border: '1px solid rgba(99,102,241,0.15)', animationDelay: `${i*0.05}s` }}>
                <div className="flex items-center gap-2 mb-2">
                  <m.icon size={12} style={{ color: m.color }} />
                  <p className="text-white text-[10px] font-bold uppercase tracking-widest">{m.label}</p>
                </div>
                <p className="text-2xl font-black" style={{ color: m.color }}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Feature importance chart */}
          {fiData.length > 0 && (
            <div className="card card-dark animate-fade-up s2"
                 style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))', border: '1px solid rgba(99,102,241,0.15)' }}>
              <p className="section-title text-white mb-5 flex items-center gap-2">
                <BarChart2 size={11} /> Feature Importance
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={fiData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" domain={[0, 0.5]} tickFormatter={v => `${(v*100).toFixed(0)}%`}
                         tick={{ fill: '#ffffff', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={130}
                         tick={{ fill: '#ffffff', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(15,12,41,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, color: 'white', fontSize: 11 }}
                    formatter={v => [`${(v*100).toFixed(1)}%`, 'Importance']}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {fiData.map(d => (
                      <Cell key={d.name} fill={d.color} style={{ filter: `drop-shadow(0 0 4px ${d.color}88)` }} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Importance bars legend */}
              <div className="grid grid-cols-2 gap-3 mt-5">
                {fiData.map(d => (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white">{d.name}</span>
                      <span className="text-white font-bold">{(d.value * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full animated-bar"
                           style={{ '--target-width': `${d.value * 200}%`, width: `${d.value * 200}%`,
                                    background: d.color, boxShadow: `0 0 6px ${d.color}88`, maxWidth: '100%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Training history */}
          {data?.training_history?.length > 0 && (
            <div className="card animate-fade-up s3" style={{ background: 'rgba(255,255,255,0.97)' }}>
              <p className="font-bold text-black text-sm mb-4 flex items-center gap-2">
                <Database size={14} className="text-indigo-500" /> Training History
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      {['Run','Accuracy','CV Score','Dataset Rows','Trained At'].map(h => (
                        <th key={h} className="text-left text-[10px] font-bold text-black uppercase tracking-wider pb-3 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.training_history.map((h, i) => (
                      <tr key={h.id} className="tr-hover border-b border-gray-200">
                        <td className="py-3 pr-4 text-gray-600">#{h.id}</td>
                        <td className="py-3 pr-4 font-black text-indigo-700">{(h.accuracy * 100).toFixed(2)}%</td>
                        <td className="py-3 pr-4 text-black">{h.cv_score ? `${(h.cv_score * 100).toFixed(2)}%` : '—'}</td>
                        <td className="py-3 pr-4 text-black">{h.dataset_rows?.toLocaleString() || '—'}</td>
                        <td className="py-3 pr-4 text-gray-600">{new Date(h.trained_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No data state */}
          {!data?.current_accuracy && (
            <div className="rounded-2xl p-16 text-center animate-fade-up"
                 style={{ background: 'rgba(99,102,241,0.04)', border: '1px dashed rgba(99,102,241,0.2)' }}>
              <Cpu size={40} style={{ color: 'rgba(129,140,248,0.3)', margin: '0 auto 12px' }} />
              <p className="text-gray-400 font-semibold text-sm">Model not trained yet</p>
              <p className="text-gray-300 text-xs mt-1">Go to the Dashboard and click Train Model to get started</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
