import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({
  AuthError: class AuthError extends Error { constructor(message?: string) { super(message); this.name = 'AuthError' } },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/auth', () => ({
  signIn: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import { signIn } from '@/auth'
import { redirect } from 'next/navigation'
import { signup } from './actions'

const mockFindUnique = vi.mocked(prisma.user.findUnique)
const mockCreate = vi.mocked(prisma.user.create)
const mockSignIn = vi.mocked(signIn)
const mockRedirect = vi.mocked(redirect)

describe('signup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error for invalid email', async () => {
    const result = await signup({ name: 'Jane', email: 'not-an-email', password: 'password123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.field).toBe('email')
    }
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('returns error for short password', async () => {
    const result = await signup({ name: 'Jane', email: 'jane@example.com', password: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.field).toBe('password')
    }
  })

  it('returns error for empty name', async () => {
    const result = await signup({ name: '', email: 'jane@example.com', password: 'password123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.field).toBe('name')
    }
  })

  it('returns error when email already exists', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'existing-user',
      email: 'jane@example.com',
      password: 'hash',
      name: 'Jane',
      role: 'user',
      createdAt: new Date(),
    })
    const result = await signup({ name: 'Jane', email: 'jane@example.com', password: 'password123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.field).toBe('email')
      expect(result.error).toContain('already exists')
    }
  })

  it('returns error when user creation fails', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockRejectedValue(new Error('DB error'))
    const result = await signup({ name: 'Jane', email: 'jane@example.com', password: 'password123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Failed to create')
    }
  })

  it('creates user and redirects on success', async () => {
    mockFindUnique.mockResolvedValue(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreate.mockResolvedValue({} as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockSignIn.mockResolvedValue({} as any)
    mockRedirect.mockImplementation(() => { throw new Error('NEXT_REDIRECT') })

    await expect(
      signup({ name: 'Jane', email: 'jane@example.com', password: 'password123' })
    ).rejects.toThrow('NEXT_REDIRECT')

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        name: 'Jane',
        email: 'jane@example.com',
        password: 'hashed-password',
        role: 'user',
      },
    })
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })
})
