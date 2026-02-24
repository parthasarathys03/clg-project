import React, { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { exportPredictions } from '../api'
import { useToast } from './Toast'

export default function ExportButton({ className = '' }) {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await exportPredictions()
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      const now  = new Date().toISOString().slice(0, 10)
      link.href     = url
      link.download = `predictions_export_${now}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast('Predictions exported successfully!', 'success')
    } catch (e) {
      toast('Export failed. Please try again.', 'error')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`btn-secondary flex items-center gap-2 text-xs ${className}`}
    >
      {loading
        ? <Loader2 size={13} className="animate-spin" />
        : <Download size={13} />
      }
      {loading ? 'Exporting…' : 'Export CSV'}
    </button>
  )
}
