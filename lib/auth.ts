// lib/auth.ts — NextAuth v5 configuration (Node runtime only)
// CRITICAL: This uses next-auth@beta (v5) syntax.
// Import auth() from '@/auth', NOT from 'next-auth'.
// NEXTAUTH_SECRET must be set in .env.local

import bcryptjs from 'bcryptjs'
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const credentialsSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export const authConfig: NextAuthConfig = {
  // JWT strategy — no DB sessions required
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Custom auth pages
  pages: {
    signIn: '/signin',
    error: '/signin',
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

        // 2. Find user by email
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user) return null

        // 3. Verify password hash
        const passwordValid = await bcryptjs.compare(
          parsed.data.password,
          user.password
        )
        if (!passwordValid) return null

        // 4. Return user object (embedded in JWT via jwt callback)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],

  callbacks: {
    // Embed user.id into the JWT as token.sub
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },

    // Expose session.user.id from token.sub
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      return session
    },
  },
}
