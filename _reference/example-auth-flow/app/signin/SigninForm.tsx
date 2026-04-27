'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { z } from 'zod'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const signinSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type SigninFormValues = z.infer<typeof signinSchema>

export function SigninForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formError, setFormError] = useState<string | null>(null)

  // Read and validate callbackUrl — must be same-origin
  const rawCallbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const callbackUrl =
    rawCallbackUrl.startsWith('/') && !rawCallbackUrl.startsWith('//')
      ? rawCallbackUrl
      : '/dashboard'

  const form = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: SigninFormValues) {
    setFormError(null)

    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false, // Handle redirect manually to show errors
    })

    if (result?.error) {
      setFormError('Invalid email or password. Please try again.')
      return
    }

    // Successful sign in — navigate to callbackUrl
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        aria-label="Sign in form"
      >
        {formError && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="jane@example.com"
                  autoComplete="email"
                  disabled={form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="Your password"
                  autoComplete="current-password"
                  disabled={form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
            Sign up
          </Link>
        </p>
      </form>
    </Form>
  )
}
