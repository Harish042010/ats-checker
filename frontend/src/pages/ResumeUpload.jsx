import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadResume, getResumes } from '../services/resumeService'
import { useUpload } from '../hooks/useUpload'
import toast from 'react-hot-toast'
import { HiUpload, HiDocumentText, HiTrash, HiCheck, HiX } from 'react-icons/hi'
import { motion, AnimatePresence } from 'framer-motion'

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_SIZE = 10 * 1024 * 1024

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getFileType(file) {
  if (file.type === 'application/pdf' || file.name?.endsWith('.pdf')) return 'PDF'
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name?.endsWith('.docx')) return 'DOCX'
  return 'FILE'
}

export default function ResumeUpload() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const { progress, startUpload } = useUpload()

  React.useEffect(() => {
    loadResumes()
  }, [])

  async function loadResumes() {
    setLoading(true)
    try {
      const data = await getResumes()
      setResumes(data)
    } catch (err) {
      toast.error('Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  function validateFile(f) {
    if (!ALLOWED_TYPES.includes(f.type) && !f.name.match(/\.(pdf|docx)$/i)) {
      toast.error('Only PDF and DOCX files are allowed')
      return false
    }
    if (f.size > MAX_SIZE) {
      toast.error('File size must be under 10 MB')
      return false
    }
    return true
  }

  function handleFileDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && validateFile(f)) setFile(f)
  }

  function handleFileSelect(e) {
    const f = e.target.files[0]
    if (f && validateFile(f)) setFile(f)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setDragOver(false)
  }

  function removeFile() {
    setFile(null)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    try {
      const result = await startUpload(() => uploadResume(file))
      toast.success('Resume uploaded successfully')
      setFile(null)
      await loadResumes()
      if (result?.id) navigate(`/resume/${result.id}`)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    setConfirmDeleteId(null)
    try {
      const { deleteResume } = await import('../services/resumeService')
      await deleteResume(id)
      toast.success('Resume deleted')
      await loadResumes()
    } catch (err) {
      toast.error('Failed to delete resume')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Upload Resume
        </h1>

        <div className="card p-6 md:p-8 mb-8">
          <div
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-colors cursor-pointer ${
              dragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-800/50'
            }`}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileSelect}
            />
            <HiUpload className="mx-auto text-4xl text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">
              Drag & drop your resume here
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              or click to browse &mdash; PDF or DOCX up to 10 MB
            </p>
          </div>

          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6"
              >
                <div className="card bg-white dark:bg-gray-800 p-4 flex items-center gap-4">
                  <HiDocumentText className="text-3xl text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatSize(file.size)} &middot; {getFileType(file)}
                    </p>
                    {uploading && (
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          className="bg-blue-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={removeFile}
                    disabled={uploading}
                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <HiX className="text-xl" />
                  </button>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-primary mt-4 w-full flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Uploading {progress}%
                    </>
                  ) : (
                    <>
                      <HiUpload className="text-lg" />
                      Upload Resume
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Previously Uploaded
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No resumes uploaded yet
            </p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {resumes.map((r) => (
                  <motion.div
                    key={r.id || r._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="card bg-white dark:bg-gray-800 p-4 flex items-center gap-4"
                  >
                    <HiDocumentText className="text-3xl text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {r.filename || r.fileName || r.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {(r.fileType || getFileType({ name: r.filename || r.fileName || r.name, type: r.mimeType || '' })).toUpperCase()}
                        </span>
                        <span>{formatSize(r.size || r.fileSize || 0)}</span>
                        <span>&middot;</span>
                        <span>{formatDate(r.createdAt || r.uploadDate || r.date)}</span>
                      </div>
                    </div>

                    {confirmDeleteId === (r.id || r._id) ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(r.id || r._id)}
                          disabled={deletingId === (r.id || r._id)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <HiCheck className="text-lg" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <HiX className="text-lg" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(r.id || r._id)}
                        disabled={deletingId === (r.id || r._id)}
                        className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === (r.id || r._id) ? (
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                        ) : (
                          <HiTrash className="text-lg" />
                        )}
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
