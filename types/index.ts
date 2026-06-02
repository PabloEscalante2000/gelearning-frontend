// ── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "instructor" | "student";
export type CourseStatus = "draft" | "published" | "archived";
export type LessonType = "video" | "pdf" | "word" | "link";

// ── Core models ───────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  email_verified_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: number;
  instructor_id: number;
  title: string;
  description: string;
  thumbnail_url: string | null;
  status: CourseStatus;
  instructor: User;
  modules?: Module[];
  live_sessions?: LiveSession[];
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  order: number;
  lessons?: Lesson[];   // present in course detail; absent in course list
  created_at?: string;
  updated_at?: string;
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  type: LessonType;
  content_url: string;
  duration_minutes: number | null;
  order: number;
  is_published: boolean;
  completed?: boolean;
}

export interface LiveSession {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  meeting_url: string;
  starts_at: string;
  ends_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  enrolled_by: number;
  enrolled_at: string;
  completed_at: string | null;
  course?: {
    id: number;
    title: string;
    status: CourseStatus;
  };
}

export interface CourseProgress {
  total: number;
  completed: number;
  percent: number;
}

export interface Certificate {
  id: number;
  user_id: number;
  course_id: number;
  issued_at: string;
  certificate_url: string;
}

export interface ForumThread {
  id: number;
  course_id: number;
  user_id: number;
  user: User;
  title: string;
  body: string;
  is_pinned: boolean;
  is_closed: boolean;
  replies_count?: number;
  replies?: ForumReply[];
  created_at: string;
  updated_at: string;
}

export interface ForumReply {
  id: number;
  thread_id: number;
  user_id: number;
  user: User;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface UploadedFile {
  url: string;
  filename: string;
  original: string;
  size_bytes: number;
  mime_type: string;
}

// ── API response wrapper ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
