"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Plus, Loader2, ArrowLeft, Pin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForumThreads, useCreateThread } from "@/hooks/useForum";
import { useUrlParams } from "@/hooks/useUrlParams";

const FORUM_PATH = /\/courses\/([^/]+)\/forum\/?$/;
const FORUM_PATH_KEYS = ["courseId"] as const;

const threadSchema = z.object({
  title: z.string().min(5, "Mínimo 5 caracteres"),
  body: z.string().min(10, "Mínimo 10 caracteres"),
});
type ThreadForm = z.infer<typeof threadSchema>;

export default function ForumPage() {
  const { courseId } = useUrlParams<{ courseId: string }>(FORUM_PATH, FORUM_PATH_KEYS);
  const [showForm, setShowForm] = useState(false);
  const { data: threads = [], isLoading } = useForumThreads(courseId);
  const createThread = useCreateThread();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ThreadForm>({
    resolver: zodResolver(threadSchema),
  });

  const onSubmit = async (values: ThreadForm) => {
    await createThread.mutateAsync({ courseId, ...values });
    reset();
    setShowForm(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/courses/${courseId}/`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Foro del curso</h1>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva discusión
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nueva discusión</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input placeholder="¿Cuál es tu pregunta?" {...register("title")} />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Describe tu pregunta o comentario..."
                  {...register("body")}
                />
                {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={createThread.isPending}>
                  {createThread.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publicar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && threads.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Sé el primero en iniciar una discusión.</p>
        </div>
      )}

      <div className="space-y-3">
        {threads.map((thread) => (
          <Link key={thread.id} href={`/courses/${courseId}/forum/${thread.id}/`}>
            <Card className={`hover:shadow-md transition-shadow ${thread.is_pinned ? "border-primary/40" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{thread.title}</CardTitle>
                  <div className="flex gap-1 shrink-0">
                    {thread.is_pinned && (
                      <Badge variant="secondary" className="text-xs">
                        <Pin className="h-2.5 w-2.5 mr-1" />
                        Fijado
                      </Badge>
                    )}
                    {thread.is_closed && (
                      <Badge variant="outline" className="text-xs">Cerrado</Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {thread.user.name} · {new Date(thread.created_at).toLocaleDateString("es")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{thread.body}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  <MessageSquare className="inline h-3 w-3 mr-1" />
                  {thread.replies_count ?? 0} respuestas
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
