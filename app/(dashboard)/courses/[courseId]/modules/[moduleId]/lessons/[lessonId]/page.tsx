"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoPlayer from "@/components/courses/VideoPlayer";
import PdfViewer from "@/components/courses/PdfViewer";
import ModuleAccordion from "@/components/courses/ModuleAccordion";
import { useLesson, useCompleteLesson } from "@/hooks/useLessons";
import { useCourseModules } from "@/hooks/useCourses";

export default function LessonPage() {
  const { courseId, moduleId, lessonId } = useParams<{
    courseId: string;
    moduleId: string;
    lessonId: string;
  }>();

  const { data: lesson, isLoading } = useLesson(courseId, moduleId, lessonId);
  const { data: modules = [] } = useCourseModules(courseId);
  const complete = useCompleteLesson();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lesson) {
    return <p className="text-muted-foreground">Lección no encontrada.</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center gap-3">
          <Link href={`/courses/${courseId}/`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al curso
            </Button>
          </Link>
        </div>

        <h1 className="text-2xl font-bold">{lesson.title}</h1>

        {lesson.type === "video" && lesson.content_url && (
          <VideoPlayer url={lesson.content_url} title={lesson.title} />
        )}

        {lesson.type === "pdf" && lesson.content_url && (
          <PdfViewer url={lesson.content_url} title={lesson.title} />
        )}

        {(lesson.type === "text" || lesson.type === "quiz") && lesson.content && (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        )}

        <div className="flex justify-end pt-4">
          {lesson.completed ? (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="h-5 w-5" />
              Lección completada
            </div>
          ) : (
            <Button
              onClick={() => complete.mutate({ courseId, moduleId, lessonId })}
              disabled={complete.isPending}
            >
              {complete.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Marcar como completada
            </Button>
          )}
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-24">
          <h3 className="font-semibold mb-3 text-sm">Contenido del curso</h3>
          <div className="max-h-[70vh] overflow-y-auto">
            <ModuleAccordion modules={modules} courseId={courseId} activeLessonId={lessonId} />
          </div>
        </div>
      </div>
    </div>
  );
}
