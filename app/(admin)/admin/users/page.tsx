"use client";

import { useState } from "react";
import { Loader2, Search, Plus, Pencil, Trash2, BookOpen, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUserEnrollments,
  useEnrollUserInCourse,
  useUnenrollUser,
} from "@/hooks/useUsers";
import { useCourses } from "@/hooks/useCourses";
import type { User } from "@/types";

const ROLES = ["admin", "instructor", "student"] as const;

const roleLabel: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  admin:      { label: "Admin",      variant: "default"   },
  instructor: { label: "Instructor", variant: "secondary" },
  student:    { label: "Estudiante", variant: "outline"   },
};

// ─── Create User Dialog ───────────────────────────────────────────────────────
function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("student");
  const [error, setError] = useState<string | null>(null);
  const createUser = useCreateUser();

  const reset = () => { setName(""); setEmail(""); setPassword(""); setRole("student"); setError(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createUser.mutateAsync({ name, email, password, role });
      reset();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al crear el usuario.";
      setError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="c-name">Nombre</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-email">Email</Label>
            <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-password">Contraseña</Label>
            <Input id="c-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-role">Rol</Label>
            <select
              id="c-role"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{roleLabel[r].label}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit User Dialog ─────────────────────────────────────────────────────────
function EditUserDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>(user?.role ?? "student");
  const [error, setError] = useState<string | null>(null);
  const updateUser = useUpdateUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    try {
      await updateUser.mutateAsync({ userId: user.id, name, email, role, password: password || null });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al actualizar el usuario.";
      setError(msg);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="e-name">Nombre</Label>
            <Input id="e-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-email">Email</Label>
            <Input id="e-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-password">
              Nueva contraseña{" "}
              <span className="text-muted-foreground text-xs">(dejar vacío para no cambiar)</span>
            </Label>
            <Input
              id="e-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-role">Rol</Label>
            <select
              id="e-role"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{roleLabel[r].label}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={updateUser.isPending}>
              {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Enrollments Dialog ───────────────────────────────────────────────────────
function EnrollmentsDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const { data: enrollments = [], isLoading } = useUserEnrollments(user?.id);
  const { data: allCourses = [] } = useCourses();
  const enrollInCourse = useEnrollUserInCourse(user?.id ?? 0);
  const unenroll = useUnenrollUser();
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));
  const availableCourses = allCourses.filter((c) => !enrolledCourseIds.has(c.id));

  const handleEnroll = async () => {
    if (!selectedCourseId || !user) return;
    setEnrollError(null);
    try {
      await enrollInCourse.mutateAsync(Number(selectedCourseId));
      setSelectedCourseId("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al inscribir.";
      setEnrollError(msg);
    }
  };

  const handleUnenroll = async (enrollmentId: number) => {
    if (!user) return;
    try {
      await unenroll.mutateAsync({ enrollmentId, userId: user.id });
    } catch {
      // ignore
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cursos de {user?.name}</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <div className="space-y-4">
            {enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No está inscrito en ningún curso.</p>
            ) : (
              <div className="divide-y rounded-lg border">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm">{enrollment.course?.title ?? `Curso #${enrollment.course_id}`}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-7 w-7 p-0"
                      title="Dar de baja"
                      onClick={() => handleUnenroll(enrollment.id)}
                      disabled={unenroll.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {availableCourses.length > 0 && (
              <div className="space-y-2">
                <Label>Inscribir en curso</Label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none"
                    value={selectedCourseId}
                    onChange={(e) => { setSelectedCourseId(e.target.value); setEnrollError(null); }}
                  >
                    <option value="">Selecciona un curso...</option>
                    {availableCourses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleEnroll}
                    disabled={!selectedCourseId || enrollInCourse.isPending}
                  >
                    {enrollInCourse.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Inscribir"
                    )}
                  </Button>
                </div>
                {enrollError && <p className="text-xs text-destructive">{enrollError}</p>}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
function DeleteUserDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const deleteUser = useDeleteUser();

  const handleDelete = async () => {
    if (!user) return;
    setError(null);
    try {
      await deleteUser.mutateAsync(user.id);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al eliminar el usuario.";
      setError(msg);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar usuario</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          ¿Estás seguro de que deseas eliminar a <strong>{user?.name}</strong>? Esta acción no se puede deshacer.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
            {deleteUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [enrollUser, setEnrollUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const { data: users = [], isLoading } = useUsers();

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} usuarios registrados</p>
        </div>
        <div className="flex items-center gap-3 sm:ml-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuario..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Crear usuario
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Usuario</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium">Rol</th>
                <th className="text-left px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((user) => {
                const role = roleLabel[user.role] ?? { label: user.role, variant: "outline" as const };
                return (
                  <tr key={user.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url ?? ""} alt={user.name} />
                          <AvatarFallback>
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={role.variant}>{role.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Editar usuario"
                          onClick={() => setEditUser(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Gestionar cursos"
                          onClick={() => setEnrollUser(user)}
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Eliminar usuario"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteUser(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Sin resultados.</div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUserDialog key={editUser?.id ?? "none"} user={editUser} onClose={() => setEditUser(null)} />
      <EnrollmentsDialog key={enrollUser?.id ?? "none"} user={enrollUser} onClose={() => setEnrollUser(null)} />
      <DeleteUserDialog key={deleteUser?.id ?? "none"} user={deleteUser} onClose={() => setDeleteUser(null)} />
    </div>
  );
}
