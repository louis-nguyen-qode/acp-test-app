# CLAUDE.md — Agent Guidance

**Project**: acp-test-app — Todo app with authentication (signup, signin, protected dashboard, CRUD todos, profile page)

This is a **Next.js 14 App Router** project with TypeScript, Prisma 5 (SQLite), NextAuth v5, Tailwind CSS, and Vitest.

Read this file fully before writing any code.

---

## Development commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint (must pass with zero warnings) |
| `npm run typecheck` | TypeScript type check (tsc --noEmit) |
| `npm test` | Run Vitest test suite |
| `npm test -- --coverage --run` | Run tests with coverage report |
| `npx prisma db push` | Push schema changes to SQLite DB |
| `npx prisma studio` | Open Prisma Studio (DB browser) |
| `npx prisma generate` | Re-generate Prisma client after schema changes |
| `bash bootstrap/local-gates.sh` | Run full pre-PR gate (lint + typecheck + test + build) |
| `bash bootstrap/iter-gates.sh <files>` | Run scoped gate on changed files only |

---

## Key files

| File | Purpose |
|---|---|
| `lib/prisma.ts` | Singleton Prisma client — always import from here |
| `lib/auth.ts` | NextAuth v5 config: Credentials provider, PrismaAdapter, JWT callbacks |
| `auth.ts` | Exports `{ auth, signIn, signOut, handlers }` — import auth() from here |
| `auth.config.ts` | Edge-compatible auth config for middleware (no Prisma/bcryptjs) |
| `middleware.ts` | Protects routes, validates callbackUrl |
| `prisma/schema.prisma` | DB schema — edit this, then run `npx prisma db push` |
| `vitest.config.ts` | Test configuration (jsdom, coverage thresholds 80%) |
| `vitest.setup.ts` | Test setup (jest-dom matchers) |
| `STANDARDS.md` | TypeScript/Next.js coding standards |
| `DESIGN.md` | shadcn + Tailwind design system rules |
| `BASELINE.md` | Universal project baseline standards |

---

## App Router conventions

**Server Components (default):**
- Files in `app/` are Server Components by default
- Can be `async` — directly `await` Prisma queries, `await auth()`, etc.
- Cannot use hooks (`useState`, `useEffect`, etc.)
- Cannot attach event handlers directly
- Can import and render Client Components

**Client Components:**
- Add `'use client'` at the top of the file
- Can use hooks and event handlers
- Cannot be `async`
- Cannot directly call Prisma or `auth()`

**Naming convention:**
- Page: `app/<route>/page.tsx`
- Layout: `app/<route>/layout.tsx`
- Loading: `app/<route>/loading.tsx`
- Error: `app/<route>/error.tsx` (must be `'use client'`)
- Route group: `app/(group)/`
- API route: `app/api/<route>/route.ts`

---

## How to add a new page

1. Create `app/<route>/page.tsx` — Server Component
2. Optionally add `app/<route>/loading.tsx` and `app/<route>/error.tsx`
3. For client interactivity, create a `<Name>Client.tsx` with `'use client'` and render it from the page
4. Reference `_reference/example-list/` for a full list page example
5. Reference `_reference/example-form/` for a form page example

---

## How to add an API route

1. Create `app/api/<resource>/route.ts`
2. Export named functions `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
3. Use `NextRequest` and `NextResponse` from `next/server`
4. Validate input with Zod before touching Prisma
5. Return `NextResponse.json({ data }, { status: 200 })`

Example:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const users = await prisma.user.findMany()
  return NextResponse.json({ users })
}
```

---

## How to add a server action

1. Create `actions.ts` in the same directory as the form/component
2. Add `'use server'` at the top
3. Validate input with Zod
4. Return `{ success: boolean, error?: string, data?: T }`
5. Reference `_reference/example-server-action/` for a complete example

---

## Database (Prisma)

- **Schema**: `prisma/schema.prisma` — always edit the schema, never write raw SQL
- **After schema change**: run `npx prisma db push` (dev) or `npx prisma migrate dev` (staging)
- **Import**: always `import { prisma } from '@/lib/prisma'`
- **Pattern**: always `await prisma.model.operation()`
- **NotFound**: wrap with try/catch for `PrismaClientKnownRequestError` (code `P2025`)
- **Testing**: mock Prisma — never call the real DB in unit tests

---

## Auth (NextAuth v5)

**CRITICAL: This project uses NextAuth v5 (`next-auth@beta`). Do NOT use v4 patterns.**

| Task | How |
|---|---|
| Access session in Server Component | `import { auth } from '@/auth'` then `const session = await auth()` |
| Access session in Client Component | `import { useSession } from 'next-auth/react'` |
| Sign in programmatically | `import { signIn } from '@/auth'` then `await signIn('credentials', { ... })` |
| Sign out | `import { signOut } from '@/auth'` then `await signOut()` |
| Protect a server component | `const session = await auth(); if (!session) redirect('/signin')` |
| Protect a route group | Use `app/(protected)/layout.tsx` with auth check |
| Check role | `session.user.role === 'admin'` |

**Never use**: `getServerSession`, `useSession` in Server Components, `import { auth } from 'next-auth'` (wrong — use `'@/auth'`).

---

## Reference templates

Complete working examples are in `_reference/`:

| Directory | What it shows |
|---|---|
| `_reference/example-form/` | react-hook-form + zod + server action + all 4 form states |
| `_reference/example-list/` | Server Component + Suspense + loading/empty/error/populated states |
| `_reference/example-auth-flow/` | Full signup/signin/protected route with NextAuth v5 |
| `_reference/example-component-test/` | Vitest + Testing Library component test patterns |
| `_reference/example-server-action/` | Server action with Zod + Prisma + typed result |

**Always check `_reference/` before implementing a new pattern. Imitate, don't invent.**

---

## Subagents available

| Agent | Use when |
|---|---|
| `feature-implementer` | Implementing any Tier 2 or Tier 3 feature |
| `pattern-scanner` | Finding all instances of a pattern before a fix |
| `verifier` | Verifying a fix worked, or extracting a recipe from a merged PR |
| `test-writer` | Writing tests for an existing source file |
| `auth-specialist` | Any task touching auth (NextAuth, sessions, middleware, signup/signin) |

---

## Domain models (Prisma)

| Model | Key fields |
|---|---|
| `User` | `id`, `email`, `password` (hashed), `name`, `role`, `createdAt` |
| `Todo` | `id`, `title`, `completed`, `userId` (FK→User), `createdAt`, `updatedAt` |

## Core routes

| Route | Type | Auth |
|---|---|---|
| `/` | Server Component | Redirects to `/dashboard` or `/signin` |
| `/signup` | Page + Client Form + Server Action | Public |
| `/signin` | Page + Client Form | Public |
| `/dashboard` | Server Component (protected) | Requires login |
| `/profile` | Server Component (protected) | Requires login |

## Hard rules (never violate)

- No `any` types — use proper TypeScript types or generics
- No `console.log` in production code (use structured logging if needed)
- No `.skip` or `.only` in tests
- No hardcoded secrets — all config via `process.env`
- Files ≤300 lines — split if larger
- PR diff ≤300 lines — surrender if larger
- Run `bash bootstrap/local-gates.sh` before every `git push`
- Every new page needs `loading.tsx` and `error.tsx`
- Prisma env vars required for offline: `PRISMA_SCHEMA_ENGINE_BINARY` + `PRISMA_QUERY_ENGINE_LIBRARY` + `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1`
