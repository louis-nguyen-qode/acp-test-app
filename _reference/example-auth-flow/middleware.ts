// middleware.ts — Route protection and callbackUrl validation.
// Uses edge-compatible auth.config.ts (no Prisma, no bcryptjs).

import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

const { auth } = NextAuth(authConfig)

export default auth(function middleware(req) {
  const { nextUrl } = req
  const session = req.auth
  const isLoggedIn = !!session?.user

  // Validate callbackUrl to prevent open redirect attacks.
  // Must start with / but NOT // (protocol-relative URL).
  const callbackUrl = nextUrl.searchParams.get('callbackUrl')
  if (callbackUrl) {
    if (!callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
      // Reject and redirect to safe default
      const safeUrl = new URL('/dashboard', nextUrl.origin)
      return Response.redirect(safeUrl)
    }
  }

  // Protect /dashboard and all sub-routes
  const isOnProtected = nextUrl.pathname.startsWith('/dashboard')
  if (isOnProtected && !isLoggedIn) {
    const signInUrl = new URL('/signin', nextUrl.origin)
    signInUrl.searchParams.set('callbackUrl', nextUrl.pathname + nextUrl.search)
    return Response.redirect(signInUrl)
  }

  // Redirect already-signed-in users away from auth pages
  const isOnAuthPage =
    nextUrl.pathname.startsWith('/signin') ||
    nextUrl.pathname.startsWith('/signup')
  if (isOnAuthPage && isLoggedIn) {
    const callbackParam = nextUrl.searchParams.get('callbackUrl')
    const isSafe =
      callbackParam?.startsWith('/') && !callbackParam.startsWith('//')
    const destination = isSafe ? callbackParam : '/dashboard'
    return Response.redirect(new URL(destination, nextUrl.origin))
  }

  return undefined
})

// Run middleware on all routes except static files and API auth
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
