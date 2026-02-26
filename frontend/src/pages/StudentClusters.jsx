import React, { useEffect, useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Network, RefreshCw, Users, AlertTriangle, BookOpen } from 'lucide-react'
import { getStudentClusters } from '../api'

// ── Cluster colour palette ────────────────────────────────────────────────────
const CLUSTER_COLORS = ['#6366f1', '#10b981', '#f59e0b']

const CLUSTER_ICONS = {
  'High Performing Group':    { icon: '🏆', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  text: '#10b981' },
  'Average Learners Group':   { icon: '📘', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.25)',  text: '#818cf8' },
  'At-Risk Behaviour Group':  { icon: '⚠️', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)',  text: '#f59e0b' },
}

// ── Custom scatter tooltip ─────────────────────────────────────────────────────
function ClusterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const color = CLUSTER_COLORS[d.cluster]
  return (
    <div style={{
      background: 'rgba(15,12,41,0.96)',
      border: `1px solid ${color}44`,
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 11,
      color: 'rgba(255,255,255,0.8)',
    }}>
      <p style={{ color, fontWeight: 700, marginBottom: 4 }}>Cluster {d.cluster}</p>
      <p>t-SNE X: <span style={{ color: '#fff' }}>{d.x.toFixed(2)}</span></p>
      <p>t-SNE Y: <span style={{ color: '#fff' }}>{d.y.toFixed(2)}</span></p>
    </div>
  )
}

// ── Cluster summary card ───────────────────────────────────────────────────────
function ClusterCard({ cluster, color }) {
  const style = CLUSTER_ICONS[cluster.interpretation] ?? {
    icon: '📊',
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.2)',
    text: '#818cf8',
  }

  const metrics = [
    { label: 'Attendance',    value: `${cluster.avg_attendance}%`    },
    { label: 'Internal Marks',value: `${cluster.avg_marks}%`         },
    { label: 'Assignments',   value: `${cluster.avg_assignments}%`   },
    { label: 'Study Hours',   value: `${cluster.avg_study_hours} h`  },
  ]

  return (
    <div className="card animate-fade-up"
         style={{
           background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))',
           border: `1px solid ${color}28`,
         }}>

      {/* Card header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
             style={{ background: style.bg, border: `1px solid ${style.border}` }}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">
            {cluster.interpretation}
          </p>
          <p className="text-white/30 text-[10px] mt-0.5 font-medium uppercase tracking-wider">
            Cluster {cluster.cluster_id} · {cluster.student_count.toLocaleString()} students
          </p>
        </div>
        <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
             style={{ background: color, boxShadow: `0 0 8px ${color}88` }} />
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-2 gap-2">
        {metrics.map(m => (
          <div key={m.label} className="rounded-lg px-3 py-2"
               style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-white/25 text-[9px] font-bold uppercase tracking-wider mb-0.5">{m.label}</p>
            <p className="text-white font-black text-sm">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Colour indicator bar */}
      <div className="mt-4 h-0.5 rounded-full" style={{ background: `${color}30` }}>
        <div className="h-full rounded-full" style={{
          width: `${(cluster.student_count / 2000) * 100}%`,
          background: color,
          boxShadow: `0 0 8px ${color}66`,
          maxWidth: '100%',
        }} />
      </div>
    </div>
  )
}


