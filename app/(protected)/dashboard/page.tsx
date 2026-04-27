import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { signOut } from '@/auth'
import Link from 'next/link'
import { Timeline } from './Timeline'
import { CreatePostForm } from './CreatePostForm'

export const metadata = { title: 'Timeline' }

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      likes: { select: { userId: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">Timeline</h1>
          <nav className="flex items-center gap-4">
            <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
              Profile
            </Link>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/signin' })
              }}
            >
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-3">
            Welcome, <span className="font-medium text-gray-800">{session?.user?.name ?? session?.user?.email}</span>!
          </p>
          <CreatePostForm />
        </div>

        <Timeline posts={posts} currentUserId={userId} />
      </main>
    </div>
  )
}
