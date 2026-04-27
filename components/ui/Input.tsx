import * as React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({
  label,
  error,
  id,
  className = '',
  ...props
}: InputProps) {
  // Generate a stable id from the label if not provided
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={[
          'w-full rounded-md border px-3 py-2 text-sm shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-300',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
