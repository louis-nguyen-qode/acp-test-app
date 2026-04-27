# Baseline Standards

Every project built by this system meets these standards, regardless of stack.
Stack-specific implementation details are in STANDARDS.md and DESIGN.md.

## Architecture
- Concerns separated by layer (presentation / domain / data) in whatever
  shape is idiomatic for the chosen stack
- No business logic in presentation
- No data access in domain except through the data layer
- Dependencies flow inward: data layer never imports from presentation
- Functions and files small enough to read in one screen (300 lines max)
- Names communicate intent, not implementation

## Code quality
- Strict type checking enabled (or strictest available linter for dynamic langs)
- Lint strict, autoformatter enforced
- No suppression of type/lint errors without an inline comment justifying
- No `any`, `unknown` without narrowing, suppressions without justification

## Testing
- Test framework matched to the stack (chosen at bootstrap)
- Coverage ≥80% per file (lines, branches, functions)
- Test file mandatory for every source file containing logic
- Tests assert behavior, not implementation
- No real network/DB calls in unit tests; mock external dependencies
- Every assertion block contains at least one expectation

## Authentication & authorization
- Every multi-user app has authentication
- Every authenticated app has at least one role distinction (user/admin)
- Authentication uses the stack's recommended library
- Sessions expire; tokens rotate
- callbackUrl / redirect parameters validated against open-redirect

## Data persistence
- Every app with state has a persistent DB (no in-memory only)
- Schema migrations checked into source control
- DB choice: SQLite for solo, Postgres for multi-user
- ORM/query layer used consistently; no raw SQL in feature code

## UI/UX (web/mobile only)
- Design system used; no ad-hoc styling
- Light + dark mode where the stack supports
- Mobile responsive
- Every list/data view has all four states: loading, empty, error, populated
- Loading = skeleton; empty = illustration + CTA; error = explanation + retry
- Forms validate inline; field errors don't block other fields
- Accessibility: WCAG AA; tested with axe in CI
- Keyboard navigation works; focus rings visible
- One primary action per screen

## Operations
- CI on every PR (lint, types, tests, coverage, accessibility, build)
- PR diff ≤300 lines; files ≤300 lines; if larger, split or surrender
- Conventional commits enforced
- No `console.log`, `print`, `debugger`, `.skip`, `.only`
- All env-config via env vars; no hardcoded secrets

## Out of scope (the agent does NOT add unless the goal asks)
- Analytics, telemetry, error reporting (Sentry etc.)
- Email sending
- Payment integration
- Internationalization
- Rate limiting
- OAuth providers (only credentials/email auth in baseline)
- Onboarding flows
- Admin panels
