'use client'

export default function ChangePasswordError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-8 max-w-md w-full text-center space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
        <p className="text-sm text-gray-600">{error.message ?? 'An unexpected error occurred.'}</p>
        <button
          onClick={reset}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
