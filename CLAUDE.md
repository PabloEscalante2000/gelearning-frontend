# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # Start dev server (Turbopack, default) — served at localhost:3000/ without basePath
npm run build      # Production build — exports static site with basePath /learning
npm run start      # Start production server
npm run lint       # Run ESLint
```

> `next build` no longer runs the linter automatically (changed in Next.js 16). Run lint separately.

## Stack

- **Next.js 16.2.6** — App Router, static export (`output: "export"`) for production, Turbopack as dev bundler
- **React 19.2.4**
- **TypeScript 5** — strict mode, path alias `@/*` maps to project root
- **Tailwind CSS v4** — CSS-first config via `@import "tailwindcss"` in `globals.css`; theme tokens in `@theme {}` blocks (no `tailwind.config.js`)
- **TanStack Query v5** — all server data fetching; `QueryProvider` wraps the root layout
- **Zustand** — auth state only (`store/useAuthStore.ts`), persisted to `localStorage` as `"gelearning-auth"`
- **axios** — API client (`lib/axios.ts`), configured with bearer token injection and response unwrapping

## Next.js 16 key differences from prior versions

Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. The API has breaking changes from earlier versions:

- **Static export**: production build uses `output: "export"` with `basePath: "/learning"` — no server-side features (SSR, Route Handlers, middleware) work in production
- **Turbopack is the default** — use `next dev --webpack` / `next build --webpack` to opt out
- **`"use client"` / `"use server"` directives** govern Server vs. Client Components in the App Router
- **Tailwind v4** uses CSS-first config — theme tokens go in `@theme {}` blocks inside CSS, not in `tailwind.config.js`
- **`trailingSlash: true`** — all routes must include trailing slashes in `href` and `router.push()` calls

## Architecture

### Route groups

```
app/
  (auth)/          # Login + Register — no layout wrapper, no auth required
  (dashboard)/     # All student/instructor routes — wrapped in AuthGuard + Sidebar + Header
  (admin)/         # Admin/instructor routes — AuthGuard with requiredRole="admin"
  auth/google/callback/  # OAuth callback page
```

### Authentication flow

1. `store/useAuthStore.ts` — Zustand store persists `{ token, user }` to localStorage. Exposes `_hasHydrated` flag to prevent flicker before hydration completes.
2. `components/auth/AuthGuard.tsx` — Client component that reads the store, redirects to `/login/` if unauthenticated. Used as the outermost wrapper in `(dashboard)/layout.tsx` and `(admin)/layout.tsx`.
3. `lib/axios.ts` — Reads token from store on every request via `useAuthStore.getState()`. Automatically unwraps the `{ success, data, message }` API envelope so hooks receive the inner `data` directly. On 401, calls `clear()` and redirects to `/login/`.

### Data layer

All API calls go through `lib/axios.ts` (`apiClient`). Hooks in `hooks/` use TanStack Query:
- **Queries** return data via `useQuery`; standard cache key pattern: `["resource", id]`
- **Mutations** use `useMutation` and invalidate relevant query keys on success
- The API envelope `{ success, data, message }` is stripped by the axios response interceptor — hooks only see the inner payload

### API base URLs

| Environment | `NEXT_PUBLIC_API_URL` |
|-------------|----------------------|
| Development | `http://gelearning.test` (local Laravel backend) |
| Production  | `https://grupoeades.org/gelearningbackend` |

The backend is a separate Laravel API; this repo is frontend-only.

### Role model

Users have one of three roles: `"admin"`, `"instructor"`, `"student"`. In the sidebar and `AuthGuard`, `admin` and `instructor` are treated as privileged (see `isAdmin` in `Sidebar.tsx`). The `AuthGuard` `requiredRole="admin"` blocks students but allows both admin and instructor.

### UI components

`components/ui/` contains shadcn/ui-style primitives (Button, Input, Card, Badge, etc.). Use these instead of raw HTML elements for consistency.
