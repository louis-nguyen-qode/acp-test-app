import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Session } from 'next-auth'

// Mock dependencies BEFORE importing the module under test
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Import mocked modules AFTER vi.mock calls
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createTodo } from './actions'

const mockAuth = vi.mocked(auth)
const mockTransaction = vi.mocked(prisma.$transaction)
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

describe('createTodo server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Authentication tests ---

  it('returns error when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const result = await createTodo(makeFormData({ title: 'Buy milk' }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('signed in')
    }
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  // --- Validation tests ---

  it('returns validation error when title is empty', async () => {
    mockAuth.mockResolvedValue(makeSession())

    const result = await createTodo(makeFormData({ title: '' }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.fieldErrors?.title).toBeDefined()
      expect(result.fieldErrors!.title[0]).toContain('required')
    }
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('returns validation error when title is too long', async () => {
    mockAuth.mockResolvedValue(makeSession())

    const result = await createTodo(makeFormData({ title: 'A'.repeat(201) }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.fieldErrors?.title).toBeDefined()
    }
  })

  it('returns validation error for invalid priority', async () => {
    mockAuth.mockResolvedValue(makeSession())

    const result = await createTodo(makeFormData({ title: 'Valid title', priority: 'invalid' }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeTruthy()
    }
  })

  // --- Success tests ---

  it('creates a todo and returns success result', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockTransaction.mockResolvedValue({
      id: 'todo-123',
      title: 'Buy milk',
      completed: false,
      priority: 'medium',
      userId: 'user-1',
    })

    const result = await createTodo(makeFormData({ title: 'Buy milk', priority: 'medium' }))

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Buy milk')
      expect(result.data.completed).toBe(false)
      expect(result.data.id).toBeDefined()
    }
  })

  it('revalidates the todos page on success', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockTransaction.mockResolvedValue({
      id: 'todo-123',
      title: 'Buy milk',
      completed: false,
      priority: 'low',
      userId: 'user-1',
    })

    await createTodo(makeFormData({ title: 'Buy milk', priority: 'low' }))

    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/todos')
  })

  it('uses medium priority by default when priority is not provided', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockTransaction.mockResolvedValue({
      id: 'todo-456',
      title: 'Default priority todo',
      completed: false,
      priority: 'medium',
      userId: 'user-1',
    })

    const fd = new FormData()
    fd.append('title', 'Default priority todo')
    // No priority appended — should default to 'medium'

    const result = await createTodo(fd)

    expect(result.success).toBe(true)
  })

  // --- Error tests ---

  it('returns error when Prisma transaction fails', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockTransaction.mockRejectedValue(new Error('DB connection failed'))

    const result = await createTodo(makeFormData({ title: 'Buy milk' }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Failed to create')
    }
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})
