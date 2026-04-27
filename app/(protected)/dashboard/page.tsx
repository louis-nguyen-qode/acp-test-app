import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Timeline } from './Timeline'
import { CreatePostForm } from './CreatePostForm'
import { SignOutButton } from './SignOutButton'

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
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">
              Welcome, <span className="font-medium text-gray-800">{session?.user?.name ?? session?.user?.email}</span>!
            </p>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/profile" className="text-gray-500 hover:text-gray-900 transition-colors">
                Profile
              </Link>
              <SignOutButton />
            </div>
          </div>
          <CreatePostForm />
        </div>

        <Timeline posts={posts} currentUserId={userId} />
      </main>
    </div>
  )
}
