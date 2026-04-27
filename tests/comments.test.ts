import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import type { Session } from 'next-auth'

// Mock dependencies BEFORE importing the module under test
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    comment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Import mocked modules AFTER vi.mock calls
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { addComment, deleteComment, getComments } from '../actions/comments'

const mockAuth = auth as unknown as MockedFunction<() => Promise<Session | null>>
const mockCommentCreate = vi.mocked(prisma.comment.create)
const mockCommentFindUnique = vi.mocked(prisma.comment.findUnique)
const mockCommentDelete = vi.mocked(prisma.comment.delete)
const mockCommentFindMany = vi.mocked(prisma.comment.findMany)
const mockRevalidatePath = vi.mocked(revalidatePath)

// Helper to create a valid session
function makeSession(userId = 'user-1'): Session {
  return {
    user: { id: userId, email: 'alice@example.com', name: 'Alice' },
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
  }
}

// Helper to create a comment object
function makeComment(overrides: Partial<{
  id: string
  userId: string
  postId: string
  content: string
}> = {}) {
  return {
    id: 'comment-1',
    content: 'Great post!',
    userId: 'user-1',
    postId: 'post-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('addComment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates comment with valid body', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockCommentCreate.mockResolvedValue(makeComment() as never)

    await addComment('post-1', 'Great post!')

    expect(mockCommentCreate).toHaveBeenCalledWith({
      data: {
        content: 'Great post!',
        postId: 'post-1',
        userId: 'user-1',
      },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
  })

  it('throws error when body is empty', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))

    await expect(addComment('post-1', '')).rejects.toThrow('Comment body cannot be empty')
    expect(mockCommentCreate).not.toHaveBeenCalled()
  })

  it('throws error when body is only whitespace', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))

    await expect(addComment('post-1', '   ')).rejects.toThrow('Comment body cannot be empty')
    expect(mockCommentCreate).not.toHaveBeenCalled()
  })

  it('throws error when body exceeds 1000 characters', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))

    const longBody = 'a'.repeat(1001)
    await expect(addComment('post-1', longBody)).rejects.toThrow('Comment body cannot exceed 1000 characters')
    expect(mockCommentCreate).not.toHaveBeenCalled()
  })

  it('throws error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    await expect(addComment('post-1', 'Nice post!')).rejects.toThrow('Not authenticated')
    expect(mockCommentCreate).not.toHaveBeenCalled()
  })

  it('accepts body with exactly 1000 characters', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockCommentCreate.mockResolvedValue(makeComment() as never)

    const maxBody = 'a'.repeat(1000)
    await addComment('post-1', maxBody)

    expect(mockCommentCreate).toHaveBeenCalledWith({
      data: {
        content: maxBody,
        postId: 'post-1',
        userId: 'user-1',
      },
    })
  })

  it('trims whitespace from body', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockCommentCreate.mockResolvedValue(makeComment() as never)

    await addComment('post-1', '  Trimmed comment  ')

    expect(mockCommentCreate).toHaveBeenCalledWith({
      data: {
        content: '  Trimmed comment  ',
        postId: 'post-1',
        userId: 'user-1',
      },
    })
  })
})

