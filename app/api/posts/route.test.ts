import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

// Mock dependencies BEFORE importing the module under test
vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

// Import mocked modules AFTER vi.mock calls
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { GET, POST } from './route'

// Cast to simpler type to avoid NextAuth overload resolution issues
const mockAuth = auth as unknown as MockedFunction<() => Promise<Session | null>>

// Helper to create a valid session
function makeSession(userId = 'user-1', email = 'user@example.com', name = 'User 1'): Session {
  return {
    user: { id: userId, email, name },
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
  }
}

describe('GET /api/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return posts with default limit of 10', async () => {
    const mockPosts = [
      {
        id: '1',
        content: 'Post 1',
        type: 'text',
        mediaUrl: null,
        mediaUrls: null,
        deletedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        userId: 'user1',
        user: {
          id: 'user1',
          name: 'User 1',
          avatarUrl: 'https://example.com/avatar1.jpg',
        },
        _count: {
          comments: 5,
        },
      },
    ]

    vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts)

    const req = new NextRequest('http://localhost:3000/api/posts')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts).toHaveLength(1)
    expect(data.nextCursor).toBeNull()
    expect(data.posts[0]?.user.image).toBe('https://example.com/avatar1.jpg')
    expect(data.posts[0]?.mediaUrls).toEqual([])
  })

  it('should handle cursor pagination', async () => {
    const mockPosts = Array.from({ length: 11 }, (_, i) => ({
      id: `post-${i}`,
      content: `Post ${i}`,
      type: 'text',
      mediaUrl: null,
      mediaUrls: null,
      deletedAt: null,
      createdAt: new Date(`2024-01-${i + 1}`),
      updatedAt: new Date(`2024-01-${i + 1}`),
      userId: 'user1',
      user: {
        id: 'user1',
        name: 'User 1',
        avatarUrl: null,
      },
      _count: {
        comments: 0,
      },
    }))

    vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts)

    const req = new NextRequest('http://localhost:3000/api/posts?cursor=post-0&limit=10')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts).toHaveLength(10)
    expect(data.nextCursor).toBe('post-9')
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: 'post-0' },
        skip: 1,
        take: 11,
      })
    )
  })

  it('should parse mediaUrls JSON field', async () => {
    const mockPosts = [
      {
        id: '1',
        content: 'Post with media',
        type: 'image',
        mediaUrl: null,
        mediaUrls: JSON.stringify(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']),
        deletedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        userId: 'user1',
        user: {
          id: 'user1',
          name: 'User 1',
          avatarUrl: null,
        },
        _count: {
          comments: 0,
        },
      },
    ]

    vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts)

    const req = new NextRequest('http://localhost:3000/api/posts')
    const response = await GET(req)
    const data = await response.json()

    expect(data.posts[0]?.mediaUrls).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg'])
  })

  it('should return 400 for invalid limit', async () => {
    const req = new NextRequest('http://localhost:3000/api/posts?limit=-5')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid limit parameter')
  })

  it('should handle errors gracefully', async () => {
    vi.mocked(prisma.post.findMany).mockRejectedValue(new Error('Database error'))

    const req = new NextRequest('http://localhost:3000/api/posts')
    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database error')
  })
})

describe('POST /api/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a post when authenticated', async () => {
    const mockCreatedPost = {
      id: 'post1',
      content: 'New post content',
      type: 'text',
      mediaUrl: null,
      mediaUrls: null,
      deletedAt: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      userId: 'user1',
      user: {
        id: 'user1',
        name: 'User 1',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
    }

    mockAuth.mockResolvedValue(makeSession('user1', 'user@example.com', 'User 1'))
    vi.mocked(prisma.post.create).mockResolvedValue(mockCreatedPost)

    const req = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({ content: 'New post content' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.content).toBe('New post content')
    expect(data.user.image).toBe('https://example.com/avatar.jpg')
    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          content: 'New post content',
          type: 'text',
          mediaUrls: null,
          userId: 'user1',
        },
      })
    )
  })

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({ content: 'New post' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Not authenticated')
  })

  it('should return 400 for empty content', async () => {
    mockAuth.mockResolvedValue(makeSession('user1'))

    const req = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({ content: '' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Content cannot be empty')
  })

  it('should return 400 for content exceeding 500 characters', async () => {
    mockAuth.mockResolvedValue(makeSession('user1'))

    const longContent = 'a'.repeat(501)
    const req = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({ content: longContent }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Content must be 500 characters or less')
  })

  it('should handle errors gracefully', async () => {
    mockAuth.mockResolvedValue(makeSession('user1'))
    vi.mocked(prisma.post.create).mockRejectedValue(new Error('Database error'))

    const req = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({ content: 'Test post' }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database error')
  })
})
