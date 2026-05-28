"use client";

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

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["student", "instructor", "admin"]),
});
type InviteForm = z.infer<typeof inviteSchema>;

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  accepted: "default",
  expired: "destructive",
};

const statusLabel = { pending: "Pendiente", accepted: "Aceptada", expired: "Expirada" };

export default function InvitationsPage() {
  const { data: invitations = [], isLoading } = useInvitations();
  const sendInvite = useSendInvitation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "student" },
  });

  const onSubmit = async (data: InviteForm) => {
    await sendInvite.mutateAsync(data);
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Invitaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">Invita a usuarios a la plataforma.</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar invitación
          </CardTitle>
          <CardDescription>El usuario recibirá un correo con el enlace de registro.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="correo@ejemplo.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <select
                id="role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("role")}
              >
                <option value="student">Estudiante</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
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
        <h2 className="font-semibold mb-4">Invitaciones enviadas</h2>
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {!isLoading && invitations.length === 0 && (
          <p className="text-muted-foreground text-sm">No hay invitaciones enviadas.</p>
        )}
        {!isLoading && invitations.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Rol</th>
                  <th className="text-left px-4 py-3 font-medium">Estado</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Enviada por</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Expira</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">{inv.email}</td>
                    <td className="px-4 py-3 capitalize">{inv.role}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[inv.status]}>
                        {statusLabel[inv.status] ?? inv.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {inv.invited_by.name}
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
