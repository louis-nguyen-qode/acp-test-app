'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createPost } from './actions'

const schema = z.object({
  content: z.string().min(1, 'Post content is required').max(2000, 'Post is too long'),
})

type FormValues = z.infer<typeof schema>

export function CreatePostForm() {
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
      const result = await createPost({ content: values.content, type: 'text' })
      if (!result.success) {
        setError(result.error)
      } else {
        reset()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-label="Create post form">
      <textarea
        {...register('content')}
        placeholder="What's on your mind?"
        disabled={isSubmitting}
        rows={3}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
      />
      {(errors.content || error) && (
        <p className="mt-1 text-xs text-red-600">{errors.content?.message ?? error}</p>
      )}
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  )
}
