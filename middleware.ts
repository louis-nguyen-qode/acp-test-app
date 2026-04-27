import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

const { auth } = NextAuth(authConfig)

export default auth(function middleware(req) {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user

  // Validate callbackUrl to prevent open redirect
  const callbackUrl = nextUrl.searchParams.get('callbackUrl')
  if (callbackUrl) {
    // callbackUrl must be same-origin: starts with / but not //
    if (!callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
      const safeUrl = new URL('/dashboard', nextUrl.origin)
      return Response.redirect(safeUrl)
    }
  }

  const isOnProtected = nextUrl.pathname.startsWith('/dashboard')
  if (isOnProtected && !isLoggedIn) {
    const signInUrl = new URL('/signin', nextUrl.origin)
    signInUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return Response.redirect(signInUrl)
  }

  return undefined
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|signin|signup).*)',
  ],
}
