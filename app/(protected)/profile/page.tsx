import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const session = await auth()
  const userId = session!.user!.id!

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to dashboard
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Role</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">{user.role}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Member since</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {user.createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>
        </div>
      </main>
    </div>
  )
}
