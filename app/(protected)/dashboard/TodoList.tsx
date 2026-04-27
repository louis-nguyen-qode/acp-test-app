'use client'

import { useState, useTransition } from 'react'
import { deleteTodo, toggleTodo } from './actions'

type Todo = {
  id: string
  title: string
  completed: boolean
  createdAt: Date
}

export function TodoList({ todos }: { todos: Todo[] }) {
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)

  function handleToggle(id: string) {
    setPendingId(id)
    startTransition(async () => {
      await toggleTodo(id)
      setPendingId(null)
    })
  }

  function handleDelete(id: string) {
    setPendingId(id)
    startTransition(async () => {
      await deleteTodo(id)
      setPendingId(null)
    })
  }

  if (todos.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        No todos yet. Add one above to get started!
      </p>
    )
  }

  return (
    <ul className="space-y-2" aria-label="Todo list">
      {todos.map((todo) => (
        <li
          key={todo.id}
          className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-3 shadow-sm"
        >
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => handleToggle(todo.id)}
            disabled={isPending && pendingId === todo.id}
            aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
          />
          <span
            className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}
          >
            {todo.title}
          </span>
          <button
            onClick={() => handleDelete(todo.id)}
            disabled={isPending && pendingId === todo.id}
            aria-label={`Delete "${todo.title}"`}
            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}
