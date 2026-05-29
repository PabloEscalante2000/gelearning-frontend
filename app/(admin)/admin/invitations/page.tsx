"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvitations, useSendInvitation } from "@/hooks/useUsers";
import { useCourses } from "@/hooks/useCourses";

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  course_id: z.string().min(1, "Selecciona un curso"),
});
type InviteForm = z.infer<typeof inviteSchema>;

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  accepted: "default",
  expired: "destructive",
};

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  expired: "Expirada",
};

export default function InvitationsPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const { data: courses = [] } = useCourses();
  const { data: invitations = [], isLoading } = useInvitations(selectedCourseId);
  const sendInvite = useSendInvitation();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
  });

  const onSubmit = async (data: InviteForm) => {
    await sendInvite.mutateAsync({
      email: data.email,
      course_id: Number(data.course_id),
    });
    setSelectedCourseId(data.course_id);
    reset({ email: "", course_id: data.course_id });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Invitaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Invita a usuarios a un curso concreto.
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar invitación
          </CardTitle>
          <CardDescription>
            El usuario recibirá un email con el enlace de inscripción al curso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course_id">Curso</Label>
              <select
                id="course_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("course_id")}
              >
                <option value="">Selecciona un curso...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              {errors.course_id && (
                <p className="text-xs text-destructive">{errors.course_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email del destinatario</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {sendInvite.isSuccess && (
              <p className="text-sm text-green-600">Invitación enviada exitosamente.</p>
            )}
            {sendInvite.isError && (
              <p className="text-sm text-destructive">Error al enviar la invitación.</p>
            )}

            <Button type="submit" disabled={sendInvite.isPending} className="w-full">
              {sendInvite.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar invitación
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="font-semibold">Invitaciones por curso</h2>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">Selecciona un curso...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        {!selectedCourseId && (
          <p className="text-muted-foreground text-sm">Selecciona un curso para ver sus invitaciones.</p>
        )}

        {selectedCourseId && isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {selectedCourseId && !isLoading && invitations.length === 0 && (
          <p className="text-muted-foreground text-sm">No hay invitaciones para este curso.</p>
        )}

        {selectedCourseId && !isLoading && invitations.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Estado</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Expira</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">{inv.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[inv.status]}>
                        {statusLabel[inv.status] ?? inv.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {new Date(inv.expires_at).toLocaleDateString("es")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
