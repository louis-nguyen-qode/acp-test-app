'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  onDismiss?: () => void
}

export function Toast({ message, type = 'success', onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDismiss) {
        onDismiss()
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [onDismiss])

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600'

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-3 rounded-md shadow-lg animate-slide-in`}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <span>{message}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 text-white hover:text-gray-200"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
