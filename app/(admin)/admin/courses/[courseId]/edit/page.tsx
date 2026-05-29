"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Loader2, Save, Plus, Pencil, Trash2,
  ChevronDown, ChevronUp, GripVertical, Eye, EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCourse } from "@/hooks/useCourses";
import { useModules, useCreateModule, useUpdateModule, useDeleteModule } from "@/hooks/useModules";
import { useCreateLesson, useUpdateLesson, useDeleteLesson } from "@/hooks/useLessons";
import type { Module, Lesson } from "@/types";

// ── Schemas ──────────────────────────────────────────────────────────────────

const courseSchema = z.object({
  title: z.string().min(5, "Mínimo 5 caracteres"),
  description: z.string().min(10, "Mínimo 10 caracteres"),
  status: z.enum(["draft", "published", "archived"]),
  thumbnail_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

const moduleSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres"),
  description: z.string().optional(),
});

const lessonSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres"),
  type: z.enum(["video", "pdf", "word", "link"]),
  content_url: z.string().url("URL inválida"),
  duration_minutes: z.string().optional(),   // kept as string; converted to number on submit
  is_published: z.boolean(),
});

type CourseForm = z.infer<typeof courseSchema>;
type ModuleForm = z.infer<typeof moduleSchema>;
type LessonForm = z.infer<typeof lessonSchema>;

