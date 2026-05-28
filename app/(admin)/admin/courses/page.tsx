"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Search, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCourses } from "@/hooks/useCourses";

const statusVariant = {
  published: "default" as const,
  draft: "secondary" as const,
  archived: "outline" as const,
};

const statusLabel = { published: "Publicado", draft: "Borrador", archived: "Archivado" };

export default function AdminCoursesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useCourses();
  const courses = data?.data ?? [];

  const filtered = courses.filter(
    (c) => c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestionar Cursos</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.meta?.total ?? 0} cursos en total</p>
        </div>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar curso..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button size="sm" className="sm:ml-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo curso
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Curso</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Instructor</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((course) => (
                <tr key={course.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{course.title}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {course.instructor.name}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[course.status]}>
                      {statusLabel[course.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/courses/${course.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Sin resultados.</div>
          )}
        </div>
      )}
    </div>
  );
}
