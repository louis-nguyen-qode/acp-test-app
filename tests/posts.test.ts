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
      update: vi.fn(),
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
import { createPost, updatePost, deletePost, getPosts } from '../actions/posts'

const mockAuth = auth as unknown as MockedFunction<() => Promise<Session | null>>
const mockPostCreate = vi.mocked(prisma.post.create)
const mockPostFindUnique = vi.mocked(prisma.post.findUnique)
const mockPostUpdate = vi.mocked(prisma.post.update)
const mockPostFindMany = vi.mocked(prisma.post.findMany)
const mockRevalidatePath = vi.mocked(revalidatePath)

// Helper to create a valid session
function makeSession(userId = 'user-1'): Session {
  return {
    user: { id: userId, email: 'alice@example.com', name: 'Alice' },
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
  }
}

// Helper to create FormData
function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value)
  }
  return fd
}

// Helper to create a post object
function makePost(overrides: Partial<{
  id: string
  userId: string
  type: string
  content: string | null
  mediaUrls: string | null
  deletedAt: Date | null
}> = {}) {
  return {
    id: 'post-1',
    type: 'text',
    content: 'Hello world',
    mediaUrl: null,
    mediaUrls: null,
    deletedAt: null,
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('createPost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates post with authenticated session and correct userId', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostCreate.mockResolvedValue(makePost() as never)

    const formData = makeFormData({
      type: 'text',
      content: 'Hello world',
    })

    await createPost(formData)

    expect(mockPostCreate).toHaveBeenCalledWith({
      data: {
        type: 'text',
        content: 'Hello world',
        mediaUrls: null,
        userId: 'user-1',
      },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
  })

  it('throws error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const formData = makeFormData({ content: 'Test' })

    await expect(createPost(formData)).rejects.toThrow('Not authenticated')
    expect(mockPostCreate).not.toHaveBeenCalled()
  })

  it('handles mediaUrls from FormData correctly', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostCreate.mockResolvedValue(makePost() as never)

    const mediaUrls = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
    const formData = makeFormData({
      type: 'image',
      content: 'Check out these photos',
      mediaUrls: JSON.stringify(mediaUrls),
    })

    await createPost(formData)

    expect(mockPostCreate).toHaveBeenCalledWith({
      data: {
        type: 'image',
        content: 'Check out these photos',
        mediaUrls: JSON.stringify(mediaUrls),
        userId: 'user-1',
      },
    })
  })

  it('handles empty mediaUrls array', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostCreate.mockResolvedValue(makePost() as never)

    const formData = makeFormData({
      type: 'text',
      content: 'No media',
      mediaUrls: JSON.stringify([]),
    })

    await createPost(formData)

    expect(mockPostCreate).toHaveBeenCalledWith({
      data: {
        type: 'text',
        content: 'No media',
        mediaUrls: null,
        userId: 'user-1',
      },
    })
  })

  it('defaults type to text when not provided', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostCreate.mockResolvedValue(makePost() as never)

    const formData = makeFormData({
      content: 'Default type post',
    })

    await createPost(formData)

    expect(mockPostCreate).toHaveBeenCalledWith({
      data: {
        type: 'text',
        content: 'Default type post',
        mediaUrls: null,
        userId: 'user-1',
      },
    })
  })

  it('handles null content', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostCreate.mockResolvedValue(makePost() as never)

    const formData = new FormData()
    formData.append('type', 'image')

    await createPost(formData)

    expect(mockPostCreate).toHaveBeenCalledWith({
      data: {
        type: 'image',
        content: null,
        mediaUrls: null,
        userId: 'user-1',
      },
    })
  })
})

describe('deletePost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets deletedAt field when caller is post owner', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostFindUnique.mockResolvedValue(makePost({ userId: 'user-1' }) as never)
    mockPostUpdate.mockResolvedValue(makePost() as never)

    await deletePost('post-1')

    expect(mockPostUpdate).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: { deletedAt: expect.any(Date) },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
  })

  it('throws error when caller is not post owner', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostFindUnique.mockResolvedValue(makePost({ userId: 'user-2' }) as never)

    await expect(deletePost('post-1')).rejects.toThrow('Not authorized')
    expect(mockPostUpdate).not.toHaveBeenCalled()
  })

  it('throws error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    await expect(deletePost('post-1')).rejects.toThrow('Not authenticated')
    expect(mockPostFindUnique).not.toHaveBeenCalled()
  })

  it('throws error when post is not found', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostFindUnique.mockResolvedValue(null)

    await expect(deletePost('post-1')).rejects.toThrow('Not authorized')
    expect(mockPostUpdate).not.toHaveBeenCalled()
  })
})

