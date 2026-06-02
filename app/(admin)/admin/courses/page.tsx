"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useCourses, useCreateCourse } from "@/hooks/useCourses";

const statusVariant = {
  published: "default" as const,
  draft: "secondary" as const,
  archived: "outline" as const,
};

const statusLabel = { published: "Publicado", draft: "Borrador", archived: "Archivado" };

export default function AdminCoursesPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const { data, isLoading } = useCourses();
  const createCourse = useCreateCourse();
  const router = useRouter();
  const courses = data ?? [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const result = await createCourse.mutateAsync({
      title: newTitle,
      description: newDescription,
    });
    setDialogOpen(false);
    setNewTitle("");
    setNewDescription("");
    router.push(`/admin/courses/${(result.data as { id: number }).id}/edit`);
  }

  const filtered = courses.filter(
    (c) => c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestionar Cursos</h1>
          <p className="text-muted-foreground text-sm mt-1">{courses.length} cursos en total</p>
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
        <Button size="sm" className="sm:ml-auto" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo curso
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo curso</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input
                required
                minLength={5}
                placeholder="Nombre del curso"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <textarea
                required
                minLength={10}
                placeholder="Descripción breve del curso"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createCourse.isPending}>
                {createCourse.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear curso
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
