import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, Download, FileText, CheckCircle, XCircle, Loader2, ClipboardList, Sparkles, Cloud, RefreshCw, Zap, Database } from 'lucide-react'
import RiskBadge from '../components/RiskBadge'
import { batchUpload, getBatchProgress, clearBatchData } from '../api'
import { useToast } from '../components/Toast'

const SAMPLE_CSV = `student_id,student_name,department,current_year,section,attendance,CA_1_internal_marks,assignments,study_hours
SKP-IT-A101,Aravind Kumar,Information Technology,4,IT-A,92,88,90,5.5
SKP-IT-A102,Priya Dharshini,Information Technology,4,IT-A,95,91,93,6.0
SKP-IT-B101,Karthikeyan R,Information Technology,4,IT-B,74,58,65,2.5
SKP-IT-B102,Tamilselvi M,Information Technology,4,IT-B,77,63,67,3.0
SKP-IT-C101,Manikandan R,Information Technology,4,IT-C,45,28,35,0.5
SKP-IT-C102,Vikram S,Information Technology,4,IT-C,50,35,40,1.0`

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'SKP_IT_Section_Template.csv'
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
  const [progressText, setProgressText] = useState('')
  const [batchId, setBatchId]     = useState(null)
  const [totalRows, setTotalRows] = useState(0)
  const [cacheHits, setCacheHits] = useState(0)
  const [aiGenerated, setAiGenerated] = useState(0)
  const inputRef = useRef(null)
  const pollRef  = useRef(null)
  const toast    = useToast()

  const handleFile = f => {
    if (!f) return
    if (!f.name.endsWith('.csv')) {
      toast('Only CSV files are accepted', 'error'); return
    }
    setFile(f); setResult(null); setProgress(0); setProgressText(''); setBatchId(null)
    setCacheHits(0); setAiGenerated(0)
  }

  const onDrop = e => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  // Poll batch progress
  const pollProgress = useCallback(async (bid) => {
    try {
      const res = await getBatchProgress(bid)
      const data = res.data
      const pct = data.total > 0 ? Math.round((data.processed / data.total) * 100) : 0
      setProgress(pct)
      setCacheHits(data.cache_hits || 0)
      setAiGenerated(data.ai_generated || 0)
      
      // Smart progress text based on cache usage
      if (data.cache_hits > 0 && data.ai_generated === 0) {
        setProgressText(`Loading from cache (${data.processed}/${data.total}) — instant!`)
      } else if (data.cache_hits > 0) {
        setProgressText(`Processing (${data.processed}/${data.total}) — ${data.cache_hits} cached, ${data.ai_generated} generating`)
      } else {
        setProgressText(`Generating AI advisories (${data.processed}/${data.total})`)
      }

      if (data.status === 'done') {
        clearInterval(pollRef.current)
        pollRef.current = null
        setProgress(100)
        
        // Final summary
        if (data.cache_hits === data.total) {
          setProgressText(`Instant load — all ${data.total} from cache`)
        } else if (data.cache_hits > 0) {
          setProgressText(`Complete — ${data.cache_hits} cached, ${data.ai_generated} generated`)
        } else {
          setProgressText(`Complete — ${data.processed} students processed`)
        }
        
        setResult(data)
        setLoading(false)
        toast(`Processed ${data.processed} students (${data.cache_hits} from cache)`, 'success')
        window.dispatchEvent(new CustomEvent('predictionSaved'))
      }
    } catch {
      // Keep polling on network errors
    }
  }, [toast])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const upload = async () => {
    if (!file) return
    setLoading(true); setProgress(5); setProgressText('Uploading CSV...')
    setCacheHits(0); setAiGenerated(0)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await batchUpload(fd)
      const data = res.data

      if (data.status === 'processing') {
        // Async mode — start polling
        setBatchId(data.batch_id)
        setTotalRows(data.total)
        setProgress(10)
        setProgressText(`Checking cache for ${data.total} students...`)
        pollRef.current = setInterval(() => pollProgress(data.batch_id), 1000)
      } else {
        // Sync fallback (shouldn't happen with new backend)
        setProgress(100)
        setResult(data)
        setLoading(false)
        toast(`Processed ${data.processed} of ${data.total} students`, 'success')
        window.dispatchEvent(new CustomEvent('predictionSaved'))
      }
    } catch (e) {
      setProgress(0); setProgressText('')
      toast(e.response?.data?.detail || 'Upload failed', 'error')
      setLoading(false)
    }
  }

  const handleClearBatch = async () => {
    try {
      await clearBatchData()
      toast('Batch data cleared successfully', 'success')
      setFile(null); setResult(null); setProgress(0); setProgressText(''); setBatchId(null)
      window.dispatchEvent(new CustomEvent('predictionSaved'))
    } catch (e) {
      toast(e.response?.data?.detail || 'Clear failed', 'error')
    }
  }

  const distCount = result ? (result.results || []).reduce((acc, r) => {
    acc[r.risk_level] = (acc[r.risk_level] || 0) + 1; return acc
  }, {}) : {}

  // Detect section from results
  const detectedSection = result?.results?.[0]?.section || null
  const detectedYear = result?.results?.[0]?.current_year || null

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
            <p className="text-gray-700 text-sm font-medium">
              {result && detectedSection 
                ? `Processed: Section ${detectedSection} (Year ${detectedYear || '—'})` 
                : 'Predict an entire class from a CSV file'}
            </p>
          </div>
        </div>
        <button onClick={downloadSample} className="btn-secondary flex items-center gap-2 text-xs">
          <Download size={13} /> Download Template
        </button>
      </div>

      {/* Section info banner when result is ready */}
      {result && detectedSection && (
        <div className="rounded-xl p-3 flex items-center justify-between animate-fade-up"
             style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
              <FileText size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-indigo-700 text-sm">
                Class: {detectedSection} • Year {detectedYear || '—'}
              </p>
              <p className="text-xs text-gray-600">
                {result.processed} students processed — data isolated from demo students
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700">
            Batch ID: {batchId?.slice(0, 8)}...
          </span>
        </div>
      )}

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
            <p className="text-gray-600 text-xs">Required: student_id, student_name, department, current_year, section, attendance, CA_1_internal_marks, assignments, study_hours</p>
          </>
        )}
      </div>

      {/* Real-time progress bar */}
      {loading && (
        <div className="animate-fade-up">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
              {cacheHits > 0 && aiGenerated === 0 ? (
                <><Database size={12} className="text-emerald-500" /> {progressText}</>
              ) : cacheHits > 0 ? (
                <><Sparkles size={12} className="text-indigo-500 animate-pulse" /> {progressText}</>
              ) : (
                <><Sparkles size={12} className="text-indigo-500 animate-pulse" /> {progressText || 'Processing predictions…'}</>
              )}
            </span>
            <span className="text-xs text-indigo-500 font-bold">{progress}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-500 ease-out"
                 style={{ 
                   width: `${progress}%`, 
                   background: cacheHits > 0 && aiGenerated === 0 
                     ? 'linear-gradient(90deg,#10b981,#059669)' 
                     : 'linear-gradient(90deg,#6366f1,#a855f7)' 
                 }} />
          </div>
          {progress > 0 && progress < 100 && (
            <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1">
              {cacheHits > 0 && aiGenerated === 0 ? (
                <><Zap size={10} /> Loading from permanent cache — instant processing</>
              ) : (
                <><Cloud size={10} /> AI generating personalised advisories — please wait</>
              )}
            </p>
          )}
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

          {/* Cache performance banner */}
          {result.cache_hits > 0 && (
            <div className="rounded-xl p-3 flex items-center gap-3" 
                 style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(99,102,241,0.1))', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                <Zap size={18} className="text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-emerald-700 text-sm">
                  {result.cache_hits === result.total ? 'Instant Load — 100% from Cache' : `${result.cache_hits} Students Loaded from Cache`}
                </p>
                <p className="text-xs text-gray-600">
                  {result.cache_hits === result.total 
                    ? 'Zero AI calls — all advisories were pre-cached'
                    : `${result.ai_generated} new advisories generated, ${result.cache_hits} loaded instantly`}
                </p>
              </div>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total',       value: result.total,                  color: '#818cf8', icon: ClipboardList },
              { label: 'From Cache',  value: result.cache_hits || 0,        color: '#10b981', icon: Database },
              { label: 'Generated',   value: result.ai_generated || 0,      color: '#6366f1', icon: Sparkles },
              { label: 'Failed',      value: result.failed,                 color: '#f43f5e', icon: XCircle },
              { label: 'At Risk',     value: distCount['At Risk'] || 0,     color: '#f59e0b', icon: null },
            ].map(m => (
              <div key={m.label} className="card text-center" style={{ background: 'rgba(255,255,255,0.97)' }}>
                <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                  {m.icon && <m.icon size={10} />} {m.label}
                </p>
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
                    {['#','Name','ID','Section','Year','Attendance','Int. Marks','Assignments','Study Hrs','Risk','Confidence'].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-black uppercase tracking-wider pb-3 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(result.results || []).map((r, i) => (
                    <tr key={r.id} className="tr-hover border-b border-gray-200">
                      <td className="py-2.5 pr-3 text-gray-700">{i + 1}</td>
                      <td className="py-2.5 pr-3 font-semibold text-black">{r.student_name}</td>
                      <td className="py-2.5 pr-3 font-mono text-gray-700 text-[10px]">{r.student_id}</td>
                      <td className="py-2.5 pr-3 text-black font-mono">{r.section || '—'}</td>
                      <td className="py-2.5 pr-3 text-black">{r.current_year ? `Yr ${r.current_year}` : '—'}</td>
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

          <div className="flex justify-center gap-3">
            <button onClick={() => { setFile(null); setResult(null); setProgress(0); setProgressText(''); setBatchId(null); setCacheHits(0); setAiGenerated(0) }}
                    className="btn-secondary text-xs px-6 flex items-center gap-2">
              <Upload size={13} /> Upload Another File
            </button>
            <button onClick={handleClearBatch}
                    className="btn-secondary text-xs px-6 flex items-center gap-2 text-rose-600 border-rose-200 hover:bg-rose-50">
              <XCircle size={13} /> Clear Batch Data
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
