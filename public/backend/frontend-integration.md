# Guía de integración: Next.js 14 → GeLearning API

Este documento describe todo lo que el frontend en Next.js 14 (desplegado en Apache) necesita saber para comunicarse con la API Laravel de GeLearning.

---

## 1. Configuración base

### Variable de entorno

```env
# .env.local (Next.js)
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```

> Nunca incluyas la barra final. Todos los paths en este documento ya incluyen `/`.

### Cliente HTTP centralizado

Crea un único wrapper para `fetch` que aplique los headers y el token automáticamente en cada llamada.

```ts
// lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_URL;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sanctum_token");
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: Record<string, unknown> | FormData;
};

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    body: isFormData
      ? (options.body as FormData)
      : options.body
      ? JSON.stringify(options.body)
      : undefined,
  });

  const json = await res.json();

  if (!res.ok) {
    // json.message siempre existe en errores de esta API
    throw new ApiError(res.status, json.message, json.errors);
  }

  return json as T;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
  }
}

export const api = {
  get:    <T>(path: string, init?: ApiOptions) => request<T>(path, { method: "GET",    ...init }),
  post:   <T>(path: string, body?: ApiOptions["body"], init?: ApiOptions) => request<T>(path, { method: "POST",   body, ...init }),
  put:    <T>(path: string, body?: ApiOptions["body"], init?: ApiOptions) => request<T>(path, { method: "PUT",    body, ...init }),
  patch:  <T>(path: string, body?: ApiOptions["body"], init?: ApiOptions) => request<T>(path, { method: "PATCH",  body, ...init }),
  delete: <T>(path: string, init?: ApiOptions) => request<T>(path, { method: "DELETE", ...init }),
};
```

---

## 2. Headers requeridos en cada petición

| Header          | Valor                         | Cuándo                              |
|-----------------|-------------------------------|-------------------------------------|
| `Accept`        | `application/json`            | **Siempre** (activa respuestas JSON en Laravel) |
| `Content-Type`  | `application/json`            | POST / PUT / PATCH con cuerpo JSON  |
| `Content-Type`  | *(omitir — lo pone el browser)* | POST multipart (subida de archivos) |
| `Authorization` | `Bearer <token>`              | Todas las rutas protegidas          |

> **Importante:** Si `Accept: application/json` no está presente, Laravel puede devolver HTML en lugar de JSON en algunos errores (ej. 419, redirección de auth).

---

## 3. Formato de respuesta universal

Todos los endpoints devuelven esta estructura:

```json
{
  "success": true,
  "data": { ... },
  "message": "Texto descriptivo"
}
```

En errores:

```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": {
    "email": ["El campo email es obligatorio."]
  }
}
```

`errors` solo aparece en errores de validación (HTTP 422). Para todos los demás errores solo existe `message`.

### Códigos HTTP utilizados

| Código | Significado en esta API                          |
|--------|--------------------------------------------------|
| `200`  | OK — lectura o acción exitosa                    |
| `201`  | Recurso creado                                   |
| `400`  | Error genérico de negocio                        |
| `401`  | No autenticado (token ausente o inválido)        |
| `403`  | Autenticado pero sin permiso                     |
| `404`  | Recurso no encontrado                            |
| `409`  | Conflicto (ej. usuario ya inscrito)              |
| `422`  | Error de validación — revisa `errors`            |

---

## 4. Autenticación

### Login

```
POST /api/auth/login
```

**Body JSON:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

**Respuesta exitosa (`200`):**
```json
{
  "success": true,
  "data": {
    "token": "1|abc123...",
    "user": {
      "id": 1,
      "name": "Pablo Escalante",
      "email": "pablo@ejemplo.com",
      "role": "admin",
      "avatar_url": null
    }
  },
  "message": "Inicio de sesión exitoso."
}
```

**Almacenamiento del token:**

```ts
// Guardar tras login exitoso
localStorage.setItem("sanctum_token", data.token);
localStorage.setItem("current_user", JSON.stringify(data.user));
```

