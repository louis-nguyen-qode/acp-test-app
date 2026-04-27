import { auth } from '@/auth'
import { Feed } from '@/components/Feed'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const session = await auth()

  let currentUserAvatarUrl: string | null = null
  let currentUserName: string | null = null

  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true, name: true },
    })
    currentUserAvatarUrl = dbUser?.avatarUrl ?? null
    currentUserName = dbUser?.name ?? session.user.email ?? null
  }

  return (
    <main className="min-h-screen bg-gray-100 pt-4 pb-16">
      <div className="mx-auto max-w-2xl px-4">
        <Feed
          currentUserId={session?.user?.id ?? null}
          currentUserAvatarUrl={currentUserAvatarUrl}
          currentUserName={currentUserName}
        />
      </div>
    </main>
  )
}
