import React, { useEffect, useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, BarChart, Bar, Cell,
  ReferenceLine,
} from 'recharts'
import {
  Network, RefreshCw, Users, AlertTriangle, BookOpen,
  TrendingDown, Award, Info, CheckCircle,
} from 'lucide-react'
import { useClusterCache } from '../hooks/useClusterCache'

// ── Cluster colour palette (supports up to 8 clusters) ───────────────────────
const CLUSTER_COLORS = [
  '#6366f1', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
]

// ── Dynamic cluster style based on interpretation text ────────────────────────
function getClusterStyle(interpretation) {
  if (interpretation?.includes('High Performing'))
    return { icon: '🏆', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  text: '#10b981' }
  if (interpretation?.includes('At-Risk'))
    return { icon: '⚠️', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)',  text: '#f59e0b' }
  if (interpretation?.includes('Above Average'))
    return { icon: '📗', bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.25)',   text: '#06b6d4' }
  if (interpretation?.includes('Below Average'))
    return { icon: '📙', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   text: '#ef4444' }
  return   { icon: '📘', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.25)',  text: '#818cf8' }
}

// ── Custom scatter tooltip ─────────────────────────────────────────────────────
function ClusterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d     = payload[0].payload
  const color = CLUSTER_COLORS[d.cluster % CLUSTER_COLORS.length]
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

// ── Elbow / silhouette chart tooltips ─────────────────────────────────────────
function ElbowTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(15,12,41,0.96)',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 11,
      color: '#fff',
    }}>
      <p style={{ color: '#818cf8', fontWeight: 700, marginBottom: 2 }}>k = {label}</p>
      <p>Inertia: <span style={{ color: '#fff' }}>{payload[0].value?.toLocaleString()}</span></p>
    </div>
  )
}

function SilhouetteTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(15,12,41,0.96)',
      border: '1px solid rgba(16,185,129,0.3)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 11,
      color: '#fff',
    }}>
      <p style={{ color: '#10b981', fontWeight: 700, marginBottom: 2 }}>k = {label}</p>
      <p>Silhouette: <span style={{ color: '#fff' }}>{payload[0].value?.toFixed(4)}</span></p>
    </div>
  )
}

