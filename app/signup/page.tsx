import { Suspense } from 'react'
import { SignupForm } from './SignupForm'

export const metadata = { title: 'Sign Up' }

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Create account</h1>
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}