describe('updatePost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates post with new content when caller is owner', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostFindUnique.mockResolvedValue(makePost({ userId: 'user-1' }) as never)
    mockPostUpdate.mockResolvedValue(makePost() as never)

    await updatePost('post-1', { content: 'Updated content' })

    expect(mockPostUpdate).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: {
        content: 'Updated content',
        mediaUrls: undefined,
      },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
  })

  it('throws error when caller is not owner', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostFindUnique.mockResolvedValue(makePost({ userId: 'user-2' }) as never)

    await expect(updatePost('post-1', { content: 'Hacked' })).rejects.toThrow('Not authorized')
    expect(mockPostUpdate).not.toHaveBeenCalled()
  })

  it('throws error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    await expect(updatePost('post-1', { content: 'Test' })).rejects.toThrow('Not authenticated')
    expect(mockPostFindUnique).not.toHaveBeenCalled()
  })

  it('updates mediaUrls when provided', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostFindUnique.mockResolvedValue(makePost({ userId: 'user-1' }) as never)
    mockPostUpdate.mockResolvedValue(makePost() as never)

    const mediaUrls = ['https://example.com/new-image.jpg']
    await updatePost('post-1', { mediaUrls })

    expect(mockPostUpdate).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: {
        content: undefined,
        mediaUrls: JSON.stringify(mediaUrls),
      },
    })
  })

  it('updates both content and mediaUrls together', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostFindUnique.mockResolvedValue(makePost({ userId: 'user-1' }) as never)
    mockPostUpdate.mockResolvedValue(makePost() as never)

    const mediaUrls = ['https://example.com/image.jpg']
    await updatePost('post-1', {
      content: 'New content',
      mediaUrls,
    })

    expect(mockPostUpdate).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: {
        content: 'New content',
        mediaUrls: JSON.stringify(mediaUrls),
      },
    })
  })

  it('throws error when post is not found', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostFindUnique.mockResolvedValue(null)

    await expect(updatePost('post-1', { content: 'Test' })).rejects.toThrow('Not authorized')
    expect(mockPostUpdate).not.toHaveBeenCalled()
  })
})

describe('getPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls prisma.post.findMany with deletedAt null filter and returns posts', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostFindMany.mockResolvedValue([
      {
        ...makePost({ id: 'post-1', mediaUrls: JSON.stringify(['url1.jpg', 'url2.jpg']) }),
        user: { id: 'user-1', name: 'Alice', email: 'alice@example.com', avatarUrl: null },
        _count: { comments: 5, likes: 10 },
        likes: [{ userId: 'user-1' }],
      },
      {
        ...makePost({ id: 'post-2', mediaUrls: null }),
        user: { id: 'user-2', name: 'Bob', email: 'bob@example.com', avatarUrl: null },
        _count: { comments: 2, likes: 3 },
        likes: [],
      },
    ] as never)

    const result = await getPosts()

    expect(mockPostFindMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
    })

    expect(result).toHaveLength(2)
    expect(result[0].mediaUrls).toEqual(['url1.jpg', 'url2.jpg'])
    expect(result[1].mediaUrls).toEqual([])
  })

  it('uses cursor pagination when cursor is provided', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostFindMany.mockResolvedValue([] as never)

    await getPosts('post-10')

    expect(mockPostFindMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      take: 10,
      cursor: { id: 'post-10' },
      skip: 1,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
    })
  })

  it('throws error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    await expect(getPosts()).rejects.toThrow('Not authenticated')
    expect(mockPostFindMany).not.toHaveBeenCalled()
  })

  it('parses mediaUrls from JSON string to array correctly', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostFindMany.mockResolvedValue([
      {
        ...makePost({ mediaUrls: JSON.stringify(['image1.jpg', 'image2.jpg', 'image3.jpg']) }),
        user: { id: 'user-1', name: 'Alice', email: 'alice@example.com', avatarUrl: null },
        _count: { comments: 0, likes: 0 },
        likes: [],
      },
    ] as never)

    const result = await getPosts()

    expect(result[0].mediaUrls).toEqual(['image1.jpg', 'image2.jpg', 'image3.jpg'])
  })

  it('returns empty array for mediaUrls when null', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostFindMany.mockResolvedValue([
      {
        ...makePost({ mediaUrls: null }),
        user: { id: 'user-1', name: 'Alice', email: 'alice@example.com', avatarUrl: null },
        _count: { comments: 0, likes: 0 },
        likes: [],
      },
    ] as never)

    const result = await getPosts()

    expect(result[0].mediaUrls).toEqual([])
  })

  it('limits results to 10 posts', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockPostFindMany.mockResolvedValue([] as never)

    await getPosts()

    const callArgs = mockPostFindMany.mock.calls[0][0]
    expect(callArgs).toHaveProperty('take', 10)
  })
})
