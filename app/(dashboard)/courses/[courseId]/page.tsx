"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen, MessageSquare, Video, TrendingUp, Loader2, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ModuleAccordion from "@/components/courses/ModuleAccordion";
import ProgressBar from "@/components/courses/ProgressBar";
import { useCourse, useCourseProgress } from "@/hooks/useCourses";

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isLoading } = useCourse(courseId);
  const { data: progress } = useCourseProgress(courseId);

  // modules come embedded in course detail response
  const modules = course?.modules ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return <p className="text-muted-foreground">Curso no encontrado.</p>;
  }

  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <Badge>{course.status}</Badge>
          </div>
          <p className="text-muted-foreground mt-2">{course.description}</p>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {course.instructor.name}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {totalLessons} lecciones
            </span>
          </div>
        </div>

        {progress && (
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-sm font-medium mb-2">Tu progreso</p>
            <ProgressBar value={progress.percent} />
            <p className="text-xs text-muted-foreground mt-2">
              {progress.completed}/{progress.total} lecciones completadas
            </p>
          </div>
        )}

        <Separator />

        <div className="flex flex-wrap gap-3">
          <Link href={`/courses/${courseId}/forum/`}>
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              Foro
            </Button>
          </Link>
          <Link href={`/courses/${courseId}/live-sessions/`}>
            <Button variant="outline" size="sm">
              <Video className="mr-2 h-4 w-4" />
              Clases en vivo
            </Button>
          </Link>
          <Link href={`/courses/${courseId}/progress/`}>
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              Mi progreso
            </Button>
          </Link>
          {progress?.percent === 100 && (
            <Link href={`/courses/${courseId}/certificate/`}>
              <Button variant="outline" size="sm">
                <Award className="mr-2 h-4 w-4" />
                Mi certificado
              </Button>
            </Link>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Contenido del curso</h2>
          {modules.length > 0 ? (
            <ModuleAccordion modules={modules} courseId={courseId} />
          ) : (
            <p className="text-muted-foreground text-sm">No hay módulos disponibles.</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-6 space-y-4 sticky top-24">
          {modules[0]?.lessons?.[0] && (
            <Link
              href={`/courses/${courseId}/modules/${modules[0].id}/lessons/${modules[0].lessons![0].id}/`}
            >
              <Button className="w-full">
                {progress && progress.completed > 0 ? "Continuar curso" : "Empezar curso"}
              </Button>
            </Link>
          )}

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Módulos</span>
              <span>{modules.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lecciones</span>
              <span>{totalLessons}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Instructor</span>
              <span>{course.instructor.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
