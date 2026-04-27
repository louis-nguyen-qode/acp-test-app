import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { UserCard, type UserCardUser } from './UserCard'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { UserList } from './UserList'

const mockUser: UserCardUser = {
  id: 'user-1',
  name: 'Alice Smith',
  email: 'alice@example.com',
  role: 'admin',
  createdAt: new Date('2024-01-15T10:00:00Z'),
}

const mockUserNoName: UserCardUser = {
  id: 'user-2',
  name: null,
  email: 'bob@example.com',
  role: 'user',
  createdAt: new Date('2024-02-20T10:00:00Z'),
}

describe('UserCard', () => {
  it('renders user name and email', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })

  it('shows admin badge for admin role', () => {
    render(<UserCard user={mockUser} />)

    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('shows "Unnamed user" when name is null', () => {
    render(<UserCard user={mockUserNoName} />)

    expect(screen.getByText('Unnamed user')).toBeInTheDocument()
  })

  it('renders join date', () => {
    render(<UserCard user={mockUser} />)

    // Check that "Joined" text is rendered
    expect(screen.getByText(/Joined/)).toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('renders the empty state message', () => {
    render(<EmptyState />)

    expect(screen.getByText('No users yet')).toBeInTheDocument()
    expect(screen.getByText(/Get started by inviting/)).toBeInTheDocument()
  })

  it('renders the invite user CTA link', () => {
    render(<EmptyState />)

    const link = screen.getByRole('link', { name: 'Invite user' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard/users/invite')
  })
})

describe('ErrorState', () => {
  it('renders the error message', () => {
    render(<ErrorState message="Failed to load users." />)

    expect(screen.getByText('Failed to load users.')).toBeInTheDocument()
  })

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn()
    render(<ErrorState message="Error" onRetry={onRetry} />)

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorState message="Error" onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorState message="Error" />)

    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })
})

describe('UserList', () => {
  it('renders all users', () => {
    render(<UserList users={[mockUser, mockUserNoName]} />)

    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Unnamed user')).toBeInTheDocument()
  })

  it('renders empty state when users array is empty', () => {
    render(<UserList users={[]} />)

    expect(screen.getByText('No users yet')).toBeInTheDocument()
  })

  it('renders error state when error is provided', () => {
    render(<UserList users={[]} error="Failed to load users." />)

    expect(screen.getByText('Failed to load users.')).toBeInTheDocument()
  })
})
