/**
 * AIAdvisoryPanels — shared component
 * Renders the 4-section AI advisory: Explanation, Risk Factors, Priority Plan, 7-Day Schedule.
 * Used by PredictPage and StudentProgressPage.
 */
import React, { useState, useEffect, useRef } from 'react'
import {
  BrainCircuit, Lightbulb, CheckCircle, XCircle, AlertCircle,
  Star, FileText, Shield, Calendar, Clock, BookOpen, ClipboardList,
  TrendingUp, ChevronDown, ChevronUp, Cloud, Zap, Sparkles, ServerCrash, RefreshCw,
} from 'lucide-react'

export const SEV_CONFIG = {
  critical: { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)', label: 'CRITICAL', icon: XCircle },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', label: 'WARNING',  icon: AlertCircle },
  good:     { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', label: 'OK',       icon: CheckCircle },
}

export const CAT_ICONS = {
  'Attendance':      Calendar,
  'Internal Marks':  BookOpen,
  'Assignment Score':ClipboardList,
  'Study Hours':     Clock,
  'General':         Lightbulb,
}

const PRIORITY_COLORS = ['#f43f5e', '#f59e0b', '#6366f1', '#10b981']

const DAYS     = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
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

/**
 * @param {object} result  - prediction record (explanation, risk_factors, strengths,
 *                           recommendations, weekly_plan, report_summary, fallback_used, model_name)
 * @param {object} theme   - { accent } for border colors  (optional)
 */
