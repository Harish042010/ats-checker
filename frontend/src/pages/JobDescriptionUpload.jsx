import React, { useState } from 'react'
import { uploadJD, getJDs, deleteJD, analyzeResume } from '../services/resumeService'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { HiDocumentText, HiTrash, HiClipboardList, HiSparkles } from 'react-icons/hi'
import { motion } from 'framer-motion'

const JobDescriptionUpload = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: ''
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [jds, setJds] = useState([])
  const [showAnalyze, setShowAnalyze] = useState(null)
  const [selectedResume, setSelectedResume] = useState('')
  const [resumes, setResumes] = useState([])
  const [analyzing, setAnalyzing] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const loadJDs = async () => {
    setFetching(true)
    try {
      const data = await getJDs()
      setJds(data || [])
    } catch {
      toast.error('Failed to load job descriptions')
    } finally {
      setFetching(false)
    }
  }

  useState(() => {
    loadJDs()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required'
    } else if (formData.description.trim().length < 50) {
      newErrors.description = 'Job description must be at least 50 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const result = await uploadJD({
        title: formData.title.trim(),
        company: formData.company.trim(),
        description: formData.description.trim()
      })
      toast.success('Job description uploaded successfully')
      setFormData({ title: '', company: '', description: '' })
      loadJDs()
      const userResumes = result?.resumes || []
      setResumes(userResumes)
      if (userResumes.length > 0) {
        setShowAnalyze(result.jd?._id || result.jd?.id)
        setSelectedResume('')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to upload job description')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job description?')) return
    setDeleting(id)
    try {
      await deleteJD(id)
      toast.success('Job description deleted')
      setJds((prev) => prev.filter((jd) => (jd._id || jd.id) !== id))
      if (showAnalyze === id) {
        setShowAnalyze(null)
        setSelectedResume('')
      }
    } catch {
      toast.error('Failed to delete job description')
    } finally {
      setDeleting(null)
    }
  }

  const handleAnalyze = async (jdId) => {
    if (!selectedResume) {
      toast.error('Please select a resume')
      return
    }
    setAnalyzing(true)
    try {
      const report = await analyzeResume(selectedResume, jdId)
      toast.success('Analysis complete')
      navigate(`/analysis/${report._id || report.id}`)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const getCharCount = () => formData.description.length

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getPreview = (desc) => {
    if (!desc) return ''
    return desc.length > 100 ? desc.substring(0, 100) + '...' : desc
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="section-title text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <HiDocumentText className="text-blue-600 dark:text-blue-400" />
            Job Description
          </h1>
          <p className="section-subtitle text-gray-600 dark:text-gray-400 mt-1">
            Upload a job description to analyze against your resumes
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="card bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Senior Frontend Developer"
                className={`input-field w-full px-4 py-2.5 rounded-lg border ${
                  errors.title
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g. Tech Corp Inc."
                className="input-field w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={8}
                value={formData.description}
                onChange={handleChange}
                placeholder="Paste the full job description here (minimum 50 characters)..."
                className={`input-field w-full px-4 py-2.5 rounded-lg border resize-vertical ${
                  errors.description
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description ? (
                  <p className="text-sm text-red-500">{errors.description}</p>
                ) : (
                  <span />
                )}
                <span
                  className={`text-xs ${
                    getCharCount() < 50
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-green-500 dark:text-green-400'
                  }`}
                >
                  {getCharCount()} / 50 min
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <HiDocumentText className="h-5 w-5" />
              )}
              {loading ? 'Uploading...' : 'Upload Job Description'}
            </button>
          </form>
        </motion.div>

        {showAnalyze && resumes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="card bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center gap-2 mb-4">
              <HiSparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Analyze with a Resume
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 w-full">
                <label
                  htmlFor="resume-select"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Select Resume
                </label>
                <select
                  id="resume-select"
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="">-- Choose a resume --</option>
                  {resumes.map((r) => (
                    <option key={r._id || r.id} value={r._id || r.id}>
                      {r.name || r.fileName || 'Untitled'}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => handleAnalyze(showAnalyze)}
                disabled={analyzing}
                className="btn-primary w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <HiSparkles className="h-5 w-5" />
                )}
                {analyzing ? 'Analyzing...' : 'Analyze Now'}
              </button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <HiClipboardList className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            <h2 className="section-title text-xl font-bold text-gray-900 dark:text-white">
              Previously Uploaded
            </h2>
            {!fetching && (
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                ({jds.length})
              </span>
            )}
          </div>

          {fetching ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          ) : jds.length === 0 ? (
            <div className="card bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center border border-gray-200 dark:border-gray-700">
              <HiDocumentText className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No job descriptions uploaded yet
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {jds.map((jd) => {
                const id = jd._id || jd.id
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {jd.title}
                        </h3>
                        {jd.company && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {jd.company}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(id)}
                        disabled={deleting === id}
                        className="ml-3 p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deleting === id ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                        ) : (
                          <HiTrash className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {getPreview(jd.description)}
                    </p>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(jd.createdAt || jd.date)}
                      </span>
                      <button
                        onClick={() => {
                          setShowAnalyze(showAnalyze === id ? null : id)
                          setSelectedResume('')
                          if (jd.resumes?.length) {
                            setResumes(jd.resumes)
                          }
                        }}
                        className="btn-secondary text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <HiSparkles className="h-3.5 w-3.5" />
                        Analyze
                      </button>
                    </div>
                    {showAnalyze === id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                      >
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select a resume to analyze against this JD
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={selectedResume}
                            onChange={(e) => setSelectedResume(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                          >
                            <option value="">Choose resume</option>
                            {(resumes.length > 0 ? resumes : jd.resumes || []).map((r) => (
                              <option key={r._id || r.id} value={r._id || r.id}>
                                {r.name || r.fileName || 'Untitled'}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAnalyze(id)}
                            disabled={analyzing}
                            className="btn-primary px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                          >
                            {analyzing ? '...' : 'Go'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default JobDescriptionUpload
