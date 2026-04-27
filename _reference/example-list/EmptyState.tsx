import { Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <Users className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
      <h3 className="mb-1 text-lg font-semibold">No users yet</h3>
      <p className="mb-6 text-sm text-muted-foreground">
        Get started by inviting your first team member.
      </p>
      <Button asChild>
        <Link href="/dashboard/users/invite">Invite user</Link>
      </Button>
    </div>
  )
}
