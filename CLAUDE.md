# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # Start dev server (Turbopack) — served at localhost:3000/ without basePath
npm run build      # Production build — static export with basePath /learning
npm run lint       # Run ESLint (not run automatically by next build)
```

## Deploy

```bash
# Frontend → Hostinger (uploads out/ via SSH in 62 chunks)
$env:SSH_PASSWORD="Pabloescalante27$"; python deploy_frontend.py

# Backend changes → use ssh_cmd.py or tmp_check.py scripts
$env:SSH_PASSWORD="Pabloescalante27$"; python ssh_cmd.py
```

SSH: host=`145.223.105.59`, port=`65002`, user=`u286274846`  
PHP 8.4: `/opt/alt/php84/usr/bin/php`  
Backend path: `/home/u286274846/gelearningbackend_app/`  
Frontend live at: `https://grupoeades.org/learning/`  
Backend API at: `https://grupoeades.org/gelearningbackend/`

## Frontend Stack

- **Next.js 16.2.6** — App Router, `output: "export"` (static), `basePath: "/learning"`, `trailingSlash: true`
- **React 19 / TypeScript 5** — strict mode, path alias `@/*` → project root
- **Tailwind CSS v4** — CSS-first, `@theme {}` in `globals.css`, no `tailwind.config.js`
- **TanStack Query v5** — all data fetching; `QueryProvider` in root layout
- **Zustand** — auth only (`store/useAuthStore.ts`), persisted as `"gelearning-auth"` in localStorage
- **axios** (`lib/axios.ts`) — injects Bearer token, unwraps `{ success, data, message }` envelope, clears auth on 401

Static export means **no SSR, no Route Handlers, no middleware** in production.  
All `href` and `router.push()` calls must include trailing slashes.

## Frontend Architecture

### Route groups

```
app/
  (auth)/        # Login + Register — no auth required
  (dashboard)/   # Student/instructor — AuthGuard + Sidebar + Header
  (admin)/       # Admin/instructor — AuthGuard requiredRole="admin"
  auth/google/callback/
```

### Data layer pattern

All API hooks live in `hooks/`. Every hook follows the same pattern:
- `useQuery` with key `["resource", id]` for reads
- `useMutation` that invalidates related keys on success
- `apiClient` from `lib/axios.ts` (envelope already stripped — hooks receive inner `data` directly)

### Adding a new lesson type

When adding a new `LessonType` value you must touch **five places**:

1. `types/index.ts` — add to `LessonType` union
2. `app/(admin)/admin/courses/[courseId]/edit/page.tsx` — `lessonSchema` enum + `lessonTypeLabel` map + conditional form fields
3. `components/courses/LessonItem.tsx` — `typeIcon` map
4. `app/(dashboard)/courses/.../lessons/.../page.tsx` — render branch for the new type
5. **Backend**: MySQL ENUM on `lessons.type` column (requires a migration with `DB::statement("ALTER TABLE lessons MODIFY COLUMN type ENUM(...) NOT NULL")`), PHP `LessonType` enum, and `LessonController` validation

### UI components

`components/ui/` — shadcn/ui-style primitives (Button, Input, Card, Badge, etc.). Use these over raw HTML.

## Backend Stack (Laravel 11 on Hostinger)

**Location:** `/home/u286274846/gelearningbackend_app/`  
**DB:** MySQL `u286274846_gelearning` (user `u286274846_glearn`)  
**Auth:** Laravel Sanctum (token-based, no sessions)  
**CORS:** controlled via `CORS_ALLOWED_ORIGINS` in `.env`

### Response format

All controllers extend `Controller` and use the `ApiResponse` trait (`app/Http/Traits/ApiResponse.php`):

```php
class MyController extends Controller
{
    use ApiResponse;
    // $this->success($data, $message)
    // $this->created($data)
    // $this->error($message, $status)
}
```

Never use `BaseController` — it doesn't exist in this project.

### Storage disks

| Disk | Root | Use |
|------|------|-----|
| `local` | `storage/app/private/` | Student submission files (private) |
| `public` | `storage/app/public/` | Course thumbnails (web-accessible) |

Student submissions: `storage/app/private/tareas/{course_slug}/lesson_{id}/{user_id}_{uuid}.ext`  
Served via `response()->download()` with auth check — never exposed as a direct URL.

### Critical model gotchas

Some models need explicit `$table` because Laravel's auto-pluralization differs from the actual table name:

```php
protected $table = 'lesson_progress';     // not lesson_progresses
protected $table = 'user_module_access';  // not user_module_accesses
```

### Role system

`User` has a `role` field cast to `UserRole` enum (`admin`, `instructor`, `student`).  
Use `$user->isAdmin()` / `$user->isInstructor()` / `$user->isStudent()` — never compare strings directly.  
In the frontend `AuthGuard` and `Sidebar`, both `admin` and `instructor` are treated as privileged.

### Key API routes summary

```
POST   /api/auth/login|register
GET    /api/auth/me
GET    /api/v1/courses                        # catalog (all published)
GET    /api/v1/courses/{id}                   # course detail with modules+lessons
POST   /api/v1/modules/{module}/lessons       # create lesson
PUT    /api/v1/modules/{module}/lessons/{id}  # update lesson
POST   /api/v1/lessons/{lesson}/complete      # mark lesson done
POST   /api/v1/lessons/{lesson}/submissions   # upload student file (multipart)
GET    /api/v1/lessons/{lesson}/my-submission # student's own submission
GET    /api/v1/lessons/{lesson}/submissions   # all submissions (admin)
GET    /api/v1/submissions/{id}/download      # download file (auth required)
GET/PUT /api/v1/admin/courses/{c}/students/{u}/module-access
POST   /api/v1/courses/{course}/payment       # MercadoPago preference
POST   /api/v1/payments/webhook               # public webhook
GET    /api/v1/diploma-verifications/{code}   # public diploma check
```

### Lesson `due_date` and `scheduled_at`

- `scheduled_at` — datetime when a live session is held (shown as a banner to students)
- `due_date` — datetime deadline for submission lessons (shown as amber/red warning to students)
- Both stored as `datetime` in MySQL; frontend uses `datetime-local` inputs (sends ISO 8601 with `T`)
- Backend validation uses `'nullable', 'date'` (accepts both `T` and space separators)

### MercadoPago payments

- `price = null` → invitation-only (admin enrolls manually)
- `price = 0` → free (auto-enrolled on request)
- `price > 0` → paid via MercadoPago
- Webhook at `/api/v1/payments/webhook` is public (no Sanctum) — enrolls student on `approved` status

### Diploma verifications

Public endpoint `GET /api/v1/diploma-verifications/{code}` — no auth needed.  
Admin creates diplomas via `POST /api/v1/admin/diploma-verifications`.

## Environment variables

| Variable | Frontend | Backend |
|----------|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://grupoeades.org/gelearningbackend` (prod) / `http://gelearning.test` (dev) | — |
| `CORS_ALLOWED_ORIGINS` | — | `https://grupoeades.org,https://www.grupoeades.org` |
| `MERCADOPAGO_ACCESS_TOKEN` | — | secret token |
| `FILESYSTEM_DISK` | — | `local` (default) |
