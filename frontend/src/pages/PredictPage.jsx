import React, { useState } from 'react'
import {
  BrainCircuit, Send, AlertCircle, Lightbulb,
  ChevronRight, BarChart2, CheckCircle, XCircle
} from 'lucide-react'
import RiskBadge from '../components/RiskBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { predictStudent } from '../api'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts'

const INITIAL = {
  student_id: '',
  student_name: '',
  attendance_percentage: '',
  internal_marks: '',
  assignment_score: '',
  study_hours_per_day: '',
}

const FIELDS = [
  { key: 'student_id',            label: 'Student ID',          placeholder: 'e.g. STU001', type: 'text',   hint: 'Unique identifier' },
  { key: 'student_name',          label: 'Student Name',         placeholder: 'e.g. Rahul Sharma', type: 'text',   hint: 'Full name' },
  { key: 'attendance_percentage', label: 'Attendance (%)',       placeholder: '0 – 100',   type: 'number', hint: 'Recommended ≥ 75%' },
  { key: 'internal_marks',        label: 'Internal Marks',       placeholder: '0 – 100',   type: 'number', hint: 'Out of 100' },
  { key: 'assignment_score',      label: 'Assignment Score',     placeholder: '0 – 100',   type: 'number', hint: 'Out of 100' },
  { key: 'study_hours_per_day',   label: 'Study Hours / Day',    placeholder: '0 – 12',    type: 'number', hint: 'Recommended ≥ 3 hrs' },
]

const riskColor = {
  Good:     'border-green-400 bg-green-50',
  Average:  'border-yellow-400 bg-yellow-50',
  'At Risk':'border-red-400 bg-red-50',
}

export default function PredictPage() {
  const [form, setForm]       = useState(INITIAL)
  const [errors, setErrors]   = useState({})
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const validate = () => {
    const errs = {}
    if (!form.student_id.trim())   errs.student_id   = 'Required'
    if (!form.student_name.trim()) errs.student_name = 'Required'
    const numFields = [
      { key: 'attendance_percentage', min: 0,  max: 100 },
      { key: 'internal_marks',        min: 0,  max: 100 },
      { key: 'assignment_score',      min: 0,  max: 100 },
      { key: 'study_hours_per_day',   min: 0,  max: 12  },
    ]
    numFields.forEach(({ key, min, max }) => {
      const v = parseFloat(form[key])
      if (form[key] === '') errs[key] = 'Required'
      else if (isNaN(v))   errs[key] = 'Must be a number'
      else if (v < min || v > max) errs[key] = `Must be ${min}–${max}`
    })
    return errs
  }

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setApiError('')
    setResult(null)

    try {
      const payload = {
        student_id:            form.student_id.trim(),
        student_name:          form.student_name.trim(),
        attendance_percentage: parseFloat(form.attendance_percentage),
        internal_marks:        parseFloat(form.internal_marks),
        assignment_score:      parseFloat(form.assignment_score),
        study_hours_per_day:   parseFloat(form.study_hours_per_day),
      }
      const res = await predictStudent(payload)
      setResult(res.data)
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Prediction request failed.')
    }
    setLoading(false)
  }

  const handleReset = () => { setForm(INITIAL); setResult(null); setApiError(''); setErrors({}) }

  // Radar chart data
  const radarData = result ? [
    { subject: 'Attendance',   value: result.inputs.attendance_percentage,       max: 100 },
    { subject: 'Int. Marks',   value: result.inputs.internal_marks,              max: 100 },
    { subject: 'Assignments',  value: result.inputs.assignment_score,            max: 100 },
    { subject: 'Study Hrs',    value: result.inputs.study_hours_per_day * 8.33,  max: 100 },
  ] : []

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <BrainCircuit size={20} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Student Performance Predictor</h2>
          <p className="text-sm text-gray-400">
            RandomForest ML prediction + AI-generated explanation and advisory
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Input form ────────────────────────────────────────────────── */}
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-5">Student Academic Data</h3>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {FIELDS.map(({ key, label, placeholder, type, hint }) => (
              <div key={key}>
                <label className="label">
                  {label}
                  <span className="text-gray-400 font-normal ml-1 text-xs">({hint})</span>
                </label>
                <input
                  type={type}
                  name={key}
                  value={form[key]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  step={type === 'number' ? '0.1' : undefined}
                  className={`input-field ${errors[key] ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                {errors[key] && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <XCircle size={12} /> {errors[key]}
                  </p>
                )}
              </div>
            ))}

            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{apiError}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing…</>
                ) : (
                  <><Send size={16} /> Predict Performance</>
                )}
              </button>
              {result && (
                <button type="button" onClick={handleReset} className="btn-secondary">
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Result panel ──────────────────────────────────────────────── */}
        {loading && (
          <div className="card flex items-center justify-center">
            <LoadingSpinner message="Running ML prediction and AI advisory…" size="lg" />
          </div>
        )}

        {!loading && result && (
          <div className="space-y-4">
            {/* Prediction result card */}
            <div className={`card border-2 ${riskColor[result.risk_level]}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{result.student_name}</p>
                  <p className="text-xs text-gray-400">{result.student_id}</p>
                </div>
                <RiskBadge level={result.risk_level} size="lg" />
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Confidence</p>
                  <p className="text-2xl font-bold text-gray-800">{(result.confidence * 100).toFixed(1)}%</p>
                </div>
                <div className="text-right text-xs text-gray-400">
                  {Object.entries(result.probabilities || {}).map(([k, v]) => (
                    <div key={k}>{k}: <span className="font-medium text-gray-600">{(v * 100).toFixed(0)}%</span></div>
                  ))}
                </div>
              </div>

              {/* Probability bars */}
              <div className="mt-4 space-y-2">
                {Object.entries(result.probabilities || {}).map(([k, v]) => {
                  const barColor = k === 'Good' ? 'bg-green-500' : k === 'Average' ? 'bg-yellow-500' : 'bg-red-500'
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <span className="w-16 text-xs text-gray-500">{k}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${v * 100}%` }} />
                      </div>
                      <span className="w-10 text-right text-xs text-gray-500">{(v * 100).toFixed(0)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Radar chart */}
            <div className="card">
              <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <BarChart2 size={14} className="text-blue-600" /> Performance Profile
              </h4>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                  <Tooltip formatter={v => [`${v.toFixed(1)}`, 'Score']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {!loading && !result && !apiError && (
          <div className="card flex flex-col items-center justify-center text-center py-16 border-dashed border-2 border-gray-200">
            <BrainCircuit size={48} className="text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium">Fill in student data and click Predict</p>
            <p className="text-gray-300 text-sm mt-1">Result will appear here</p>
          </div>
        )}
      </div>

      {/* ── Explanation + Advisory ─────────────────────────────────────── */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* AI Explanation */}
          <div className="card border-l-4 border-blue-500">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <BrainCircuit size={16} className="text-blue-600" />
              AI Explanation
              {result.fallback_used && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full ml-auto">
                  Rule-based
                </span>
              )}
              {!result.fallback_used && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto">
                  GPT-3.5
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">{result.explanation}</p>

            {result.key_factors?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Key Factors
                </p>
                <ul className="space-y-1.5">
                  {result.key_factors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <ChevronRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="card border-l-4 border-green-500">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Lightbulb size={16} className="text-green-600" />
              Personalized Advisory
            </h3>
            <ul className="space-y-3">
              {(result.recommendations || []).map((rec, i) => (
                <li key={i} className="flex items-start gap-3 bg-green-50 rounded-lg px-3 py-2.5">
                  <CheckCircle size={15} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
