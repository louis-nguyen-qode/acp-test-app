import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/Navbar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/signin?callbackUrl=/dashboard')
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