> Para SSR en Next.js 14, considera guardar el token también en una cookie HttpOnly desde un Route Handler (`/app/api/auth/login/route.ts`) para poder leerlo en Server Components.

### Logout

```
POST /api/auth/logout
Authorization: Bearer <token>
```

Sin body. Revoca el token en el servidor.

```ts
// Limpiar tras logout exitoso
localStorage.removeItem("sanctum_token");
localStorage.removeItem("current_user");
```

### Usuario autenticado

```
GET /api/auth/me
Authorization: Bearer <token>
```

Devuelve el mismo objeto `user` que el login.

---

## 5. Roles y acceso

El campo `user.role` puede ser `"admin"`, `"instructor"` o `"student"`. Las reglas de acceso más importantes:

| Acción                              | Admin | Instructor       | Student              |
|-------------------------------------|-------|------------------|----------------------|
| Ver todos los cursos                | ✅    | Solo los suyos   | Solo en los que está inscrito |
| Crear / editar / borrar cursos      | ✅    | Solo los suyos   | ❌                   |
| Inscribir estudiantes               | ✅    | Solo en los suyos| ❌                   |
| Invitar al curso                    | ✅    | Solo en los suyos| ❌                   |
| Ver lista de estudiantes del curso  | ✅    | Solo en los suyos| ❌                   |
| Gestionar usuarios (`/admin/users`) | ✅    | ❌               | ❌                   |

---

## 6. Endpoints y contratos

### 6.1 Cursos

#### Listar cursos
```
GET /api/v1/courses
```
Devuelve array de cursos. El filtro por rol es automático en el servidor.

#### Detalle de curso
```
GET /api/v1/courses/{id}
```
Incluye: `instructor`, `modules[].lessons`, `liveSessions`.

#### Crear curso
```
POST /api/v1/courses
```
```json
{
  "title": "Nombre del curso",
  "description": "Descripción larga",
  "thumbnail_url": "https://...",  // opcional
  "status": "draft"                // "draft" | "published" | "archived" — opcional
}
```

#### Actualizar curso
```
PUT /api/v1/courses/{id}
```
Mismos campos que crear, todos opcionales (`sometimes`).

#### Eliminar curso
```
DELETE /api/v1/courses/{id}
```

---

### 6.2 Módulos

#### Listar módulos de un curso
```
GET /api/v1/courses/{courseId}/modules
```
Incluye las lecciones de cada módulo.

#### Crear módulo
```
POST /api/v1/courses/{courseId}/modules
```
```json
{
  "title": "Módulo 1",
  "description": "Descripción opcional",
  "order": 0
}
```

#### Reordenar módulos
```
PATCH /api/v1/courses/{courseId}/modules/reorder
```
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

### 6.3 Lecciones

#### Listar lecciones de un módulo
```
GET /api/v1/modules/{moduleId}/lessons
```
Los students solo ven lecciones con `is_published: true`.

#### Crear lección
```
POST /api/v1/modules/{moduleId}/lessons
```
```json
{
  "title": "Introducción",
  "type": "video",           // "video" | "pdf" | "word" | "link"
  "content_url": "https://...",
  "duration_minutes": 15,    // opcional
  "order": 0,                // opcional
  "is_published": false      // opcional, default false
}
```

#### Marcar lección como completada
```
POST /api/v1/lessons/{lessonId}/complete
```
Sin body. Si con esta lección el estudiante completa el 100% del curso, el servidor genera automáticamente el certificado y envía un email.

#### Reordenar lecciones
```
PATCH /api/v1/modules/{moduleId}/lessons/reorder
```
```json
{
  "lessons": [
    { "id": 5, "order": 0 },
    { "id": 6, "order": 1 }
  ]
}
```

---

### 6.4 Sesiones en directo

#### Listar sesiones de un curso
```
GET /api/v1/courses/{courseId}/live-sessions
```

