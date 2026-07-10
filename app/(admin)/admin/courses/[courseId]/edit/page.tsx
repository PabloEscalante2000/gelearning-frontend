"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Loader2, Save, Plus, Pencil, Trash2,
  ChevronDown, ChevronUp, GripVertical, Eye, EyeOff, UserPlus, UserMinus, Upload, BookOpen,
  UploadCloud, Download, Users,
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
import { useCourse, useCourseStudents, useEnrollStudent } from "@/hooks/useCourses";
import { useModules, useCreateModule, useUpdateModule, useDeleteModule } from "@/hooks/useModules";
import { useCreateLesson, useUpdateLesson, useDeleteLesson } from "@/hooks/useLessons";
import { useLessonSubmissions, downloadSubmission } from "@/hooks/useSubmissions";
import { useUsers } from "@/hooks/useUsers";
import { useModuleAccess, useUpdateModuleAccess } from "@/hooks/useModuleAccess";
import { useUrlParams } from "@/hooks/useUrlParams";
import type { Module, Lesson } from "@/types";

const ADMIN_COURSE_PATH = /\/admin\/courses\/([^/]+)\/edit\/?$/;
const ADMIN_COURSE_PATH_KEYS = ["courseId"] as const;

// ── Schemas ──────────────────────────────────────────────────────────────────

const courseSchema = z.object({
  title: z.string().min(5, "Mínimo 5 caracteres"),
  description: z.string().min(10, "Mínimo 10 caracteres"),
  status: z.enum(["draft", "published", "archived"]),
  thumbnail_url: z.string().url("URL inválida").optional().or(z.literal("")),
  price: z.string().optional(),
  instructor_id: z.string().min(1, "Selecciona un instructor"),
});

const moduleSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres"),
  description: z.string().optional(),
});

const lessonSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres"),
  type: z.enum(["video", "pdf", "word", "link", "submission"]),
  content_url: z.string().optional(),
  duration_minutes: z.string().optional(),
  is_published: z.boolean(),
  scheduled_at: z.string().optional(),
  due_date: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type !== "submission") {
    if (!data.content_url) {
      ctx.addIssue({ code: "custom", message: "URL requerida", path: ["content_url"] });
    } else if (!/^https?:\/\//i.test(data.content_url)) {
      ctx.addIssue({ code: "custom", message: "URL inválida", path: ["content_url"] });
    }
  }
});

type CourseForm = z.infer<typeof courseSchema>;
type ModuleForm = z.infer<typeof moduleSchema>;
type LessonForm = z.infer<typeof lessonSchema>;

function toDatetimeLocal(dt: string | null | undefined): string {
  if (!dt) return "";
  return dt.replace(" ", "T").slice(0, 16);
}

