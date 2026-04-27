'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PostComposer } from '@/components/PostComposer'
import { PostCard, FeedPost } from '@/components/PostCard'

interface FeedProps {
  currentUserId: string | null
  currentUserAvatarUrl?: string | null
  currentUserName?: string | null
}

export function Feed({ currentUserId, currentUserAvatarUrl, currentUserName }: FeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Initial load
  useEffect(() => {
    const fetchInitialPosts = async () => {
      try {
        const response = await fetch('/api/posts')
        if (!response.ok) {
          throw new Error('Failed to fetch posts')
        }
        const data = await response.json()
        setPosts(data.posts || [])
        setHasMore((data.posts || []).length === 10)
      } catch {
        // Silent fail - show empty state
      } finally {
        setIsInitialLoad(false)
      }
    }

    fetchInitialPosts()
  }, [])

  // Handle new post created
  const handlePostCreated = async () => {
    try {
      // Refresh the feed by fetching the latest posts
      const response = await fetch('/api/posts')
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }
      const data = await response.json()
      setPosts(data.posts || [])
      setHasMore((data.posts || []).length === 10)
    } catch {
      // Silent fail - post was created, just didn't refresh
    }
  }

  // Handle post deleted
  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  // Load more posts
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const lastPost = posts[posts.length - 1]
      if (!lastPost) return

      const response = await fetch(`/api/posts?cursor=${lastPost.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }

      const data = await response.json()
      const morePosts = data.posts || []

      if (morePosts.length < 10) {
        setHasMore(false)
      }

      setPosts((prev) => [...prev, ...morePosts])
    } catch {
      // Silent fail
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, posts])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && hasMore && !isLoadingMore) {
          loadMorePosts()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    )

    const sentinel = sentinelRef.current
    if (sentinel) {
      observer.observe(sentinel)
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel)
      }
    }
  }, [hasMore, isLoadingMore, loadMorePosts])

  return (
    <div>
      {/* Post composer - only show for authenticated users */}
      {currentUserId && (
        <PostComposer
          onPostCreated={handlePostCreated}
          currentUserAvatarUrl={currentUserAvatarUrl}
          currentUserName={currentUserName}
        />
      )}

      {/* Posts list */}
      <div>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            onDelete={handlePostDeleted}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-4">
        {(isLoadingMore || isInitialLoad) && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}
        {!hasMore && posts.length > 0 && !isInitialLoad && (
          <div className="text-center text-gray-700 text-sm">
            No more posts
          </div>
        )}
        {posts.length === 0 && !isLoadingMore && !isInitialLoad && (
          <div className="text-center text-gray-700 py-8">
            No posts yet. Be the first to share something!
          </div>
        )}
      </div>
    </div>
  )
}
