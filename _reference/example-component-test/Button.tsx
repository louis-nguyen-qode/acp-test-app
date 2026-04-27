'use client'

import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { Button as ShadcnButton } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ComponentPropsWithoutRef } from 'react'

interface LoadingButtonProps extends ComponentPropsWithoutRef<typeof ShadcnButton> {
  /** When true, shows a spinner and disables the button */
  loading?: boolean
  /** Label shown while loading (for screen readers and visible text) */
  loadingText?: string
}

/**
 * LoadingButton wraps the shadcn Button with a built-in loading state.
 * Shows a spinner icon and disables interaction while loading.
 *
 * Usage:
 *   <LoadingButton loading={isSubmitting} loadingText="Saving...">
 *     Save changes
 *   </LoadingButton>
 */
export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  function LoadingButton(
    { children, loading = false, loadingText, disabled, className, ...props },
    ref
  ) {
    const isDisabled = disabled || loading

    return (
      <ShadcnButton
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        className={cn(className)}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{loadingText ?? children}</span>
          </>
        ) : (
          children
        )}
      </ShadcnButton>
    )
  }
)
