'use server'

import bcryptjs from 'bcryptjs'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { signIn } from '@/auth'

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
})

export type SignupResult =
  | { success: true }
  | { success: false; error: string; field?: 'name' | 'email' | 'password' }

export async function signup(formData: unknown): Promise<SignupResult> {
  // 1. Validate input
  const parsed = signupSchema.safeParse(formData)
  if (!parsed.success) {
    const err = parsed.error.errors[0]
    return {
      success: false,
      error: err?.message ?? 'Invalid input',
      field: err?.path[0] as 'name' | 'email' | 'password' | undefined,
    }
  }

  const { name, email, password } = parsed.data

  // 2. Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: 'An account with this email already exists.', field: 'email' }
  }

  // 3. Hash password
  const hashedPassword = await bcryptjs.hash(password, 12)

  // 4. Create user
  try {
    await prisma.user.create({
      data: { name, email, password: hashedPassword, role: 'user' },
    })
  } catch {
    return { success: false, error: 'Failed to create account. Please try again.' }
  }

  // 5. Sign in immediately after account creation
  try {
    await signIn('credentials', { email, password, redirect: false })
  } catch (e) {
    if (e instanceof AuthError) {
      return { success: false, error: 'Account created but sign-in failed. Please sign in manually.' }
    }
    throw e
  }

  // 6. Redirect to dashboard (redirect throws internally in Next.js)
  redirect('/dashboard')
}
