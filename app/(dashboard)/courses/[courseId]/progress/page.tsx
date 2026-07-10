"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Loader2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProgressBar from "@/components/courses/ProgressBar";
import { useCourse, useCourseProgress, useCourseCertificate } from "@/hooks/useCourses";
import { useUrlParams } from "@/hooks/useUrlParams";

const PROGRESS_PATH = /\/courses\/([^/]+)\/progress\/?$/;
const PROGRESS_PATH_KEYS = ["courseId"] as const;

export default function CourseProgressPage() {
  const { courseId } = useUrlParams<{ courseId: string }>(PROGRESS_PATH, PROGRESS_PATH_KEYS);
  const { data: progress, isLoading: loadingProgress } = useCourseProgress(courseId);
  const { data: course, isLoading: loadingCourse } = useCourse(courseId);
  const { data: certificate } = useCourseCertificate(courseId);
  const modules = course?.modules ?? [];

  const isLoading = loadingProgress || loadingCourse;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/courses/${courseId}/`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Mi progreso</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && progress && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Progreso general</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* API returns: total, completed, percent */}
              <ProgressBar value={progress.percent} />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {Math.round(progress.percent)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Completado</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{progress.completed}</p>
                  <p className="text-xs text-muted-foreground">Lecciones vistas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{progress.total}</p>
                  <p className="text-xs text-muted-foreground">Total lecciones</p>
                </div>
              </div>

              {certificate && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex items-center gap-3">
                  <Award className="h-6 w-6 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      ¡Certificado obtenido!
                    </p>
                    <a
                      href={certificate.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 underline"
                    >
                      Descargar certificado
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {modules.map((module) => {
              const lessons = module.lessons ?? [];
              const completedCount = lessons.filter((l) => l.completed).length;
              const moduleProgress = lessons.length
                ? (completedCount / lessons.length) * 100
                : 0;
              return (
                <Card key={module.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium">{module.title}</CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {completedCount}/{lessons.length}
                      </span>
                    </div>
                    <ProgressBar value={moduleProgress} showLabel={false} />
                  </CardHeader>
                  <CardContent className="pt-0 space-y-1">
                    {lessons.map((lesson) => (
                      <div key={lesson.id} className="flex items-center gap-2 text-sm py-1">
                        {lesson.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={lesson.completed ? "line-through text-muted-foreground" : ""}>
                          {lesson.title}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
