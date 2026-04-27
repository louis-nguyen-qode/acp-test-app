import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import type { Session } from 'next-auth'

// Mock dependencies BEFORE importing the module under test
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    todo: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createTodo, deleteTodo, toggleTodo } from './actions'

// Cast to simpler type to avoid NextAuth overload resolution issue
const mockAuth = auth as unknown as MockedFunction<() => Promise<Session | null>>
const mockTodoCreate = vi.mocked(prisma.todo.create)
const mockTodoFindUnique = vi.mocked(prisma.todo.findUnique)
const mockTodoDelete = vi.mocked(prisma.todo.delete)
const mockTodoUpdate = vi.mocked(prisma.todo.update)
const mockRevalidatePath = vi.mocked(revalidatePath)

function makeSession(userId = 'user-1'): Session {
  return {
    user: { id: userId, email: 'alice@example.com', name: 'Alice' },
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
  }
}

describe('createTodo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await createTodo({ title: 'Buy milk' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Not authenticated')
    expect(mockTodoCreate).not.toHaveBeenCalled()
  })

  it('returns error for empty title', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const result = await createTodo({ title: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('required')
  })

  it('returns error when title is too long', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const result = await createTodo({ title: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('creates todo successfully', async () => {
    mockAuth.mockResolvedValue(makeSession())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockTodoCreate.mockResolvedValue({ id: 'todo-1', title: 'Buy milk' } as any)
    const result = await createTodo({ title: 'Buy milk' })
    expect(result.success).toBe(true)
    expect(mockTodoCreate).toHaveBeenCalledWith({
      data: { title: 'Buy milk', userId: 'user-1' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
  })
})

describe('deleteTodo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await deleteTodo('todo-1')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Not authenticated')
  })

  it('returns error when todo not found', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockTodoFindUnique.mockResolvedValue(null)
    const result = await deleteTodo('todo-1')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Todo not found')
  })

  it('returns error when todo belongs to another user', async () => {
    mockAuth.mockResolvedValue(makeSession('user-1'))
    mockTodoFindUnique.mockResolvedValue({
      id: 'todo-1',
      userId: 'user-2',
      title: 'Other todo',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    const result = await deleteTodo('todo-1')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Todo not found')
  })

  it('deletes todo successfully', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockTodoFindUnique.mockResolvedValue({
      id: 'todo-1',
      userId: 'user-1',
      title: 'Buy milk',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockTodoDelete.mockResolvedValue({} as any)
    const result = await deleteTodo('todo-1')
    expect(result.success).toBe(true)
    expect(mockTodoDelete).toHaveBeenCalledWith({ where: { id: 'todo-1' } })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
  })
})

describe('toggleTodo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await toggleTodo('todo-1')
    expect(result.success).toBe(false)
  })

  it('returns error when todo not found', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockTodoFindUnique.mockResolvedValue(null)
    const result = await toggleTodo('todo-1')
    expect(result.success).toBe(false)
  })

  it('toggles todo from incomplete to complete', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockTodoFindUnique.mockResolvedValue({
      id: 'todo-1',
      userId: 'user-1',
      title: 'Buy milk',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockTodoUpdate.mockResolvedValue({} as any)
    const result = await toggleTodo('todo-1')
    expect(result.success).toBe(true)
    expect(mockTodoUpdate).toHaveBeenCalledWith({
      where: { id: 'todo-1' },
      data: { completed: true },
    })
  })

  it('toggles todo from complete to incomplete', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockTodoFindUnique.mockResolvedValue({
      id: 'todo-1',
      userId: 'user-1',
      title: 'Buy milk',
      completed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockTodoUpdate.mockResolvedValue({} as any)
    const result = await toggleTodo('todo-1')
    expect(result.success).toBe(true)
    expect(mockTodoUpdate).toHaveBeenCalledWith({
      where: { id: 'todo-1' },
      data: { completed: false },
    })
  })
})
