import CourseCard from "./CourseCard";
import type { Course } from "@/types";

interface CourseGridProps {
  courses: Course[];
  emptyMessage?: string;
}

export default function CourseGrid({
  courses,
  emptyMessage = "No hay cursos disponibles.",
}: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
