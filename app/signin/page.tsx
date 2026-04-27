import { Suspense } from 'react'
import { SigninForm } from './SigninForm'

export const metadata = { title: 'Sign In' }

export default function SigninPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Sign in</h1>
        <Suspense>
          <SigninForm />
        </Suspense>
      </div>
    </div>
  )
}