#### Crear sesión
```
POST /api/v1/courses/{courseId}/live-sessions
```
```json
{
  "title": "Clase en vivo - Módulo 1",
  "description": "Texto opcional",
  "meeting_url": "https://meet.google.com/xxx",
  "starts_at": "2026-06-15T18:00:00Z",  // ISO 8601, debe ser futuro
  "ends_at": "2026-06-15T20:00:00Z"     // opcional, debe ser > starts_at
}
```

---

### 6.5 Inscripciones

#### Inscribir estudiante (admin/instructor)
```
POST /api/v1/enrollments
```
```json
{
  "user_id": 42,
  "course_id": 7
}
```
Devuelve `409` si el estudiante ya está inscrito.

#### Dar de baja estudiante (admin/instructor)
```
DELETE /api/v1/enrollments/{enrollmentId}
```

#### Ver estudiantes de un curso (admin/instructor)
```
GET /api/v1/courses/{courseId}/students
```
Devuelve array con `id`, `name`, `email`, `avatar_url` y los campos pivot `enrolled_at`, `completed_at`.

---

### 6.6 Invitaciones

#### Enviar invitación (admin/instructor)
```
POST /api/v1/invitations
```
```json
{
  "email": "nuevo@estudiante.com",
  "course_id": 7
}
```
Envía un email con un link de aceptación. Si ya existe una invitación pendiente válida para ese email+curso, la reutiliza.

#### Listar invitaciones de un curso
```
GET /api/v1/invitations?course_id=7
```

#### Aceptar invitación (ruta pública)
```
GET /api/v1/invitations/accept/{token}
```
**Sin autenticación.** El token llega por email al usuario invitado. El frontend debe redirigir a esta URL (o hacer `GET` en un Route Handler) cuando el usuario haga clic en el link del email. El usuario debe existir con ese email; si no, devuelve `422`.

---

### 6.7 Progreso

```
GET /api/v1/courses/{courseId}/progress
```
**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 12,
    "completed": 8,
    "percent": 66.67
  },
  "message": ""
}
```

---

### 6.8 Certificados

```
GET /api/v1/courses/{courseId}/certificate
```
Devuelve el registro del certificado si existe (incluye `certificate_url` con la URL pública en R2). Si el curso no está completado al 100%, devuelve `403`.

---

### 6.9 Foro

#### Listar hilos
```
GET /api/v1/courses/{courseId}/forum/threads
```
Los hilos fijados (`is_pinned: true`) aparecen primero. Cada hilo incluye `replies_count`.

#### Crear hilo
```
POST /api/v1/courses/{courseId}/forum/threads
```
```json
{
  "title": "Duda sobre el módulo 2",
  "body": "Texto del hilo..."
}
```

#### Ver hilo con respuestas
```
GET /api/v1/courses/{courseId}/forum/threads/{threadId}
```
Incluye array `replies[].user`.

#### Fijar/desfijar hilo (toggle)
```
PATCH /api/v1/courses/{courseId}/forum/threads/{threadId}/pin
```
Sin body. Solo admin/instructor.

#### Cerrar/abrir hilo (toggle)
```
PATCH /api/v1/courses/{courseId}/forum/threads/{threadId}/close
```
Sin body. Solo admin/instructor.

#### Crear respuesta
```
POST /api/v1/courses/{courseId}/forum/threads/{threadId}/replies
```
```json
{
  "body": "Texto de la respuesta..."
}
```
Devuelve `403` si el hilo está cerrado.

#### Editar respuesta
```
PUT /api/v1/replies/{replyId}
```
```json
{
  "body": "Texto editado..."
}
```

#### Eliminar respuesta
```
DELETE /api/v1/replies/{replyId}
```

---

### 6.10 Subida de archivos

```
POST /api/v1/upload
Content-Type: multipart/form-data
```

Acepta PDF, DOC y DOCX. Máximo 50 MB.

**Cómo enviar desde Next.js:**
```ts
const formData = new FormData();
formData.append("file", file); // File del <input type="file">

