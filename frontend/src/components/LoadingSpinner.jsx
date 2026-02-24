import React from 'react'

export default function LoadingSpinner({ message = 'Loading…', size = 'md' }) {
  const sz = size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className={`${sz} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}
