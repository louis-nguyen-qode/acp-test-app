import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Protected page — uses auth() to get the session.
// IMPORTANT: import { auth } from '@/auth', not from 'next-auth'.
export default async function DashboardPage() {
  const session = await auth()

  // Belt-and-suspenders check (middleware should already handle this,
  // but layout.tsx is the primary guard for the /dashboard group)
  if (!session?.user) {
    redirect('/signin?callbackUrl=/dashboard')
  }

  const user = session.user
  const role = (user as { role?: string }).role ?? 'user'

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Welcome back</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{user.name ?? user.email}</p>
              <p className="text-sm text-muted-foreground">Role: {role}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
