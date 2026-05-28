"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProgressBar from "@/components/courses/ProgressBar";
import { useCourseModules, useCourseProgress } from "@/hooks/useCourses";

export default function CourseProgressPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: progress, isLoading: loadingProgress } = useCourseProgress(courseId);
  const { data: modules = [], isLoading: loadingModules } = useCourseModules(courseId);

  const isLoading = loadingProgress || loadingModules;

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
              <ProgressBar value={progress.progress_percentage} />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {Math.round(progress.progress_percentage)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Completado</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{progress.completed_lessons}</p>
                  <p className="text-xs text-muted-foreground">Lecciones vistas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{progress.total_lessons}</p>
                  <p className="text-xs text-muted-foreground">Total lecciones</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {modules.map((module) => {
              const completedCount = module.lessons.filter((l) => l.completed).length;
              const moduleProgress = (completedCount / (module.lessons.length || 1)) * 100;
              return (
                <Card key={module.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium">{module.title}</CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {completedCount}/{module.lessons.length}
                      </span>
                    </div>
                    <ProgressBar value={moduleProgress} showLabel={false} />
                  </CardHeader>
                  <CardContent className="pt-0 space-y-1">
                    {module.lessons.map((lesson) => (
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
