import React, { useState, useEffect, useRef } from 'react'
import {
  BrainCircuit, Send, AlertCircle, Lightbulb, ChevronRight,
  BarChart2, CheckCircle, XCircle, Sparkles, RotateCcw, User,
  Shield, Star, Calendar, Clock, BookOpen, ClipboardList,
  TrendingUp, TrendingDown, Minus, FileText, ChevronDown, ChevronUp,
  RefreshCw, Zap, Cloud, ServerCrash,
} from 'lucide-react'
import RiskBadge from '../components/RiskBadge'
import { predictStudent } from '../api'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts'

const FIELDS = [
  { key: 'attendance_percentage', label: 'Attendance %',      placeholder: '0 – 100', type: 'number', hint: '≥ 75% recommended', icon: '📅' },
  { key: 'internal_marks',        label: 'Internal Marks',    placeholder: '0 – 100', type: 'number', hint: 'Out of 100',          icon: '📝' },
  { key: 'assignment_score',      label: 'Assignment Score',  placeholder: '0 – 100', type: 'number', hint: 'Out of 100',          icon: '📋' },
  { key: 'study_hours_per_day',   label: 'Study Hours/Day',   placeholder: '0 – 12',  type: 'number', hint: '≥ 3 hrs recommended', icon: '🕐' },
]
const INIT = { student_id: '', student_name: '', attendance_percentage: '', internal_marks: '', assignment_score: '', study_hours_per_day: '' }

const riskTheme = {
  Good:     { grad: 'linear-gradient(135deg,#022c22,#064e3b)', accent: '#10b981', glow: 'rgba(16,185,129,0.4)',  label: 'Excellent Performance' },
  Average:  { grad: 'linear-gradient(135deg,#451a03,#78350f)', accent: '#f59e0b', glow: 'rgba(245,158,11,0.4)', label: 'Average Performance'    },
  'At Risk':{ grad: 'linear-gradient(135deg,#4c0519,#881337)', accent: '#f43f5e', glow: 'rgba(244,63,94,0.4)',  label: 'Needs Intervention'     },
}

function CircleProgress({ value, color, size = 90 }) {
  const radius = (size - 10) / 2
  const circ   = 2 * Math.PI * radius
  const [dash, setDash] = useState(circ)

  useEffect(() => {
    const timer = setTimeout(() => setDash(circ * (1 - value / 100)), 100)
    return () => clearTimeout(timer)
  }, [value, circ])

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={radius}
              fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={radius}
              fill="none" stroke={color} strokeWidth={8}
              strokeDasharray={circ} strokeDashoffset={dash}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)',
                       filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  )
}

// Step-based loading messages for premium SaaS feel
const LOADING_STEPS = [
  { text: 'Analyzing student performance...', icon: BarChart2, delay: 0 },
  { text: 'Consulting Gemini AI...', icon: Cloud, delay: 1500 },
  { text: 'Generating advisory plan...', icon: Sparkles, delay: 4000 },
  { text: 'Preparing personalized insights...', icon: BrainCircuit, delay: 7000 },
]