// ── Cluster Validation Panel ───────────────────────────────────────────────────
function ValidationPanel({ validation }) {
  if (!validation) return null

  const elbowData = validation.k_values.map((k, i) => ({
    k,
    inertia: validation.inertias[i],
  }))

  const silhouetteData = validation.k_values.map((k, i) => ({
    k,
    score: validation.silhouette_scores[i],
  }))

  return (
    <div className="rounded-2xl p-5 animate-fade-up s3"
         style={{
           background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))',
           border: '1px solid rgba(99,102,241,0.2)',
         }}>

      {/* Panel header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <Award size={16} className="text-indigo-400" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">Cluster Validation</p>
          <p className="text-white text-[10px] mt-0.5">
            Elbow Method · Silhouette Score · Auto k-Selection
          </p>
        </div>
        <span className="ml-auto text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
          IEEE Validated
        </span>
      </div>

      {/* Optimal k + silhouette score metrics */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl px-4 py-3"
             style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <p className="text-white text-[9px] font-bold uppercase tracking-widest mb-1">
            Optimal Cluster Count
          </p>
          <p className="text-3xl font-black" style={{ color: '#818cf8' }}>
            k = {validation.optimal_k}
          </p>
          <p className="text-white text-[9px] mt-1">Auto-selected via silhouette score</p>
        </div>

        <div className="rounded-xl px-4 py-3"
             style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p className="text-white text-[9px] font-bold uppercase tracking-widest mb-1">
            Best Silhouette Score
          </p>
          <p className="text-3xl font-black" style={{ color: '#10b981' }}>
            {validation.optimal_silhouette?.toFixed(3)}
          </p>
          <p className="text-white text-[9px] mt-1">Range: 0 (poor) → 1 (perfect)</p>
        </div>
      </div>

      {/* Charts: Elbow Curve + Silhouette Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Elbow Curve */}
        <div>
          <p className="text-white text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingDown size={11} className="text-indigo-400" /> Elbow Curve (Inertia vs k)
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={elbowData} margin={{ top: 4, right: 10, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="k"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                label={{ value: 'k (clusters)', position: 'insideBottom', offset: -2, fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9 }}
                width={40}
              />
              <Tooltip content={<ElbowTooltip />} />
              <ReferenceLine
                x={validation.optimal_k}
                stroke="rgba(129,140,248,0.6)"
                strokeDasharray="4 3"
                label={{ value: `k=${validation.optimal_k}`, fill: '#818cf8', fontSize: 9, position: 'top' }}
              />
              <Line
                type="monotone"
                dataKey="inertia"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 3 }}
                activeDot={{ r: 5, fill: '#818cf8' }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-white text-[9px] mt-1 text-center">
            The elbow point indicates where adding more clusters yields diminishing returns.
          </p>
        </div>

        {/* Silhouette Score Bar Chart */}
        <div>
          <p className="text-white text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Award size={11} className="text-emerald-400" /> Silhouette Score per k
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={silhouetteData} margin={{ top: 4, right: 10, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="k"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                label={{ value: 'k (clusters)', position: 'insideBottom', offset: -2, fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
              />
              <YAxis
                domain={[0, 1]}
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9 }}
                width={30}
              />
              <Tooltip content={<SilhouetteTooltip />} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {silhouetteData.map((entry) => (
                  <Cell
                    key={`sil-${entry.k}`}
                    fill={entry.k === validation.optimal_k
                      ? '#10b981'
                      : 'rgba(99,102,241,0.45)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-white text-[9px] mt-1 text-center">
            Highlighted bar (green) = optimal k with highest silhouette score.
          </p>
        </div>
      </div>

      {/* Selection explanation note */}
      <div className="flex gap-2.5 rounded-xl px-4 py-3"
           style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <Info size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="text-white text-[11px] leading-relaxed">
          {validation.selection_method}
        </p>
      </div>
    </div>
  )
}

// ── Cluster summary card ───────────────────────────────────────────────────────
function ClusterCard({ cluster, color }) {
  const style = getClusterStyle(cluster.interpretation)

  const metrics = [
    { label: 'Attendance',     value: `${cluster.avg_attendance}%`   },
    { label: 'Internal Marks', value: `${cluster.avg_marks}%`        },
    { label: 'Assignments',    value: `${cluster.avg_assignments}%`  },
    { label: 'Study Hours',    value: `${cluster.avg_study_hours} h` },
  ]

  return (
    <div className="card card-dark animate-fade-up"
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
          <p className="text-white text-[10px] mt-0.5 font-medium uppercase tracking-wider">
            Cluster {cluster.cluster_id} · {cluster.student_count.toLocaleString()} students
          </p>
        </div>
        <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
             style={{ background: color }} />
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {metrics.map(m => (
          <div key={m.label} className="rounded-lg px-3 py-2"
               style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-white text-[9px] font-bold uppercase tracking-wider mb-0.5">{m.label}</p>
            <p className="text-white font-black text-sm">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Cluster insight */}
      {cluster.insight && (
        <div className="rounded-xl px-3 py-2.5 mb-3"
             style={{ background: `${color}0d`, border: `1px solid ${color}20` }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
             style={{ color }}>
            Cluster Insight
          </p>
          <p className="text-white text-[11px] leading-relaxed">
            {cluster.insight}
          </p>
        </div>
      )}

      {/* Colour indicator bar */}
      <div className="h-0.5 rounded-full" style={{ background: `${color}30` }}>
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
  const { data, loading, error, refresh, isReady } = useClusterCache()

  // Load data on mount if not already cached
  useEffect(() => {
    if (!isReady && !loading) {
      refresh()
    }
  }, [isReady, loading, refresh])

  // Dynamic cluster IDs from response
  const clusterIds = data?.clusters?.map(c => c.cluster_id) ?? []

  // Split points by cluster for Recharts (one <Scatter> per cluster)
  const pointsByCluster = data?.points
    ? clusterIds.map(cid =>
        data.points
          .filter(p => p.cluster === cid)
          .map(p => ({ x: p.x, y: p.y, cluster: p.cluster }))
      )
    : []

  const clusterNameForId = (cid) =>
    data?.clusters?.find(c => c.cluster_id === cid)?.interpretation ?? `Cluster ${cid}`

  const optimalK       = data?.optimal_k ?? data?.clusters?.length ?? '—'
  const silhouetteScore = data?.validation?.optimal_silhouette

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{
                 background: 'linear-gradient(135deg,#6366f1,#a855f7)',
               }}>
            <Network size={22} className="text-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-black text-xl">
              Student Behaviour Analysis
              <span className="ml-2 text-[10px] font-bold text-indigo-600 bg-indigo-50
                               border border-indigo-200 rounded-full px-2 py-0.5 align-middle">
                IEEE Clustering
              </span>
            </h2>
            <p className="text-gray-700 text-sm font-medium">
              t-SNE · KMeans · Elbow Method · Silhouette Validation · Auto k-Selection
            </p>
          </div>
        </div>
        <button
          onClick={() => refresh()}
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
             background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(168,85,247,0.06))',
             border: '1px solid rgba(99,102,241,0.2)',
           }}>
        <div className="flex gap-3">
          <BookOpen size={15} className="text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-indigo-700 font-bold text-xs mb-1 uppercase tracking-wider">IEEE Educational Data Mining</p>
            <p className="text-gray-700 text-xs leading-relaxed">
              This module applies <strong className="text-gray-900">t-SNE dimensionality reduction</strong> and{' '}
              <strong className="text-gray-900">KMeans clustering</strong> with full mathematical validation
              (Elbow Method + Silhouette Score) to discover hidden student learning behaviour patterns.
              The optimal cluster count is <strong className="text-gray-900">automatically selected</strong> using
              silhouette analysis — no manual tuning required. Cluster interpretations are derived
              entirely from per-cluster feature averages, not hardcoded labels.
            </p>
          </div>
        </div>
      </div>

      {/* ── Loading skeleton ─────────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)' }} />
          <div className="h-96 rounded-2xl" style={{ background: 'rgba(99,102,241,0.06)' }} />
          <div className="h-52 rounded-2xl" style={{ background: 'rgba(16,185,129,0.05)' }} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-64 rounded-2xl" style={{ background: 'rgba(99,102,241,0.06)' }} />
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
          <button onClick={() => refresh()} className="mt-4 btn-secondary text-xs">
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
              { label: 'Optimal Clusters',  value: `k = ${optimalK}`,                   color: '#a855f7', note: 'Auto-selected' },
              { label: 'Silhouette Score',  value: silhouetteScore?.toFixed(3) ?? '—',  color: '#10b981', note: '0 → 1 scale' },
              { label: 'Algorithm',         value: 't-SNE + KMeans',                    color: '#f59e0b' },
            ].map((s, i) => (
              <div key={s.label} className="card card-dark"
                   style={{
                     background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))',
                     border: '1px solid rgba(99,102,241,0.15)',
                     animationDelay: `${i * 0.05}s`,
                   }}>
                <p className="text-white text-[9px] font-bold uppercase tracking-widest mb-2">
                  {s.label}
                </p>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                {s.note && (
                  <p className="text-white text-[9px] mt-1">{s.note}</p>
                )}
              </div>
            ))}
          </div>

          {/* Scatter plot */}
          <div className="card card-dark animate-fade-up s2"
               style={{
                 background: 'linear-gradient(145deg,rgba(15,12,41,0.92),rgba(30,27,75,0.88))',
                 border: '1px solid rgba(99,102,241,0.15)',
               }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="section-title text-white flex items-center gap-2">
                  <Network size={11} /> t-SNE 2D Scatter Plot
                </p>
                <p className="text-white text-[10px] mt-1">
                  Each point represents one student. Colour indicates behaviour cluster.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap justify-end">
                {clusterIds.map(cid => (
                  <div key={cid} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full"
                         style={{ background: CLUSTER_COLORS[cid % CLUSTER_COLORS.length] }} />
                    <span className="text-white text-[10px]">
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
                  tick={{ fill: '#ffffff', fontSize: 10 }}
                  label={{ value: 't-SNE X', position: 'insideBottom', offset: -2,
                           fill: '#ffffff', fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="t-SNE Y"
                  tick={{ fill: '#ffffff', fontSize: 10 }}
                  label={{ value: 't-SNE Y', angle: -90, position: 'insideLeft',
                           fill: '#ffffff', fontSize: 10 }}
                />
                <Tooltip content={<ClusterTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingTop: 16 }}
                />
                {clusterIds.map((cid, idx) => (
                  <Scatter
                    key={cid}
                    name={clusterNameForId(cid)}
                    data={pointsByCluster[idx]}
                    fill={CLUSTER_COLORS[cid % CLUSTER_COLORS.length]}
                    opacity={0.75}
                    r={3}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* ── Cluster Validation Panel ─────────────────────────────────────── */}
          <ValidationPanel validation={data.validation} />

          {/* Cluster summary cards */}
          <div>
            <p className="section-title text-black flex items-center gap-2 mb-4 animate-fade-up s4">
              <Users size={11} /> Cluster Summaries &amp; Insights
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.clusters.map((cluster) => (
                <ClusterCard
                  key={cluster.cluster_id}
                  cluster={cluster}
                  color={CLUSTER_COLORS[cluster.cluster_id % CLUSTER_COLORS.length]}
                />
              ))}
            </div>
          </div>

          {/* Average metrics comparison table */}
          <div className="card animate-fade-up s5" style={{ background: 'rgba(255,255,255,0.97)' }}>
            <p className="font-bold text-black text-sm mb-4 flex items-center gap-2">
              <Network size={14} className="text-indigo-500" /> Cluster Average Comparison
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {['Cluster', 'Interpretation', 'Students', 'Avg Attendance', 'Avg Marks', 'Avg Assignments', 'Avg Study Hrs'].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-black uppercase tracking-wider pb-3 pr-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.clusters.map((c) => (
                    <tr key={c.cluster_id} className="tr-hover border-b border-gray-200">
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ background: CLUSTER_COLORS[c.cluster_id % CLUSTER_COLORS.length] }} />
                          <span className="text-gray-600 font-bold">#{c.cluster_id}</span>
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-black">{c.interpretation}</td>
                      <td className="py-3 pr-4 text-black">{c.student_count.toLocaleString()}</td>
                      <td className="py-3 pr-4 font-bold text-indigo-700">{c.avg_attendance}%</td>
                      <td className="py-3 pr-4 text-black">{c.avg_marks}%</td>
                      <td className="py-3 pr-4 text-black">{c.avg_assignments}%</td>
                      <td className="py-3 pr-4 text-black">{c.avg_study_hours} h</td>
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
