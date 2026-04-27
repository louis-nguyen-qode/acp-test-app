'use client'

import { useState, useEffect, useTransition } from 'react'
import { deletePost, toggleLike, createComment } from './actions'

/** Renders a date in the user's local timezone — deferred to client to avoid SSR/hydration timezone mismatch. */
function FormattedDate({ date }: { date: Date }) {
  const [formatted, setFormatted] = useState<string | null>(null)

  useEffect(() => {
    setFormatted(
      new Date(date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    )
  }, [date])

  return (
    <time dateTime={new Date(date).toISOString()} suppressHydrationWarning>
      {formatted}
    </time>
  )
}

type CommentData = {
  id: string
  content: string
  createdAt: Date
  user: { id: string; name: string | null; email: string }
}

type PostData = {
  id: string
  content: string | null
  type: string
  mediaUrl: string | null
  createdAt: Date
  userId: string
  user: { id: string; name: string | null; email: string; avatarUrl: string | null }
  comments: CommentData[]
  likes: { userId: string }[]
  _count: { likes: number; comments: number }
}

type Props = {
  posts: PostData[]
  currentUserId: string
}

export function Timeline({ posts, currentUserId }: Props) {
  if (posts.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12">
        No posts yet. Be the first to share something!
      </p>
    )
  }

  return (
    <ul className="space-y-4" aria-label="Timeline">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
        />
      ))}
    </ul>
  )
}

function PostCard({ post, currentUserId }: { post: PostData; currentUserId: string }) {
  const [isPending, startTransition] = useTransition()
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  const isOwner = post.userId === currentUserId
  const isLiked = post.likes.some((l) => l.userId === currentUserId)
  const authorName = post.user.name ?? post.user.email

  function handleDelete() {
    startTransition(async () => {
      await deletePost(post.id)
    })
  }

  function handleLike() {
    startTransition(async () => {
      await toggleLike(post.id)
    })
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentError(null)
    startTransition(async () => {
      const result = await createComment(post.id, { content: commentText })
      if (result.success) {
        setCommentText('')
      } else {
        setCommentError(result.error)
      }
    })
  }

  return (
    <li className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Post header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{authorName}</p>
            <p className="text-xs text-gray-400">
              <FormattedDate date={post.createdAt} />
            </p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            aria-label="Delete post"
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
          >
            Delete
          </button>
        )}
      </div>

      {/* Post content */}
      <div className="px-4 py-2">
        {post.content && (
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
        )}
        {post.mediaUrl && post.type === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.mediaUrl}
            alt="Post media"
            className="mt-2 rounded-md max-h-96 w-full object-cover"
          />
        )}
      </div>

      {/* Like / Comment counts */}
      {/* text-gray-500 min for WCAG AA on white */}
      <div className="px-4 py-1 text-xs text-gray-500 flex gap-3 border-t border-gray-100">
        <span>{post._count.likes} {post._count.likes === 1 ? 'like' : 'likes'}</span>
        <button
          onClick={() => setShowComments((s) => !s)}
          className="hover:text-gray-600"
        >
          {post._count.comments} {post._count.comments === 1 ? 'comment' : 'comments'}
        </button>
      </div>

      {/* Actions */}
      <div className="px-4 py-2 flex gap-4 border-t border-gray-100">
        <button
          onClick={handleLike}
          disabled={isPending}
          className={`text-sm font-medium flex-1 py-1 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40 ${
            isLiked ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          {isLiked ? '👍 Liked' : '👍 Like'}
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className="text-sm font-medium flex-1 py-1 rounded text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          💬 Comment
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-2">
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0">
                {(c.user.name ?? c.user.email).charAt(0).toUpperCase()}
              </div>
              <div className="bg-gray-50 rounded-2xl px-3 py-1.5 text-sm flex-1">
                <span className="font-semibold text-gray-800 mr-1">
                  {c.user.name ?? c.user.email}
                </span>
                <span className="text-gray-700">{c.content}</span>
              </div>
            </div>
          ))}

          <form onSubmit={handleComment} className="flex gap-2 mt-2" aria-label="Add comment">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              disabled={isPending}
              className="flex-1 rounded-full border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <button
              type="submit"
              disabled={isPending || !commentText.trim()}
              className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
          {commentError && (
            <p className="text-xs text-red-600">{commentError}</p>
          )}
        </div>
      )}
    </li>
  )
}
