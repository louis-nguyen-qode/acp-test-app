import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import type { Session } from 'next-auth'

// Mock dependencies BEFORE importing the module under test
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    comment: {
      create: vi.fn(),
    },
    like: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createPost, deletePost, updatePost, createComment, toggleLike } from './actions'

const mockAuth = auth as unknown as MockedFunction<() => Promise<Session | null>>
const mockPostCreate = vi.mocked(prisma.post.create)
const mockPostFindUnique = vi.mocked(prisma.post.findUnique)
const mockPostDelete = vi.mocked(prisma.post.delete)
const mockPostUpdate = vi.mocked(prisma.post.update)
const mockCommentCreate = vi.mocked(prisma.comment.create)
const mockLikeFindUnique = vi.mocked(prisma.like.findUnique)
const mockLikeCreate = vi.mocked(prisma.like.create)
const mockLikeDelete = vi.mocked(prisma.like.delete)
const mockRevalidatePath = vi.mocked(revalidatePath)

function makeSession(userId = 'user-1'): Session {
  return {
    user: { id: userId, email: 'alice@example.com', name: 'Alice' },
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
  }
}

function makePost(overrides: Partial<{ id: string; userId: string }> = {}) {
  return {
    id: 'post-1',
    content: 'Hello world',
    type: 'text',
    mediaUrl: null,
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('createPost', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await createPost({ content: 'Hello' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Not authenticated')
    expect(mockPostCreate).not.toHaveBeenCalled()
  })

  it('returns error for empty content', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const result = await createPost({ content: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('required')
  })

  it('returns error when content is too long', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const result = await createPost({ content: 'x'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('creates post successfully', async () => {
    mockAuth.mockResolvedValue(makeSession())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPostCreate.mockResolvedValue(makePost() as any)
    const result = await createPost({ content: 'Hello world', type: 'text' })
    expect(result.success).toBe(true)
    expect(mockPostCreate).toHaveBeenCalledWith({
      data: { content: 'Hello world', type: 'text', mediaUrl: null, userId: 'user-1' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
  })
})

describe('deletePost', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await deletePost('post-1')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Not authenticated')
  })

  it('returns error when post not found', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockPostFindUnique.mockResolvedValue(null)
    const result = await deletePost('post-1')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Post not found')
  })

  it('returns error when post belongs to another user', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPostFindUnique.mockResolvedValue(makePost({ userId: 'user-2' }) as any)
    const result = await deletePost('post-1')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Post not found')
  })

  it('deletes post successfully', async () => {
    mockAuth.mockResolvedValue(makeSession())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPostFindUnique.mockResolvedValue(makePost() as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPostDelete.mockResolvedValue({} as any)
    const result = await deletePost('post-1')
    expect(result.success).toBe(true)
    expect(mockPostDelete).toHaveBeenCalledWith({ where: { id: 'post-1' } })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
  })
})

describe('updatePost', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await updatePost('post-1', { content: 'Updated' })
    expect(result.success).toBe(false)
  })

  it('returns error when post not found', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockPostFindUnique.mockResolvedValue(null)
    const result = await updatePost('post-1', { content: 'Updated' })
    expect(result.success).toBe(false)
  })

  it('returns error when content is empty', async () => {
    mockAuth.mockResolvedValue(makeSession())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPostFindUnique.mockResolvedValue(makePost() as any)
    const result = await updatePost('post-1', { content: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('required')
  })

  it('updates post successfully', async () => {
    mockAuth.mockResolvedValue(makeSession())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPostFindUnique.mockResolvedValue(makePost() as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPostUpdate.mockResolvedValue({} as any)
    const result = await updatePost('post-1', { content: 'Updated content' })
    expect(result.success).toBe(true)
    expect(mockPostUpdate).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: { content: 'Updated content' },
    })
  })
})

describe('createComment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await createComment('post-1', { content: 'Nice post!' })
    expect(result.success).toBe(false)
  })

  it('returns error when post not found', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockPostFindUnique.mockResolvedValue(null)
    const result = await createComment('post-1', { content: 'Nice post!' })
    expect(result.success).toBe(false)
  })

  it('returns error when comment content is empty', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const result = await createComment('post-1', { content: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('empty')
  })

  it('creates comment successfully', async () => {
    mockAuth.mockResolvedValue(makeSession())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPostFindUnique.mockResolvedValue(makePost() as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCommentCreate.mockResolvedValue({} as any)
    const result = await createComment('post-1', { content: 'Nice post!' })
    expect(result.success).toBe(true)
    expect(mockCommentCreate).toHaveBeenCalledWith({
      data: { content: 'Nice post!', postId: 'post-1', userId: 'user-1' },
    })
  })
})

describe('toggleLike', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await toggleLike('post-1')
    expect(result.success).toBe(false)
  })

  it('returns error when post not found', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockPostFindUnique.mockResolvedValue(null)
    const result = await toggleLike('post-1')
    expect(result.success).toBe(false)
  })

  it('adds like when not yet liked', async () => {
    mockAuth.mockResolvedValue(makeSession())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPostFindUnique.mockResolvedValue(makePost() as any)
    mockLikeFindUnique.mockResolvedValue(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockLikeCreate.mockResolvedValue({} as any)
    const result = await toggleLike('post-1')
    expect(result.success).toBe(true)
    expect(mockLikeCreate).toHaveBeenCalled()
    expect(mockLikeDelete).not.toHaveBeenCalled()
  })

  it('removes like when already liked', async () => {
    mockAuth.mockResolvedValue(makeSession())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPostFindUnique.mockResolvedValue(makePost() as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockLikeFindUnique.mockResolvedValue({ id: 'like-1' } as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockLikeDelete.mockResolvedValue({} as any)
    const result = await toggleLike('post-1')
    expect(result.success).toBe(true)
    expect(mockLikeDelete).toHaveBeenCalledWith({ where: { id: 'like-1' } })
    expect(mockLikeCreate).not.toHaveBeenCalled()
  })
})
