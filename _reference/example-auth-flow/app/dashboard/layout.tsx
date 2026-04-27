import { redirect } from 'next/navigation'
import { auth } from '@/auth'

// Protected layout: all /dashboard/* routes require authentication.
// If not authenticated, redirect to /signin with callbackUrl.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/signin?callbackUrl=/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="font-semibold">My App</span>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            {/* SignOut is a form POST — handled by a Client Component */}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
