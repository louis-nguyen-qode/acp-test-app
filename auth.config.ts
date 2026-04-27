import type { NextAuthConfig } from 'next-auth'

// auth.config.ts is edge-compatible (no Prisma, no bcryptjs)
// It is used by middleware.ts which runs in the Edge runtime.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // redirect to signIn
      }
      return true
    },
  },
  providers: [], // providers are added in auth.ts (Node runtime only)
}
