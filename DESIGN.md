# DESIGN.md — shadcn + Tailwind Design System

UI design rules for this project. Read alongside STANDARDS.md.

---

## Component library: shadcn/ui

This project uses **shadcn/ui** as the component library.

### Installing a new shadcn component

```bash
npx shadcn-ui@latest add <component-name>
# Examples:
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
```

Components are installed into `components/ui/`. Never edit them — if you need customization, create a wrapper component.

### Component import path

```ts
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
```

---

## Styling: Tailwind CSS

- **Utility classes only** — no custom CSS unless it is genuinely impossible to express in Tailwind
- If you write custom CSS, add a comment explaining why Tailwind was insufficient
- No inline `style={{}}` props — use Tailwind classes
- Use `cn()` utility (from `@/lib/utils`) to merge conditional classes

```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  'rounded-lg p-4',
  isActive && 'bg-primary text-primary-foreground',
  isDisabled && 'opacity-50 cursor-not-allowed'
)} />
```

---

## Dark mode

- Strategy: `class` (via `next-themes`)
- Default: system preference
- Toggle: `ThemeProvider` wraps the app layout; `ModeToggle` component in header

```tsx
// app/layout.tsx
import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## Color system

Use **shadcn/ui CSS variables** — do not use raw Tailwind color values (e.g., `blue-500`) for semantic UI elements.

| Variable | Use |
|---|---|
| `bg-background` / `text-foreground` | Page background and primary text |
| `bg-card` / `text-card-foreground` | Card backgrounds |
| `bg-primary` / `text-primary-foreground` | Primary action buttons, links |
| `bg-secondary` / `text-secondary-foreground` | Secondary UI elements |
| `bg-muted` / `text-muted-foreground` | Subdued/inactive UI |
| `bg-accent` / `text-accent-foreground` | Hover states, highlights |
| `bg-destructive` / `text-destructive-foreground` | Delete, error, danger actions |
| `border` | Default border color |
| `ring` | Focus ring |

---

## Typography

- Font: **Inter** via `next/font/google`
- Base size: 16px (Tailwind default)
- Heading hierarchy: `text-3xl font-bold` (h1) → `text-2xl font-semibold` (h2) → `text-xl font-semibold` (h3) → `text-lg font-medium` (h4)
- Body text: `text-sm text-foreground` or `text-base text-foreground`
- Subdued text: `text-sm text-muted-foreground`
- Monospace (code): `font-mono text-sm`

---

## Spacing

- Use Tailwind's 4px base scale exclusively
- Common patterns:
  - Page padding: `px-4 py-8 md:px-6 lg:px-8`
  - Section gap: `space-y-6` or `gap-6`
  - Card padding: `p-6`
  - Form field gap: `space-y-4`
  - Button padding: handled by shadcn (do not override)

---

## Forms

Always use these shadcn components together for forms:

```tsx
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
```

- `FormLabel` — field label (linked to input via htmlFor automatically)
- `FormControl` — wraps the input; provides aria-* props automatically
- `FormMessage` — renders the field error from react-hook-form
- `FormDescription` — optional helper text below the field

All form components handle accessibility automatically when used correctly.

---

## Button variants

Use shadcn Button with appropriate variant — do not create ad-hoc styled buttons:

| Variant | Use |
|---|---|
| `default` | Primary action (e.g., "Save", "Create") |
| `destructive` | Destructive action (e.g., "Delete", "Remove") |
| `outline` | Secondary action (e.g., "Cancel", "Back") |
| `ghost` | Tertiary action, inline (e.g., menu items, icon buttons) |
| `link` | Looks like a hyperlink |

```tsx
<Button variant="default">Save changes</Button>
<Button variant="destructive">Delete account</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost" size="icon"><TrashIcon /></Button>
<Button variant="link" asChild><Link href="/settings">Settings</Link></Button>
```

Size variants: `default`, `sm`, `lg`, `icon`.

---

## Loading states

Use the shadcn `Skeleton` component for loading states. Every list or data view must have a loading state.

```tsx
import { Skeleton } from '@/components/ui/skeleton'

// Pattern: 3 placeholder cards
export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-3">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      ))}
    </div>
  )
}
```

Use `loading.tsx` (Next.js route-level) for full-page loading states.

---

## Error states

Use shadcn `Alert` with `AlertDescription` for inline error messages:

```tsx
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export function ErrorState({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

// For page-level errors with retry:
export function ErrorPage({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h3 className="text-lg font-semibold">Something went wrong</h3>
      <p className="text-sm text-muted-foreground">{error}</p>
      <Button variant="outline" onClick={onRetry}>Try again</Button>
    </div>
  )
}
```

---

## Empty states

Every list view must have an empty state. Pattern: centered container with icon + heading + CTA:

```tsx
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
      <Users className="h-12 w-12 text-muted-foreground" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">No users yet</h3>
        <p className="text-sm text-muted-foreground">
          Get started by inviting your first user.
        </p>
      </div>
      <Button asChild>
        <Link href="/users/invite">Invite user</Link>
      </Button>
    </div>
  )
}
```

---

## Four states: every list view must implement all four

Every component that displays a list of data must handle:

1. **Loading** — `<LoadingSkeleton />` (Skeleton cards)
2. **Empty** — `<EmptyState />` (icon + heading + CTA)
3. **Error** — `<ErrorState message={...} onRetry={...} />` (alert + retry)
4. **Populated** — the actual list of items

Reference: `_reference/example-list/` shows the complete pattern.

---

## Responsive layout

- Mobile-first: write mobile styles first, use `md:` and `lg:` prefixes to scale up
- Max content width: `max-w-7xl mx-auto` for page containers
- Navigation: drawer on mobile, sidebar on desktop
- Cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Tables: on mobile, consider a card list view instead

---

## Accessibility

- All interactive elements must be keyboard-navigable
- Focus rings must be visible — Tailwind's `focus-visible:ring` (shadcn handles this for its components)
- Images must have meaningful `alt` text (or `alt=""` for decorative images)
- Icons paired with text: `<Icon aria-hidden="true" />` + visible label
- Icon-only buttons: `<Button aria-label="Delete item" size="icon"><TrashIcon aria-hidden="true" /></Button>`
- Color must not be the only way to convey information — add text or icon alongside color
- Heading hierarchy must be sequential (h1 → h2 → h3, no skipping)

---

## Icons

Use **Lucide React** (bundled with shadcn):

```tsx
import { Loader2, Check, X, AlertCircle, Users, Plus, Trash2, Edit2 } from 'lucide-react'
```

Spinning loader pattern:
```tsx
<Loader2 className="h-4 w-4 animate-spin" />
```

---

## Layout patterns

### Page layout

```tsx
export default function Page() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Page Title</h1>
          <Button>Primary Action</Button>
        </div>
        {/* content */}
      </div>
    </main>
  )
}
```

### Settings/form page (centered, narrow)

```tsx
<div className="container mx-auto px-4 py-8 max-w-2xl">
  <Card>
    <CardHeader>
      <CardTitle>Profile Settings</CardTitle>
    </CardHeader>
    <CardContent>
      <ProfileForm />
    </CardContent>
  </Card>
</div>
```

### Two-column layout (sidebar + content)

```tsx
<div className="flex gap-6">
  <aside className="w-64 shrink-0">
    <nav>{/* sidebar nav */}</nav>
  </aside>
  <main className="flex-1 min-w-0">
    {/* content */}
  </main>
</div>
```
