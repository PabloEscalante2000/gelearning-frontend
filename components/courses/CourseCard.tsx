import Link from "next/link";
import Image from "next/image";
import { BookOpen, Users, CheckCircle } from "lucide-react";
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

function formatPrice(price: string | null): string {
  if (price === null) return "";
  const n = parseFloat(price);
  if (n === 0) return "Gratis";
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;
}

export default function CourseCard({ course, progress }: CourseCardProps) {
  const status = statusLabel[course.status];
  const showEnrollmentBadge = course.is_enrolled !== undefined;
  const priceLabel = course.price !== undefined ? formatPrice(course.price) : null;
  const lessonCount = course.lessons_count !== undefined
    ? course.lessons_count
    : course.modules?.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0);

  const thumbnailBadge = showEnrollmentBadge
    ? course.is_enrolled
      ? { label: "Inscrito", variant: "default" as const }
      : priceLabel
        ? { label: priceLabel, variant: "secondary" as const }
        : null
    : { label: status.label, variant: status.variant };

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
          {thumbnailBadge && (
            <Badge className="absolute top-2 right-2" variant={thumbnailBadge.variant}>
              {thumbnailBadge.label}
            </Badge>
          )}
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
          {lessonCount !== undefined && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {lessonCount} lecciones
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {course.instructor.name}
          </span>
          {course.is_enrolled === true && (
            <span className="flex items-center gap-1 text-green-600 ml-auto">
              <CheckCircle className="h-3 w-3" />
              Acceso completo
            </span>
          )}
        </div>
      </CardContent>

      {progress !== undefined && (
        <CardFooter className="pt-0 pb-4">
          <ProgressBar value={progress} className="w-full" />
        </CardFooter>
      )}

      {course.is_enrolled === false && priceLabel && (
        <CardFooter className="pt-0 pb-4">
          <Link href={`/courses/${course.id}/`} className="w-full">
            <div className="flex items-center justify-between w-full rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-sm hover:bg-primary/10 transition-colors">
              <span className="text-muted-foreground">Ver curso</span>
              <span className="font-semibold text-primary">{priceLabel}</span>
            </div>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
