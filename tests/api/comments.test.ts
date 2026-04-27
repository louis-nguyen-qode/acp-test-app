import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import { NextRequest } from 'next/server'
import type { Session } from 'next-auth'

// Mock dependencies BEFORE importing the module under test
vi.mock('@/lib/prisma', () => ({
  prisma: {
    comment: {
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
import { GET as GET_COMMENTS, POST as POST_COMMENT } from '@/app/api/posts/[postId]/comments/route'
import { DELETE as DELETE_COMMENT } from '@/app/api/posts/[postId]/comments/[commentId]/route'

const mockAuth = auth as unknown as MockedFunction<() => Promise<Session | null>>

function makeSession(userId = 'user-1', email = 'user@example.com', name = 'User 1'): Session {
  return {
    user: { id: userId, email, name },
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
  }
}

describe('GET /api/posts/[postId]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with comments array', async () => {
    const mockComments = [
      {
        id: 'comment-1',
        content: 'First comment',
        postId: 'post-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        user: {
          id: 'user-1',
          name: 'Alice',
          avatarUrl: 'https://example.com/alice.jpg',
        },
      },
      {
        id: 'comment-2',
        content: 'Second comment',
        postId: 'post-1',
        userId: 'user-2',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        user: {
          id: 'user-2',
          name: 'Bob',
          avatarUrl: null,
        },
      },
    ]

    vi.mocked(prisma.comment.findMany).mockResolvedValue(mockComments)

    const req = new NextRequest('http://localhost:3000/api/posts/post-1/comments')
    const response = await GET_COMMENTS(req, { params: { postId: 'post-1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.comments).toHaveLength(2)
    expect(Array.isArray(data.comments)).toBe(true)
  })

  it('orders comments by createdAt ASC', async () => {
    vi.mocked(prisma.comment.findMany).mockResolvedValue([])

    const req = new NextRequest('http://localhost:3000/api/posts/post-1/comments')
    await GET_COMMENTS(req, { params: { postId: 'post-1' } })

    expect(prisma.comment.findMany).toHaveBeenCalledWith({
      where: { postId: 'post-1' },
      orderBy: { createdAt: 'asc' },
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

  it('maps avatarUrl to image in user', async () => {
    const mockComments = [
      {
        id: 'comment-1',
        content: 'Test comment',
        postId: 'post-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        user: {
          id: 'user-1',
          name: 'Alice',
          avatarUrl: 'https://example.com/alice.jpg',
        },
      },
    ]

    vi.mocked(prisma.comment.findMany).mockResolvedValue(mockComments)

    const req = new NextRequest('http://localhost:3000/api/posts/post-1/comments')
    const response = await GET_COMMENTS(req, { params: { postId: 'post-1' } })
    const data = await response.json()

    expect(data.comments[0].user.image).toBe('https://example.com/alice.jpg')
    expect(data.comments[0].user.id).toBe('user-1')
    expect(data.comments[0].user.name).toBe('Alice')
  })
})

describe('POST /api/posts/[postId]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/posts/post-1/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'Test comment' }),
    })

    const response = await POST_COMMENT(req, { params: { postId: 'post-1' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Not authenticated')
    expect(prisma.comment.create).not.toHaveBeenCalled()
  })

  it('returns 400 for empty content', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))

    const req = new NextRequest('http://localhost:3000/api/posts/post-1/comments', {
      method: 'POST',
      body: JSON.stringify({ content: '' }),
    })

    const response = await POST_COMMENT(req, { params: { postId: 'post-1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Content cannot be empty')
    expect(prisma.comment.create).not.toHaveBeenCalled()
  })

  it('returns 400 for content over 300 chars', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))

    const longContent = 'a'.repeat(301)
    const req = new NextRequest('http://localhost:3000/api/posts/post-1/comments', {
      method: 'POST',
      body: JSON.stringify({ content: longContent }),
    })

    const response = await POST_COMMENT(req, { params: { postId: 'post-1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Content must be 300 characters or less')
    expect(prisma.comment.create).not.toHaveBeenCalled()
  })

  it('returns 201 with created comment', async () => {
    const mockCreatedComment = {
      id: 'comment-new',
      content: 'Valid comment content',
      postId: 'post-1',
      userId: 'user-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      user: {
        id: 'user-1',
        name: 'Alice',
        avatarUrl: 'https://example.com/alice.jpg',
      },
    }

    mockAuth.mockResolvedValue(makeSession('user-1', 'alice@example.com', 'Alice'))
    vi.mocked(prisma.comment.create).mockResolvedValue(mockCreatedComment)

    const req = new NextRequest('http://localhost:3000/api/posts/post-1/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'Valid comment content' }),
    })

    const response = await POST_COMMENT(req, { params: { postId: 'post-1' } })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.content).toBe('Valid comment content')
    expect(data.id).toBe('comment-new')
    expect(data.user.image).toBe('https://example.com/alice.jpg')
    expect(prisma.comment.create).toHaveBeenCalledWith({
      data: {
        content: 'Valid comment content',
        postId: 'post-1',
        userId: 'user-1',
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

describe('DELETE /api/posts/[postId]/comments/[commentId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/posts/post-1/comments/comment-1', {
      method: 'DELETE',
    })

    const response = await DELETE_COMMENT(req, { params: { postId: 'post-1', commentId: 'comment-1' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Not authenticated')
    expect(prisma.comment.findUnique).not.toHaveBeenCalled()
  })

  it('returns 403 when user is NOT the comment author even if they are the post author', async () => {
    mockAuth.mockResolvedValue(makeSession('post-author-user'))
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'comment-1',
      content: 'Test comment',
      postId: 'post-1',
      userId: 'comment-author-user',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const req = new NextRequest('http://localhost:3000/api/posts/post-1/comments/comment-1', {
      method: 'DELETE',
    })

    const response = await DELETE_COMMENT(req, { params: { postId: 'post-1', commentId: 'comment-1' } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden: Only the comment author can delete this comment')
    expect(prisma.comment.delete).not.toHaveBeenCalled()
  })

  it('returns 404 for missing comment', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/posts/post-1/comments/nonexistent', {
      method: 'DELETE',
    })

    const response = await DELETE_COMMENT(req, { params: { postId: 'post-1', commentId: 'nonexistent' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Comment not found')
    expect(prisma.comment.delete).not.toHaveBeenCalled()
  })

  it('returns 204 on successful deletion by comment author', async () => {
    mockAuth.mockResolvedValue(makeSession('comment-author'))
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'comment-1',
      content: 'Test comment',
      postId: 'post-1',
      userId: 'comment-author',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(prisma.comment.delete).mockResolvedValue({} as never)

    const req = new NextRequest('http://localhost:3000/api/posts/post-1/comments/comment-1', {
      method: 'DELETE',
    })

    const response = await DELETE_COMMENT(req, { params: { postId: 'post-1', commentId: 'comment-1' } })

    expect(response.status).toBe(204)
    expect(prisma.comment.findUnique).toHaveBeenCalledWith({
      where: { id: 'comment-1' },
    })
    expect(prisma.comment.delete).toHaveBeenCalledWith({
      where: { id: 'comment-1' },
    })
  })
})
