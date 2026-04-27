// lib/auth.ts — NextAuth v5 configuration (Node runtime only)
// CRITICAL: This uses next-auth@beta (v5) syntax.
// Import auth() from '@/auth', NOT from 'next-auth'.

import { PrismaAdapter } from '@auth/prisma-adapter'
import bcryptjs from 'bcryptjs'
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const credentialsSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const authConfig: NextAuthConfig = {
  // Use PrismaAdapter for session storage (required for JWT with DB)
  adapter: PrismaAdapter(prisma),

  // JWT strategy — safe for edge deployments with proper adapter setup
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Custom pages
  pages: {
    signIn: '/signin',
    error: '/signin', // Error redirects back to signin with error param
  },

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        // 1. Validate input shape
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        // 2. Find user
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user) return null

        // 3. Verify password
        const passwordValid = await bcryptjs.compare(parsed.data.password, user.password)
        if (!passwordValid) return null

        // 4. Return user object (becomes JWT payload via jwt callback)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],

  callbacks: {
    // Called when a JWT is created or updated
    async jwt({ token, user }) {
      if (user) {
        // First sign in: persist role and id into the token
        token.id = user.id
        token.role = (user as { role?: string }).role ?? 'user'
      }
      return token
    },

    // Called when session is accessed
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        ;(session.user as { role?: string }).role = token.role as string
      }
      return session
    },
  },
}
