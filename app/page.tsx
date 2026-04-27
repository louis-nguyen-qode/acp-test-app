import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'

export const metadata = { title: 'Welcome' }

export default async function Home() {
  const session = await auth()

  // Authenticated users go straight to their dashboard
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
      {/* Gradient hero card */}
      <div className="w-full max-w-lg rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 p-10 shadow-lg">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          TodoApp
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Stay organised. Track what matters. Get things done.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signin"
            className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-md border border-blue-300 bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}
