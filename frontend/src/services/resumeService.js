import api from './api'

export const uploadResume = async (file, onProgress) => {
  const formData = new FormData()
  formData.append('resume', file)
  const { data } = await api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  })
  return data
}

export const getResumes = async () => {
  const { data } = await api.get('/resume')
  return data
}

export const getResume = async (id) => {
  const { data } = await api.get(`/resume/${id}`)
  return data
}

export const deleteResume = async (id) => {
  const { data } = await api.delete(`/resume/${id}`)
  return data
}

export const uploadJD = async (jdData) => {
  const { data } = await api.post('/jd', jdData)
  return data
}

export const getJDs = async () => {
  const { data } = await api.get('/jd')
  return data
}

export const deleteJD = async (id) => {
  const { data } = await api.delete(`/jd/${id}`)
  return data
}

export const analyzeResume = async (resumeId, jdId) => {
  const { data } = await api.post('/analyze', { resumeId, jdId })
  return data
}

export const getReport = async (id) => {
  const { data } = await api.get(`/analyze/report/${id}`)
  return data
}

export const getReports = async (page = 1, limit = 10) => {
  const { data } = await api.get(`/analyze/reports?page=${page}&limit=${limit}`)
  return data
}

export const getDashboardStats = async () => {
  const { data } = await api.get('/dashboard/stats')
  return data
}

export const getAdminStats = async () => {
  const { data } = await api.get('/dashboard/admin')
  return data
}
