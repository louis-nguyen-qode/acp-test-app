# STANDARDS.md — TypeScript + Next.js 14 Coding Standards

Stack-specific implementation rules. Read alongside BASELINE.md (universal) and DESIGN.md (UI).

---

## TypeScript

### Strict mode — non-negotiable

`tsconfig.json` must include:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Type rules

- **No `any`** — ever. Use `unknown` with narrowing if the type is genuinely unknown.
- **No type assertions (`as`)** without a comment justifying why it's safe.
- **No `!` (non-null assertions)** without a comment; prefer early return or optional chaining.
- **No `@ts-ignore` / `@ts-expect-error`** without an inline comment explaining the suppression.
- Prefer `interface` for object shapes that may be extended; `type` for unions, intersections, primitives.
- Export types alongside the functions that use them.
- Generic functions over `any[]` — write `function process<T>(items: T[]): T[]`.

### Imports

- Use path alias `@/` for all imports from project root (e.g. `import { prisma } from '@/lib/prisma'`).
- Never use relative `../../` imports across domain boundaries.
- Group imports: external packages → `@/lib` → `@/components` → local files (separated by blank line).

---

## Next.js 14 App Router

### Server Components (default)

- Files in `app/` are Server Components unless `'use client'` is present.
- Can be `async` — `await` Prisma queries, `await auth()`, `fetch()` directly.
- Cannot use `useState`, `useEffect`, `useContext`, or any other React hooks.
- Cannot attach event handlers (`onClick`, `onChange`, etc.).
- Can pass serializable props to Client Components.
- Can import and render Client Components.
- For auth: `const session = await auth()` then `if (!session) redirect('/signin')`.

```tsx
// Correct Server Component pattern
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect('/signin')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })
  if (!user) redirect('/signin')

  return <ProfileForm user={user} />
}
```

### Client Components

- Must have `'use client'` as the **very first line** of the file.
- Can use hooks, event handlers, browser APIs.
- Cannot be `async`.
- Cannot call Prisma directly.
- Cannot call `await auth()` (use `useSession()` from `next-auth/react` instead).
- Keep Client Components small — extract pure UI from data-fetching logic.

```tsx
'use client'

import { useState } from 'react'

// Correct Client Component pattern
export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

### Server Actions

- Must have `'use server'` as the **very first line** of the file (or function).
- Always validate input with Zod before any other operation.
- Return a typed result object: `{ success: boolean; error?: string; data?: T }`.
- Never throw from a server action — catch errors and return `{ success: false, error: message }`.
- Use `revalidatePath()` or `revalidateTag()` after mutations.

```ts
'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  name: z.string().min(1).max(100),
})

export async function updateName(
  formData: unknown
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  const parsed = schema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
    })
    revalidatePath('/dashboard/profile')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update name' }
  }
}
```

### Route handlers (API routes)

- File: `app/api/<resource>/route.ts`
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- Always validate request body with Zod for mutation methods
- Return `NextResponse.json(data, { status })` — never throw bare errors

```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({ name: z.string().min(1) })

export async function POST(req: NextRequest) {
  const body: unknown = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  // ...
  return NextResponse.json({ data }, { status: 201 })
}
```

---

## Prisma

- **Always** import from `@/lib/prisma`: `import { prisma } from '@/lib/prisma'`
- **Always** `await` every Prisma call — never fire-and-forget
- **NotFound**: wrap in try/catch, handle `PrismaClientKnownRequestError` with code `P2025`
- **Never** write raw SQL in feature code; use Prisma's query API
- **Select only needed fields** — use `select` or `include` to avoid over-fetching
- After schema changes: `npx prisma db push` (dev) / `npx prisma migrate dev` (production)
- Testing: mock `@/lib/prisma` with `vi.mock`; never use real DB in unit tests

```ts
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

async function getUserById(id: string) {
  try {
    return await prisma.user.findUniqueOrThrow({ where: { id } })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return null
    }
    throw e
  }
}
```

---

## NextAuth v5

**This project uses `next-auth@beta` (v5). Do NOT use v4 APIs.**

### Auth import rules

| What you want | Import | Do NOT use |
|---|---|---|
| `auth()` in server components/actions | `import { auth } from '@/auth'` | `import { getServerSession } from 'next-auth'` |
| `signIn()` / `signOut()` server-side | `import { signIn, signOut } from '@/auth'` | `import { signIn } from 'next-auth/react'` in server context |
| Session in Client Component | `import { useSession } from 'next-auth/react'` | `await auth()` in client |
| Route handlers | `import { handlers } from '@/auth'` | — |

### Session access patterns

```ts
// Server Component
import { auth } from '@/auth'

