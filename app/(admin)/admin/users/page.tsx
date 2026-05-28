"use client";

import { useState } from "react";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useUsers, useUpdateUserRole } from "@/hooks/useUsers";

const roleLabel: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  admin: { label: "Admin", variant: "default" },
  instructor: { label: "Instructor", variant: "secondary" },
  student: { label: "Estudiante", variant: "outline" },
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useUsers();
  const updateRole = useUpdateUserRole();
  const users = data?.data ?? [];

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
          <p className="text-muted-foreground text-sm mt-1">{data?.meta?.total ?? 0} usuarios registrados</p>
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
        <div className="rounded-lg border overflow-hidden">
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
                          <AvatarFallback>
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={role.variant}>{role.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            Cambiar rol
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {["admin", "instructor", "student"].map((r) => (
                            <DropdownMenuItem
                              key={r}
                              onClick={() => updateRole.mutate({ userId: user.id, role: r })}
                              disabled={user.role === r}
                            >
                              {roleLabel[r]?.label ?? r}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