// ── Main page ─────────────────────────────────────────────────────────────────
export default function StudentClusters() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = async (refresh = false) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getStudentClusters(refresh)
      setData(res.data)
    } catch (e) {
      setError(e?.response?.data?.detail ?? 'Failed to load clustering data.')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Split points by cluster for Recharts (one <Scatter> per cluster)
  const pointsByCluster = data?.points
    ? [0, 1, 2].map(cid =>
        data.points
          .filter(p => p.cluster === cid)
          .map(p => ({ x: p.x, y: p.y, cluster: p.cluster }))
      )
    : [[], [], []]

  const clusterNameForId = (cid) =>
    data?.clusters?.find(c => c.cluster_id === cid)?.interpretation ?? `Cluster ${cid}`

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{
                 background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                 boxShadow: '0 0 24px rgba(99,102,241,0.45)',
               }}>
            <Network size={22} className="text-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-gray-800 text-xl">
              Student Behaviour Analysis
              <span className="ml-2 text-[10px] font-bold text-indigo-400 bg-indigo-50
                               border border-indigo-100 rounded-full px-2 py-0.5 align-middle">
                IEEE Clustering
              </span>
            </h2>
            <p className="text-gray-400 text-sm">t-SNE dimensionality reduction · KMeans (k=3) · Unsupervised learning</p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 text-xs disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Computing…' : 'Recompute'}
        </button>
      </div>

      {/* ── IEEE explanation banner ──────────────────────────────────────────── */}
      <div className="rounded-2xl p-5 animate-fade-up s1"
           style={{
             background: 'linear-gradient(135deg,rgba(99,102,241,0.07),rgba(168,85,247,0.05))',
             border: '1px solid rgba(99,102,241,0.15)',
           }}>
        <div className="flex gap-3">
          <BookOpen size={15} className="text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-indigo-300 font-bold text-xs mb-1 uppercase tracking-wider">IEEE Educational Data Mining</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              This module applies <strong className="text-gray-400">t-SNE dimensionality reduction</strong> and{' '}
              <strong className="text-gray-400">KMeans clustering</strong> to discover hidden student
              learning behaviour patterns, aligning with Educational Data Mining techniques proposed in
              IEEE research. Cluster interpretations are derived automatically from per-cluster
              feature averages — no labels are hardcoded.
            </p>
          </div>
        </div>
      </div>

      {/* ── Loading skeleton ─────────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)' }} />
          <div className="h-96 rounded-2xl" style={{ background: 'rgba(99,102,241,0.06)' }} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-52 rounded-2xl" style={{ background: 'rgba(99,102,241,0.06)' }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Error state ──────────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="rounded-2xl p-10 text-center animate-fade-up"
             style={{ background: 'rgba(245,158,11,0.05)', border: '1px dashed rgba(245,158,11,0.25)' }}>
          <AlertTriangle size={36} className="mx-auto mb-3" style={{ color: 'rgba(245,158,11,0.5)' }} />
          <p className="text-gray-500 font-semibold text-sm">Clustering unavailable</p>
          <p className="text-gray-400 text-xs mt-1 max-w-md mx-auto">{error}</p>
          <button onClick={() => load()} className="mt-4 btn-secondary text-xs">
            Retry
          </button>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────────── */}
      {!loading && data && !error && (
        <>
          {/* Summary stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up s1">
            {[
              { label: 'Students Analysed', value: data.total_students.toLocaleString(), color: '#6366f1' },
              { label: 'Behaviour Clusters', value: data.clusters.length, color: '#a855f7' },
              { label: 'Algorithm', value: 't-SNE + KMeans', color: '#10b981' },
              { label: 'Dimensions',  value: '4 → 2D',       color: '#f59e0b' },
            ].map((s, i) => (
              <div key={s.label} className="card"
                   style={{
                     background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))',
                     border: '1px solid rgba(99,102,241,0.15)',
                     animationDelay: `${i * 0.05}s`,
                   }}>
                <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-2">
                  {s.label}
                </p>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Scatter plot */}
          <div className="card animate-fade-up s2"
               style={{
                 background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))',
                 border: '1px solid rgba(99,102,241,0.15)',
               }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="section-title text-white/40 flex items-center gap-2">
                  <Network size={11} /> t-SNE 2D Scatter Plot
                </p>
                <p className="text-white/20 text-[10px] mt-1">
                  Each point represents one student. Colour indicates behaviour cluster.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {[0, 1, 2].map(cid => (
                  <div key={cid} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full"
                         style={{ background: CLUSTER_COLORS[cid] }} />
                    <span className="text-white/30 text-[10px]">
                      {clusterNameForId(cid).split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="t-SNE X"
                  tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                  label={{ value: 't-SNE X', position: 'insideBottom', offset: -2,
                           fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="t-SNE Y"
                  tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                  label={{ value: 't-SNE Y', angle: -90, position: 'insideLeft',
                           fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                />
                <Tooltip content={<ClusterTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingTop: 16 }}
                />
                {[0, 1, 2].map(cid => (
                  <Scatter
                    key={cid}
                    name={clusterNameForId(cid)}
                    data={pointsByCluster[cid]}
                    fill={CLUSTER_COLORS[cid]}
                    opacity={0.75}
                    r={3}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Cluster summary cards */}
          <div>
            <p className="section-title text-gray-400 flex items-center gap-2 mb-4 animate-fade-up s3">
              <Users size={11} /> Cluster Summaries
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.clusters.map((cluster, i) => (
                <ClusterCard
                  key={cluster.cluster_id}
                  cluster={cluster}
                  color={CLUSTER_COLORS[cluster.cluster_id % CLUSTER_COLORS.length]}
                />
              ))}
            </div>
          </div>

          {/* Average metrics comparison table */}
          <div className="card animate-fade-up s4" style={{ background: 'rgba(255,255,255,0.97)' }}>
            <p className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
              <Network size={14} className="text-indigo-500" /> Cluster Average Comparison
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Cluster', 'Interpretation', 'Students', 'Avg Attendance', 'Avg Marks', 'Avg Assignments', 'Avg Study Hrs'].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-gray-300 uppercase tracking-wider pb-3 pr-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.clusters.map((c, i) => (
                    <tr key={c.cluster_id} className="tr-hover border-b border-gray-50">
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ background: CLUSTER_COLORS[c.cluster_id % CLUSTER_COLORS.length] }} />
                          <span className="text-gray-400 font-bold">#{c.cluster_id}</span>
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-gray-700">{c.interpretation}</td>
                      <td className="py-3 pr-4 text-gray-500">{c.student_count.toLocaleString()}</td>
                      <td className="py-3 pr-4 font-bold text-indigo-600">{c.avg_attendance}%</td>
                      <td className="py-3 pr-4 text-gray-600">{c.avg_marks}%</td>
                      <td className="py-3 pr-4 text-gray-600">{c.avg_assignments}%</td>
                      <td className="py-3 pr-4 text-gray-600">{c.avg_study_hours} h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
