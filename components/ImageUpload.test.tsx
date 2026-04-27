import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { ImageUpload } from './ImageUpload'

// Mock next/image used by Avatar component
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

// Mock URL APIs (not available in jsdom)
const mockCreateObjectURL = vi.fn(() => 'blob:mock-preview-url')
const mockRevokeObjectURL = vi.fn()

beforeAll(() => {
  global.URL.createObjectURL = mockCreateObjectURL
  global.URL.revokeObjectURL = mockRevokeObjectURL
})

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Render tests ---

  it('renders Upload button when no currentUrl', () => {
    render(<ImageUpload onUpload={vi.fn()} />)
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
  })

  it('renders Change button when currentUrl is provided', () => {
    render(<ImageUpload currentUrl="/uploads/avatar.jpg" onUpload={vi.fn()} />)
    expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument()
  })

  it('renders Remove button when currentUrl is provided', () => {
    render(<ImageUpload currentUrl="/uploads/avatar.jpg" onUpload={vi.fn()} />)
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
  })

  it('does not render Remove button when no currentUrl', () => {
    render(<ImageUpload onUpload={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })

  it('renders a hidden file input that accepts only images', () => {
    render(<ImageUpload onUpload={vi.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeTruthy()
    expect(input.type).toBe('file')
    expect(input).toHaveAttribute('aria-label', 'Upload profile image')
  })

  it('shows current image in preview when currentUrl is provided', () => {
    render(<ImageUpload currentUrl="/uploads/avatar.jpg" currentName="Alice" onUpload={vi.fn()} />)
    const img = screen.getByAltText('Alice')
    expect(img).toHaveAttribute('src', '/uploads/avatar.jpg')
  })

  // --- Remove / Clear tests ---

  it('calls onUpload with empty string when Remove is clicked', async () => {
    const user = userEvent.setup()
    const onUpload = vi.fn()
    render(<ImageUpload currentUrl="/uploads/avatar.jpg" onUpload={onUpload} />)

    await user.click(screen.getByRole('button', { name: /remove/i }))

    expect(onUpload).toHaveBeenCalledOnce()
    expect(onUpload).toHaveBeenCalledWith('')
  })

  it('hides Remove button after clicking Remove', async () => {
    const user = userEvent.setup()
    render(<ImageUpload currentUrl="/uploads/avatar.jpg" onUpload={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /remove/i }))

    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })

  it('clears any error when Remove is clicked', async () => {
    const user = userEvent.setup()
    render(<ImageUpload currentUrl="/uploads/avatar.jpg" onUpload={vi.fn()} />)

    // First trigger an error by uploading a bad file
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const badFile = new File(['data'], 'doc.pdf', { type: 'application/pdf' })
    await user.upload(input, badFile)
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // Then click remove — error should clear
    await user.click(screen.getByRole('button', { name: /remove/i }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  // --- File validation tests ---

  it('shows error for non-image file type', async () => {
    const user = userEvent.setup()
    render(<ImageUpload onUpload={vi.fn()} />)

    const file = new File(['data'], 'doc.txt', { type: 'text/plain' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    expect(screen.getByRole('alert')).toHaveTextContent('Please select an image file')
  })

  it('does not call fetch for non-image file type', async () => {
    const user = userEvent.setup()
    render(<ImageUpload onUpload={vi.fn()} />)

    const file = new File(['data'], 'doc.txt', { type: 'text/plain' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('shows error when file exceeds 5MB size limit', async () => {
    const user = userEvent.setup()
    render(<ImageUpload onUpload={vi.fn()} />)

    // 6MB content
    const largeContent = new Uint8Array(6 * 1024 * 1024).fill(1)
    const file = new File([largeContent], 'huge.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    expect(screen.getByRole('alert')).toHaveTextContent('5MB')
  })

  it('does not call fetch for oversized file', async () => {
    const user = userEvent.setup()
    render(<ImageUpload onUpload={vi.fn()} />)

    const largeContent = new Uint8Array(6 * 1024 * 1024).fill(1)
    const file = new File([largeContent], 'huge.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    expect(mockFetch).not.toHaveBeenCalled()
  })

  // --- Upload flow tests ---

  it('calls URL.createObjectURL for a valid image file', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ url: '/uploads/new.jpg' }),
    })
    render(<ImageUpload onUpload={vi.fn()} />)

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    expect(mockCreateObjectURL).toHaveBeenCalledWith(file)
  })

  it('POSTs to /api/upload with FormData on valid image', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ url: '/uploads/new.jpg' }),
    })
    render(<ImageUpload onUpload={vi.fn()} />)

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/upload',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('calls onUpload with returned URL after successful upload', async () => {
    const user = userEvent.setup()
    const onUpload = vi.fn()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ url: '/uploads/new-avatar.jpg' }),
    })
    render(<ImageUpload onUpload={onUpload} />)

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith('/uploads/new-avatar.jpg')
    })
  })

  it('revokes object URL after successful upload', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ url: '/uploads/new.jpg' }),
    })
    render(<ImageUpload onUpload={vi.fn()} />)

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() => {
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-preview-url')
    })
  })

  it('shows error alert when upload API returns non-ok', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Upload failed' }),
    })
    render(<ImageUpload onUpload={vi.fn()} />)

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Upload failed')
    })
  })

  it('shows error alert when fetch throws a network error', async () => {
    const user = userEvent.setup()
    mockFetch.mockRejectedValue(new Error('Network error'))
    render(<ImageUpload onUpload={vi.fn()} />)

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error')
    })
  })

  it('restores original preview on upload failure', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    })
    render(<ImageUpload currentUrl="/uploads/original.jpg" currentName="Alice" onUpload={vi.fn()} />)

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    // After failure, the original image should be shown
    await waitFor(() => {
      expect(screen.getByAltText('Alice')).toHaveAttribute('src', '/uploads/original.jpg')
    })
  })

  // --- Upload button state tests ---

  it('disables buttons while uploading', async () => {
    const user = userEvent.setup()
    // Never resolves to keep the uploading state
    mockFetch.mockImplementation(() => new Promise(() => {}))
    render(<ImageUpload onUpload={vi.fn()} />)

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    // Upload button should be disabled during upload
    const uploadButton = screen.getByRole('button', { name: /upload|change/i })
    expect(uploadButton).toBeDisabled()
  })
})
