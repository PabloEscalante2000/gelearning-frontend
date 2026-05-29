import Link from "next/link";
import Image from "next/image";
import { BookOpen, Users } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProgressBar from "./ProgressBar";
import type { Course } from "@/types";

interface CourseCardProps {
  course: Course;
  progress?: number;
}

const statusLabel: Record<Course["status"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  published: { label: "Publicado", variant: "default" },
  draft: { label: "Borrador", variant: "secondary" },
  archived: { label: "Archivado", variant: "outline" },
};

export default function CourseCard({ course, progress }: CourseCardProps) {
  const status = statusLabel[course.status];

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md group">
      <Link href={`/courses/${course.id}/`}>
        <div className="relative aspect-video bg-muted overflow-hidden">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <BookOpen className="h-12 w-12 text-primary/40" />
            </div>
          )}
          <Badge className="absolute top-2 right-2" variant={status.variant}>
            {status.label}
          </Badge>
        </div>
      </Link>

      <CardContent className="pt-4 pb-2">
        <Link href={`/courses/${course.id}/`}>
          <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
            {course.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          {course.modules && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {course.modules.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0)} lecciones
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {course.instructor.name}
          </span>
        </div>
      </CardContent>

      {progress !== undefined && (
        <CardFooter className="pt-0 pb-4">
          <ProgressBar value={progress} className="w-full" />
        </CardFooter>
      )}
    </Card>
  );
}
