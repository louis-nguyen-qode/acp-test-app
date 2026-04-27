import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getPosts } from '@/actions/posts'
import { Feed } from '@/components/Feed'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const session = await auth()
  if (!session?.user) {
    redirect('/signin')
  }

  const initialPosts = await getPosts()

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id! },
    select: { avatarUrl: true, name: true },
  })

  return (
    <main className="min-h-screen bg-gray-100 pt-4 pb-16">
      <div className="mx-auto max-w-2xl px-4">
        <Feed
          initialPosts={initialPosts}
          currentUserId={session.user.id!}
          currentUserAvatarUrl={dbUser?.avatarUrl ?? null}
          currentUserName={dbUser?.name ?? session.user.email ?? null}
        />
      </div>
    </main>
  )
}
