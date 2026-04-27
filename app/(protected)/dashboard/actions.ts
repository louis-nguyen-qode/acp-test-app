'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
})

export type TodoActionResult = { success: true } | { success: false; error: string }

export async function createTodo(formData: unknown): Promise<TodoActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  const parsed = createTodoSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  await prisma.todo.create({
    data: {
      title: parsed.data.title,
      userId: session.user.id,
    },
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteTodo(todoId: string): Promise<TodoActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  const todo = await prisma.todo.findUnique({ where: { id: todoId } })
  if (!todo || todo.userId !== session.user.id) {
    return { success: false, error: 'Todo not found' }
  }

  await prisma.todo.delete({ where: { id: todoId } })
  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleTodo(todoId: string): Promise<TodoActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

  const todo = await prisma.todo.findUnique({ where: { id: todoId } })
  if (!todo || todo.userId !== session.user.id) {
    return { success: false, error: 'Todo not found' }
  }

  await prisma.todo.update({
    where: { id: todoId },
    data: { completed: !todo.completed },
  })

  revalidatePath('/dashboard')
  return { success: true }
}