export default function PredictPage() {
  const [form, setForm]       = useState(INIT)
  const [errors, setErrors]   = useState({})
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [apiErr, setApiErr]   = useState('')
  const [revealed, setRevealed] = useState(false)
  const resultRef = useRef(null)

  const validate = () => {
    const e = {}
    if (!form.student_id.trim())   e.student_id   = 'Required'
    if (!form.student_name.trim()) e.student_name = 'Required'
    const nums = [
      { k: 'attendance_percentage', min: 0, max: 100 },
      { k: 'internal_marks',        min: 0, max: 100 },
      { k: 'assignment_score',      min: 0, max: 100 },
      { k: 'study_hours_per_day',   min: 0, max: 12  },
    ]
    nums.forEach(({ k, min, max }) => {
      const v = parseFloat(form[k])
      if (form[k] === '')           e[k] = 'Required'
      else if (isNaN(v))            e[k] = 'Must be a number'
      else if (v < min || v > max)  e[k] = `Must be ${min}–${max}`
    })
    return e
  }

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
    if (apiErr) setApiErr('')
  }

  // Drive loading step animation
  useEffect(() => {
    if (!loading) return
    setLoadingStep(0)
    const timers = LOADING_STEPS.slice(1).map((step, i) =>
      setTimeout(() => setLoadingStep(i + 1), step.delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [loading])

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setApiErr('')
    setResult(null)
    setRevealed(false)

    try {
      const res = await predictStudent({
        student_id:            form.student_id.trim(),
        student_name:          form.student_name.trim(),
        attendance_percentage: parseFloat(form.attendance_percentage),
        internal_marks:        parseFloat(form.internal_marks),
        assignment_score:      parseFloat(form.assignment_score),
        study_hours_per_day:   parseFloat(form.study_hours_per_day),
      })
      setResult(res.data)
      // Notify Dashboard, TeacherDashboard, and StudentHistory to auto-refresh
      window.dispatchEvent(new CustomEvent('predictionSaved'))
      setTimeout(() => {
        setRevealed(true)
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      const detail = err.response?.data?.detail || ''
      if (detail.includes('AI advisory') || detail.includes('all providers')) {
        setApiErr('AI_UNAVAILABLE')
      } else {
        setApiErr(detail || 'Prediction failed. Please try again.')
      }
    }
    setLoading(false)
  }

  const handleReset = () => { setForm(INIT); setResult(null); setErrors({}); setApiErr(''); setRevealed(false) }

  const theme     = result ? (riskTheme[result.risk_level] || riskTheme.Average) : null
  const radarData = result ? [
    { s: 'Attendance',  v: result.inputs.attendance_percentage },
    { s: 'Int Marks',   v: result.inputs.internal_marks        },
    { s: 'Assignments', v: result.inputs.assignment_score       },
    { s: 'Study',       v: result.inputs.study_hours_per_day * 8.33 },
  ] : []

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="animate-fade-up flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', boxShadow: '0 0 24px rgba(99,102,241,0.5)' }}>
          <BrainCircuit size={22} className="text-white" />
        </div>
        <div>
          <h2 className="font-extrabold text-gray-900 text-xl">Performance Predictor</h2>
          <p className="text-gray-700 text-sm">RandomForest ML + AI Explanation + Personalised Advisory</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Input form ──────────────────────────────────────────────── */}
        <div className="card animate-fade-up s1 space-y-5"
             style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(229,231,235,0.7)' }}>

          {/* Form title */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                 style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
              <User size={14} className="text-indigo-600" />
            </div>
            <p className="font-bold text-gray-900 text-sm">Student Academic Data</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Identity row */}
            <div className="grid grid-cols-2 gap-3">
              {['student_id', 'student_name'].map(key => (
                <div key={key}>
                  <label className="label">{key === 'student_id' ? 'Student ID' : 'Full Name'}</label>
                  <input
                    type="text" name={key} value={form[key]} onChange={handleChange}
                    placeholder={key === 'student_id' ? 'e.g. STU001' : 'e.g. Rahul Sharma'}
                    className={`input-field ${errors[key] ? 'border-rose-400' : ''}`}
                  />
                  {errors[key] && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                      <XCircle size={10} /> {errors[key]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Academic fields */}
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map(({ key, label, placeholder, type, hint, icon }) => (
                <div key={key}>
                  <label className="label flex items-center gap-1">
                    <span>{icon}</span> {label}
                  </label>
                  <input
                    type={type} name={key} value={form[key]} onChange={handleChange}
                    placeholder={placeholder} step="0.1"
                    className={`input-field ${errors[key] ? 'border-rose-400' : ''}`}
                  />
                  <p className="text-[10px] text-gray-700 mt-0.5">{hint}</p>
                  {errors[key] && (
                    <p className="text-[11px] text-rose-500 mt-0.5 flex items-center gap-1">
                      <XCircle size={10} /> {errors[key]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* API Error / AI Unavailable */}
            {apiErr && apiErr === 'AI_UNAVAILABLE' ? (
              <div className="rounded-xl p-5 space-y-3"
                   style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(249,115,22,0.04))', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                       style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <ServerCrash size={16} className="text-red-500" />
                  </div>
                  <div>
                    <p className="font-bold text-red-700 text-sm">AI Advisory Temporarily Unavailable</p>
                    <p className="text-xs text-red-500/80">All AI providers are currently unreachable</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Gemini API and Ollama are both unavailable. This is usually temporary — please retry in a few moments.
                </p>
                <button type="button" onClick={() => { setApiErr(''); handleSubmit({ preventDefault: () => {} }) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <RefreshCw size={12} /> Retry Prediction
                </button>
              </div>
            ) : apiErr ? (
              <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
                   style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#e11d48' }}>
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                {apiErr}
              </div>
            ) : null}

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Analysing Student…
                  </>
                ) : (
                  <><Sparkles size={15} /> Predict Performance</>
                )}
              </button>
              {result && (
                <button type="button" onClick={handleReset} className="btn-secondary">
                  <RotateCcw size={14} /> Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Result panel ────────────────────────────────────────────── */}
        <div ref={resultRef}>
          {loading && (
            <div className="card card-dark flex flex-col items-center justify-center py-16 animate-fade-in"
                 style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.9),rgba(30,27,75,0.85))', border: '1px solid rgba(99,102,241,0.2)', minHeight: '320px' }}>
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-900" />
                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-400 animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-t-purple-400 animate-spin"
                     style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BrainCircuit size={22} className="text-white animate-pulse" />
                </div>
              </div>
              {/* Step-based status */}
              <div className="space-y-2 w-full max-w-[240px]">
                {LOADING_STEPS.map((step, i) => {
                  const StepIcon = step.icon
                  const active = i === loadingStep
                  const done = i < loadingStep
                  return (
                    <div key={i} className="flex items-center gap-2 transition-all duration-500"
                         style={{ opacity: done ? 0.4 : active ? 1 : 0.2 }}>
                      {done ? (
                        <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                      ) : active ? (
                        <StepIcon size={14} className="text-indigo-300 animate-pulse flex-shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0" />
                      )}
                      <p className={`text-xs ${active ? 'text-white font-semibold' : 'text-white/50'}`}>
                        {step.text}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="card card-dark flex flex-col items-center justify-center py-20"
                 style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.8),rgba(30,27,75,0.75))', border: '1px dashed rgba(99,102,241,0.25)', minHeight: '320px' }}>
              <div className="animate-float">
                <BrainCircuit size={52} style={{ color: 'rgba(129,140,248,0.6)' }} />
              </div>
              <p className="text-white font-semibold text-sm mt-5">Result appears here</p>
              <p className="text-white text-xs mt-1">Fill form and click Predict</p>
            </div>
          )}

          {!loading && result && (
            <div className={`rounded-2xl overflow-hidden animate-scale-in`}
                 style={{ background: theme.grad, border: `1px solid ${theme.accent}33`,
                          boxShadow: `0 8px 40px ${theme.glow}` }}>

              {/* Top accent bar */}
              <div className="h-1 w-full"
                   style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}66, transparent)` }} />

              <div className="p-6 space-y-5">
                {/* Name + badge */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Student</p>
                    <p className="text-white font-bold text-lg mt-0.5 leading-tight">{result.student_name}</p>
                    <p className="text-white/35 font-mono text-xs">{result.student_id}</p>
                  </div>
                  <RiskBadge level={result.risk_level} size="lg" />
                </div>

                {/* Confidence circle + probabilities */}
                <div className="flex items-center gap-6">
                  <div className="relative flex-shrink-0">
                    <CircleProgress value={result.confidence * 100} color={theme.accent} size={88} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-white font-black text-base leading-none">{(result.confidence * 100).toFixed(0)}%</p>
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-wide">conf</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    {Object.entries(result.probabilities || {}).map(([k, v]) => {
                      const c = k === 'Good' ? '#10b981' : k === 'Average' ? '#f59e0b' : '#f43f5e'
                      return (
                        <div key={k}>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-white/55 font-semibold">{k}</span>
                            <span className="text-white/80 font-bold">{(v * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="animated-bar h-full rounded-full"
                                 style={{ '--target-width': `${v * 100}%`, width: `${v * 100}%`,
                                          background: c, boxShadow: `0 0 6px ${c}88` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Radar chart */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <p className="text-white text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                    <BarChart2 size={10} /> Performance Profile
                  </p>
                  <ResponsiveContainer width="100%" height={160}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="s" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="v" stroke={theme.accent} fill={theme.accent} fillOpacity={0.2}
                             strokeWidth={2} dot={{ fill: theme.accent, r: 3 }} />
                      <Tooltip contentStyle={{ background: 'rgba(15,12,41,0.95)', border: `1px solid ${theme.accent}44`, borderRadius: '10px', color: 'white' }}
                               formatter={v => [`${v.toFixed(1)}`, 'Score']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* AI tag */}
                <div className="flex items-center justify-between">
                  <p className="text-white text-[10px] font-semibold">
                    {new Date(result.timestamp).toLocaleString()}
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                        style={{
                          background: result.fallback_used
                            ? 'rgba(245,158,11,0.15)'
                            : 'rgba(99,102,241,0.2)',
                          color: result.fallback_used
                            ? '#fbbf24'
                            : '#a5b4fc',
                          border: `1px solid ${result.fallback_used
                            ? 'rgba(245,158,11,0.25)'
                            : 'rgba(99,102,241,0.3)'}`,
                        }}>
                    {result.fallback_used
                      ? <><Zap size={8} /> Ollama AI (Fallback)</>
                      : <><Sparkles size={8} /> Gemini AI</>
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── AI Intelligence Panels ─────────────────────────────────────── */}
      {result && <AIIntelligencePanels result={result} theme={theme} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  AI INTELLIGENCE PANELS  (standalone component for clean layout)
// ─────────────────────────────────────────────────────────────────────────────

const SEV_CONFIG = {
  critical: { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)', label: 'CRITICAL', icon: XCircle },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', label: 'WARNING',  icon: AlertCircle },
  good:     { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', label: 'OK',       icon: CheckCircle },
}

const CAT_ICONS = {
  'Attendance':      Calendar,
  'Internal Marks':  BookOpen,
  'Assignment Score':ClipboardList,
  'Study Hours':     Clock,
  'General':         Lightbulb,
}

const PRIORITY_COLORS = ['#f43f5e', '#f59e0b', '#6366f1', '#10b981']

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const DAY_ABBR = ['MON','TUE','WED','THU','FRI','SAT','SUN']
const DAY_COLORS = [
  { bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', accent: '#60a5fa' },
  { bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', accent: '#a78bfa' },
  { bg: 'linear-gradient(135deg, #ec4899, #be185d)', accent: '#f472b6' },
  { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', accent: '#fbbf24' },
  { bg: 'linear-gradient(135deg, #10b981, #059669)', accent: '#34d399' },
  { bg: 'linear-gradient(135deg, #6366f1, #4f46e5)', accent: '#818cf8' },
  { bg: 'linear-gradient(135deg, #f43f5e, #e11d48)', accent: '#fb7185' },
]

function AIIntelligencePanels({ result, theme }) {
  const [weekOpen, setWeekOpen] = useState(false)
  const scrollRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const rfs  = result.risk_factors || []
  const recs = result.recommendations || []
  const strengths = result.strengths || []
  const plan = result.weekly_plan || {}
  const hasWeeklyPlan = Object.keys(plan).length > 0

  // Auto-scroll effect for weekly plan
  useEffect(() => {
    if (!weekOpen || !scrollRef.current || isHovered) return
    const container = scrollRef.current
    let scrollAmount = 0
    const cardWidth = 220 + 16 // card width + gap
    const totalWidth = container.scrollWidth - container.clientWidth
    
    const interval = setInterval(() => {
      scrollAmount += 1
      if (scrollAmount >= totalWidth) {
        scrollAmount = 0
        container.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        container.scrollLeft = scrollAmount
      }
    }, 30)
    
    return () => clearInterval(interval)
  }, [weekOpen, isHovered])

  // Flatten rec text for display
  const recText = (r) => typeof r === 'string' ? r : (r.action || r)

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Row 1: AI Explanation + Risk Factor Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── AI Explanation ── */}
        <div className="card space-y-5" style={{ background: 'rgba(255,255,255,0.97)', borderLeft: '4px solid #818cf8' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
              <BrainCircuit size={18} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-lg">AI Explanation</p>
              <span className="text-xs font-bold px-2 py-1 rounded-full inline-flex items-center gap-1"
                    style={{
                      background: result.fallback_used
                        ? 'rgba(245,158,11,0.1)'
                        : 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
                      color: result.fallback_used ? '#f59e0b' : '#6366f1',
                    }}>
                {result.fallback_used
                  ? <><Zap size={10} /> Ollama AI (Fallback)</>
                  : <><Sparkles size={10} /> Gemini AI</>
                }
              </span>
            </div>
          </div>

          {/* AI Provider Status Line */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
               style={{
                 background: result.fallback_used
                   ? 'rgba(245,158,11,0.05)' : 'rgba(99,102,241,0.04)',
                 border: `1px solid ${result.fallback_used
                   ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.08)'}`,
               }}>
            {result.fallback_used ? (
              <Cloud size={12} className="text-amber-500 flex-shrink-0" />
            ) : (
              <Cloud size={12} className="text-indigo-400 flex-shrink-0" />
            )}
            <span className="text-gray-600">
              {result.fallback_used
                ? <>Gemini unavailable — response generated using <strong className="text-amber-700">{result.model_name || 'Ollama'}</strong> fallback model</>
                : <>Generated using <strong className="text-indigo-600">{result.model_name || 'Gemini AI'}</strong> (Primary Model)</>
              }
            </span>
          </div>

          <p className="text-gray-800 text-base leading-relaxed">{result.explanation}</p>

          {/* Strengths */}
          {strengths.length > 0 && (
            <div className="rounded-xl p-4 space-y-2"
                 style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <p className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                <Star size={12} /> Strengths
              </p>
              {strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                  <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                  {s}
                </div>
              ))}
            </div>
          )}

          {/* Report summary */}
          {result.report_summary && (
            <div className="rounded-xl p-4"
                 style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
              <p className="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <FileText size={12} /> Executive Summary
              </p>
              <p className="text-sm text-gray-800 leading-relaxed">{result.report_summary}</p>
            </div>
          )}
        </div>

        {/* ── Risk Factor Breakdown ── */}
        <div className="card space-y-5" style={{ background: 'rgba(255,255,255,0.97)', borderLeft: `4px solid ${theme?.accent || '#818cf8'}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <Shield size={18} className="text-rose-500" />
            </div>
            <p className="font-bold text-gray-900 text-lg">Risk Factor Analysis</p>
          </div>

          <div className="space-y-4">
            {rfs.map((rf, i) => {
              const cfg = SEV_CONFIG[rf.severity] || SEV_CONFIG.good
              const pct = Math.min(100, (rf.value / (rf.threshold * 1.4)) * 100)
              return (
                <div key={rf.key || i} className="rounded-xl p-4 animate-fade-up"
                     style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, animationDelay: `${i * 0.06}s` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <cfg.icon size={14} style={{ color: cfg.color }} />
                      <span className="font-bold text-gray-900 text-sm">{rf.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg" style={{ color: cfg.color }}>{rf.value}</span>
                      <span className="text-xs font-bold px-2 py-1 rounded-full"
                            style={{ background: cfg.color + '20', color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full mb-2" style={{ background: 'rgba(0,0,0,0.08)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                         style={{ width: `${pct}%`, background: cfg.color,
                                  boxShadow: `0 0 6px ${cfg.color}66` }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: cfg.color }}>{rf.message}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Priority Recommendations */}
      <div className="card space-y-5" style={{ background: 'rgba(255,255,255,0.97)', borderLeft: '4px solid #10b981' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.1))', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Lightbulb size={18} className="text-emerald-600" />
          </div>
          <p className="font-bold text-gray-900 text-lg">Priority Action Plan</p>
          <span className="ml-auto text-sm text-gray-700 font-semibold">Ordered by urgency</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recs.map((rec, i) => {
            const isObj    = typeof rec === 'object'
            const action   = isObj ? rec.action   : rec
            const cat      = isObj ? rec.category : 'General'
            const tf       = isObj ? rec.timeframe: ''
            const impact   = isObj ? rec.expected_impact : ''
            const CatIcon  = CAT_ICONS[cat] || Lightbulb
            const pColor   = PRIORITY_COLORS[i] || '#818cf8'
            return (
              <div key={i} className="rounded-xl p-4 animate-fade-up flex flex-col gap-3"
                   style={{ background: pColor + '08', border: `1px solid ${pColor}25`,
                            animationDelay: `${i * 0.07}s` }}>
                {/* Header */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                       style={{ background: pColor }}>
                    {i + 1}
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <CatIcon size={14} style={{ color: pColor }} className="flex-shrink-0" />
                    <span className="text-sm font-bold truncate" style={{ color: pColor }}>{cat}</span>
                  </div>
                  {tf && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0"
                          style={{ background: pColor + '15', color: pColor }}>
                      {tf}
                    </span>
                  )}
                </div>
                {/* Action */}
                <p className="text-sm text-gray-800 leading-relaxed">{action}</p>
                {/* Impact */}
                {impact && (
                  <div className="flex items-start gap-1.5 mt-auto pt-2 border-t border-black/[0.04]">
                    <TrendingUp size={14} className="mt-0.5 flex-shrink-0" style={{ color: pColor }} />
                    <p className="text-sm font-semibold leading-snug" style={{ color: pColor }}>{impact}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Row 3: 7-Day Study Plan (collapsible) */}
      {hasWeeklyPlan && (
        <div className="card card-dark space-y-4" style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.94),rgba(30,27,75,0.90))', border: '1px solid rgba(99,102,241,0.2)' }}>
          <button onClick={() => setWeekOpen(o => !o)}
                  className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <Calendar size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-lg text-left">7-Day Personalised Study Plan</p>
                <p className="text-xs text-white/50 text-left">Swipe or wait for auto-scroll</p>
              </div>
            </div>
            {weekOpen
              ? <ChevronUp size={18} className="text-white" />
              : <ChevronDown size={18} className="text-white" />
            }
          </button>

          {weekOpen && (
            <div 
              ref={scrollRef}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 scroll-smooth animate-fade-up carousel-scroll"
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(99,102,241,0.5) transparent',
                WebkitOverflowScrolling: 'touch'
              }}>
              {DAYS.map((day, i) => {
                const task = plan[day] || plan[day.toLowerCase()] || '—'
                return (
                  <div key={day} 
                       className="flex-shrink-0 w-[220px] rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:-translate-y-2"
                       style={{ 
                         background: 'rgba(255,255,255,0.05)',
                         border: '1px solid rgba(255,255,255,0.1)',
                         boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${DAY_COLORS[i].accent}22`
                       }}>
                    {/* Day header with gradient */}
                    <div className="px-4 py-4 text-center relative overflow-hidden"
                         style={{ background: DAY_COLORS[i].bg }}>
                      <div className="absolute inset-0 opacity-30"
                           style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3), transparent 60%)' }} />
                      <p className="text-white font-black text-lg tracking-wider relative z-10">
                        {DAY_ABBR[i]}
                      </p>
                      <p className="text-white/70 text-xs mt-1 relative z-10">{DAYS[i]}</p>
                    </div>
                    {/* Task content */}
                    <div className="p-4 min-h-[140px]">
                      <p className="text-sm text-white/90 leading-relaxed">{task}</p>
                    </div>
                    {/* Bottom accent */}
                    <div className="h-1.5 w-full" style={{ background: DAY_COLORS[i].bg }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
