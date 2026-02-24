import React from 'react'
import { BookOpen, BrainCircuit, CheckCircle, ArrowRight, Lightbulb } from 'lucide-react'

const existing = [
  'ML prediction only (RandomForest / SVM)',
  'No explanation of prediction results',
  'No personalised student advisory',
  'No interactive teacher dashboard',
  'No real-time performance monitoring',
]

const proposed = [
  'ML prediction (RandomForestClassifier, 200 trees)',
  'AI-generated grounded explanation (GPT-3.5 / rule-based)',
  'Personalised 4-point improvement advisory',
  'Teacher analytics dashboard with charts',
  'Live prediction history with search & filter',
  'Automatic synthetic dataset generation',
  'Edge-case handling and graceful fallbacks',
]

const workflow = [
  { step: 1, title: 'Data Input',    desc: 'Teacher/admin enters student academic metrics: attendance, marks, assignment score, study hours.' },
  { step: 2, title: 'ML Prediction', desc: 'RandomForestClassifier (200 estimators, balanced class weights) classifies student as Good / Average / At Risk with probability scores.' },
  { step: 3, title: 'AI Explanation',desc: 'OpenAI GPT-3.5-turbo (or rule-based fallback) generates a grounded 2–3 sentence explanation citing the specific input values.' },
  { step: 4, title: 'Advisory',      desc: 'AI produces 4 personalised, actionable study recommendations targeting the student\'s weakest areas.' },
  { step: 5, title: 'Dashboard',     desc: 'Results are stored and reflected instantly on the Teacher Analytics Dashboard with charts and filterable history.' },
]

const techStack = [
  { layer: 'Frontend',     tech: 'React 18, Vite, Tailwind CSS, Recharts, Lucide icons' },
  { layer: 'Backend',      tech: 'Python 3.10+, FastAPI, Pydantic v2, Uvicorn' },
  { layer: 'ML Engine',    tech: 'Scikit-learn RandomForestClassifier, NumPy, Pandas' },
  { layer: 'AI Layer',     tech: 'OpenAI GPT-3.5-turbo API (with rule-based fallback)' },
  { layer: 'Data',         tech: 'Synthetic CSV dataset (1500 rows, auto-generated)' },
  { layer: 'Deployment',   tech: 'localhost:3000 (React) + localhost:8000 (FastAPI)' },
]

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="card bg-gradient-to-r from-blue-900 to-blue-700 text-white border-0">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI-Based Student Performance Prediction and Advisory System</h2>
            <p className="text-blue-200 mt-1 text-sm">Final Year AI Project  •  IEEE-Enhanced Proposed System</p>
            <p className="mt-3 text-blue-100 text-sm leading-relaxed">
              Inspired by the IEEE research paper <em>"Early Predicting of Students Performance in Higher Education"</em>,
              this system extends the existing ML-prediction baseline with an AI explanation layer,
              personalised advisory generation, and a full teacher analytics dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* ── IEEE Reference ───────────────────────────────────────────────── */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <BookOpen size={16} className="text-blue-600" /> IEEE Paper Reference
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 border border-gray-200">
          <p><strong>Title:</strong> Early Predicting of Students Performance in Higher Education</p>
          <p className="mt-1"><strong>Source:</strong> IEEE (2023)</p>
          <p className="mt-2 leading-relaxed">
            The referenced paper proposes using machine learning models (including ensemble classifiers)
            trained on student academic data — admission scores, GPA, aptitude tests — to predict
            performance outcomes early in the academic cycle. The study demonstrates that early
            intervention, guided by prediction results, improves student success rates.
          </p>
          <p className="mt-2 text-gray-500 italic">
            This project adopts the core ML-prediction idea and adds an AI explanation and advisory layer
            as the primary improvement over the existing system.
          </p>
        </div>
      </div>

      {/* ── Existing vs Proposed ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card border-l-4 border-red-400">
          <h3 className="font-semibold text-gray-700 mb-3">Existing System (IEEE Baseline)</h3>
          <ul className="space-y-2">
            {existing.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-red-400 mt-0.5">✗</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="card border-l-4 border-green-400">
          <h3 className="font-semibold text-gray-700 mb-3">Proposed System (This Project)</h3>
          <ul className="space-y-2">
            {proposed.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Workflow ─────────────────────────────────────────────────────── */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-5 flex items-center gap-2">
          <ArrowRight size={16} className="text-blue-600" /> System Workflow: Predict → Explain → Advise
        </h3>
        <div className="relative">
          {workflow.map((w, i) => (
            <div key={w.step} className="flex gap-4 mb-6 last:mb-0">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {w.step}
                </div>
                {i < workflow.length - 1 && (
                  <div className="w-0.5 bg-blue-200 flex-1 mt-2" />
                )}
              </div>
              <div className="pb-4">
                <p className="font-semibold text-gray-700 text-sm">{w.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tech Stack ───────────────────────────────────────────────────── */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Lightbulb size={16} className="text-yellow-500" /> Technology Stack
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {techStack.map(t => (
            <div key={t.layer} className="flex gap-3 bg-gray-50 rounded-lg px-4 py-3">
              <span className="font-semibold text-blue-700 text-sm w-24 flex-shrink-0">{t.layer}</span>
              <span className="text-sm text-gray-600">{t.tech}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Viva checklist ───────────────────────────────────────────────── */}
      <div className="card bg-green-50 border-green-200">
        <h3 className="font-semibold text-green-800 mb-3">Viva Evaluation Checklist</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            'IEEE paper linkage and improvement explanation',
            'End-to-end working ML pipeline',
            'Teacher analytics dashboard with charts',
            'Risk classification (Good / Average / At Risk)',
            'AI explanation panel (GPT or fallback)',
            'Personalised advisory output (4 recommendations)',
            'Input validation and error handling',
            'Synthetic dataset auto-generation (1500 rows)',
            'Professional institutional UI with sidebar',
            'Real-world academic use-case documentation',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle size={14} className="text-green-500 flex-shrink-0" /> {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
