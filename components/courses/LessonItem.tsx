"use client";

import Link from "next/link";
import { CheckCircle2, Circle, FileText, PlayCircle, FileQuestion } from "lucide-react";
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
  text: FileText,
  quiz: FileQuestion,
};

export default function LessonItem({ lesson, courseId, moduleId, active }: LessonItemProps) {
  const Icon = typeIcon[lesson.type] ?? Circle;

  return (
    <Link
      href={`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}
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
      {lesson.duration && (
        <span className="text-xs text-muted-foreground shrink-0">
          {Math.ceil(lesson.duration / 60)}m
        </span>
      )}
    </Link>
  );
}
