'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { AlertCircle, Check, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTodo, type CreateTodoResult } from './actions'

// The initial state returned before the form is submitted
const initialState: CreateTodoResult | null = null

// Submit button — must be a separate component to access useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Creating...
        </>
      ) : (
        <>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Create todo
        </>
      )}
    </Button>
  )
}

export function CreateTodoForm() {
  const [state, formAction] = useFormState(createTodo, initialState)

  return (
    <form action={formAction} className="space-y-4" aria-label="Create todo form">
      {/* Success message */}
      {state?.success && (
        <Alert role="status">
          <Check className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Todo &ldquo;{state.data.title}&rdquo; created successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Form-level error */}
      {state && !state.success && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Title field */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          type="text"
          placeholder="What needs to be done?"
          aria-describedby={
            state && !state.success && state.fieldErrors?.title
              ? 'title-error'
              : undefined
          }
          required
        />
        {state && !state.success && state.fieldErrors?.title && (
          <p id="title-error" className="text-sm text-destructive" role="alert">
            {state.fieldErrors.title[0]}
          </p>
        )}
      </div>

      {/* Priority field */}
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select name="priority" defaultValue="medium">
          <SelectTrigger id="priority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SubmitButton />
    </form>
  )
}
