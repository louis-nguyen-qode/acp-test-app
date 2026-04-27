// Navigation link: /settings/change-password
// Add a link to this page from your dashboard or profile nav area.
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { ChangePasswordForm } from '@/components/ChangePasswordForm'

export const metadata = { title: 'Change Password' }

export default async function ChangePasswordPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/api/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to dashboard
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Change Password</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <ChangePasswordForm />
      </main>
    </div>
  )
}
