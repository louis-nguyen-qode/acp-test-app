import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserList } from './UserList'
import { LoadingSkeleton } from './LoadingSkeleton'

// Fetch data in the Server Component
async function getUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return users
}

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/signin?callbackUrl=/dashboard/users')
  }

  const users = await getUsers()

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {users.length} {users.length === 1 ? 'user' : 'users'} total
            </p>
          </div>
        </div>

        {/* Suspense boundary for streaming */}
        <Suspense fallback={<LoadingSkeleton />}>
          <UserList users={users} />
        </Suspense>
      </div>
    </div>
  )
}
