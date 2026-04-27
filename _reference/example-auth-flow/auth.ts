// auth.ts — Root auth module.
// This is what the rest of the app imports from.
//
// CORRECT:   import { auth } from '@/auth'
// INCORRECT: import { auth } from 'next-auth'  ← this is v4 and wrong

import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth'

export const { auth, signIn, signOut, handlers } = NextAuth(authConfig)
