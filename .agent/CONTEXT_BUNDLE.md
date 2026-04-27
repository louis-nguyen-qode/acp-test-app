# CONTEXT_BUNDLE for goal 01KQ7KSSX201N6G8H18F4VSJHV
# Target: louis-nguyen-qode/acp-test-app
# Generated: 2026-04-27T14:14:09.755Z

## PLAN.json

```json
[
  {
    "id": "01KQ7MK1R0PA097NGX58JH2227",
    "title": "Fix low-contrast input text color across the app",
    "spec": "Locate all input, textarea, and select elements across the codebase — including shared form components and any Tailwind base styles in globals.css. The issue is likely a missing or overly light text-color class (e.g. text-gray-200 on a white background, or a dark-mode class bleeding into light mode). Apply a high-contrast text color (e.g. text-gray-900 dark:text-white) to all input variants. Also check for any global CSS rules in globals.css targeting input[type] that may override Tailwind classes. Acceptance criteria: all text typed into inputs is clearly legible in both light and dark mode, WCAG AA contrast ratio met.",
    "tier": "T2",
    "depends_on": "[]",
    "wave": 0,
    "pattern_match": null
  },
  {
    "id": "01KQ7MK1R0RK4M4SMP8M82KVQK",
    "title": "Add image upload and update feature to profile or content forms",
    "spec": "Implement an image attachment/update capability on the relevant form(s) (e.g. user profile, post editor, or item form — identify by reviewing existing form components). Add an ImageUpload component that renders a clickable image preview area and a hidden <input type='file' accept='image/*' />. On file selection, generate a local object URL for preview using URL.createObjectURL(). Wire the file to the form's submit handler and upload it via a multipart POST or PATCH to the relevant API route (e.g. /api/profile or /api/posts/[id]). On the API route, use the 'formidable' or built-in NextRequest formData() to parse the file, save it to /public/uploads/ or an external store, and persist the resulting URL in the database via Prisma. Show the current image (if any) as the default preview. Include a remove/clear button that nulls out the image field. Acceptance criteria: user can select, preview, upload, and update an image; existing image is shown on load; image URL is persisted to DB; works on create and edit flows.",
    "tier": "T3",
    "depends_on": "[]",
    "wave": 0,
    "pattern_match": null
  },
  {
    "id": "01KQ7MK1R0SP8MJ0MXCH9RAJNC",
    "title": "Remove duplicate header bar from layout",
    "spec": "Audit the app layout files (likely app/layout.tsx and any nested layout files or shared components) to identify where two <header> or <Header> elements are being rendered. Remove the duplicate so only one header bar appears globally. Check both the root layout and any page-level layouts (e.g. app/(dashboard)/layout.tsx) for redundant Header component imports or JSX. Acceptance criteria: only one header bar is visible on all pages, no layout shift or spacing regressions.",
    "tier": "T1",
    "depends_on": "[]",
    "wave": 0,
    "pattern_match": null
  }
]
```
