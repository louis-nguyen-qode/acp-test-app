'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PostComposer } from '@/components/PostComposer'
import { PostCard } from '@/components/PostCard'
import { getPosts, PostWithRelations } from '@/actions/posts'

interface FeedProps {
  initialPosts: PostWithRelations[]
  currentUserId: string
  currentUserAvatarUrl: string | null
  currentUserName: string | null
}

export function Feed({ initialPosts, currentUserId, currentUserAvatarUrl, currentUserName }: FeedProps) {
  const [posts, setPosts] = useState<PostWithRelations[]>(initialPosts)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length === 10)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Handle new post created
  const handlePostCreated = async () => {
    try {
      // Refresh the feed by fetching the latest posts
      const freshPosts = await getPosts()
      setPosts(freshPosts)
      setHasMore(freshPosts.length === 10)
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

      const morePosts = await getPosts(lastPost.id)

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
      {/* Post composer */}
      <PostComposer
        onPostCreated={handlePostCreated}
        currentUserAvatarUrl={currentUserAvatarUrl}
        currentUserName={currentUserName}
      />

      {/* Posts list */}
      <div>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            onDeleted={() => handlePostDeleted(post.id)}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-4">
        {isLoadingMore && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <div className="text-center text-gray-500 text-sm">
            No more posts
          </div>
        )}
        {posts.length === 0 && !isLoadingMore && (
          <div className="text-center text-gray-500 py-8">
            No posts yet. Be the first to share something!
          </div>
        )}
      </div>
    </div>
  )
}
