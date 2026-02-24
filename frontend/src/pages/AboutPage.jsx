import React from 'react'
import { BookOpen, BrainCircuit, CheckCircle, ArrowRight, Lightbulb, Sparkles, X } from 'lucide-react'

const existing = [
  'ML prediction only (RandomForest / SVM)',
  'No explanation of prediction results',
  'No personalised student advisory',
  'No interactive teacher dashboard',
  'No real-time performance monitoring',
]

const proposed = [
  'RandomForestClassifier (200 trees, balanced weights)',
  'AI-generated grounded explanation (GPT-3.5 / rule-based)',
  'Personalised 4-point improvement advisory per student',
  'Teacher analytics dashboard with interactive charts',
  'Live prediction history with search & filter',
  'Automatic 10,000-row synthetic dataset with realistic noise',
  'Input validation and graceful edge-case handling',
]

const workflow = [
  { n: 1, title: 'Data Input',    color: '#818cf8', desc: 'Teacher enters student metrics: attendance %, internal marks, assignment score, study hours.' },
  { n: 2, title: 'ML Prediction', color: '#a78bfa', desc: 'RandomForestClassifier (200 trees) classifies the student as Good / Average / At Risk with probability scores.' },
  { n: 3, title: 'AI Explanation',color: '#c084fc', desc: 'GPT-3.5 (or rule-based fallback) generates a grounded 2–3 sentence explanation citing specific input values.' },
  { n: 4, title: 'Advisory',      color: '#f472b6', desc: '4 personalised, actionable study recommendations targeting the student\'s weakest performance areas.' },
  { n: 5, title: 'Dashboard',     color: '#fb923c', desc: 'Results stored and reflected in Teacher Analytics — charts, filters, history, and trend visualisation.' },
]

const tech = [
  { l: 'Frontend',  t: 'React 18, Vite, Tailwind CSS, Recharts, Lucide icons' },
  { l: 'Backend',   t: 'Python 3.11, FastAPI, Pydantic v2, Uvicorn'            },
  { l: 'ML Engine', t: 'Scikit-learn RandomForestClassifier (sklearn 1.4)'     },
  { l: 'AI Layer',  t: 'OpenAI GPT-3.5-turbo API with rule-based fallback'     },
  { l: 'Dataset',   t: '10,000-row synthetic CSV with realistic noise (3%)'    },
  { l: 'Accuracy',  t: '89.45% test accuracy | 89.33% 5-fold CV'              },
]

const viva = [
  'IEEE paper linkage and improvement explanation',
  'End-to-end working ML pipeline',
  'Teacher analytics dashboard with charts',
  'Risk classification (Good / Average / At Risk)',
  'AI explanation panel (GPT or rule-based)',
  'Personalised advisory (4 recommendations)',
  'Input validation and graceful error handling',
  '10,000-row synthetic dataset with noise',
  'Professional institutional UI with animations',
  'Real-world academic use-case documentation',
]

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl p-7 overflow-hidden animate-fade-up"
           style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
        <div className="absolute top-0 left-0 right-0 h-0.5 animated-gradient"
             style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1)', backgroundSize: '200% 100%' }} />
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
        <div className="flex items-start gap-5 relative">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', boxShadow: '0 0 30px rgba(99,102,241,0.5)' }}>
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white leading-tight">
              AI-Based Student Performance
              <span style={{ display: 'block', background: 'linear-gradient(135deg,#818cf8,#c084fc,#f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Prediction & Advisory System
              </span>
            </h2>
            <p className="text-white/40 mt-2 text-sm">Final Year AI Project  •  IEEE Enhanced System  •  2024</p>
            <p className="text-white/60 text-sm mt-3 leading-relaxed max-w-xl">
              Inspired by the IEEE paper <em className="text-indigo-300">"Early Predicting of Students Performance in Higher Education"</em>,
              this system extends the ML-prediction baseline with an AI explanation layer, personalised advisory, and a full teacher analytics dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* ── IEEE Reference ───────────────────────────────────────────────── */}
      <div className="card animate-fade-up s1" style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(229,231,235,0.7)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <BookOpen size={14} className="text-indigo-600" />
          </div>
          <p className="font-bold text-gray-800 text-sm">IEEE Paper Reference</p>
        </div>
        <div className="rounded-xl p-4 text-sm text-gray-600"
             style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
          <p><strong className="text-gray-800">Title:</strong> Early Predicting of Students Performance in Higher Education</p>
          <p className="mt-1"><strong className="text-gray-800">Source:</strong> IEEE (2023)</p>
          <p className="mt-2 leading-relaxed text-gray-500">
            The paper uses ML models trained on student academic data (admission scores, GPA, aptitude tests) to predict performance outcomes early.
            This project adopts the core ML-prediction idea and adds an <strong className="text-indigo-600">AI explanation + advisory layer</strong> as the primary improvement.
          </p>
        </div>
      </div>

      {/* ── Existing vs Proposed ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-up s2">
        <div className="card" style={{ background: 'rgba(255,255,255,0.97)', borderLeft: '3px solid #f43f5e' }}>
          <p className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2">
            <X size={14} className="text-rose-500" /> Existing System (IEEE Baseline)
          </p>
          <ul className="space-y-2.5">
            {existing.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-500">
                <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(244,63,94,0.1)' }}>
                  <X size={9} className="text-rose-400" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="card" style={{ background: 'rgba(255,255,255,0.97)', borderLeft: '3px solid #10b981' }}>
          <p className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-500" /> Proposed System (This Project)
          </p>
          <ul className="space-y-2.5">
            {proposed.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                <CheckCircle size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Workflow ─────────────────────────────────────────────────────── */}
      <div className="card animate-fade-up s3" style={{ background: 'rgba(255,255,255,0.97)' }}>
        <p className="font-bold text-gray-800 text-sm mb-5 flex items-center gap-2">
          <ArrowRight size={14} className="text-indigo-500" /> System Workflow: Predict → Explain → Advise
        </p>
        <div className="space-y-0">
          {workflow.map((w, i) => (
            <div key={w.n} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                     style={{ background: `linear-gradient(135deg, ${w.color}, ${w.color}88)`, boxShadow: `0 0 12px ${w.color}55` }}>
                  {w.n}
                </div>
                {i < workflow.length - 1 && (
                  <div className="w-0.5 flex-1 mt-1 mb-1"
                       style={{ background: `linear-gradient(${w.color}, ${workflow[i+1].color})`, opacity: 0.3 }} />
                )}
              </div>
              <div className="pb-5">
                <p className="font-bold text-gray-700 text-sm">{w.title}</p>
                <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tech Stack ───────────────────────────────────────────────────── */}
      <div className="card animate-fade-up s4" style={{ background: 'rgba(255,255,255,0.97)' }}>
        <p className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
          <Lightbulb size={14} className="text-amber-500" /> Technology Stack
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tech.map(t => (
            <div key={t.l} className="flex gap-3 rounded-xl px-4 py-3"
                 style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
              <span className="font-bold text-indigo-600 text-sm w-20 flex-shrink-0">{t.l}</span>
              <span className="text-sm text-gray-500">{t.t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Viva checklist ───────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 animate-fade-up s5"
           style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.05))', border: '1px solid rgba(16,185,129,0.2)' }}>
        <p className="font-bold text-emerald-700 text-sm mb-4 flex items-center gap-2">
          <CheckCircle size={14} /> Viva Evaluation Checklist
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {viva.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-emerald-700">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(16,185,129,0.15)' }}>
                <CheckCircle size={10} className="text-emerald-500" />
              </div>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
