import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

// Mock dependencies BEFORE importing the module under test
vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

// Import mocked modules AFTER vi.mock calls
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { GET as GET_POSTS, POST as POST_POST } from '@/app/api/posts/route'
import { DELETE as DELETE_POST } from '@/app/api/posts/[postId]/route'

const mockAuth = auth as unknown as MockedFunction<() => Promise<Session | null>>

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

  it('returns first page with nextCursor when more than 10 posts exist', async () => {
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
        avatarUrl: 'https://example.com/avatar.jpg',
      },
      _count: {
        comments: 0,
      },
    }))

    vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts)

    const req = new NextRequest('http://localhost:3000/api/posts')
    const response = await GET_POSTS(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts).toHaveLength(10)
    expect(data.nextCursor).toBe('post-9')
  })

  it('returns null nextCursor when 10 or fewer posts', async () => {
    const mockPosts = Array.from({ length: 5 }, (_, i) => ({
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

    const req = new NextRequest('http://localhost:3000/api/posts')
    const response = await GET_POSTS(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts).toHaveLength(5)
    expect(data.nextCursor).toBeNull()
  })

  it('uses cursor when provided with skip 1', async () => {
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

    const req = new NextRequest('http://localhost:3000/api/posts?cursor=post-5')
    const response = await GET_POSTS(req)

    expect(response.status).toBe(200)
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: 'post-5' },
        skip: 1,
      })
    )
  })

  it('returns 200 with posts and nextCursor format', async () => {
    const mockPosts = [
      {
        id: 'post-1',
        content: 'Test post',
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
          avatarUrl: null,
        },
        _count: {
          comments: 3,
        },
      },
    ]

    vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts)

    const req = new NextRequest('http://localhost:3000/api/posts')
    const response = await GET_POSTS(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('posts')
    expect(data).toHaveProperty('nextCursor')
    expect(Array.isArray(data.posts)).toBe(true)
  })

  it('maps user.avatarUrl to user.image', async () => {
    const mockPosts = [
      {
        id: 'post-1',
        content: 'Test post',
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
        _count: {
          comments: 0,
        },
      },
    ]

    vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts)

    const req = new NextRequest('http://localhost:3000/api/posts')
    const response = await GET_POSTS(req)
    const data = await response.json()

    expect(data.posts[0].user.image).toBe('https://example.com/avatar.jpg')
    expect(data.posts[0].user.id).toBe('user1')
    expect(data.posts[0].user.name).toBe('User 1')
  })
})

describe('POST /api/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({ content: 'Test post' }),
    })

    const response = await POST_POST(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Not authenticated')
    expect(prisma.post.create).not.toHaveBeenCalled()
  })

  it('returns 400 for empty content', async () => {
    mockAuth.mockResolvedValue(makeSession('user1'))

    const req = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({ content: '' }),
    })

    const response = await POST_POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Content cannot be empty')
    expect(prisma.post.create).not.toHaveBeenCalled()
  })

  it('returns 400 for content over 500 chars', async () => {
    mockAuth.mockResolvedValue(makeSession('user1'))

    const longContent = 'a'.repeat(501)
    const req = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({ content: longContent }),
    })

    const response = await POST_POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Content must be 500 characters or less')
    expect(prisma.post.create).not.toHaveBeenCalled()
  })

  it('returns 201 with created post for valid authenticated request', async () => {
    const mockCreatedPost = {
      id: 'post-new',
      content: 'Valid post content',
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

    mockAuth.mockResolvedValue(makeSession('user1'))
    vi.mocked(prisma.post.create).mockResolvedValue(mockCreatedPost)

    const req = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({ content: 'Valid post content' }),
    })

    const response = await POST_POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.content).toBe('Valid post content')
    expect(data.id).toBe('post-new')
    expect(data.user.image).toBe('https://example.com/avatar.jpg')
    expect(prisma.post.create).toHaveBeenCalledWith({
      data: {
        content: 'Valid post content',
        type: 'text',
        mediaUrls: null,
        userId: 'user1',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    })
  })
})

describe('DELETE /api/posts/[postId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/posts/post-1', {
      method: 'DELETE',
    })

    const response = await DELETE_POST(req, { params: { postId: 'post-1' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Not authenticated')
    expect(prisma.post.findUnique).not.toHaveBeenCalled()
  })

  it('returns 403 when session user is not the post author', async () => {
    mockAuth.mockResolvedValue(makeSession('user-2'))
    vi.mocked(prisma.post.findUnique).mockResolvedValue({
      id: 'post-1',
      userId: 'user-1',
    } as never)

    const req = new NextRequest('http://localhost:3000/api/posts/post-1', {
      method: 'DELETE',
    })

    const response = await DELETE_POST(req, { params: { postId: 'post-1' } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden: You can only delete your own posts')
    expect(prisma.post.delete).not.toHaveBeenCalled()
  })

  it('returns 404 for missing post', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    vi.mocked(prisma.post.findUnique).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/posts/nonexistent', {
      method: 'DELETE',
    })

    const response = await DELETE_POST(req, { params: { postId: 'nonexistent' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Post not found')
    expect(prisma.post.delete).not.toHaveBeenCalled()
  })

  it('returns 204 on successful deletion', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    vi.mocked(prisma.post.findUnique).mockResolvedValue({
      id: 'post-1',
      userId: 'user-1',
    } as never)
    vi.mocked(prisma.post.delete).mockResolvedValue({} as never)

    const req = new NextRequest('http://localhost:3000/api/posts/post-1', {
      method: 'DELETE',
    })

    const response = await DELETE_POST(req, { params: { postId: 'post-1' } })

    expect(response.status).toBe(204)
    expect(prisma.post.findUnique).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      select: { id: true, userId: true },
    })
    expect(prisma.post.delete).toHaveBeenCalledWith({
      where: { id: 'post-1' },
    })
  })
})
