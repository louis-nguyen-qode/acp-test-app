import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProfileForm } from './ProfileForm'
import * as actions from './actions'

// Mock the server action
vi.mock('./actions', () => ({
  updateProfile: vi.fn(),
}))

const mockUpdateProfile = vi.mocked(actions.updateProfile)

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders name and bio fields', () => {
    render(<ProfileForm />)

    expect(screen.getByLabelText('Display name')).toBeInTheDocument()
    expect(screen.getByLabelText('Bio')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  })

  it('renders with default values', () => {
    render(<ProfileForm defaultValues={{ name: 'Alice', bio: 'Hello!' }} />)

    expect(screen.getByLabelText('Display name')).toHaveValue('Alice')
    expect(screen.getByLabelText('Bio')).toHaveValue('Hello!')
  })

  it('shows validation error when name is empty', async () => {
    const user = userEvent.setup()
    render(<ProfileForm />)

    // Submit without filling in name
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('shows validation error when name is too long', async () => {
    const user = userEvent.setup()
    render(<ProfileForm />)

    const nameInput = screen.getByLabelText('Display name')
    await user.type(nameInput, 'A'.repeat(101))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Name must be 100 characters or fewer')).toBeInTheDocument()
    expect(mockUpdateProfile).not.toHaveBeenCalled()
  })

  it('shows success state after successful submission', async () => {
    const user = userEvent.setup()
    mockUpdateProfile.mockResolvedValue({ success: true, data: { name: 'Alice' } })

    render(<ProfileForm defaultValues={{ name: 'Alice' }} />)

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Profile updated successfully.')).toBeInTheDocument()
    expect(mockUpdateProfile).toHaveBeenCalledWith({ name: 'Alice', bio: '' })
  })

  it('shows error state after failed submission', async () => {
    const user = userEvent.setup()
    mockUpdateProfile.mockResolvedValue({
      success: false,
      error: 'Failed to update profile. Please try again.',
    })

    render(<ProfileForm defaultValues={{ name: 'Alice' }} />)

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(
      await screen.findByText('Failed to update profile. Please try again.')
    ).toBeInTheDocument()
  })

  it('disables the submit button while submitting', async () => {
    const user = userEvent.setup()
    // Delay resolution to observe submitting state
    mockUpdateProfile.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: { name: 'Alice' } }), 100))
    )

    render(<ProfileForm defaultValues={{ name: 'Alice' }} />)

    const button = screen.getByRole('button', { name: 'Save changes' })
    await user.click(button)

    // Button should be disabled while submitting
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully.')).toBeInTheDocument()
    })
  })

  it('calls updateProfile with correct values', async () => {
    const user = userEvent.setup()
    mockUpdateProfile.mockResolvedValue({ success: true, data: { name: 'Bob' } })

    render(<ProfileForm />)

    await user.type(screen.getByLabelText('Display name'), 'Bob')
    await user.type(screen.getByLabelText('Bio'), 'I love TypeScript')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Bob',
        bio: 'I love TypeScript',
      })
    })
  })
})
