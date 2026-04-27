'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createTodo } from './actions'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
})

type FormValues = z.infer<typeof schema>

export function CreateTodoForm() {
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setError(null)
    startTransition(async () => {
      const result = await createTodo(values)
      if (!result.success) {
        setError(result.error)
      } else {
        reset()
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex gap-2"
      aria-label="Create todo form"
    >
      <div className="flex-1">
        <input
          {...register('title')}
          type="text"
          placeholder="What needs to be done?"
          disabled={isSubmitting}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        {(errors.title || error) && (
          <p className="mt-1 text-xs text-red-600">{errors.title?.message ?? error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {isSubmitting ? 'Adding…' : 'Add todo'}
      </button>
    </form>
  )
}
