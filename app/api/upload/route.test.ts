import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import type { Session } from 'next-auth'

// Mock dependencies BEFORE importing the module under test
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/upload', () => ({
  uploadMedia: vi.fn(),
}))

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { uploadMedia } from '@/lib/upload'
import { POST } from './route'

const mockAuth = auth as unknown as MockedFunction<() => Promise<Session | null>>
const mockUploadMedia = vi.mocked(uploadMedia)

function makeSession(): Session {
  return {
    user: { id: 'user-1', email: 'alice@example.com', name: 'Alice' },
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
  }
}

function makeRequest(file: File | null) {
  const formData = new FormData()
  if (file) formData.append('file', file)
  return new NextRequest('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
  })
}

describe('POST /api/upload', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
    const req = makeRequest(file)
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = (await res.json()) as { error: string }
    expect(data.error).toBe('Not authenticated')
  })

  it('returns 400 when no file provided', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const req = makeRequest(null)
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = (await res.json()) as { error: string }
    expect(data.error).toBe('No file provided')
  })

  it('returns 400 for unsupported file type (text)', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const file = new File(['data'], 'test.txt', { type: 'text/plain' })
    const req = makeRequest(file)
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = (await res.json()) as { error: string }
    expect(data.error).toContain('Only image and video')
  })

  it('returns 400 for unsupported file type (PDF)', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' })
    const req = makeRequest(file)
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 with URL on successful image upload', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockUploadMedia.mockResolvedValue('/uploads/uuid-test.jpg')
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
    const req = makeRequest(file)
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = (await res.json()) as { url: string }
    expect(data.url).toBe('/uploads/uuid-test.jpg')
  })

  it('accepts video files', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockUploadMedia.mockResolvedValue('/uploads/uuid-test.mp4')
    const file = new File(['data'], 'test.mp4', { type: 'video/mp4' })
    const req = makeRequest(file)
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = (await res.json()) as { url: string }
    expect(data.url).toBe('/uploads/uuid-test.mp4')
  })

  it('returns 500 when uploadMedia throws', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockUploadMedia.mockRejectedValue(new Error('Disk full'))
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
    const req = makeRequest(file)
    const res = await POST(req)
    expect(res.status).toBe(500)
    const data = (await res.json()) as { error: string }
    expect(data.error).toBe('Disk full')
  })

  it('returns 500 with generic message when non-Error is thrown', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockUploadMedia.mockRejectedValue('unexpected string error')
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' })
    const req = makeRequest(file)
    const res = await POST(req)
    expect(res.status).toBe(500)
    const data = (await res.json()) as { error: string }
    expect(data.error).toBe('Upload failed')
  })

  it('calls uploadMedia with the provided file', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockUploadMedia.mockResolvedValue('/uploads/result.jpg')
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    const req = makeRequest(file)
    await POST(req)
    expect(mockUploadMedia).toHaveBeenCalled()
  })
})
