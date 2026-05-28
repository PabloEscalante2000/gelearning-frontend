# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # Start dev server (Turbopack, default)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```

> `next build` no longer runs the linter automatically (changed in Next.js 16). Run lint separately.

## Stack

- **Next.js 16.2.6** — App Router with Turbopack as the default bundler
- **React 19.2.4**
- **TypeScript 5** — strict mode, path alias `@/*` maps to project root
- **Tailwind CSS v4** — configured via `@import "tailwindcss"` in `globals.css` (no `tailwind.config.js`; uses `@theme` directive instead)
- **ESLint 9** — flat config (`eslint.config.mjs`), `eslint-config-next/core-web-vitals` + TypeScript rules

## Next.js 16 key differences from prior versions

Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. The API has breaking changes from earlier versions:

- **Turbopack is the default** — use `next dev --webpack` / `next build --webpack` to opt out
- **`next build` no longer lints** — lint must be run separately
- **`"use client"` / `"use server"` directives** govern Server vs. Client Components in the App Router
- **Data fetching** uses async Server Components and the `fetch` API with built-in caching; `getServerSideProps` / `getStaticProps` are Pages Router only
- **Route Handlers** (`app/*/route.ts`) replace `pages/api/*`
- **Tailwind v4** uses CSS-first config — theme tokens go in `@theme {}` blocks inside CSS, not in `tailwind.config.js`

## Project structure

```
app/
  layout.tsx    # Root layout (html + body, Geist fonts)
  page.tsx      # Home page route "/"
  globals.css   # Global styles + Tailwind v4 import + theme tokens
public/         # Static assets (served from "/")
next.config.ts  # Next.js config (TypeScript)
```

New routes are added as `app/<segment>/page.tsx`. Nested layouts go in `app/<segment>/layout.tsx`.
