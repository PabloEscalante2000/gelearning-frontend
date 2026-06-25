"use client";

import Link from "next/link";
import { CheckCircle2, PlayCircle, FileText, Link2, FileIcon, CalendarClock, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/types";

function formatScheduled(dt: string): string {
  const [datePart, timePart] = dt.split(" ");
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = (timePart ?? "00:00").split(":").map(Number);
  const date = new Date(y, m - 1, d, h, min);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
    + " · " + date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

interface LessonItemProps {
  lesson: Lesson;
  courseId: string;
  moduleId: string;
  active?: boolean;
}

const typeIcon = {
  video: PlayCircle,
  pdf: FileText,
  word: FileIcon,
  link: Link2,
  submission: UploadCloud,
};

export default function LessonItem({ lesson, courseId, moduleId, active }: LessonItemProps) {
  const Icon = typeIcon[lesson.type] ?? FileText;
  const done = !!lesson.completed;

  return (
    <Link
      href={`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/`}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary/10 text-primary font-medium"
          : done
            ? "text-muted-foreground hover:bg-muted/60"
            : "hover:bg-muted text-foreground"
      )}
    >
      {done ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
      ) : (
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <span className={cn("line-clamp-1 block", done && !active && "text-muted-foreground")}>
          {lesson.title}
        </span>
        {done && !active && (
          <span className="text-xs font-medium text-green-600">Completada</span>
        )}
        {lesson.scheduled_at && !done && (
          <span className="flex items-center gap-1 text-xs text-blue-600 mt-0.5">
            <CalendarClock className="h-3 w-3 shrink-0" />
            {formatScheduled(lesson.scheduled_at)}
          </span>
        )}
      </div>
      {lesson.duration_minutes && !done && (
        <span className="text-xs text-muted-foreground shrink-0">
          {lesson.duration_minutes}m
        </span>
      )}
    </Link>
  );
}
