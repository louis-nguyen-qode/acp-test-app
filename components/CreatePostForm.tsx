'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'

export interface FeedPost {
  id: string
  content: string | null
  createdAt: string
  userId: string
  user: { id: string; name: string | null; image: string | null }
  _count: { comments: number }
  mediaUrls?: string[]
  mediaUrl?: string | null
  type?: string
}

interface CreatePostFormProps {
  isAuthenticated: boolean
  onPostCreated: (post: FeedPost) => void
}

export function CreatePostForm({ isAuthenticated, onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxLength = 500
  const remainingChars = maxLength - content.length

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate content is not empty
    if (!content.trim()) {
      setError('Please enter some content')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create post')
      }

      const post = await response.json()

      // Reset form
      setContent('')

      // Call parent callback with the new post
      onPostCreated(post)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <p className="text-gray-700 text-center">
          <Link href="/signin" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </Link>
          {' '}to share your thoughts
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] text-gray-900 placeholder:text-gray-400 resize-none"
          disabled={isSubmitting}
          maxLength={maxLength}
        />

        {/* Character count */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-500">
            {remainingChars} / {maxLength}
          </span>

          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-600 text-sm mt-2" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
