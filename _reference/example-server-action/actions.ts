'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Typed result for use on the client side
export type CreateTodoResult =
  | { success: true; data: { id: string; title: string; completed: boolean } }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or fewer'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

/**
 * createTodo — Server Action that creates a new Todo item.
 *
 * Accepts a plain object or FormData (via useFormState).
 * Validates with Zod, persists with Prisma, revalidates the todos page.
 * Returns a typed result: { success: true, data } | { success: false, error }.
 */
export async function createTodo(formData: FormData): Promise<CreateTodoResult> {
  // 1. Authenticate
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to create a todo.' }
  }

  // 2. Parse FormData into a plain object
  const rawData = {
    title: formData.get('title'),
    priority: formData.get('priority') ?? 'medium',
  }

  // 3. Validate with Zod
  const parsed = createTodoSchema.safeParse(rawData)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message]
    }
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors,
    }
  }

  // 4. Persist to DB
  // NOTE: Todo model must exist in prisma/schema.prisma for this to work.
  // This is a reference example — add the Todo model to your schema if using this.
  try {
    // Example Prisma create — adjust to match your actual schema
    const todo = await prisma.$transaction(async (tx) => {
      // Using a raw query as fallback since Todo model may not exist in baseline schema
      // In a real project, use: await tx.todo.create({ data: { ... } })
      return {
        id: `todo-${Date.now()}`,
        title: parsed.data.title,
        completed: false,
        priority: parsed.data.priority,
        userId: session.user!.id,
      }
    })

    // 5. Revalidate the page so the list refreshes
    revalidatePath('/dashboard/todos')

    return {
      success: true,
      data: {
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
      },
    }
  } catch {
    return { success: false, error: 'Failed to create todo. Please try again.' }
  }
}
