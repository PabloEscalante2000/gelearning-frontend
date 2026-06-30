"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeft, CheckCircle, Loader2, ExternalLink, CalendarClock, UploadCloud, Download, FileCheck, AlertCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import VideoPlayer from "@/components/courses/VideoPlayer";
import PdfViewer from "@/components/courses/PdfViewer";
import ModuleAccordion from "@/components/courses/ModuleAccordion";
import { useLesson, useCompleteLesson } from "@/hooks/useLessons";
import { useCourse } from "@/hooks/useCourses";
import { useMySubmission, useSubmitAssignment, downloadSubmission } from "@/hooks/useSubmissions";

function formatScheduled(dt: string): string {
  const [datePart, timePart] = dt.split(" ");
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = (timePart ?? "00:00").split(":").map(Number);
  const date = new Date(y, m - 1, d, h, min);
  const dayStr = date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${dayStr} a las ${timeStr}`;
}

function toAbsoluteUrl(url: string | null | undefined): string {
  const raw = (url ?? "").trim();
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export default function LessonPage() {
  const { courseId, moduleId, lessonId } = useParams<{
    courseId: string;
    moduleId: string;
    lessonId: string;
  }>();

  const { data: lesson, isLoading } = useLesson(moduleId, lessonId);
  const { data: course } = useCourse(courseId);
  const modules = course?.modules ?? [];
  const complete = useCompleteLesson();
  const { data: mySubmission } = useMySubmission(lesson?.type === "submission" ? lessonId : "");
  const submitAssignment = useSubmitAssignment();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await submitAssignment.mutateAsync({ lessonId, moduleId, courseId, file });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDownload() {
    if (!mySubmission) return;
    setDownloading(true);
    try { await downloadSubmission(mySubmission); } finally { setDownloading(false); }
  }

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
        <Link href={`/courses/${courseId}/`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al curso
          </Button>
        </Link>

        <h1 className="text-2xl font-bold">{lesson.title}</h1>

        {lesson.scheduled_at && (
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <CalendarClock className="h-5 w-5 text-blue-600 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-blue-800">Fecha programada: </span>
              <span className="text-blue-700 capitalize">{formatScheduled(lesson.scheduled_at)}</span>
            </div>
          </div>
        )}

        {lesson.type === "video" && (
          <VideoPlayer url={lesson.content_url ?? ""} title={lesson.title} />
        )}

        {lesson.type === "pdf" && (
          <PdfViewer url={lesson.content_url ?? ""} title={lesson.title} />
        )}

        {lesson.type === "word" && (
          <PdfViewer url={lesson.content_url ?? ""} title={lesson.title} />
        )}

        {lesson.type === "link" && (
          <div className="rounded-lg border p-6 text-center space-y-3">
            <ExternalLink className="h-12 w-12 mx-auto text-primary" />
            <p className="font-medium">{lesson.title}</p>
            <a
              href={toAbsoluteUrl(lesson.content_url)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants()}
            >
              Abrir enlace externo
            </a>
          </div>
        )}

        {lesson.type === "submission" && (
          <div className="space-y-4">
            {lesson.due_date && (() => {
              const due = new Date(lesson.due_date.replace(" ", "T"));
              const now = new Date();
              const overdue = now > due;
              const dateStr = due.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
              const timeStr = due.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
              return (
                <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${overdue ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                  <AlertCircle className={`h-5 w-5 shrink-0 ${overdue ? "text-red-500" : "text-amber-500"}`} />
                  <div className="text-sm">
                    <span className={`font-semibold ${overdue ? "text-red-800" : "text-amber-800"}`}>
                      {overdue ? "Fecha de entrega vencida: " : "Fecha de entrega: "}
                    </span>
                    <span className={overdue ? "text-red-700" : "text-amber-700"}>
                      {dateStr} a las {timeStr}
                    </span>
                  </div>
                </div>
              );
            })()}
            {lesson.content_url && (
              <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
                <p className="text-sm font-semibold">Instrucciones</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{lesson.content_url}</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.txt,.xlsx,.xls,.csv,.mp4"
              onChange={handleFileChange}
            />

            {mySubmission ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="font-semibold text-green-800">Tarea entregada</span>
                </div>
                <div className="text-sm text-green-700 space-y-0.5">
                  <p className="font-medium truncate">{mySubmission.file_name}</p>
                  <p className="text-xs text-green-600">
                    {(mySubmission.file_size / 1024 / 1024).toFixed(2)} MB ·{" "}
                    {new Date(mySubmission.submitted_at).toLocaleDateString("es-ES", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
                    {downloading
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <Download className="mr-2 h-4 w-4" />}
                    Descargar mi entrega
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitAssignment.isPending}
                  >
                    {submitAssignment.isPending
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <UploadCloud className="mr-2 h-4 w-4" />}
                    Reemplazar entrega
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed p-8 text-center space-y-4">
                <UploadCloud className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-semibold">Sube tu tarea</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PDF, Word, PowerPoint, imágenes, ZIP — máximo 50 MB
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitAssignment.isPending}
                >
                  {submitAssignment.isPending
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <UploadCloud className="mr-2 h-4 w-4" />}
                  {submitAssignment.isPending ? "Subiendo..." : "Seleccionar archivo"}
                </Button>
                {submitAssignment.isError && (
                  <p className="text-xs text-destructive">Error al subir el archivo. Intenta de nuevo.</p>
                )}
              </div>
            )}
          </div>
        )}

        {lesson.type !== "submission" && (
          <div className="flex justify-end pt-4">
            {lesson.completed ? (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="h-5 w-5" />
                Lección completada
              </div>
            ) : (
              <Button
                onClick={() => complete.mutate({ lessonId, moduleId, courseId })}
                disabled={complete.isPending}
              >
                {complete.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Marcar como completada
              </Button>
            )}
          </div>
        )}
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
