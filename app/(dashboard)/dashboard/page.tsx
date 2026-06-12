"use client";

import {
  BookOpen,
  TrendingUp,
  Award,
  Clock,
  Users,
  GraduationCap,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { useAdminStats, useInstructorStats } from "@/hooks/useStats";
import type { AdminStats, InstructorCourseStats } from "@/types";

// ── Admin ─────────────────────────────────────────────────────────────────────

function AdminDashboard() {
  const { data, isLoading } = useAdminStats();

  const cards: {
    label: string;
    key: keyof AdminStats;
    icon: React.ElementType;
    color: string;
    suffix?: string;
  }[] = [
    { label: "Estudiantes", key: "total_students", icon: Users, color: "text-blue-500" },
    { label: "Cursos publicados", key: "total_courses", icon: BookOpen, color: "text-indigo-500" },
    { label: "Inscripciones", key: "total_enrollments", icon: GraduationCap, color: "text-green-500" },
    {
      label: "Lecciones completadas",
      key: "total_lessons_completed",
      icon: Award,
      color: "text-yellow-500",
    },
    {
      label: "Progreso promedio",
      key: "avg_progress",
      icon: TrendingUp,
      color: "text-purple-500",
      suffix: "%",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mt-1">
          Resumen general de la plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map(({ label, key, icon: Icon, color, suffix }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">{label}</CardDescription>
              <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {isLoading ? "—" : `${data?.[key] ?? 0}${suffix ?? ""}`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Instructor ────────────────────────────────────────────────────────────────

function InstructorDashboard() {
  const { data: courses, isLoading } = useInstructorStats();

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm">Cargando estadísticas...</p>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">
            Aún no tienes cursos creados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground mt-1">
        Actividad de tus cursos.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {courses.map((course: InstructorCourseStats) => (
          <Card key={course.course_id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base leading-snug">
                {course.course_title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                    <Users className="h-4 w-4" />
                  </div>
                  <p className="text-xl font-bold">{course.enrolled_students}</p>
                  <p className="text-xs text-muted-foreground">Inscritos</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-indigo-500 mb-1">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <p className="text-xl font-bold">{course.total_lessons}</p>
                  <p className="text-xs text-muted-foreground">Lecciones</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-xl font-bold">{course.total_completions}</p>
                  <p className="text-xs text-muted-foreground">Completadas</p>
                </div>
              </div>

              {/* Barra de tasa de completado */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    Tasa de completado
                  </span>
                  <span className="font-medium text-foreground">
                    {course.completion_rate}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${course.completion_rate}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Student ───────────────────────────────────────────────────────────────────

function StudentDashboard() {
  const cards = [
    { label: "Cursos inscritos", value: "—", icon: BookOpen, color: "text-blue-500" },
    { label: "Progreso promedio", value: "—", icon: TrendingUp, color: "text-green-500" },
    { label: "Lecciones completadas", value: "—", icon: Award, color: "text-yellow-500" },
    { label: "Horas de estudio", value: "—", icon: Clock, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground mt-1">
        Aquí tienes un resumen de tu actividad de aprendizaje.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">{label}</CardDescription>
              <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Continuar aprendiendo</CardTitle>
          <CardDescription>Retoma donde lo dejaste</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Inscríbete en cursos para ver tu progreso aquí.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const subtitles: Record<string, string> = {
    admin: "Panel de administración",
    instructor: "Panel del instructor",
    student: "Mi aprendizaje",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Bienvenido, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          {subtitles[user?.role ?? "student"]}
        </p>
      </div>

      {user?.role === "admin" && <AdminDashboard />}
      {user?.role === "instructor" && <InstructorDashboard />}
      {user?.role === "student" && <StudentDashboard />}
    </div>
  );
}
