import Link from 'next/link'
import { auth } from '@/auth'
import { signOut } from '@/auth'

export async function Navbar() {
  const session = await auth()

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
        {/* App name */}
        <Link
          href="/"
          className="text-lg font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          TodoApp
        </Link>

        {/* Right-side nav */}
        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <span className="text-sm text-gray-600 hidden sm:block">
                {session.user.name ?? session.user.email}
              </span>
              <Link
                href="/profile"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
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
                  className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none transition-colors"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
