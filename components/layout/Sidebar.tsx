"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  ChevronRight,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const studentNav = [
  { href: "/dashboard/", label: "Inicio", icon: LayoutDashboard },
  { href: "/courses/", label: "Mis Cursos", icon: BookOpen },
  { href: "/profile/", label: "Mi Perfil", icon: UserCircle },
];

const adminNav = [
  { href: "/dashboard/", label: "Inicio", icon: LayoutDashboard },
  { href: "/courses/", label: "Mis Cursos", icon: BookOpen },
  { href: "/admin/users/", label: "Usuarios", icon: Users },
  { href: "/admin/courses/", label: "Gestionar Cursos", icon: GraduationCap },
  { href: "/profile/", label: "Mi Perfil", icon: UserCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin" || user?.role === "instructor";
  const navItems = isAdmin ? adminNav : studentNav;

  return (
    <aside
      className="hidden md:flex flex-col w-64 min-h-screen"
      style={{ background: "hsl(var(--sidebar))", color: "hsl(var(--sidebar-foreground))" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-6 py-5"
        style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "hsl(var(--primary))" }}
        >
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight">GELearning</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href.replace(/\/$/, "/"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "text-white"
                  : "opacity-70 hover:opacity-100"
              )}
              style={
                active
                  ? { background: "hsl(var(--sidebar-primary))" }
                  : { background: "transparent" }
              }
              onMouseEnter={active ? undefined : (e) => {
                (e.currentTarget as HTMLElement).style.background = "hsl(var(--sidebar-muted))";
              }}
              onMouseLeave={active ? undefined : (e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3 w-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-3"
        style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "hsl(var(--primary))", color: "white" }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{user?.name}</p>
            <p className="text-xs opacity-50 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
