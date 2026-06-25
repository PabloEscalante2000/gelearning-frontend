// ── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "instructor" | "student";
export type CourseStatus = "draft" | "published" | "archived";
export type LessonType = "video" | "pdf" | "word" | "link" | "submission";

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
  price: string | null;
  is_enrolled?: boolean;
  lessons_count?: number;
  instructor: User;
  modules?: Module[];
  live_sessions?: LiveSession[];
  created_at: string;
  updated_at: string;
}

// ── Payments ──────────────────────────────────────────────────────────────────

export type PaymentStatus = "pending" | "approved" | "rejected" | "cancelled" | "in_process";

export interface PaymentPreference {
  payment_id?: number;
  init_point?: string;
  preference_id?: string;
  free?: boolean;
  enrolled?: boolean;
}

export interface PaymentStatusResponse {
  id: number;
  status: PaymentStatus;
  course_id: number;
  is_enrolled: boolean;
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
  content_url: string | null;
  duration_minutes: number | null;
  order: number;
  is_published: boolean;
  scheduled_at: string | null;
  completed?: boolean;
}

export interface StudentSubmission {
  id: number;
  user_id: number;
  lesson_id: number;
  course_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  submitted_at: string;
  user?: { id: number; name: string; email: string };
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

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface AdminStats {
  total_students: number;
  total_courses: number;
  total_enrollments: number;
  total_lessons_completed: number;
  avg_progress: number;
}

export interface InstructorCourseStats {
  course_id: number;
  course_title: string;
  enrolled_students: number;
  total_lessons: number;
  total_completions: number;
  completion_rate: number;
}

// ── Diploma Verifications ─────────────────────────────────────────────────────

export interface DiplomaVerification {
  id: number;
  code: string;
  student_name: string;
  student_document: string | null;
  course_id: number;
  issued_at: string;
  course?: { id: number; title: string };
  created_at: string;
  updated_at: string;
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
