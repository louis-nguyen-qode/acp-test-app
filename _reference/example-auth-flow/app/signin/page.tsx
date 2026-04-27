import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SigninForm } from './SigninForm'

// Wrap SigninForm in Suspense because it uses useSearchParams()
// which causes the parent to be treated as a dynamic page.
export default function SigninPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Enter your email and password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-muted" />}>
              <SigninForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
