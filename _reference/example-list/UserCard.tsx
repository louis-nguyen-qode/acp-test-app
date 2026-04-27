import { User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export interface UserCardUser {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: Date
}

interface UserCardProps {
  user: UserCardUser
}

export function UserCard({ user }: UserCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted"
          aria-hidden="true"
        >
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{user.name ?? 'Unnamed user'}</p>
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
              {user.role}
            </Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          Joined{' '}
          <time dateTime={user.createdAt.toISOString()}>
            {user.createdAt.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </p>
      </CardContent>
    </Card>
  )
}
