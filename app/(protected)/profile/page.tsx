import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const session = await auth()
  const userId = session!.user!.id!

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: { select: { todos: true } },
    },
  })

  if (!user) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>

      <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-6">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Name
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{user.name ?? '—'}</dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Email
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Member since
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {user.createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total todos
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{user._count.todos}</dd>
          </div>
        </dl>
      </div>

      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
