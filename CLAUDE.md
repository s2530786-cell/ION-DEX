# CLAUDE.md — Next.js 15 + SQLite SaaS Template

## Stack & Versions
- **Runtime**: Node.js 22 LTS
- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite via better-sqlite3 (local dev) / Turso (production)
- **ORM**: Drizzle ORM (type-safe, SQL-first)
- **Auth**: NextAuth.js v5 (Auth.js) with JWT strategy
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Validation**: Zod (server + client)
- **Payments**: Stripe (subscriptions)
- **Testing**: Vitest + Playwright (E2E)
- **Hosting**: Vercel (frontend) / Fly.io (background jobs)

## Folder Structure
```
src/
├── app/              # App Router pages + API routes
│   ├── (auth)/       # Login, register, verify-email
│   ├── (dashboard)/  # Authenticated pages
│   ├── api/          # Route handlers
│   └── layout.tsx    # Root layout
├── db/
│   ├── schema.ts     # Drizzle schema definitions
│   ├── migrations/   # Generated SQL migrations
│   └── index.ts      # DB connection singleton
├── lib/
│   ├── auth.ts       # NextAuth configuration
│   ├── stripe.ts     # Stripe client
│   └── utils.ts      # Shared utilities
├── components/
│   ├── ui/           # shadcn/ui primitives (never edit by hand)
│   └── features/     # Business-logic components
└── email/            # React Email templates
```

## Development Commands
```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm db:generate      # Generate Drizzle migrations from schema
pnpm db:migrate       # Apply migrations to SQLite
pnpm db:studio        # Open Drizzle Studio GUI
pnpm test             # Run Vitest unit tests
pnpm test:e2e         # Run Playwright E2E tests
pnpm lint             # ESLint + Prettier
pnpm typecheck        # TypeScript check (no emit)
```

## SQL / Migration Conventions

### ✅ DO
- **Always write migrations** via `pnpm db:generate` — never edit SQLite directly
- **Use snake_case** for column names, camelCase for TS fields (Drizzle maps)
- **Default timestamps**: `createdAt` = `integer $defaultFn(() => Date.now())`, `updatedAt` with `$onUpdate`
- **Foreign keys**: enable `PRAGMA foreign_keys = ON` in connection
- **Index every column** used in WHERE/JOIN/ORDER BY
- **Numeric IDs**: use `integer('id').primaryKey({ autoIncrement: true })` for SQLite performance

### ❌ DON'T
- Don't use raw SQL in route handlers — put queries in `db/queries/` directory
- Don't store dates as strings — integer timestamps (Unix ms)
- Don't use Sequelize/Prisma — we chose Drizzle for SQL-first type safety
- Don't skip migrations — every schema change gets a migration file

## Component Patterns

### Server Components (default)
```tsx
// src/app/(dashboard)/page.tsx
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/db'

export default async function DashboardPage() {
  const user = await getCurrentUser()  // throws redirect if not authed
  const projects = await db.query.projects.findMany({
    where: eq(projects.ownerId, user.id)
  })
  return <ProjectList projects={projects} />
}
```

### Client Components (only when needed)
```tsx
// Mark with 'use client' ONLY for: state, effects, event handlers, browser APIs
'use client'
import { useState } from 'react'

export function ProjectForm() { ... }
```

### Data Fetching Rule
> Server components fetch data directly. Client components receive data as props.
> **Never `fetch()` from a client component.**

## Auth Patterns
```tsx
// Protected page — auto-redirects to /login if unauthenticated
import { getCurrentUser } from '@/lib/auth'
export default async function ProtectedPage() {
  const user = await getCurrentUser()  // throws 302 to /login
}

// API route protection
import { auth } from '@/lib/auth'
export const GET = auth(async (req) => {
  if (!req.auth) return Response.json({ error: 'Unauthorized' }, { status: 401 })
})
```

## What We Don't Do (and Why)

1. **No tRPC** — App Router already gives us type-safe server→client via Server Components
2. **No state management libraries** (Redux, Zustand) — URL as state + React context are enough
3. **No CSS-in-JS** — Tailwind is faster, smaller bundle, zero runtime
4. **No GraphQL** — REST + RSC payloads are simpler, smaller, cache-friendly
5. **No monorepo** — Single Next.js app. Microservices split later, not now.
6. **No `any` types** — Strict TypeScript (`strict: true`). Map API responses to Zod schemas.
7. **No `process.env` in client code** — Use `NEXT_PUBLIC_` prefix or server-side only
8. **No direct SQLite in production** — Dev uses better-sqlite3, prod switches to Turso via same Drizzle interface

## Error Handling
```tsx
// Server actions: return structured errors, don't throw
async function createProject(data: FormData) {
  try {
    const parsed = projectSchema.parse(Object.fromEntries(data))
    await db.insert(projects).values(parsed)
    return { ok: true }
  } catch (e) {
    if (e instanceof ZodError) return { ok: false, errors: e.flatten() }
    throw e  // re-throw unexpected errors to error boundary
  }
}
```
