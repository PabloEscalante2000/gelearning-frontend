"use client";

import Link from "next/link";
import { CheckCircle2, PlayCircle, FileText, Link2, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/types";

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
};

export default function LessonItem({ lesson, courseId, moduleId, active }: LessonItemProps) {
  const Icon = typeIcon[lesson.type] ?? FileText;

  return (
    <Link
      href={`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/`}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "hover:bg-muted text-foreground"
      )}
    >
      {lesson.completed ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
      ) : (
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <span className="flex-1 line-clamp-1">{lesson.title}</span>
      {lesson.duration_minutes && (
        <span className="text-xs text-muted-foreground shrink-0">
          {lesson.duration_minutes}m
        </span>
      )}
    </Link>
  );
}