export default function AIAdvisoryPanels({ result, theme }) {
  const [weekOpen, setWeekOpen] = useState(false)
  const scrollRef   = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  const rfs       = result.risk_factors    || []
  const recs      = result.recommendations || []
  const strengths = result.strengths       || []
  const plan      = result.weekly_plan     || {}
  const hasWeeklyPlan = Object.keys(plan).length > 0
  const accent    = theme?.accent || '#818cf8'

  // ── AI temporarily unavailable — show risk factors + info banner ──────────
  if (result.ai_advisory_failed) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Info banner */}
          <div className="card space-y-4" style={{ background: 'rgba(255,255,255,0.97)', borderLeft: '4px solid rgba(245,158,11,0.7)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <ServerCrash size={18} className="text-amber-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">AI Advisory Temporarily Unavailable</p>
                <p className="text-xs text-amber-600 font-semibold">All AI providers timed out</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Your ML prediction above is accurate — the risk level, confidence score, and metric breakdown are fully computed.
              The AI-generated explanation and study plan could not be generated within the time limit.
            </p>
            <div className="rounded-xl p-3 text-xs text-amber-800 leading-relaxed"
                 style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <strong>Why this happens:</strong> Free hosting limits each request to 30 seconds.
              When Gemini API quota is exhausted and Groq is slow, the advisory times out.
              Try again in a few seconds — results are cached so subsequent predictions are instant.
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white w-fit"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <RefreshCw size={14} /> Retry Prediction
            </button>
          </div>

          {/* Risk factors — always computed locally, always available */}
          <div className="card space-y-5" style={{ background: 'rgba(255,255,255,0.97)', borderLeft: `4px solid ${accent}` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
                <Shield size={18} className="text-rose-500" />
              </div>
              <p className="font-bold text-gray-900 text-lg">Risk Factor Analysis</p>
            </div>
            {rfs.length > 0 ? (
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
                             style={{ width: `${pct}%`, background: cfg.color, boxShadow: `0 0 6px ${cfg.color}66` }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: cfg.color }}>{rf.message}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No risk factor data available.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Auto-scroll weekly plan cards
  useEffect(() => {
    if (!weekOpen || !scrollRef.current || isHovered) return
    const container = scrollRef.current
    let scrollAmount = 0
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

  const recText = (r) => typeof r === 'string' ? r : (r.action || r)

  return (
    <div className="space-y-5">

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
                  ? <><Zap size={10} /> {result.ai_provider === 'groq' ? 'Groq AI (Fallback)' : 'Ollama AI (Fallback)'}</>
                  : <><Sparkles size={10} /> Gemini AI</>
                }
              </span>
            </div>
          </div>

          {/* Provider status line */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
               style={{
                 background: result.fallback_used ? 'rgba(245,158,11,0.05)' : 'rgba(99,102,241,0.04)',
                 border: `1px solid ${result.fallback_used ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.08)'}`,
               }}>
            <Cloud size={12} className={result.fallback_used ? 'text-amber-500 flex-shrink-0' : 'text-indigo-400 flex-shrink-0'} />
            <span className="text-gray-600">
              {result.fallback_used
                ? <>Gemini unavailable — generated via <strong className="text-amber-700">{result.model_name || (result.ai_provider === 'groq' ? 'Groq' : 'Ollama')}</strong> fallback</>
                : <>Generated using <strong className="text-indigo-600">{result.model_name || 'Gemini AI'}</strong> (Primary)</>
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
        <div className="card space-y-5" style={{ background: 'rgba(255,255,255,0.97)', borderLeft: `4px solid ${accent}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <Shield size={18} className="text-rose-500" />
            </div>
            <p className="font-bold text-gray-900 text-lg">Risk Factor Analysis</p>
          </div>

          {rfs.length > 0 ? (
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
                           style={{ width: `${pct}%`, background: cfg.color, boxShadow: `0 0 6px ${cfg.color}66` }} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: cfg.color }}>{rf.message}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No risk factor data for this prediction.</p>
          )}
        </div>
      </div>

      {/* Row 2: Priority Action Plan */}
      {recs.length > 0 && (
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
              const isObj   = typeof rec === 'object'
              const action  = isObj ? rec.action   : rec
              const cat     = isObj ? rec.category : 'General'
              const tf      = isObj ? rec.timeframe: ''
              const impact  = isObj ? rec.expected_impact : ''
              const CatIcon = CAT_ICONS[cat] || Lightbulb
              const pColor  = PRIORITY_COLORS[i] || '#818cf8'
              return (
                <div key={i} className="rounded-xl p-4 animate-fade-up flex flex-col gap-3"
                     style={{ background: pColor + '08', border: `1px solid ${pColor}25`, animationDelay: `${i * 0.07}s` }}>
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
                  <p className="text-sm text-gray-800 leading-relaxed">{action}</p>
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
      )}

      {/* Row 3: 7-Day Personalised Study Plan */}
      {hasWeeklyPlan && (
        <div className="card card-dark space-y-4"
             style={{ background: 'linear-gradient(145deg,rgba(15,12,41,0.94),rgba(30,27,75,0.90))', border: '1px solid rgba(99,102,241,0.2)' }}>
          <button onClick={() => setWeekOpen(o => !o)} className="w-full flex items-center justify-between">
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
            <div ref={scrollRef}
                 onMouseEnter={() => setIsHovered(true)}
                 onMouseLeave={() => setIsHovered(false)}
                 className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 scroll-smooth animate-fade-up carousel-scroll"
                 style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.5) transparent', WebkitOverflowScrolling: 'touch' }}>
              {DAYS.map((day, i) => {
                const task = plan[day] || plan[day.toLowerCase()] || '—'
                return (
                  <div key={day}
                       className="flex-shrink-0 w-[220px] rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:-translate-y-2"
                       style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${DAY_COLORS[i].accent}22` }}>
                    <div className="px-4 py-4 text-center relative overflow-hidden" style={{ background: DAY_COLORS[i].bg }}>
                      <div className="absolute inset-0 opacity-30"
                           style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3), transparent 60%)' }} />
                      <p className="text-white font-black text-lg tracking-wider relative z-10">{DAY_ABBR[i]}</p>
                      <p className="text-white/70 text-xs mt-1 relative z-10">{DAYS[i]}</p>
                    </div>
                    <div className="p-4 min-h-[140px]">
                      <p className="text-sm text-white/90 leading-relaxed">{task}</p>
                    </div>
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
