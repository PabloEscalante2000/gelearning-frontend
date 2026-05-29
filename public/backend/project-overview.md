# GeLearning — Documentación técnica del proyecto

## Índice

1. [¿Qué es GeLearning?](#1-qué-es-gelearning)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Estructura de directorios](#3-estructura-de-directorios)
4. [Base de datos](#4-base-de-datos)
5. [Modelos y relaciones](#5-modelos-y-relaciones)
6. [Enums](#6-enums)
7. [Autenticación](#7-autenticación)
8. [Autorización — Roles y Policies](#8-autorización--roles-y-policies)
9. [Capa de servicios](#9-capa-de-servicios)
10. [Eventos, listeners y notificaciones](#10-eventos-listeners-y-notificaciones)
11. [Referencia completa de endpoints](#11-referencia-completa-de-endpoints)
12. [Flujos clave del sistema](#12-flujos-clave-del-sistema)

---

## 1. ¿Qué es GeLearning?

GeLearning es una **plataforma de e-learning** construida como API REST pura. No sirve ninguna interfaz web propia: toda la presentación corresponde a un frontend externo (Next.js, móvil, etc.).

Sus funcionalidades principales son:

- Creación y publicación de cursos con módulos y lecciones estructurados
- Cuatro tipos de contenido por lección: video, PDF, Word y enlace externo
- Sistema de inscripciones directas e invitaciones por email con token
- Seguimiento de progreso por lección y por curso
- Generación automática de certificados PDF al completar un curso
- Foro de discusión por curso con hilos y respuestas
- Sesiones en directo asociadas a cursos
- Panel de administración para gestión de usuarios
- Subida de archivos a Cloudflare R2

---

## 2. Stack tecnológico

| Capa            | Tecnología                          |
|-----------------|-------------------------------------|
| Lenguaje        | PHP 8.3                             |
| Framework       | Laravel 13.8                        |
| Autenticación   | Laravel Sanctum (tokens de API)     |
| Base de datos   | SQLite (dev) / cualquier RDBMS (prod)|
| Almacenamiento  | Cloudflare R2 (via S3 v3 SDK)       |
| PDF             | barryvdh/laravel-dompdf             |
| Cola de trabajos| Database driver                     |
| Email           | Laravel Notifications (canal mail)  |
| Frontend assets | Vite + Tailwind CSS v4              |
| Testing         | PHPUnit 12                          |
| Formato         | Laravel Pint                        |

---

## 3. Estructura de directorios

```
gelearning/
├── app/
│   ├── Enums/                  # CourseStatus, LessonType, UserRole, InvitationStatus
│   ├── Events/                 # CourseCompleted
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       ├── AuthController.php       # login / logout / me
│   │   │       └── V1/                      # todos los recursos bajo /api/v1/
│   │   └── Traits/
│   │       └── ApiResponse.php             # formato unificado de respuesta
│   ├── Listeners/              # GenerateCertificate
│   ├── Models/                 # 11 modelos Eloquent
│   ├── Notifications/          # 3 notificaciones por email
│   ├── Policies/               # 7 policies de autorización
│   ├── Providers/
│   │   └── AppServiceProvider.php          # registro evento → listener
│   └── Services/               # EnrollmentService, ProgressService,
│                               # CertificateService, InvitationService
├── bootstrap/
│   └── app.php                 # configuración central: rutas, middleware, excepciones
├── database/
│   ├── factories/
│   └── migrations/             # 14 migraciones ordenadas cronológicamente
├── resources/
│   └── views/
│       └── certificates/
│           └── template.blade.php          # única vista Blade del proyecto
├── routes/
│   └── api.php                 # todas las rutas de la API
└── docs/
    ├── frontend-integration.md
    └── project-overview.md     # este archivo
```

> El proyecto **no usa rutas web** para servir HTML. `routes/web.php` existe pero está vacío.
> La única vista Blade es la plantilla del certificado PDF, usada internamente por `CertificateService`.

---

## 4. Base de datos

### Esquema completo

```
users
├── id
├── name
├── email (unique)
├── password (hashed)
├── role  ENUM(admin, instructor, student)  default: student
├── avatar_url (nullable)
├── email_verified_at (nullable)
└── timestamps

courses
├── id
├── instructor_id → users.id (cascade delete)
├── title
├── description
├── thumbnail_url (nullable)
├── status  ENUM(draft, published, archived)  default: draft
└── timestamps

modules
├── id
├── course_id → courses.id (cascade delete)
├── title
├── description (nullable)
├── order  default: 0
└── timestamps

lessons
├── id
├── module_id → modules.id (cascade delete)
├── title
├── type  ENUM(video, pdf, word, link)
├── content_url
├── duration_minutes (nullable)
├── order  default: 0
├── is_published  default: false
└── timestamps

live_sessions
├── id
├── course_id → courses.id (cascade delete)
├── title
├── description (nullable)
├── meeting_url
├── starts_at
├── ends_at (nullable)
└── timestamps

enrollments                         ← sin timestamps automáticos
├── id
├── user_id   → users.id (cascade delete)
├── course_id → courses.id (cascade delete)
├── enrolled_by → users.id
├── enrolled_at  default: now()
├── completed_at (nullable)
└── UNIQUE(user_id, course_id)

lesson_progress                     ← sin timestamps automáticos
├── id
├── user_id   → users.id (cascade delete)
├── lesson_id → lessons.id (cascade delete)
├── completed  default: false
├── completed_at (nullable)
└── UNIQUE(user_id, lesson_id)

certificates
├── id
├── user_id   → users.id (cascade delete)
├── course_id → courses.id (cascade delete)
├── issued_at  default: now()
├── certificate_url
└── UNIQUE(user_id, course_id)

forum_threads
├── id
├── course_id → courses.id (cascade delete)
├── user_id   → users.id (cascade delete)
├── title
├── body
├── is_pinned  default: false
├── is_closed  default: false
└── timestamps

forum_replies
├── id
├── thread_id → forum_threads.id (cascade delete)
├── user_id   → users.id (cascade delete)
├── body
└── timestamps

invitations
├── id
├── email
├── course_id  → courses.id (cascade delete)
├── invited_by → users.id
├── token (unique, 64 caracteres aleatorios)
├── status  ENUM(pending, accepted, expired)  default: pending
├── expires_at
├── accepted_at (nullable)
└── timestamps

personal_access_tokens              ← gestionada por Sanctum
```

### Eliminación en cascada

Borrar un `Course` elimina en cascada: módulos → lecciones → progreso de lecciones, sesiones en directo, inscripciones, certificados, hilos del foro → respuestas, e invitaciones.

---

## 5. Modelos y relaciones

### Mapa de relaciones

```
User ──────────────────────────────────────────────────────────
  taughtCourses()      HasMany → Course          (instructor_id)
  enrollments()        HasMany → Enrollment
  enrolledCourses()    BelongsToMany → Course    via enrollments
  lessonProgress()     HasMany → LessonProgress
  certificates()       HasMany → Certificate
  forumThreads()       HasMany → ForumThread
  forumReplies()       HasMany → ForumReply
  sentInvitations()    HasMany → Invitation      (invited_by)

Course ─────────────────────────────────────────────────────────
  instructor()         BelongsTo → User
  modules()            HasMany → Module           ordenados por 'order'
  liveSessions()       HasMany → LiveSession      ordenadas por 'starts_at'
  enrollments()        HasMany → Enrollment
  students()           BelongsToMany → User      via enrollments
  certificates()       HasMany → Certificate
  forumThreads()       HasMany → ForumThread
  invitations()        HasMany → Invitation
  publishedLessons()   HasManyThrough → Lesson   via Module (is_published=true)

Module ─────────────────────────────────────────────────────────
  course()             BelongsTo → Course
  lessons()            HasMany → Lesson           ordenadas por 'order'
  publishedLessons()   HasMany → Lesson           (is_published=true, ordenadas)

Lesson ─────────────────────────────────────────────────────────
  module()             BelongsTo → Module
  progress()           HasMany → LessonProgress
  userProgress()       HasMany → LessonProgress   filtrado por auth()->id()

Enrollment ─────────────────────────────────────────────────────
  user()               BelongsTo → User
  course()             BelongsTo → Course
  enrolledBy()         BelongsTo → User           (enrolled_by)

Invitation ─────────────────────────────────────────────────────
  course()             BelongsTo → Course
  invitedBy()          BelongsTo → User           (invited_by)
  isPending()          → bool   (status=pending AND expires_at en el futuro)
  isExpired()          → bool   (expires_at en el pasado)
```

---

## 6. Enums

Todos los enums son `string` backed y se registran automáticamente en los `casts()` del modelo correspondiente.

| Enum               | Valores                              | Usado en        |
|--------------------|--------------------------------------|-----------------|
| `UserRole`         | `admin`, `instructor`, `student`     | `users.role`    |
| `CourseStatus`     | `draft`, `published`, `archived`     | `courses.status`|
| `LessonType`       | `video`, `pdf`, `word`, `link`       | `lessons.type`  |
| `InvitationStatus` | `pending`, `accepted`, `expired`     | `invitations.status` |

---

## 7. Autenticación

El proyecto usa **Laravel Sanctum** en modo token (no cookies de sesión). El flujo es:

1. El cliente hace `POST /api/auth/login` con `email` y `password`.
2. Si las credenciales son válidas, el servidor crea un token con `createToken('api-token')` y devuelve el `plainTextToken`.
3. El cliente almacena ese token y lo envía en cada petición protegida como header `Authorization: Bearer <token>`.
4. El middleware `auth:sanctum` valida el token contra la tabla `personal_access_tokens`.
5. `POST /api/auth/logout` revoca únicamente el token actual (`currentAccessToken()->delete()`). Los demás tokens del usuario no se ven afectados.

**Configuración clave en `bootstrap/app.php`:**

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->statefulApi(); // habilita Sanctum para rutas API
})
->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->shouldRenderJsonWhen(
        fn (Request $request) => $request->is('api/*')
    ); // todas las excepciones en /api/* devuelven JSON, nunca HTML
})
```

---

## 8. Autorización — Roles y Policies

### Helpers de rol en `User`

```php
$user->isAdmin()       // role === 'admin'
$user->isInstructor()  // role === 'instructor'
$user->isStudent()     // role === 'student'
```

### Policies registradas

| Policy                | Modelo protegido  |
|-----------------------|-------------------|
| `CoursePolicy`        | `Course`          |
| `ModulePolicy`        | `Module`          |
| `LessonPolicy`        | `Lesson`          |
| `ForumThreadPolicy`   | `ForumThread`     |
| `ForumReplyPolicy`    | `ForumReply`      |
| `InvitationPolicy`    | `Invitation`      |
| `CertificatePolicy`   | `Certificate`     |

### Reglas de `CoursePolicy` (ejemplo representativo)

| Acción       | Admin | Instructor                    | Student                        |
|--------------|-------|-------------------------------|--------------------------------|
| `viewAny`    | ✅    | ✅ (ve los suyos, filtrado en controller) | ✅ (ve los inscritos, filtrado en controller) |
| `view`       | ✅    | Solo si `instructor_id === user->id` | Solo si tiene `Enrollment` en ese curso |
| `create`     | ✅    | ✅                            | ❌                             |
| `update`     | ✅    | Solo si `instructor_id === user->id` | ❌                       |
| `delete`     | ✅    | Solo si `instructor_id === user->id` | ❌                       |

### Restricciones implementadas directamente en controllers

Algunas restricciones no usan Policy sino `abort_if()` inline:

- `AdminUserController`: solo `admin` puede acceder. Verificado en el constructor con middleware closure.
- `EnrollmentController`: solo `admin` o `instructor` pueden inscribir/dar de baja. Los instructores solo pueden operar en sus propios cursos.
- `InvitationController`: los instructores solo pueden invitar/ver invitaciones de sus propios cursos.

---

## 9. Capa de servicios

La lógica de negocio no vive en los controllers sino en `app/Services/`. Los controllers solo validan la request, delegan al servicio y formatean la respuesta.

### `EnrollmentService`

**Responsabilidades:**
- `enroll(User $student, Course $course, User $enrolledBy): Enrollment` — crea la inscripción y envía `EnrollmentConfirmationNotification`. Lanza `RuntimeException` si el usuario ya está inscrito.
- `isEnrolled(User $user, Course $course): bool` — consulta rápida sin excepción.
- `unenroll(Enrollment $enrollment): void` — elimina la inscripción.

### `ProgressService`

**Responsabilidades:**
- `getCourseProgress(User $user, Course $course): array` — calcula `{ total, completed, percent }`. Solo cuenta lecciones con `is_published = true`. Usa `Course::publishedLessons()` (HasManyThrough) para obtener los IDs y luego consulta `lesson_progress`.
- `isCourseCompleted(User $user, Course $course): bool` — devuelve `true` si `completed === total > 0`.

### `CertificateService`

**Responsabilidades:**
- `generate(User $user, Course $course): Certificate` — es **idempotente**: si ya existe el certificado lo devuelve sin crear uno nuevo. Si no existe, genera el PDF con `barryvdh/laravel-dompdf` usando la vista `certificates.template`, lo sube a Cloudflare R2 como `certificates/{uuid}.pdf` con visibilidad pública, guarda el registro en la BD y envía `CertificateIssuedNotification`.

### `InvitationService`

**Responsabilidades:**
- `invite(string $email, Course $course, User $invitedBy): Invitation` — crea una invitación con token de 64 chars y expiración de 7 días. Es **idempotente**: reutiliza una invitación pendiente existente si ya existe para ese email+curso. Envía `CourseInvitationNotification` por email.
- `accept(string $token): Invitation` — valida el token, busca el usuario por email (debe existir), lo inscribe vía `EnrollmentService` si no lo está, y marca la invitación como `accepted`. Lanza `RuntimeException` para cualquier estado inválido.

---

## 10. Eventos, listeners y notificaciones

### Flujo de eventos

```
POST /api/v1/lessons/{lesson}/complete
    └── LessonController::complete()
            └── LessonProgress::updateOrCreate(...)
                    └── ProgressService::isCourseCompleted()
                            └── [si true] CourseCompleted::dispatch($user, $course)
                                    └── GenerateCertificate::handle()  ← listener
                                            └── CertificateService::generate()
                                                    ├── Genera PDF (dompdf)
                                                    ├── Sube a R2
                                                    ├── Guarda Certificate en BD
                                                    └── CertificateIssuedNotification → email
```

El evento `CourseCompleted` se registra en `AppServiceProvider::boot()`:
```php
Event::listen(CourseCompleted::class, GenerateCertificate::class);
```

### Notificaciones por email

| Notificación                         | Cuándo se envía                          | Destinatario       |
|--------------------------------------|------------------------------------------|--------------------|
| `EnrollmentConfirmationNotification` | Al inscribir un estudiante               | El estudiante      |
| `CourseInvitationNotification`       | Al crear una invitación                  | El email invitado  |
| `CertificateIssuedNotification`      | Al generar un certificado                | El estudiante      |

El link de la invitación apunta a `GET /api/v1/invitations/accept/{token}` — la única ruta pública del sistema además del login.

---

## 11. Referencia completa de endpoints

### Convenciones

- Base: `/api`
- Todos los endpoints de recursos están bajo `/api/v1/`
- Autenticación: todos requieren `Authorization: Bearer <token>` salvo los marcados como **[público]**
- Headers obligatorios en toda petición: `Accept: application/json`
- Headers en peticiones con body JSON: `Content-Type: application/json`
- Todas las respuestas siguen el formato: `{ "success": bool, "data": any, "message": string }`

---

### AUTH

| Método | Ruta              | Acceso     | Descripción                              |
|--------|-------------------|------------|------------------------------------------|
| POST   | `/api/auth/login` | **Público**| Login, devuelve token Sanctum            |
| POST   | `/api/auth/logout`| Auth       | Revoca el token actual                   |
| GET    | `/api/auth/me`    | Auth       | Devuelve el usuario autenticado          |

#### `POST /api/auth/login`
```json
// Request body
{ "email": "user@mail.com", "password": "secret" }

// Response 200
{
  "success": true,
  "data": {
    "token": "1|abc...",
    "user": { "id": 1, "name": "...", "email": "...", "role": "admin", "avatar_url": null }
  },
  "message": "Inicio de sesión exitoso."
}
```

---

### CURSOS

| Método | Ruta                    | Roles permitidos        | Descripción                                    |
|--------|-------------------------|-------------------------|------------------------------------------------|
| GET    | `/api/v1/courses`       | Todos                   | Lista cursos (filtrado por rol automáticamente)|
| POST   | `/api/v1/courses`       | Admin, Instructor       | Crea un curso                                  |
| GET    | `/api/v1/courses/{id}`  | Admin, Instructor(suyos), Student(inscrito) | Detalle con módulos y sesiones |
| PUT    | `/api/v1/courses/{id}`  | Admin, Instructor(suyos)| Actualiza un curso                             |
| DELETE | `/api/v1/courses/{id}`  | Admin, Instructor(suyos)| Elimina un curso                               |

**Comportamiento de `GET /api/v1/courses` según rol:**
- `admin` → todos los cursos
- `instructor` → solo los cursos donde `instructor_id = user.id`
- `student` → solo los cursos en los que tiene una `Enrollment`

**Body de creación/actualización:**
```json
{
  "title": "Nombre del curso",        // required en create
  "description": "Descripción",       // required en create
  "thumbnail_url": "https://...",     // opcional
  "status": "draft"                   // "draft" | "published" | "archived" — opcional
}
```

**Respuesta de `GET /api/v1/courses/{id}`** incluye relaciones:
```json
{
  "instructor": { "id": 1, "name": "...", "email": "...", "avatar_url": null },
  "modules": [
    {
      "id": 1, "title": "...", "order": 0,
      "lessons": [ { "id": 1, "title": "...", "type": "video", "is_published": true, ... } ]
    }
  ],
  "live_sessions": [ ... ]
}
```

---

### MÓDULOS

Todos bajo el prefijo `/api/v1/courses/{courseId}/modules`.

| Método | Ruta                         | Roles permitidos          | Descripción               |
|--------|------------------------------|---------------------------|---------------------------|
| GET    | `/`                          | Todos (inscritos/propietario/admin) | Lista módulos con sus lecciones |
| POST   | `/`                          | Admin, Instructor(suyos)  | Crea un módulo            |
| GET    | `/{moduleId}`                | Todos                     | Detalle con lecciones     |
| PUT    | `/{moduleId}`                | Admin, Instructor(suyos)  | Actualiza un módulo       |
| DELETE | `/{moduleId}`                | Admin, Instructor(suyos)  | Elimina un módulo         |
| PATCH  | `/reorder`                   | Admin, Instructor(suyos)  | Reordena módulos          |

**Body de creación/actualización:**
```json
{ "title": "Módulo 1", "description": "Opcional", "order": 0 }
```

**Body de reordenación:**
```json
{
  "modules": [
    { "id": 3, "order": 0 },
    { "id": 1, "order": 1 },
    { "id": 2, "order": 2 }
  ]
}
```

---

### LECCIONES

Recursos anidados bajo `/api/v1/modules/{moduleId}/lessons`.

| Método | Ruta                                        | Roles permitidos         | Descripción                        |
|--------|---------------------------------------------|--------------------------|------------------------------------|
| GET    | `/api/v1/modules/{moduleId}/lessons`        | Todos*                   | Lista lecciones del módulo         |
| POST   | `/api/v1/modules/{moduleId}/lessons`        | Admin, Instructor(suyos) | Crea una lección                   |
| GET    | `/api/v1/modules/{moduleId}/lessons/{id}`   | Todos                    | Detalle de una lección             |
| PUT    | `/api/v1/modules/{moduleId}/lessons/{id}`   | Admin, Instructor(suyos) | Actualiza una lección              |
| DELETE | `/api/v1/modules/{moduleId}/lessons/{id}`   | Admin, Instructor(suyos) | Elimina una lección                |
| PATCH  | `/api/v1/modules/{moduleId}/lessons/reorder`| Admin, Instructor(suyos) | Reordena lecciones                 |
| POST   | `/api/v1/lessons/{lessonId}/complete`       | Student                  | Marca lección como completada      |

*Los `student` solo ven lecciones con `is_published = true`.

**Body de creación/actualización:**
```json
{
  "title": "Introducción",
  "type": "video",               // "video" | "pdf" | "word" | "link"
  "content_url": "https://...",
  "duration_minutes": 15,        // opcional
  "order": 0,                    // opcional
  "is_published": false          // opcional, default false
}
```

**`POST /api/v1/lessons/{lessonId}/complete`:** Sin body. Hace upsert en `lesson_progress`. Si el porcentaje de completado llega al 100%, dispara el evento `CourseCompleted` que genera el certificado de forma automática.

---

### SESIONES EN DIRECTO

| Método | Ruta                                                   | Roles                    | Descripción             |
|--------|--------------------------------------------------------|--------------------------|-------------------------|
| GET    | `/api/v1/courses/{courseId}/live-sessions`             | Todos                    | Lista sesiones          |
| POST   | `/api/v1/courses/{courseId}/live-sessions`             | Admin, Instructor(suyos) | Crea una sesión         |
| GET    | `/api/v1/courses/{courseId}/live-sessions/{id}`        | Todos                    | Detalle de sesión       |
| PUT    | `/api/v1/courses/{courseId}/live-sessions/{id}`        | Admin, Instructor(suyos) | Actualiza sesión        |
| DELETE | `/api/v1/courses/{courseId}/live-sessions/{id}`        | Admin, Instructor(suyos) | Elimina sesión          |

**Body:**
```json
{
  "title": "Clase en vivo",
  "description": "Opcional",
  "meeting_url": "https://meet.google.com/xxx",
  "starts_at": "2026-06-15T18:00:00Z",   // debe ser fecha futura
  "ends_at":   "2026-06-15T20:00:00Z"    // opcional, debe ser > starts_at
}
```

---

### INSCRIPCIONES

| Método | Ruta                                         | Roles                    | Descripción                     |
|--------|----------------------------------------------|--------------------------|---------------------------------|
| POST   | `/api/v1/enrollments`                        | Admin, Instructor(suyos) | Inscribe un estudiante          |
| DELETE | `/api/v1/enrollments/{enrollmentId}`         | Admin, Instructor(suyos) | Elimina una inscripción         |
| GET    | `/api/v1/courses/{courseId}/students`        | Admin, Instructor(suyos) | Lista estudiantes del curso     |

**Body de inscripción:**
```json
{ "user_id": 42, "course_id": 7 }
```
Devuelve `409 Conflict` si el estudiante ya está inscrito.

**Respuesta de lista de estudiantes:**
```json
{
  "data": [
    {
      "id": 42, "name": "...", "email": "...", "avatar_url": null,
      "pivot": { "enrolled_at": "2026-01-10T...", "completed_at": null }
    }
  ]
}
```

---

### INVITACIONES

| Método | Ruta                                      | Acceso      | Descripción                               |
|--------|-------------------------------------------|-------------|-------------------------------------------|
| POST   | `/api/v1/invitations`                     | Admin, Instructor(suyos) | Envía una invitación por email |
| GET    | `/api/v1/invitations?course_id={id}`      | Admin, Instructor(suyos) | Lista invitaciones de un curso |
| GET    | `/api/v1/invitations/accept/{token}`      | **Público** | Acepta la invitación e inscribe al usuario|

**Body de envío:**
```json
{ "email": "alumno@mail.com", "course_id": 7 }
```

Si ya existe una invitación `pending` no expirada para ese email+curso, se reutiliza sin crear una nueva ni enviar otro email.

**`GET /api/v1/invitations/accept/{token}` (público):**
- Valida que el token exista y no haya expirado (`expires_at` a 7 días).
- Busca el usuario con ese email. Si no existe devuelve `422`.
- Si el usuario ya está inscrito, simplemente marca la invitación como `accepted`.
- Si no, lo inscribe vía `EnrollmentService` (que envía `EnrollmentConfirmationNotification`).

---

### PROGRESO

| Método | Ruta                                  | Roles    | Descripción                             |
|--------|---------------------------------------|----------|-----------------------------------------|
| GET    | `/api/v1/courses/{courseId}/progress` | Todos    | Progreso del usuario autenticado        |

**Respuesta:**
```json
{
  "data": {
    "total": 12,
    "completed": 8,
    "percent": 66.67
  }
}
```
Solo contabiliza lecciones con `is_published = true`.

---

### CERTIFICADOS

| Método | Ruta                                     | Roles    | Descripción                                       |
|--------|------------------------------------------|----------|---------------------------------------------------|
| GET    | `/api/v1/courses/{courseId}/certificate` | Todos    | Obtiene el certificado del usuario autenticado    |

- Si el usuario tiene certificado, lo devuelve.
- Si no existe y el usuario es `admin`, lo genera en el momento.
- Si no existe y el usuario es `student` o `instructor`, devuelve `404`.
- La generación automática (vía evento) ocurre al completar todas las lecciones.

**Respuesta:**
```json
{
  "data": {
    "id": 1,
    "user_id": 42,
    "course_id": 7,
    "issued_at": "2026-05-28T10:00:00.000000Z",
    "certificate_url": "https://r2.tudominio.com/certificates/uuid.pdf"
  }
}
```

---

### FORO

Todos los hilos bajo `/api/v1/courses/{courseId}/forum/threads`.

| Método | Ruta                              | Roles                    | Descripción                     |
|--------|-----------------------------------|--------------------------|---------------------------------|
| GET    | `/threads`                        | Todos (inscritos)        | Lista hilos (fijados primero)   |
| POST   | `/threads`                        | Todos (inscritos)        | Crea un hilo                    |
| GET    | `/threads/{threadId}`             | Todos (inscritos)        | Detalle con respuestas          |
| PUT    | `/threads/{threadId}`             | Autor del hilo           | Edita el hilo                   |
| DELETE | `/threads/{threadId}`             | Autor / Admin            | Elimina el hilo                 |
| PATCH  | `/threads/{threadId}/pin`         | Admin, Instructor(suyos) | Fija o desfija (toggle)         |
| PATCH  | `/threads/{threadId}/close`       | Admin, Instructor(suyos) | Cierra o abre (toggle)          |
| POST   | `/threads/{threadId}/replies`     | Todos (inscritos)        | Crea una respuesta              |
| PUT    | `/api/v1/replies/{replyId}`       | Autor de la respuesta    | Edita una respuesta             |
| DELETE | `/api/v1/replies/{replyId}`       | Autor / Admin            | Elimina una respuesta           |

**Body de hilo:**
```json
{ "title": "Duda sobre el módulo 2", "body": "Texto del hilo..." }
```

**Body de respuesta:**
```json
{ "body": "Texto de la respuesta..." }
```

`POST .../replies` devuelve `403` si el hilo tiene `is_closed = true`.

---

### SUBIDA DE ARCHIVOS

| Método | Ruta            | Roles | Descripción                              |
|--------|-----------------|-------|------------------------------------------|
| POST   | `/api/v1/upload`| Todos | Sube PDF/DOC/DOCX a R2, devuelve URL     |

- Formato: `multipart/form-data`, campo `file`
- Tipos permitidos: `pdf`, `doc`, `docx`
- Tamaño máximo: **50 MB**
- Destino en R2: `documents/pdf/{uuid}.pdf` o `documents/word/{uuid}.docx`

**Respuesta (`201`):**
```json
{
  "data": {
    "url": "https://r2.tudominio.com/documents/pdf/uuid.pdf",
    "filename": "documents/pdf/uuid.pdf",
    "original": "mi-archivo.pdf",
    "size_bytes": 204800,
    "mime_type": "application/pdf"
  }
}
```

La URL devuelta se usa como `content_url` al crear o actualizar una lección.

---

### ADMINISTRACIÓN DE USUARIOS

Todos los endpoints bajo `/api/v1/admin/` requieren rol `admin`. El acceso se verifica en el constructor del controller con un middleware closure (no Policy).

| Método | Ruta                          | Descripción                        |
|--------|-------------------------------|------------------------------------|
| GET    | `/api/v1/admin/users`         | Lista todos los usuarios           |
| GET    | `/api/v1/admin/users?role=X`  | Filtra por rol (admin/instructor/student) |
| POST   | `/api/v1/admin/users`         | Crea un usuario                    |
| PUT    | `/api/v1/admin/users/{id}`    | Actualiza un usuario               |
| DELETE | `/api/v1/admin/users/{id}`    | Elimina un usuario                 |

**Body de creación:**
```json
{
  "name": "María López",
  "email": "maria@mail.com",
  "password": "contraseña-segura",
  "role": "instructor"
}
```

**Body de actualización:** todos los campos son opcionales. Si `password` es `null` o se omite, no se modifica.

`DELETE` devuelve `403` si intentas eliminar tu propia cuenta.

---

## 12. Flujos clave del sistema

### Flujo de inscripción directa

```
Admin/Instructor
    │
    └── POST /api/v1/enrollments  { user_id, course_id }
            │
            ├── [409] Si ya existe Enrollment(user_id, course_id)
            │
            └── EnrollmentService::enroll()
                    ├── Crea Enrollment en BD
                    └── student->notify(EnrollmentConfirmationNotification)
                                └── Email: "Estás inscrito en {curso}"
```

### Flujo de invitación

```
Admin/Instructor
    │
    └── POST /api/v1/invitations  { email, course_id }
            │
            └── InvitationService::invite()
                    ├── [reutiliza] Si ya hay Invitation pending no expirada → la devuelve
                    │
                    ├── Crea Invitation con token=random(64), expires_at=+7días
                    └── Notification::route('mail', email)->notify(CourseInvitationNotification)
                                                                └── Email con link /accept/{token}

Usuario invitado
    │
    └── GET /api/v1/invitations/accept/{token}  [PÚBLICO]
            │
            ├── [404] Token no existe
            ├── [422] Token expirado o ya usado
            ├── [422] No existe User con ese email
            │
            └── InvitationService::accept()
                    ├── EnrollmentService::enroll() [si no está inscrito]
                    │       └── Email de confirmación de inscripción
                    └── invitation.update(status=accepted, accepted_at=now())
```

### Flujo de completado de curso y certificado

```
Student
    │
    └── POST /api/v1/lessons/{lessonId}/complete
            │
            ├── LessonProgress::updateOrCreate(completed=true, completed_at=now())
            │
            └── ProgressService::isCourseCompleted()
                    │
                    ├── [false] → responde 200 "Lección marcada como completada."
                    │
                    └── [true]  → CourseCompleted::dispatch(user, course)
                                        │
                                        └── GenerateCertificate::handle()  [listener]
                                                │
                                                └── CertificateService::generate()
                                                        ├── [idempotente] Si ya existe → no hace nada
                                                        ├── Pdf::loadView('certificates.template', [...])
                                                        ├── Storage::disk('r2')->put('certificates/{uuid}.pdf')
                                                        ├── Certificate::create([...])
                                                        └── student->notify(CertificateIssuedNotification)
                                                                        └── Email: "Tu certificado está listo"
```

### Visibilidad de lecciones por rol

```
GET /api/v1/modules/{id}/lessons

admin     → todas las lecciones (publicadas y borrador)
instructor → todas las lecciones (publicadas y borrador)
student   → solo lecciones con is_published = true
```

El cálculo de progreso en `ProgressService` también solo cuenta lecciones publicadas, lo que garantiza coherencia: un estudiante no puede ver ni completar una lección en borrador.
