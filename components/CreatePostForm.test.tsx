import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreatePostForm, FeedPost } from './CreatePostForm'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('CreatePostForm', () => {
  const mockOnPostCreated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when not authenticated', () => {
    it('renders sign-in prompt instead of form', () => {
      render(<CreatePostForm isAuthenticated={false} onPostCreated={mockOnPostCreated} />)

      expect(screen.getByText(/Sign in/i)).toBeInTheDocument()
      expect(screen.getByText(/to share your thoughts/i)).toBeInTheDocument()
      expect(screen.queryByPlaceholderText("What's on your mind?")).not.toBeInTheDocument()
    })

    it('links to /signin page', () => {
      render(<CreatePostForm isAuthenticated={false} onPostCreated={mockOnPostCreated} />)

      const signInLink = screen.getByRole('link', { name: /Sign in/i })
      expect(signInLink).toHaveAttribute('href', '/signin')
    })
  })

  describe('when authenticated', () => {
    it('renders the post form', () => {
      render(<CreatePostForm isAuthenticated={true} onPostCreated={mockOnPostCreated} />)

      expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Post/i })).toBeInTheDocument()
      expect(screen.getByText('500 / 500')).toBeInTheDocument()
    })

    it('updates character count as user types', async () => {
      const user = userEvent.setup()
      render(<CreatePostForm isAuthenticated={true} onPostCreated={mockOnPostCreated} />)

      const textarea = screen.getByPlaceholderText("What's on your mind?")
      await user.type(textarea, 'Hello')

      expect(screen.getByText('495 / 500')).toBeInTheDocument()
    })

    it('disables submit button when content is empty', () => {
      render(<CreatePostForm isAuthenticated={true} onPostCreated={mockOnPostCreated} />)

      const submitButton = screen.getByRole('button', { name: /Post/i })
      expect(submitButton).toBeDisabled()
    })

    it('enables submit button when content is entered', async () => {
      const user = userEvent.setup()
      render(<CreatePostForm isAuthenticated={true} onPostCreated={mockOnPostCreated} />)

      const textarea = screen.getByPlaceholderText("What's on your mind?")
      const submitButton = screen.getByRole('button', { name: /Post/i })

      await user.type(textarea, 'Test post')

      expect(submitButton).not.toBeDisabled()
    })

    it('enforces max length of 500 characters', async () => {
      const user = userEvent.setup()
      render(<CreatePostForm isAuthenticated={true} onPostCreated={mockOnPostCreated} />)

      const textarea = screen.getByPlaceholderText("What's on your mind?") as HTMLTextAreaElement

      // Type more than 500 characters
      const longText = 'a'.repeat(600)
      await user.type(textarea, longText)

      // Textarea should only contain 500 characters due to maxLength attribute
      expect(textarea.value.length).toBe(500)
      expect(screen.getByText('0 / 500')).toBeInTheDocument()
    })

    it('successfully creates a post and resets form', async () => {
      const user = userEvent.setup()
      const mockPost: FeedPost = {
        id: '123',
        content: 'Test post',
        createdAt: '2026-04-27T10:00:00Z',
        userId: 'user-1',
        user: { id: 'user-1', name: 'Test User', image: null },
        _count: { comments: 0 },
        mediaUrls: [],
        type: 'text',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockPost,
      })

      render(<CreatePostForm isAuthenticated={true} onPostCreated={mockOnPostCreated} />)

      const textarea = screen.getByPlaceholderText("What's on your mind?")
      const submitButton = screen.getByRole('button', { name: /Post/i })

      await user.type(textarea, 'Test post')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: 'Test post' }),
        })
      })

      await waitFor(() => {
        expect(mockOnPostCreated).toHaveBeenCalledWith(mockPost)
      })

      // Form should be reset
      expect(textarea).toHaveValue('')
      expect(screen.getByText('500 / 500')).toBeInTheDocument()
    })

    it('shows loading state while submitting', async () => {
      const user = userEvent.setup()

      // Mock a delayed response
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 201,
                  json: async () => ({
                    id: '123',
                    content: 'Test',
                    createdAt: '2026-04-27T10:00:00Z',
                    userId: 'user-1',
                    user: { id: 'user-1', name: 'Test', image: null },
                    _count: { comments: 0 },
                  }),
                }),
              100
            )
          })
      )

      render(<CreatePostForm isAuthenticated={true} onPostCreated={mockOnPostCreated} />)

      const textarea = screen.getByPlaceholderText("What's on your mind?")
      const submitButton = screen.getByRole('button', { name: /Post/i })

      await user.type(textarea, 'Test post')
      await user.click(submitButton)

      // Should show loading state
      expect(screen.getByRole('button', { name: /Posting.../i })).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      expect(textarea).toBeDisabled()

      // Wait for submission to complete
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Post$/i })).toBeInTheDocument()
      })
    })

    it('displays error message when API returns error', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Content cannot be empty' }),
      })

      render(<CreatePostForm isAuthenticated={true} onPostCreated={mockOnPostCreated} />)

      const textarea = screen.getByPlaceholderText("What's on your mind?")
      const submitButton = screen.getByRole('button', { name: /Post/i })

      await user.type(textarea, 'Test post')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Content cannot be empty')
      })

      expect(mockOnPostCreated).not.toHaveBeenCalled()
    })

    it('displays error when API returns 401 unauthorized', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Not authenticated' }),
      })

      render(<CreatePostForm isAuthenticated={true} onPostCreated={mockOnPostCreated} />)

      const textarea = screen.getByPlaceholderText("What's on your mind?")
      await user.type(textarea, 'Test post')
      await user.click(screen.getByRole('button', { name: /Post/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Not authenticated')
      })
    })

    it('displays generic error when fetch throws', async () => {
      const user = userEvent.setup()

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<CreatePostForm isAuthenticated={true} onPostCreated={mockOnPostCreated} />)

      const textarea = screen.getByPlaceholderText("What's on your mind?")
      await user.type(textarea, 'Test post')
      await user.click(screen.getByRole('button', { name: /Post/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network error')
      })
    })

    it('disables button when content is only whitespace', async () => {
      const user = userEvent.setup()
      render(<CreatePostForm isAuthenticated={true} onPostCreated={mockOnPostCreated} />)

      const textarea = screen.getByPlaceholderText("What's on your mind?")
      const submitButton = screen.getByRole('button', { name: /Post/i })

      // Type whitespace
      await user.type(textarea, '   ')

      // Button should remain disabled because content.trim() is empty
      expect(submitButton).toBeDisabled()

      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockOnPostCreated).not.toHaveBeenCalled()
    })

    it('clears error message when user starts typing after error', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })

      render(<CreatePostForm isAuthenticated={true} onPostCreated={mockOnPostCreated} />)

      const textarea = screen.getByPlaceholderText("What's on your mind?")
      await user.type(textarea, 'Test')
      await user.click(screen.getByRole('button', { name: /Post/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Clear the textarea and type new content
      await user.clear(textarea)
      await user.type(textarea, 'New test')

      // Submit again with a successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: '123',
          content: 'New test',
          createdAt: '2026-04-27T10:00:00Z',
          userId: 'user-1',
          user: { id: 'user-1', name: 'Test', image: null },
          _count: { comments: 0 },
        }),
      })

      await user.click(screen.getByRole('button', { name: /Post/i }))

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })
})
