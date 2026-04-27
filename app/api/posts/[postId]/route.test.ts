import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import type { Session } from 'next-auth'

// Mock dependencies BEFORE importing the module under test
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { DELETE } from './route'

// Cast to simpler type to avoid NextAuth overload resolution issues
const mockAuth = auth as unknown as MockedFunction<() => Promise<Session | null>>
const mockFindUnique = vi.mocked(prisma.post.findUnique)
const mockDelete = vi.mocked(prisma.post.delete)

function makeRequest(postId: string) {
  return new NextRequest(`http://localhost/api/posts/${postId}`, {
    method: 'DELETE',
  })
}

function makeSession(userId = 'user-1'): Session {
  return {
    user: { id: userId, email: 'alice@example.com', name: 'Alice' },
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
  }
}

const mockPost = {
  id: 'post-1',
  userId: 'user-1',
}

describe('DELETE /api/posts/[postId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = makeRequest('post-1')
    const res = await DELETE(req, { params: { postId: 'post-1' } })
    expect(res.status).toBe(401)
    const data = await res.json() as { error: string }
    expect(data.error).toBe('Not authenticated')
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('returns 404 when post does not exist', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockFindUnique.mockResolvedValue(null)
    const req = makeRequest('nonexistent-post')
    const res = await DELETE(req, { params: { postId: 'nonexistent-post' } })
    expect(res.status).toBe(404)
    const data = await res.json() as { error: string }
    expect(data.error).toBe('Post not found')
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns 403 when user is not the post author', async () => {
    mockAuth.mockResolvedValue(makeSession('user-2'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFindUnique.mockResolvedValue(mockPost as any)
    const req = makeRequest('post-1')
    const res = await DELETE(req, { params: { postId: 'post-1' } })
    expect(res.status).toBe(403)
    const data = await res.json() as { error: string }
    expect(data.error).toBe('Forbidden: You can only delete your own posts')
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('deletes post and returns 204 when user is the author', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFindUnique.mockResolvedValue(mockPost as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockDelete.mockResolvedValue(mockPost as any)
    const req = makeRequest('post-1')
    const res = await DELETE(req, { params: { postId: 'post-1' } })
    expect(res.status).toBe(204)
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      select: { id: true, userId: true },
    })
    expect(mockDelete).toHaveBeenCalledWith({
      where: { id: 'post-1' },
    })
  })

  it('returns 500 on unexpected error', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockFindUnique.mockRejectedValue(new Error('Database error'))
    const req = makeRequest('post-1')
    const res = await DELETE(req, { params: { postId: 'post-1' } })
    expect(res.status).toBe(500)
    const data = await res.json() as { error: string }
    expect(data.error).toBe('Database error')
  })
})
