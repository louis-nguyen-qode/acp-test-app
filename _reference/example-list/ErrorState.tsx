'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive" role="alert">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
