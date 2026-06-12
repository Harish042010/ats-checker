import { useState } from 'react'

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const reset = () => {
    setUploading(false)
    setProgress(0)
    setError(null)
  }

  return { uploading, setUploading, progress, setProgress, error, setError, reset }
}