const result = await api.post("/api/v1/upload", formData);
// result.data.url → URL pública en R2 para usar como content_url en lecciones
```

**Respuesta (`201`):**
```json
{
  "success": true,
  "data": {
    "url": "https://r2.tudominio.com/documents/pdf/uuid.pdf",
    "filename": "documents/pdf/uuid.pdf",
    "original": "mi-archivo.pdf",
    "size_bytes": 204800,
    "mime_type": "application/pdf"
  },
  "message": "Archivo subido correctamente."
}
```

El flujo normal es: subir el archivo con este endpoint → obtener `url` → usarla como `content_url` al crear/actualizar una lección.

---

### 6.11 Administración de usuarios (solo admin)

#### Listar usuarios
```
GET /api/v1/admin/users
GET /api/v1/admin/users?role=student   // filtrar por rol
```
Roles válidos: `admin`, `instructor`, `student`.

#### Crear usuario
```
POST /api/v1/admin/users
```
```json
{
  "name": "María López",
  "email": "maria@ejemplo.com",
  "password": "contraseña-segura",
  "role": "instructor"
}
```

#### Actualizar usuario
```
PUT /api/v1/admin/users/{id}
```
Todos los campos son opcionales. Si `password` es `null` o se omite, no se modifica.

#### Eliminar usuario
```
DELETE /api/v1/admin/users/{id}
```
Devuelve `403` si intentas eliminar tu propia cuenta.

---

## 7. Manejo de errores en el frontend

```ts
// hooks/useApi.ts — ejemplo de uso en un componente
import { ApiError } from "@/lib/api";

try {
  const res = await api.post<LoginResponse>("/api/auth/login", { email, password });
  saveToken(res.data.token);
} catch (err) {
  if (err instanceof ApiError) {
    if (err.status === 422) {
      // Errores de campo: err.errors = { email: ["..."] }
      setFieldErrors(err.errors);
    } else if (err.status === 401) {
      router.push("/login");
    } else {
      setGlobalError(err.message); // mensaje legible del servidor
    }
  }
}
```

---

## 8. CORS — configuración en Apache

Dado que el frontend (Apache) y la API (Laravel) están en dominios o puertos distintos, el servidor Laravel debe tener CORS configurado. Asegúrate de que `config/cors.php` de Laravel incluya el origen de Next.js:

```php
// config/cors.php
'allowed_origins' => ['https://tudominio.com'],
'allowed_headers' => ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
```

Si el frontend también corre en Apache, agrega este bloque al `.htaccess` o `VirtualHost` del frontend **solo si el proxy lo requiere**; en general, CORS se gestiona desde el backend:

```apache
Header always set Access-Control-Allow-Origin "https://api.tudominio.com"
```

---

## 9. Consideraciones para Next.js 14 (App Router)

### Server Components vs Client Components

- **Login, logout:** deben ser Client Components (usan `localStorage`/cookies).
- **Listados de cursos, detalle:** pueden ser Server Components si el token se guarda en una cookie HttpOnly.
- **Subida de archivos, formularios interactivos:** siempre Client Components.

### Route Handlers como proxy (opcional pero recomendado)

Para evitar exponer el token en el cliente y poder usarlo en Server Components, crea Route Handlers en `/app/api/`:

```ts
// app/api/auth/login/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${process.env.API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.success) {
    cookies().set("sanctum_token", data.data.token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
  }
  return NextResponse.json(data, { status: res.status });
}
```

En este caso, `NEXT_PUBLIC_API_URL` no necesita ser pública; usa `API_URL` (sin prefijo `NEXT_PUBLIC_`) para que solo el servidor la lea.

### Middleware de protección de rutas

```ts
// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("sanctum_token")?.value;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/dashboard");

  if (isAuthRoute && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

---

## 10. Resumen de rutas públicas vs protegidas

| Método | Ruta                                     | Auth requerida |
|--------|------------------------------------------|----------------|
| POST   | `/api/auth/login`                        | No             |
| GET    | `/api/v1/invitations/accept/{token}`     | No             |
| Todas  | `/api/auth/logout`                       | Sí             |
| Todas  | `/api/auth/me`                           | Sí             |
| Todas  | `/api/v1/*`                              | Sí             |
