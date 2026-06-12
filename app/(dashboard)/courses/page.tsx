"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import CourseGrid from "@/components/courses/CourseGrid";
import { useCourses } from "@/hooks/useCourses";
import { useAuthStore } from "@/store/useAuthStore";

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useCourses();
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === "student";

  const courses = data ?? [];
  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const enrolledCount = isStudent ? courses.filter((c) => c.is_enrolled).length : courses.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isStudent ? "Catálogo de cursos" : "Mis Cursos"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isStudent
              ? `${enrolledCount} inscripto${enrolledCount !== 1 ? "s" : ""} · ${courses.length} disponibles`
              : `${courses.length} cursos disponibles`}
          </p>
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {isError && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error al cargar los cursos. Intenta de nuevo.
        </div>
      )}

      {!isLoading && !isError && (
        <CourseGrid
          courses={filtered}
          emptyMessage={
            isStudent ? "No hay cursos disponibles por el momento." : "No se encontraron cursos."
          }
        />
      )}
    </div>
  );
}
