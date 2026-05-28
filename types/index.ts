export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "instructor" | "student";
  avatar?: string;
  created_at: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  instructor: User;
  modules_count: number;
  lessons_count: number;
  enrolled: boolean;
  progress?: number;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: number;
  course_id: number;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  type: "video" | "pdf" | "text" | "quiz";
  content_url?: string;
  content?: string;
  duration?: number;
  order: number;
  completed?: boolean;
}

export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  progress: number;
  completed_at?: string;
  enrolled_at: string;
}

export interface CourseProgress {
  course_id: number;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
  last_lesson?: Lesson;
}

export interface ForumThread {
  id: number;
  course_id: number;
  user: User;
  title: string;
  body: string;
  replies_count: number;
  created_at: string;
  updated_at: string;
}

export interface ForumReply {
  id: number;
  thread_id: number;
  user: User;
  body: string;
  created_at: string;
}

export interface LiveSession {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  meet_url: string;
  scheduled_at: string;
  duration_minutes: number;
}

export interface Invitation {
  id: number;
  email: string;
  role: "admin" | "instructor" | "student";
  status: "pending" | "accepted" | "expired";
  invited_by: User;
  created_at: string;
  expires_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    prev: string | null;
    next: string | null;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
