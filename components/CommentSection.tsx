'use client'

import { useState, useEffect, useTransition } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

interface Comment {
  id: string
  content: string
  createdAt: string
  userId: string
  user: { id: string; name: string | null; image: string | null }
}

interface CommentSectionProps {
  postId: string
  currentUserId: string | null
}

export function CommentSection({
  postId,
  currentUserId,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)

  // Fetch comments on mount
  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/posts/${postId}/comments`)
      .then((res) => res.json())
      .then((data) => {
        setComments(data.comments || [])
      })
      .catch(() => {
        // Silent fail - comments will be empty
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [postId])

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedComment = newComment.trim()
    if (!trimmedComment || !currentUserId) return

    // Optimistic update
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: trimmedComment,
      createdAt: new Date().toISOString(),
      userId: currentUserId,
      user: {
        id: currentUserId,
        name: 'You',
        image: null,
      },
    }

    setComments((prev) => [...prev, optimisticComment])
    setNewComment('')

    startTransition(async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: trimmedComment }),
        })

        if (!response.ok) {
          throw new Error('Failed to add comment')
        }

        // Re-fetch to get the real comment with proper ID
        const refreshResponse = await fetch(`/api/posts/${postId}/comments`)
        const data = await refreshResponse.json()
        setComments(data.comments || [])
      } catch {
        // Revert optimistic update on error
        setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id))
      }
    })
  }

  const handleDeleteComment = (commentId: string) => {
    // Optimistic delete
    setComments((prev) => prev.filter((c) => c.id !== commentId))

    startTransition(async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete comment')
        }
      } catch {
        // Re-fetch on error to restore state
        const refreshResponse = await fetch(`/api/posts/${postId}/comments`)
        const data = await refreshResponse.json()
        setComments(data.comments || [])
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddComment(e)
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
    return `${Math.floor(diffInSeconds / 604800)}w`
  }

  const visibleComments = showAll ? comments : comments.slice(0, 3)
  const hasMoreComments = comments.length > 3

  if (isLoading) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500">Loading comments...</div>
    )
  }

  return (
    <div className="border-t border-gray-200 pt-3">
      {/* Toggle to show all comments */}
      {hasMoreComments && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-sm text-gray-600 hover:text-gray-800 mb-2 px-4"
        >
          View all {comments.length} comments
        </button>
      )}

      {/* Comments list */}
      <div className="space-y-3 px-4">
        {visibleComments.map((comment) => {
          const canDelete = currentUserId === comment.userId

          return (
            <div key={comment.id} className="flex gap-2">
              <Avatar
                src={comment.user.image}
                name={comment.user.name}
                size={32}
              />
              <div className="flex-1">
                <div className="bg-gray-100 rounded-2xl px-3 py-2 inline-block">
                  <div className="font-semibold text-sm text-gray-900">
                    {comment.user.name || 'Anonymous'}
                  </div>
                  <div className="text-sm text-gray-800">{comment.content}</div>
                </div>
                <div className="flex items-center gap-3 mt-1 px-3">
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs text-gray-500 hover:text-red-600"
                      disabled={isPending}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Show less button */}
      {hasMoreComments && showAll && (
        <button
          onClick={() => setShowAll(false)}
          className="text-sm text-gray-600 hover:text-gray-800 mt-2 px-4"
        >
          Show less
        </button>
      )}

      {/* Add comment input */}
      {currentUserId && (
        <form onSubmit={handleAddComment} className="mt-3 px-4">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              disabled={isPending}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!newComment.trim() || isPending}
              loading={isPending}
            >
              Send
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