function parseDuration(v?: string) {
  if (!v || v.trim() === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

const lessonTypeLabel: Record<string, string> = {
  video: "Video / Zoom",
  pdf: "PDF",
  word: "Word",
  link: "Enlace externo",
};

// ── Lesson row ────────────────────────────────────────────────────────────────

function LessonRow({
  lesson, moduleId, courseId, onDeleted,
}: {
  lesson: Lesson;
  moduleId: string;
  courseId: string;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: lesson.title,
      type: lesson.type,
      content_url: lesson.content_url,
      duration_minutes: lesson.duration_minutes != null ? String(lesson.duration_minutes) : "",
      is_published: lesson.is_published,
    },
  });

  const onSubmit = async (data: LessonForm) => {
    await updateLesson.mutateAsync({
      moduleId,
      lessonId: lesson.id,
      courseId,
      ...data,
      duration_minutes: parseDuration(data.duration_minutes),
    });
    setEditing(false);
  };

  const onDelete = async () => {
    if (!confirm(`¿Eliminar lección "${lesson.title}"?`)) return;
    await deleteLesson.mutateAsync({ moduleId, lessonId: lesson.id, courseId });
    onDeleted();
  };

  if (editing) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Título</Label>
            <Input {...register("title")} placeholder="Título de la lección" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tipo</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("type")}
            >
              {Object.entries(lessonTypeLabel).map(([val, lab]) => (
                <option key={val} value={val}>{lab}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Duración (min)</Label>
            <Input type="number" min={0} {...register("duration_minutes")} placeholder="Opcional" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">URL del contenido</Label>
            <Input {...register("content_url")} placeholder="https://drive.google.com/file/d/... o meet.google.com/..." />
            {errors.content_url && <p className="text-xs text-destructive">{errors.content_url.message}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id={`pub-${lesson.id}`} {...register("is_published")} className="h-4 w-4" />
          <Label htmlFor={`pub-${lesson.id}`} className="text-xs cursor-pointer">Publicada</Label>
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => { setEditing(false); reset(); }}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={updateLesson.isPending}>
            {updateLesson.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Guardar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 group">
      <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{lesson.title}</p>
        <p className="text-xs text-muted-foreground">
          {lessonTypeLabel[lesson.type]}
          {lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {lesson.is_published
          ? <Eye className="h-3.5 w-3.5 text-green-500" />
          : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
        }
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
          onClick={onDelete}
          disabled={deleteLesson.isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Add lesson form ───────────────────────────────────────────────────────────

function AddLessonForm({
  moduleId, courseId, order, onDone,
}: {
  moduleId: string;
  courseId: string;
  order: number;
  onDone: () => void;
}) {
  const createLesson = useCreateLesson();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: { type: "video", is_published: false, duration_minutes: "" },
  });

  const onSubmit = async (data: LessonForm) => {
    await createLesson.mutateAsync({
      moduleId,
      courseId,
      order,
      ...data,
      duration_minutes: parseDuration(data.duration_minutes),
    });
    reset({ type: "video", is_published: false });
    onDone();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-dashed p-4 space-y-3 bg-muted/20">
      <p className="text-xs font-medium text-muted-foreground">Nueva lección</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Input {...register("title")} placeholder="Título de la lección" />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1">
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register("type")}
          >
            {Object.entries(lessonTypeLabel).map(([val, lab]) => (
              <option key={val} value={val}>{lab}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Input type="number" min={0} {...register("duration_minutes")} placeholder="Duración (min)" />
        </div>
        <div className="col-span-2 space-y-1">
          <Input {...register("content_url")} placeholder="https://drive.google.com/file/d/... o meet.google.com/..." />
          {errors.content_url && <p className="text-xs text-destructive">{errors.content_url.message}</p>}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="new-pub" {...register("is_published")} className="h-4 w-4" />
          <Label htmlFor="new-pub" className="text-xs cursor-pointer">Publicar ahora</Label>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancelar</Button>
          <Button type="submit" size="sm" disabled={createLesson.isPending}>
            {createLesson.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Agregar lección
          </Button>
        </div>
      </div>
    </form>
  );
}

// ── Module card ───────────────────────────────────────────────────────────────

function ModuleCard({
  module, courseId, index,
}: {
  module: Module;
  courseId: string;
  index: number;
}) {
  const [open, setOpen] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const lessons = module.lessons ?? [];

  const { register, handleSubmit, reset } = useForm<ModuleForm>({
    defaultValues: { title: module.title, description: module.description ?? "" },
  });

  const onSaveModule = async (data: ModuleForm) => {
    await updateModule.mutateAsync({ courseId, moduleId: module.id, ...data });
    setEditingTitle(false);
  };

  const onDeleteModule = async () => {
    if (!confirm(`¿Eliminar el módulo "${module.title}" y todas sus lecciones?`)) return;
    await deleteModule.mutateAsync({ courseId, moduleId: module.id });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
            {index + 1}
          </span>

          {editingTitle ? (
            <form onSubmit={handleSubmit(onSaveModule)} className="flex flex-1 gap-2">
              <Input {...register("title")} className="h-8" autoFocus />
              <Button type="submit" size="sm" disabled={updateModule.isPending}>
                {updateModule.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => { setEditingTitle(false); reset(); }}>
                ✕
              </Button>
            </form>
          ) : (
            <div className="flex flex-1 items-center gap-2">
              <span className="font-semibold text-sm flex-1">{module.title}</span>
              <span className="text-xs text-muted-foreground">{lessons.length} lecciones</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTitle(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={onDeleteModule}
                disabled={deleteModule.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(!open)}>
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      {open && (
        <CardContent className="pt-0 space-y-1">
          {lessons.length === 0 && !addingLesson && (
            <p className="text-xs text-muted-foreground py-2 text-center">
              Sin lecciones todavía.
            </p>
          )}

          {lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              moduleId={String(module.id)}
              courseId={courseId}
              onDeleted={() => {}}
            />
          ))}

          {addingLesson && (
            <AddLessonForm
              moduleId={String(module.id)}
              courseId={courseId}
              order={lessons.length + 1}
              onDone={() => setAddingLesson(false)}
            />
          )}

          {!addingLesson && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full border border-dashed text-muted-foreground hover:text-foreground mt-1"
              onClick={() => setAddingLesson(true)}
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              Agregar lección
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EditCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isLoading: loadingCourse } = useCourse(courseId);
  const { data: modules = [], isLoading: loadingModules } = useModules(courseId);
  const createModule = useCreateModule();
  const queryClient = useQueryClient();

  const [addingModule, setAddingModule] = useState(false);

  const {
    register: regCourse,
    handleSubmit: handleCourse,
    reset: resetCourse,
    formState: { errors: courseErrors, isSubmitting },
  } = useForm<CourseForm>({ resolver: zodResolver(courseSchema) });

  const {
    register: regModule,
    handleSubmit: handleModule,
    reset: resetModule,
    formState: { errors: moduleErrors },
  } = useForm<ModuleForm>({ resolver: zodResolver(moduleSchema) });

  useEffect(() => {
    if (course) {
      resetCourse({
        title: course.title,
        description: course.description,
        status: course.status,
        thumbnail_url: course.thumbnail_url ?? "",
      });
    }
  }, [course, resetCourse]);

  const updateCourse = useMutation({
    mutationFn: (data: CourseForm) =>
      apiClient.put(`/api/v1/courses/${courseId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const onAddModule = async (data: ModuleForm) => {
    await createModule.mutateAsync({
      courseId,
      title: data.title,
      description: data.description,
      order: modules.length + 1,
    });
    resetModule();
    setAddingModule(false);
  };

  if (loadingCourse) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/courses/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{course?.title}</h1>
          <p className="text-xs text-muted-foreground">Editor del curso</p>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="content">
            Contenido
            {modules.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                {modules.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Course info ── */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Información general</CardTitle>
              <CardDescription>Datos básicos visibles para los estudiantes.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCourse((d) => updateCourse.mutate(d))} className="space-y-5">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input {...regCourse("title")} />
                  {courseErrors.title && <p className="text-xs text-destructive">{courseErrors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...regCourse("description")}
                  />
                  {courseErrors.description && <p className="text-xs text-destructive">{courseErrors.description.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>URL de miniatura</Label>
                  <Input placeholder="https://..." {...regCourse("thumbnail_url")} />
                  {courseErrors.thumbnail_url && <p className="text-xs text-destructive">{courseErrors.thumbnail_url.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...regCourse("status")}
                  >
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                    <option value="archived">Archivado</option>
                  </select>
                </div>

                {updateCourse.isSuccess && (
                  <p className="text-sm text-green-600">✓ Cambios guardados.</p>
                )}
                {updateCourse.isError && (
                  <p className="text-sm text-destructive">Error al guardar.</p>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting || updateCourse.isPending}>
                    {(isSubmitting || updateCourse.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Modules & Lessons ── */}
        <TabsContent value="content">
          <div className="space-y-4">
            {loadingModules && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {!loadingModules && modules.length === 0 && !addingModule && (
              <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                <p className="mb-2 font-medium">Sin módulos todavía</p>
                <p className="text-sm">Agrega el primer módulo para empezar a estructurar el curso.</p>
              </div>
            )}

            {modules.map((mod, i) => (
              <ModuleCard key={mod.id} module={mod} courseId={courseId} index={i} />
            ))}

            {/* Add module form */}
            {addingModule ? (
              <Card className="border-dashed">
                <CardContent className="pt-4">
                  <form onSubmit={handleModule(onAddModule)} className="space-y-3">
                    <p className="text-sm font-medium">Nuevo módulo</p>
                    <div className="space-y-1">
                      <Input
                        {...regModule("title")}
                        placeholder="Título del módulo"
                        autoFocus
                      />
                      {moduleErrors.title && <p className="text-xs text-destructive">{moduleErrors.title.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Input
                        {...regModule("description")}
                        placeholder="Descripción (opcional)"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setAddingModule(false); resetModule(); }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" size="sm" disabled={createModule.isPending}>
                        {createModule.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        Crear módulo
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setAddingModule(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar módulo
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
