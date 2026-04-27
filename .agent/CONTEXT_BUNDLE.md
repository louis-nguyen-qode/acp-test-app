# CONTEXT_BUNDLE for goal 01KQ76SNETHBD63AYXE9B81SY7
# Target: louis-nguyen-qode/acp-test-app
# Generated: 2026-04-27T10:13:56.119Z

## PLAN.json

```json
[
  {
    "id": "01KQ76T6FTVR5WYSYP0VC92DG4",
    "title": "Add password change API route with validation",
    "spec": "Create a Next.js Route Handler at `app/api/user/change-password/route.ts` that accepts POST requests with `{ currentPassword: string, newPassword: string, confirmPassword: string }`. Use NextAuth v5's `auth()` helper to verify the user is authenticated; return 401 if not. Retrieve the user record from Prisma using `prisma.user.findUnique` by the session user id, then use `bcryptjs` to compare `currentPassword` against the stored hash — return 400 with `{ error: 'Current password is incorrect' }` on mismatch. Validate that `newPassword` matches `confirmPassword` and is at least 8 characters; return 400 with appropriate error messages on failure. Hash `newPassword` with `bcryptjs.hash(newPassword, 12)` and update the record via `prisma.user.update`. Return 200 `{ message: 'Password updated successfully' }` on success. Write Vitest unit tests in `app/api/user/change-password/route.test.ts` covering: unauthenticated request, wrong current password, mismatched new passwords, short password, and successful update.",
    "tier": "T2",
    "depends_on": "[]",
    "wave": 0,
    "pattern_match": null
  },
  {
    "id": "01KQ76T6FTEASD54N9XSEA8FPB",
    "title": "Build change password form component",
    "spec": "Create a client component `components/ChangePasswordForm.tsx` using React controlled inputs and `useState` for form state (`currentPassword`, `newPassword`, `confirmPassword`) and submission status (`idle | loading | success | error`). On submit, call `fetch('/api/user/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })` and display inline success or error messages returned from the API. Use Tailwind CSS for styling: a card container with three labeled password `<input type='password'>` fields, a submit `<button>` that shows a loading spinner (via a simple animated Tailwind class) while `status === 'loading'`, a green success banner when `status === 'success'`, and a red error message when `status === 'error'`. Clear password fields on successful submission. All fields are required and the form prevents submission if `newPassword !== confirmPassword` with a client-side inline error before even hitting the API.",
    "tier": "T2",
    "depends_on": "[\"task-001\"]",
    "wave": 1,
    "pattern_match": null
  },
  {
    "id": "01KQ76T6FVQZYWHWHJDC448N6J",
    "title": "Create change password settings page",
    "spec": "Create a Next.js page at `app/settings/change-password/page.tsx` as a server component. Use NextAuth v5's `auth()` to get the current session; redirect to `/api/auth/signin` using `redirect()` from `next/navigation` if no session exists, ensuring the page is protected server-side. Render a page layout with a heading 'Change Password' and import and render the `<ChangePasswordForm />` client component. Add a navigation link to this page in the existing user settings or account navigation area (update `components/UserNav.tsx` or equivalent nav file if it exists, otherwise note the link path in a comment). The page should be minimal and focused, using Tailwind for spacing and typography consistent with the rest of the app.",
    "tier": "T2",
    "depends_on": "[\"task-002\"]",
    "wave": 2,
    "pattern_match": null
  }
]
```
