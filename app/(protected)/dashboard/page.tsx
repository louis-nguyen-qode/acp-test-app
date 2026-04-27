import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { signOut } from '@/auth'
import Link from 'next/link'
import { TodoList } from './TodoList'
import { CreateTodoForm } from './CreateTodoForm'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const todos = await prisma.todo.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const completedCount = todos.filter((t) => t.completed).length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">My Todos</h1>
          <nav className="flex items-center gap-4">
            <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
              Profile
            </Link>
            <Link
              href="/settings/change-password"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Change Password
            </Link>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/signin' })
              }}
            >
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <div className="text-sm text-gray-500">
          Welcome back, <span className="font-medium text-gray-700">{session?.user?.name ?? session?.user?.email}</span>!
          {' '}&mdash; {completedCount} of {todos.length} completed
        </div>

        <CreateTodoForm />

        <TodoList todos={todos} />
      </main>
    </div>
  )
}