const session = await auth()
if (!session?.user) redirect('/signin')
const userId = session.user.id
const role = (session.user as { role: string }).role
```

```tsx
'use client'
// Client Component
import { useSession } from 'next-auth/react'

const { data: session, status } = useSession()
if (status === 'loading') return <Skeleton />
if (!session) return <SignInPrompt />
```

### callbackUrl validation — mandatory

Whenever handling a `callbackUrl` parameter, validate it prevents open redirect:

```ts
function isSafeCallbackUrl(url: string | null): boolean {
  if (!url) return false
  // Must start with / but NOT //
  return url.startsWith('/') && !url.startsWith('//')
}

const redirectTo = isSafeCallbackUrl(callbackUrl) ? callbackUrl : '/dashboard'
```

---

## Forms

- Use `react-hook-form` + `zod` resolver for all forms with validation
- Always define the Zod schema in a separate `schema.ts` file
- Use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` components
- Show per-field inline errors — `FormMessage` auto-renders errors from react-hook-form
- Show form-level error (e.g., "Email already in use") in an `Alert` above the submit button
- Disable submit button while submitting
- Show success state after successful submission

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, type ProfileFormValues } from './schema'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function ProfileForm() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '' },
  })

  async function onSubmit(values: ProfileFormValues) {
    // call server action
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## Error handling

- Every `app/<route>/page.tsx` must have a sibling `error.tsx` (Client Component, uses `'use client'`)
- Every `app/<route>/page.tsx` must have a sibling `loading.tsx` (Server Component)
- Server actions: always `try/catch`, return `{ success: false, error }` — never let errors propagate
- API routes: always return proper HTTP status codes with error messages
- Prisma errors: catch and map to user-friendly messages before returning

```tsx
// error.tsx
'use client'

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

---

## Testing (Vitest)

- Test file location: alongside source file — `MyComponent.test.tsx` next to `MyComponent.tsx`
- Globals enabled — no need to import `describe`, `it`, `expect`
- Mock Prisma: `vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: vi.fn() } } }))`
- Mock auth: `vi.mock('@/auth', () => ({ auth: vi.fn() }))`
- Use `@testing-library/react` for component tests
- Use `@testing-library/user-event` for user interactions (not `fireEvent`)
- Every test must have at least one `expect()` call
- No `.skip` or `.only` in committed code
- Coverage threshold: 80% lines/branches/functions per file (enforced in vitest.config.ts)

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders the label', () => {
    render(<MyComponent label="Hello" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MyComponent label="Hello" onChange={onChange} />)
    await user.click(screen.getByRole('button'))
    expect(onChange).toHaveBeenCalledOnce()
  })
})
```

---

## File size and structure

- **300 line maximum** per file — if a file grows beyond 300 lines, split it
- **One component per file** for React components
- **Collocate**: keep form, schema, actions, and test in the same directory
- **Directory index**: don't use `index.ts` barrel files — import directly

```
app/dashboard/profile/
├── page.tsx          # Server Component (renders form)
├── ProfileForm.tsx   # Client Component
├── actions.ts        # Server actions
├── schema.ts         # Zod schema
├── loading.tsx       # Skeleton
├── error.tsx         # Error boundary
└── ProfileForm.test.tsx  # Vitest tests
```

---

## What NOT to do

- No `any` type
- No `as any` or `as unknown as T` without justification comment
- No `console.log` (use `console.error` only in genuine error paths)
- No `debugger` statements
- No `.skip` or `.only` in tests
- No raw SQL in feature code
- No `getServerSession` from `next-auth` (v4 API — use `auth()` from `@/auth`)
- No `import { signIn } from 'next-auth/react'` in server components
- No `useSession` in server components
- No hardcoded URLs, ports, passwords, API keys
- No `fetch()` calls from Client Components to your own API — use server actions instead
- No inline styles (use Tailwind classes)
- No custom CSS unless truly unavoidable (documented in code)
