"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useForumThread, useForumReplies, useCreateReply } from "@/hooks/useForum";

const replySchema = z.object({ body: z.string().min(5, "Mínimo 5 caracteres") });
type ReplyForm = z.infer<typeof replySchema>;

export default function ForumThreadPage() {
  const { courseId, threadId } = useParams<{ courseId: string; threadId: string }>();
  const { data: thread, isLoading: loadingThread } = useForumThread(courseId, threadId);
  const { data: replies = [] } = useForumReplies(courseId, threadId);
  const createReply = useCreateReply();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReplyForm>({
    resolver: zodResolver(replySchema),
  });

  const onSubmit = async (values: ReplyForm) => {
    await createReply.mutateAsync({ courseId, threadId, ...values });
    reset();
  };

  if (loadingThread) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href={`/courses/${courseId}/forum/`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al foro
        </Button>
      </Link>

      {thread && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {thread.user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{thread.user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(thread.created_at).toLocaleString("es")}
                </p>
              </div>
            </div>
            <CardTitle className="text-xl">{thread.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{thread.body}</p>
          </CardContent>
        </Card>
      )}

      <Separator />

      <h3 className="font-semibold">Respuestas ({replies.length})</h3>

      <div className="space-y-4">
        {replies.map((reply) => (
          <div key={reply.id} className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback>
                {reply.user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{reply.user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(reply.created_at).toLocaleString("es")}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{reply.body}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3">
        <div className="flex-1 space-y-1">
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Escribe tu respuesta..."
            {...register("body")}
          />
          {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
        </div>
        <Button type="submit" size="icon" disabled={createReply.isPending} className="self-start mt-0.5">
          {createReply.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
