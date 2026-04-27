'use client'

import { useState } from 'react'

type FormData = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export function ChangePasswordForm() {
  const [formData, setFormData] = useState<FormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [clientError, setClientError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setClientError('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      setClientError('New passwords do not match')
      return
    }

    setStatus('loading')
    setErrorMessage('')
    setClientError('')

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = (await res.json()) as { message?: string; error?: string }

      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data.error ?? 'An error occurred. Please try again.')
      } else {
        setStatus('success')
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch {
      setStatus('error')
      setErrorMessage('An unexpected error occurred. Please try again.')
    }
  }

  return (
    <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-6">
      <form onSubmit={handleSubmit} className="space-y-4" aria-label="Change password form">
        {status === 'success' && (
          <div
            role="alert"
            className="rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200"
          >
            Password updated successfully.
          </div>
        )}

        {status === 'error' && (
          <div
            role="alert"
            className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200"
          >
            {errorMessage}
          </div>
        )}

        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Current password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleChange}
            required
            autoComplete="current-password"
            disabled={status === 'loading'}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="Your current password"
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            New password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
            disabled={status === 'loading'}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
            disabled={status === 'loading'}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="Repeat your new password"
          />
          {clientError && <p className="mt-1 text-xs text-red-600">{clientError}</p>}
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
              Updating…
            </>
          ) : (
            'Update password'
          )}
        </button>
      </form>
    </div>
  )
}
