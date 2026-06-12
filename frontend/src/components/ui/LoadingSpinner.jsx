import React from 'react'

export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }

  const spinner = (
    <div className={`${sizes[size]} border-4 border-gray-200 dark:border-gray-700 border-t-primary-600 rounded-full animate-spin`} />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center space-y-3">
          {spinner}
          <p className="text-sm text-gray-500 animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  return <div className="flex justify-center p-8">{spinner}</div>
}
