"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCourse } from "@/hooks/useCourses";

const editSchema = z.object({
  title: z.string().min(5, "Mínimo 5 caracteres"),
  description: z.string().min(10, "Mínimo 10 caracteres"),
  status: z.enum(["draft", "published", "archived"]),
  thumbnail: z.string().url("URL inválida").optional().or(z.literal("")),
});

type EditForm = z.infer<typeof editSchema>;

export default function EditCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isLoading } = useCourse(courseId);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (course) {
      reset({
        title: course.title,
        description: course.description,
        status: course.status,
        thumbnail: course.thumbnail ?? "",
      });
    }
  }, [course, reset]);

  const update = useMutation({
    mutationFn: (data: EditForm) => apiClient.put(`/admin/courses/${courseId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/courses/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Editar curso</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del curso</CardTitle>
          <CardDescription>Actualiza los datos del curso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => update.mutate(d))} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <textarea
                id="description"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("description")}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">URL de miniatura</Label>
              <Input id="thumbnail" placeholder="https://..." {...register("thumbnail")} />
              {errors.thumbnail && <p className="text-xs text-destructive">{errors.thumbnail.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("status")}
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>

            {update.isSuccess && (
              <p className="text-sm text-green-600">Cambios guardados correctamente.</p>
            )}
            {update.isError && (
              <p className="text-sm text-destructive">Error al guardar los cambios.</p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || update.isPending}>
                {(isSubmitting || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
