import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import type { Session } from 'next-auth'

// Mock dependencies BEFORE importing the module under test
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('new-hashed-password'),
  },
}))

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcryptjs from 'bcryptjs'
import { POST } from './route'

// Cast to simpler type to avoid NextAuth overload resolution issues
const mockAuth = auth as unknown as MockedFunction<() => Promise<Session | null>>
const mockFindUnique = vi.mocked(prisma.user.findUnique)
const mockUpdate = vi.mocked(prisma.user.update)
const mockCompare = vi.mocked(bcryptjs.compare)
const mockHash = vi.mocked(bcryptjs.hash)

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/user/change-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeSession(userId = 'user-1'): Session {
  return {
    user: { id: userId, email: 'alice@example.com', name: 'Alice' },
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
  }
}

const mockUser = {
  id: 'user-1',
  email: 'alice@example.com',
  password: 'old-hashed-password',
  name: 'Alice',
  role: 'user',
  createdAt: new Date(),
}

describe('POST /api/user/change-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockHash.mockResolvedValue('new-hashed-password' as any)
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = makeRequest({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json() as { error: string }
    expect(data.error).toBeDefined()
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('returns 400 when current password is incorrect', async () => {
    mockAuth.mockResolvedValue(makeSession())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFindUnique.mockResolvedValue(mockUser as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCompare.mockResolvedValue(false as any)
    const req = makeRequest({
      currentPassword: 'wrongpassword',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json() as { error: string }
    expect(data.error).toBe('Current password is incorrect')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns 400 when new passwords do not match', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const req = makeRequest({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'differentpass456',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json() as { error: string }
    expect(data.error).toContain('do not match')
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('returns 400 when new password is too short', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const req = makeRequest({
      currentPassword: 'oldpass123',
      newPassword: 'short',
      confirmPassword: 'short',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json() as { error: string }
    expect(data.error).toContain('8 characters')
  })

  it('updates password and returns 200 on success', async () => {
    mockAuth.mockResolvedValue(makeSession())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFindUnique.mockResolvedValue(mockUser as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCompare.mockResolvedValue(true as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUpdate.mockResolvedValue({ ...mockUser, password: 'new-hashed-password' } as any)
    const req = makeRequest({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json() as { message: string }
    expect(data.message).toBe('Password updated successfully')
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { password: 'new-hashed-password' },
    })
  })
})