function formatScheduledShort(dt: string): string {
  const date = new Date(dt);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
    + " " + date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function parseDuration(v?: string) {
  if (!v || v.trim() === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function parsePrice(v?: string): number | null {
  if (!v || v.trim() === "") return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

const lessonTypeLabel: Record<string, string> = {
  video: "Video (Drive / YouTube)",
  pdf: "Documento PDF (Drive)",
  word: "Documento Word / Google Docs",
  link: "Sesión en vivo (Meet)",
  submission: "Entrega de tarea",
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
  const [showSubmissions, setShowSubmissions] = useState(false);
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: lesson.title,
      type: lesson.type,
      content_url: lesson.content_url ?? "",
      duration_minutes: lesson.duration_minutes != null ? String(lesson.duration_minutes) : "",
      is_published: lesson.is_published,
      scheduled_at: toDatetimeLocal(lesson.scheduled_at),
      due_date: toDatetimeLocal(lesson.due_date),
    },
  });
  const watchedType = watch("type");

  const onSubmit = async (data: LessonForm) => {
    await updateLesson.mutateAsync({
      moduleId,
      lessonId: lesson.id,
      courseId,
      ...data,
      duration_minutes: parseDuration(data.duration_minutes),
      scheduled_at: data.scheduled_at || null,
      due_date: data.due_date || null,
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
          {watchedType === "submission" ? (
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Instrucciones para el alumno <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <textarea
                {...register("content_url")}
                rows={3}
                placeholder="Describe qué debe entregar el alumno..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          ) : (
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">URL del contenido</Label>
              <Input {...register("content_url")} placeholder="https://..." />
              {errors.content_url && <p className="text-xs text-destructive">{errors.content_url.message}</p>}
            </div>
          )}
          {watchedType === "submission" && (
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Fecha de entrega <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input type="datetime-local" {...register("due_date")} />
            </div>
          )}
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Fecha y hora programada <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input type="datetime-local" {...register("scheduled_at")} />
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
    <div>
      <div className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 group">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{lesson.title}</p>
          <p className="text-xs text-muted-foreground">
            {lessonTypeLabel[lesson.type]}
            {lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ""}
          </p>
          {lesson.scheduled_at && (
            <p className="text-xs text-blue-600 font-medium">{formatScheduledShort(lesson.scheduled_at)}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {lesson.type === "submission" && (
            <Button
              variant="ghost" size="sm"
              className="h-7 gap-1 text-xs px-2"
              onClick={() => setShowSubmissions((v) => !v)}
            >
              <Users className="h-3.5 w-3.5" />
              Entregas
            </Button>
          )}
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
      {showSubmissions && <SubmissionsPanel lessonId={String(lesson.id)} />}
    </div>
  );
}

// ── Submissions panel (admin) ─────────────────────────────────────────────────

function SubmissionsPanel({ lessonId }: { lessonId: string }) {
  const { data: submissions = [], isLoading } = useLessonSubmissions(lessonId, true);
  const [downloading, setDownloading] = useState<number | null>(null);

  async function handleDownload(sub: import("@/types").StudentSubmission) {
    setDownloading(sub.id);
    try { await downloadSubmission(sub); } finally { setDownloading(null); }
  }

  return (
    <div className="ml-7 mr-2 mb-2 rounded-md border bg-muted/20 p-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Entregas recibidas
      </p>
      {isLoading ? (
        <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin" /></div>
      ) : submissions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">Sin entregas todavía.</p>
      ) : (
        <div className="divide-y">
          {submissions.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between py-2 gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{sub.user?.name ?? "Estudiante"}</p>
                <p className="text-xs text-muted-foreground truncate">{sub.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {(sub.file_size / 1024 / 1024).toFixed(2)} MB ·{" "}
                  {new Date(sub.submitted_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <Button
                variant="outline" size="sm"
                className="h-7 text-xs shrink-0"
                disabled={downloading === sub.id}
                onClick={() => handleDownload(sub)}
              >
                {downloading === sub.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Download className="h-3.5 w-3.5" />}
              </Button>
            </div>
          ))}
        </div>
      )}
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
  const { register, handleSubmit, reset, watch: watchAdd, formState: { errors } } = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: { type: "video", is_published: false, content_url: "", duration_minutes: "", scheduled_at: "" },
  });
  const watchedTypeAdd = watchAdd("type");

  const onSubmit = async (data: LessonForm) => {
    await createLesson.mutateAsync({
      moduleId,
      courseId,
      order,
      ...data,
      duration_minutes: parseDuration(data.duration_minutes),
      scheduled_at: data.scheduled_at || null,
      due_date: data.due_date || null,
    });
    reset({ type: "video", is_published: false, content_url: "", scheduled_at: "", due_date: "" });
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
        {watchedTypeAdd === "submission" ? (
          <div className="col-span-2 space-y-1">
            <textarea
              {...register("content_url")}
              rows={3}
              placeholder="Instrucciones para el alumno (opcional)..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
        ) : (
          <div className="col-span-2 space-y-1">
            <Input {...register("content_url")} placeholder="https://..." />
            {errors.content_url && <p className="text-xs text-destructive">{errors.content_url.message}</p>}
          </div>
        )}
        {watchedTypeAdd === "submission" && (
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Fecha de entrega <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input type="date" {...register("due_date")} />
          </div>
        )}
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Fecha y hora programada <span className="text-muted-foreground font-normal">(opcional)</span></Label>
          <Input type="datetime-local" {...register("scheduled_at")} />
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
            <p className="text-xs text-muted-foreground py-2 text-center">Sin lecciones todavía.</p>
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

// ── Module access dialog ───────────────────────────────────────────────────────

function ModuleAccessDialog({
  courseId,
  student,
  modules,
}: {
  courseId: string;
  student: { id: number; name: string };
  modules: Module[];
}) {
  const [open, setOpen] = useState(false);
  const { data: access, isLoading } = useModuleAccess(courseId, String(student.id));
  const updateAccess = useUpdateModuleAccess();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open || !access) return;
    setSelectedIds(
      access.module_ids.length === 0
        ? new Set(modules.map((m) => m.id))
        : new Set(access.module_ids)
    );
  }, [open, access, modules]);

  function toggleModule(id: number) {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  }

  async function handleSave() {
    const allChecked = selectedIds.size === modules.length;
    await updateAccess.mutateAsync({
      courseId,
      userId: String(student.id),
      moduleIds: allChecked ? [] : Array.from(selectedIds),
    });
    setOpen(false);
  }

  const label = access
    ? access.module_ids.length === 0
      ? "Todos"
      : `${access.module_ids.length}/${modules.length}`
    : "Módulos";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1 text-xs"
        onClick={() => setOpen(true)}
      >
        <BookOpen className="h-3 w-3" />
        {label}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-background rounded-lg border p-6 shadow-xl w-80 space-y-4">
            <div>
              <p className="font-semibold">Acceso a módulos</p>
              <p className="text-sm text-muted-foreground truncate">{student.name}</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {modules.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 rounded-md px-2 py-2 cursor-pointer hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedIds.has(m.id)}
                      onChange={() => toggleModule(m.id)}
                    />
                    <span className="text-sm line-clamp-1">{m.title}</span>
                  </label>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Todos marcados = acceso completo al curso.
            </p>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={updateAccess.isPending || selectedIds.size === 0}
                onClick={handleSave}
              >
                {updateAccess.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Students tab ──────────────────────────────────────────────────────────────

function StudentsTab({ courseId }: { courseId: string }) {
  const { data: students = [], isLoading, refetch } = useCourseStudents(courseId);
  const { data: allUsers = [] } = useUsers("student");
  const { data: courseModules = [] } = useModules(courseId);
  const enrollStudent = useEnrollStudent();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [unenrollPending, setUnenrollPending] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const enrolledIds = new Set(students.map((s) => s.id));
  const availableUsers = allUsers.filter((u) => !enrolledIds.has(u.id));

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;
    await enrollStudent.mutateAsync({
      user_id: parseInt(selectedUserId),
      course_id: parseInt(courseId),
    });
    setSelectedUserId("");
    refetch();
  }

  async function handleUnenroll(enrollmentId: number, userId: number) {
    if (!confirm("¿Quitar el acceso a este estudiante?")) return;
    setUnenrollPending(userId);
    await apiClient.delete(`/api/v1/enrollments/${enrollmentId}`);
    setUnenrollPending(null);
    queryClient.invalidateQueries({ queryKey: ["course-students", courseId] });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dar acceso a un estudiante</CardTitle>
          <CardDescription>
            Inscribe manualmente a un estudiante sin requerir pago.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEnroll} className="flex gap-2">
            <select
              className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
            >
              <option value="">Seleccionar estudiante...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" disabled={enrollStudent.isPending || !selectedUserId}>
              {enrollStudent.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <UserPlus className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Dar acceso</span>
            </Button>
          </form>
          {availableUsers.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">Todos los estudiantes ya tienen acceso.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Estudiantes inscritos
            {students.length > 0 && (
              <Badge variant="secondary" className="ml-2">{students.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin estudiantes inscritos.</p>
          ) : (
            <div className="divide-y rounded-md border">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ModuleAccessDialog
                      courseId={courseId}
                      student={student}
                      modules={courseModules}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      disabled={unenrollPending === student.id}
                      onClick={() => {
                        const pivot = (student as unknown as { pivot?: { id?: number } }).pivot;
                        handleUnenroll(pivot?.id ?? student.id, student.id);
                      }}
                    >
                      {unenrollPending === student.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <UserMinus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EditCoursePage() {
  const { courseId } = useUrlParams<{ courseId: string }>(ADMIN_COURSE_PATH, ADMIN_COURSE_PATH_KEYS);
  const { data: course, isLoading: loadingCourse } = useCourse(courseId);
  const { data: modules = [], isLoading: loadingModules } = useModules(courseId);
  const { data: instructors = [] } = useUsers("instructor");
  const createModule = useCreateModule();
  const queryClient = useQueryClient();

  const [addingModule, setAddingModule] = useState(false);

  const {
    register: regCourse,
    handleSubmit: handleCourse,
    reset: resetCourse,
    setValue: setCourseValue,
    formState: { errors: courseErrors, isSubmitting },
  } = useForm<CourseForm>({ resolver: zodResolver(courseSchema) });

  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [thumbUploading, setThumbUploading] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbPreview(URL.createObjectURL(file));
    setThumbUploading(true);
    try {
      const formData = new FormData();
      formData.append("thumbnail", file);
      const res = await apiClient.post<{ thumbnail_url: string }>(
        `/api/v1/courses/${courseId}/thumbnail`,
        formData,
        { headers: { "Content-Type": undefined } }
      );
      setCourseValue("thumbnail_url", res.data.thumbnail_url, { shouldValidate: true });
    } catch {
      setThumbPreview(null);
    } finally {
      setThumbUploading(false);
    }
  }

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
        price: course.price !== null && course.price !== undefined ? String(parseFloat(course.price)) : "",
        instructor_id: String(course.instructor_id),
      });
    }
  }, [course, resetCourse]);

  const updateCourse = useMutation({
    mutationFn: (data: CourseForm) =>
      apiClient.put(`/api/v1/courses/${courseId}`, {
        ...data,
        price: parsePrice(data.price),
        thumbnail_url: data.thumbnail_url || null,
        instructor_id: parseInt(data.instructor_id),
      }),
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
          <TabsTrigger value="students">Estudiantes</TabsTrigger>
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
                  <Label>Imagen del curso</Label>
                  <div className="flex items-start gap-4">
                    {(thumbPreview || course?.thumbnail_url) && (
                      <img
                        src={thumbPreview ?? course?.thumbnail_url ?? ""}
                        alt="Miniatura"
                        className="h-24 w-40 object-cover rounded-md border shrink-0"
                      />
                    )}
                    <div className="space-y-1.5">
                      <input
                        ref={thumbInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleThumbnailUpload}
                      />
                      <input type="hidden" {...regCourse("thumbnail_url")} />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => thumbInputRef.current?.click()}
                        disabled={thumbUploading}
                      >
                        {thumbUploading
                          ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          : <Upload className="mr-2 h-4 w-4" />}
                        {thumbUploading ? "Subiendo..." : "Subir imagen"}
                      </Button>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP · Max 5 MB</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label>Precio (S/)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0 = gratis · vacío = solo por invitación"
                      {...regCourse("price")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Vacío = solo acceso por invitación
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Instructor</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...regCourse("instructor_id")}
                  >
                    <option value="">Seleccionar instructor...</option>
                    {instructors.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  {courseErrors.instructor_id && (
                    <p className="text-xs text-destructive">{courseErrors.instructor_id.message}</p>
                  )}
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

        {/* ── Tab: Students ── */}
        <TabsContent value="students">
          <StudentsTab courseId={courseId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
