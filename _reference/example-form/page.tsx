import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from './ProfileForm'

export default async function ProfilePage() {
  // Server Component: authenticate and fetch data directly
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin?callbackUrl=/dashboard/profile')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  })

  if (!user) {
    redirect('/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Profile settings</CardTitle>
          <CardDescription>
            Update your display name and bio. Changes are saved immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultValues={{
              name: user.name ?? '',
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
