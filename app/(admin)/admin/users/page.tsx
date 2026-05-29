"use client";

import { useState } from "react";
import { Loader2, Search, ShieldCheck, BookPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useUsers, useUpdateUser } from "@/hooks/useUsers";
import { useCourses, useEnrollStudent } from "@/hooks/useCourses";
import type { User } from "@/types";

const roleLabel: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  admin:      { label: "Admin",      variant: "default"   },
  instructor: { label: "Instructor", variant: "secondary" },
  student:    { label: "Estudiante", variant: "outline"   },
};

function EnrollDropdown({ user }: { user: User }) {
  const { data: courses = [] } = useCourses();
  const enroll = useEnrollStudent();
  const [done, setDone] = useState<number | null>(null);

  const handleEnroll = async (courseId: number) => {
    try {
      await enroll.mutateAsync({ user_id: user.id, course_id: courseId });
      setDone(courseId);
      setTimeout(() => setDone(null), 2000);
    } catch {
      // 409 = already enrolled, ignore
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <BookPlus className="h-4 w-4 mr-1" />
          Inscribir
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 max-h-72 overflow-y-auto">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Inscribir a {user.name.split(" ")[0]} en...
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {courses.length === 0 && (
          <DropdownMenuItem disabled>Sin cursos disponibles</DropdownMenuItem>
        )}
        {courses.map((course) => (
          <DropdownMenuItem
            key={course.id}
            onClick={() => handleEnroll(course.id)}
            disabled={enroll.isPending}
          >
            {done === course.id ? "✓ Inscrito" : course.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const { data: users = [], isLoading } = useUsers();
  const updateUser = useUpdateUser();

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} usuarios registrados</p>
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

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
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* Change role */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ShieldCheck className="h-4 w-4 mr-1" />
                              Rol
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              Cambiar rol
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {(["admin", "instructor", "student"] as const).map((r) => (
                              <DropdownMenuItem
                                key={r}
                                onClick={() => updateUser.mutate({ userId: user.id, role: r })}
                                disabled={user.role === r || updateUser.isPending}
                              >
                                {roleLabel[r]?.label ?? r}
                                {user.role === r && " ✓"}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Enroll in course */}
                        <EnrollDropdown user={user} />
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
    </div>
  );
}
