import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

export const trainModel    = ()       => api.post('/train')
export const predictStudent = (data)  => api.post('/predict', data)
export const getDashboard  = ()       => api.get('/dashboard')
export const getPredictions = (params)=> api.get('/predictions', { params })
export const getDatasetInfo = ()      => api.get('/dataset/info')
export const getHealth      = ()      => api.get('/health')

export default api
