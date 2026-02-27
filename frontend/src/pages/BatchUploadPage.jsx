import React, { useState, useRef } from 'react'
import { Upload, Download, FileText, CheckCircle, XCircle, Loader2, ClipboardList } from 'lucide-react'
import RiskBadge from '../components/RiskBadge'
import { batchUpload } from '../api'
import { useToast } from '../components/Toast'

const SAMPLE_CSV = `student_name,student_id,attendance_percentage,internal_marks,assignment_score,study_hours_per_day
Alice Johnson,S001,88,72,80,4
Bob Smith,S002,55,40,50,1.5
Carol Davis,S003,75,65,70,3
David Lee,S004,92,85,88,5
Emma Wilson,S005,48,35,42,1`

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'batch_template.csv'
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

const riskTheme = {
  Good:     { accent: '#10b981' },
  Average:  { accent: '#f59e0b' },
  'At Risk':{ accent: '#f43f5e' },
}

export default function BatchUploadPage() {
  const [dragging, setDragging]   = useState(false)
  const [file, setFile]           = useState(null)
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [progress, setProgress]   = useState(0)
  const inputRef = useRef(null)
  const toast    = useToast()

  const handleFile = f => {
    if (!f) return
    if (!f.name.endsWith('.csv')) {
      toast('Only CSV files are accepted', 'error'); return
    }
    setFile(f); setResult(null); setProgress(0)
  }

  const onDrop = e => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const upload = async () => {
    if (!file) return
    setLoading(true); setProgress(10)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const tick = setInterval(() => setProgress(p => Math.min(p + 10, 85)), 300)
      const res  = await batchUpload(fd)
      clearInterval(tick); setProgress(100)
      setResult(res.data)
      toast(`Processed ${res.data.processed} of ${res.data.total} students`, 'success')
    } catch (e) {
      setProgress(0)
      toast(e.response?.data?.detail || 'Upload failed', 'error')
    }
    setLoading(false)
  }

  const distCount = result ? result.results.reduce((acc, r) => {
    acc[r.risk_level] = (acc[r.risk_level] || 0) + 1; return acc
  }, {}) : {}

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}>
            <Upload size={22} className="text-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-black text-xl">Batch Upload</h2>
            <p className="text-gray-600 text-sm">Predict an entire class from a CSV file</p>
          </div>
        </div>
        <button onClick={downloadSample} className="btn-secondary flex items-center gap-2 text-xs">
          <Download size={13} /> Download Template
        </button>
      </div>

      {/* Drop zone */}
      <div className={`animate-fade-up s1 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
                       flex flex-col items-center justify-center py-14 gap-3
                       ${dragging
                         ? 'border-indigo-400 bg-indigo-50/50'
                         : file
                           ? 'border-emerald-400 bg-emerald-50/30'
                           : 'border-gray-200 bg-white/60 hover:border-indigo-300 hover:bg-indigo-50/20'
                       }`}
           onDragOver={e => { e.preventDefault(); setDragging(true) }}
           onDragLeave={() => setDragging(false)}
           onDrop={onDrop}
           onClick={() => inputRef.current?.click()}>
        <input ref={inputRef} type="file" accept=".csv" className="hidden"
               onChange={e => handleFile(e.target.files[0])} />
        {file ? (
          <>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                 style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <FileText size={22} className="text-emerald-500" />
            </div>
            <p className="font-bold text-gray-700 text-sm">{file.name}</p>
            <p className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB — click to change</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                 style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <Upload size={22} className="text-indigo-400" />
            </div>
            <p className="font-bold text-black text-sm">Drop your CSV here or click to browse</p>
            <p className="text-gray-600 text-xs">Required columns: student_name, student_id, attendance_percentage, internal_marks, assignment_score, study_hours_per_day</p>
          </>
        )}
      </div>

      {/* Progress bar */}
      {loading && (
        <div className="animate-fade-up">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-gray-700">Processing predictions…</span>
            <span className="text-xs text-indigo-500 font-bold">{progress}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-300"
                 style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#6366f1,#a855f7)' }} />
          </div>
        </div>
      )}

      {/* Upload button */}
      {file && !loading && !result && (
        <div className="animate-fade-up flex justify-center">
          <button onClick={upload} className="btn-primary px-8 py-3 text-sm flex items-center gap-2">
            <Upload size={15} /> Predict All Students
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-up">

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Rows',   value: result.total,     color: '#818cf8' },
              { label: 'Processed',    value: result.processed, color: '#10b981' },
              { label: 'Failed',       value: result.failed,    color: '#f43f5e' },
              { label: 'At Risk',      value: distCount['At Risk'] || 0, color: '#f59e0b' },
            ].map(m => (
              <div key={m.label} className="card text-center" style={{ background: 'rgba(255,255,255,0.97)' }}>
                <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">{m.label}</p>
                <p className="text-2xl font-black mt-1" style={{ color: m.color }}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Errors */}
          {result.errors?.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <p className="text-rose-600 font-bold text-xs mb-2 flex items-center gap-1.5">
                <XCircle size={12} /> Row Errors (first 10)
              </p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-rose-600 text-xs">Row {e.row}: {e.error}</p>
              ))}
            </div>
          )}

          {/* Results table */}
          <div className="card" style={{ background: 'rgba(255,255,255,0.97)' }}>
            <p className="font-bold text-black text-sm mb-4 flex items-center gap-2">
              <ClipboardList size={14} className="text-indigo-500" /> Prediction Results
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {['#','Name','ID','Attendance','Int. Marks','Assignments','Study Hrs','Risk','Confidence'].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-black uppercase tracking-wider pb-3 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r, i) => (
                    <tr key={r.id} className="tr-hover border-b border-gray-200">
                      <td className="py-2.5 pr-3 text-gray-700">{i + 1}</td>
                      <td className="py-2.5 pr-3 font-semibold text-black">{r.student_name}</td>
                      <td className="py-2.5 pr-3 font-mono text-gray-700 text-[10px]">{r.student_id}</td>
                      <td className="py-2.5 pr-3 text-black">{r.inputs?.attendance_percentage}%</td>
                      <td className="py-2.5 pr-3 text-black">{r.inputs?.internal_marks}</td>
                      <td className="py-2.5 pr-3 text-black">{r.inputs?.assignment_score}</td>
                      <td className="py-2.5 pr-3 text-black">{r.inputs?.study_hours_per_day}h</td>
                      <td className="py-2.5 pr-3"><RiskBadge level={r.risk_level} /></td>
                      <td className="py-2.5 pr-3 font-bold text-black">
                        {(r.confidence * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center">
            <button onClick={() => { setFile(null); setResult(null) }}
                    className="btn-secondary text-xs px-6">
              Upload Another File
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