describe('deleteComment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes comment when caller is comment author', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockCommentFindUnique.mockResolvedValue({
      ...makeComment({ userId: 'user-1' }),
      post: { userId: 'user-2' },
    } as never)
    mockCommentDelete.mockResolvedValue(makeComment() as never)

    await deleteComment('comment-1')

    expect(mockCommentDelete).toHaveBeenCalledWith({
      where: { id: 'comment-1' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
  })

  it('deletes comment when caller is post author but not comment author', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockCommentFindUnique.mockResolvedValue({
      ...makeComment({ userId: 'user-2' }),
      post: { userId: 'user-1' },
    } as never)
    mockCommentDelete.mockResolvedValue(makeComment() as never)

    await deleteComment('comment-1')

    expect(mockCommentDelete).toHaveBeenCalledWith({
      where: { id: 'comment-1' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
  })

  it('throws error when caller is neither comment author nor post author', async () => {
    mockAuth.mockResolvedValue(makeSession('user-3'))
    mockCommentFindUnique.mockResolvedValue({
      ...makeComment({ userId: 'user-1' }),
      post: { userId: 'user-2' },
    } as never)

    await expect(deleteComment('comment-1')).rejects.toThrow('Not authorized')
    expect(mockCommentDelete).not.toHaveBeenCalled()
  })

  it('throws error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    await expect(deleteComment('comment-1')).rejects.toThrow('Not authenticated')
    expect(mockCommentFindUnique).not.toHaveBeenCalled()
  })

  it('throws error when comment not found', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockCommentFindUnique.mockResolvedValue(null)

    await expect(deleteComment('comment-1')).rejects.toThrow('Comment not found')
    expect(mockCommentDelete).not.toHaveBeenCalled()
  })

  it('verifies comment is deleted by calling prisma.comment.delete', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockCommentFindUnique.mockResolvedValue({
      ...makeComment({ id: 'comment-123', userId: 'user-1' }),
      post: { userId: 'user-2' },
    } as never)
    mockCommentDelete.mockResolvedValue(makeComment() as never)

    await deleteComment('comment-123')

    expect(mockCommentDelete).toHaveBeenCalledWith({
      where: { id: 'comment-123' },
    })
  })
})

describe('getComments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls prisma.comment.findMany with correct postId and orderBy createdAt asc', async () => {
    mockCommentFindMany.mockResolvedValue([
      {
        ...makeComment({ id: 'comment-1', content: 'First comment' }),
        user: { id: 'user-1', name: 'Alice', email: 'alice@example.com', avatarUrl: null },
      },
      {
        ...makeComment({ id: 'comment-2', content: 'Second comment' }),
        user: { id: 'user-2', name: 'Bob', email: 'bob@example.com', avatarUrl: null },
      },
    ] as never)

    const result = await getComments('post-1')

    expect(mockCommentFindMany).toHaveBeenCalledWith({
      where: { postId: 'post-1' },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })

    expect(result).toHaveLength(2)
    expect(result[0].content).toBe('First comment')
    expect(result[1].content).toBe('Second comment')
  })

  it('returns comments with user information included', async () => {
    mockCommentFindMany.mockResolvedValue([
      {
        ...makeComment(),
        user: {
          id: 'user-1',
          name: 'Alice Smith',
          email: 'alice@example.com',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      },
    ] as never)

    const result = await getComments('post-1')

    expect(result[0].user).toEqual({
      id: 'user-1',
      name: 'Alice Smith',
      email: 'alice@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
    })
  })

  it('returns empty array when no comments exist', async () => {
    mockCommentFindMany.mockResolvedValue([] as never)

    const result = await getComments('post-1')

    expect(result).toEqual([])
    expect(mockCommentFindMany).toHaveBeenCalled()
  })

  it('orders comments by createdAt ascending', async () => {
    mockCommentFindMany.mockResolvedValue([] as never)

    await getComments('post-1')

    const callArgs = mockCommentFindMany.mock.calls[0][0]
    expect(callArgs).toHaveProperty('orderBy', { createdAt: 'asc' })
  })

  it('filters comments by postId', async () => {
    mockCommentFindMany.mockResolvedValue([] as never)

    await getComments('post-123')

    const callArgs = mockCommentFindMany.mock.calls[0][0]
    expect(callArgs).toHaveProperty('where', { postId: 'post-123' })
  })

  it('does not require authentication', async () => {
    // getComments does not call auth(), so it should work without session
    mockCommentFindMany.mockResolvedValue([
      {
        ...makeComment(),
        user: { id: 'user-1', name: 'Alice', email: 'alice@example.com', avatarUrl: null },
      },
    ] as never)

    const result = await getComments('post-1')

    expect(result).toHaveLength(1)
    expect(mockAuth).not.toHaveBeenCalled()
  })
})
