import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Todos</h1>
        <p className="text-sm text-gray-500">
          {completedCount} of {todos.length} completed
        </p>
      </div>

      <p className="text-sm text-gray-600">
        Welcome back,{' '}
        <span className="font-medium text-gray-800">
          {session?.user?.name ?? session?.user?.email}
        </span>
        !
      </p>

      <CreateTodoForm />

      <TodoList todos={todos} />
    </div>
  )
}
