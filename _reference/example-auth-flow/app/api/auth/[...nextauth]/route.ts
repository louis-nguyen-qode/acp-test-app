// app/api/auth/[...nextauth]/route.ts
// Route handler for NextAuth v5.
// This is the only place where GET/POST are exported for auth routes.

import { handlers } from '@/auth'

export const { GET, POST } = handlers
