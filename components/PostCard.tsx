'use client'

import { useState, useTransition } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { CommentSection } from '@/components/CommentSection'
import { ClientFormattedDate } from '@/components/ClientFormattedDate'
import { updatePost, deletePost, PostWithRelations } from '@/actions/posts'

interface PostCardProps {
  post: PostWithRelations
  currentUserId?: string
  onDeleted?: () => void
}

export function PostCard({ post, currentUserId, onDeleted }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content || '')
  const [isPending, startTransition] = useTransition()

  const isOwner = currentUserId === post.userId

  // Combine mediaUrl (legacy single) with mediaUrls array
  const allMediaUrls = post.mediaUrl
    ? [post.mediaUrl, ...post.mediaUrls]
    : post.mediaUrls

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return
    }

    startTransition(async () => {
      try {
        await deletePost(post.id)
        onDeleted?.()
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete post')
      }
    })
  }

  const handleSaveEdit = () => {
    startTransition(async () => {
      try {
        await updatePost(post.id, {
          content: editContent,
          mediaUrls: allMediaUrls,
        })
        setIsEditing(false)
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to update post')
      }
    })
  }

  const renderMediaGrid = () => {
    if (allMediaUrls.length === 0) return null

    if (allMediaUrls.length === 1) {
      return (
        <div className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={allMediaUrls[0]}
            alt="Post media"
            className="w-full max-h-96 object-cover rounded-md"
          />
        </div>
      )
    }

    return (
      <div className="mt-3 grid grid-cols-2 gap-1">
        {allMediaUrls.slice(0, 4).map((url, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={index}
            src={url}
            alt={`Post media ${index + 1}`}
            className="aspect-square object-cover rounded-md"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md mb-4">
      {/* Post header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            {/* Avatar source: post.user.avatarUrl (canonical User.avatarUrl field from DB) */}
            <Avatar
              src={post.user.avatarUrl}
              name={post.user.name}
              size={40}
            />
            <div>
              <div className="font-semibold text-gray-900">
                {post.user.name || post.user.email}
              </div>
              <div className="text-sm text-gray-500">
                <ClientFormattedDate dateString={post.createdAt.toISOString()} />
              </div>
            </div>
          </div>

          {/* Overflow menu for post owner */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-500 hover:text-gray-700 text-xl px-2"
              >
                ⋯
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setShowMenu(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      handleDelete()
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post content */}
        {isEditing ? (
          <div className="mt-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              disabled={isPending}
            />
            <div className="flex gap-2 mt-2">
              <Button
                onClick={handleSaveEdit}
                variant="primary"
                size="sm"
                loading={isPending}
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false)
                  setEditContent(post.content || '')
                }}
                variant="secondary"
                size="sm"
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {post.content && (
              <div className="mt-3 text-gray-900 whitespace-pre-wrap">
                {post.content}
              </div>
            )}

            {/* Media grid */}
            {renderMediaGrid()}
          </>
        )}
      </div>

      {/* Action bar */}
      <div className="border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around text-sm">
          <button
            className="flex items-center gap-1 text-gray-600 hover:text-blue-600 px-3 py-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            <span>👍</span>
            <span>{post._count.likes > 0 ? post._count.likes : 'Like'}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-gray-600 hover:text-blue-600 px-3 py-1 rounded-md hover:bg-gray-100"
          >
            <span>💬</span>
            <span>{post._count.comments > 0 ? post._count.comments : 'Comment'}</span>
          </button>

          <button
            className="flex items-center gap-1 text-gray-600 hover:text-blue-600 px-3 py-1 rounded-md hover:bg-gray-100"
            disabled
          >
            <span>🔁</span>
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Comment section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          postAuthorId={post.userId}
          initialComments={[]}
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}
