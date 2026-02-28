import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
})

export const trainModel      = ()        => api.post('/train')
export const predictStudent  = (data)    => api.post('/predict', data)
export const getDashboard    = ()        => api.get('/dashboard')
export const getPredictions  = (params)  => api.get('/predictions', { params })
export const getDatasetInfo  = ()        => api.get('/dataset/info')
export const getHealth       = ()        => api.get('/health')

// ── SaaS endpoints ──────────────────────────────────────────────────────────
export const batchUpload        = (formData) => api.post('/batch-upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getBatchProgress   = (batchId)  => api.get(`/batch/${batchId}/progress`)
export const getStudentProgress = (id)       => api.get(`/student/${id}/progress`)
export const getAlerts          = (params)   => api.get('/alerts', { params })
export const getRankings        = ()         => api.get('/rankings')
export const exportPredictions  = ()         => api.get('/export', { responseType: 'blob' })
export const getModelInsights   = ()         => api.get('/model/insights')
export const deletePrediction   = (id)       => api.delete(`/predictions/${id}`)
export const getTrainingHistory = ()         => api.get('/training-history')

// ── Demo management ─────────────────────────────────────────────────────────
export const resetDemoData     = ()        => api.post('/demo/reset')

// ── IEEE Clustering endpoint ─────────────────────────────────────────────────
export const getStudentClusters = (refresh = false) =>
  api.get('/student-clusters', { params: refresh ? { refresh: true } : {} })

export default api
