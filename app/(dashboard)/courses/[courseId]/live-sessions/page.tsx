"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Clock, ExternalLink, Loader2, Video } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LiveSession } from "@/types";

export default function LiveSessionsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["live-sessions", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<LiveSession[]>(
        `/api/v1/courses/${courseId}/live-sessions`
      );
      return data;
    },
    enabled: !!courseId && courseId !== "0",
  });

  const now = new Date();
  const upcoming = sessions.filter((s) => new Date(s.starts_at) >= now);
  const past = sessions.filter((s) => new Date(s.starts_at) < now);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/courses/${courseId}/`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Clases en vivo</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && sessions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Video className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No hay clases en vivo programadas.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Próximas sesiones</h2>
          <div className="space-y-3">
            {upcoming.map((s) => <SessionCard key={s.id} session={s} upcoming />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3 text-muted-foreground">Sesiones pasadas</h2>
          <div className="space-y-3">
            {past.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, upcoming }: { session: LiveSession; upcoming?: boolean }) {
  const start = new Date(session.starts_at);
  const end = session.ends_at ? new Date(session.ends_at) : null;
  const durationMs = end ? end.getTime() - start.getTime() : null;
  const durationMin = durationMs ? Math.round(durationMs / 60000) : null;

  return (
    <Card className={upcoming ? "border-primary/40" : "opacity-75"}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{session.title}</CardTitle>
            {session.description && (
              <CardDescription className="mt-1">{session.description}</CardDescription>
            )}
          </div>
          <Badge variant={upcoming ? "default" : "secondary"}>
            {upcoming ? "Próxima" : "Pasada"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {start.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {start.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
            {durationMin && ` · ${durationMin} min`}
          </span>
        </div>
        {upcoming && (
          <Button size="sm" asChild>
            <a href={session.meeting_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Unirme a la sesión
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
