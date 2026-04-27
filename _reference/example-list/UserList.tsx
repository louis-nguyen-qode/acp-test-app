'use client'

import { UserCard, type UserCardUser } from './UserCard'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'

interface UserListProps {
  users: UserCardUser[]
  error?: string
}

export function UserList({ users, error }: UserListProps) {
  // Error state
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  // Empty state
  if (users.length === 0) {
    return <EmptyState />
  }

  // Populated state
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      role="list"
      aria-label="Users list"
    >
      {users.map((user) => (
        <div key={user.id} role="listitem">
          <UserCard user={user} />
        </div>
      ))}
    </div>
  )
}
