"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Mail,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const studentNav = [
  { href: "/dashboard/", label: "Inicio", icon: LayoutDashboard },
  { href: "/courses/", label: "Mis Cursos", icon: BookOpen },
];

const adminNav = [
  { href: "/dashboard/", label: "Inicio", icon: LayoutDashboard },
  { href: "/courses/", label: "Mis Cursos", icon: BookOpen },
  { href: "/admin/users/", label: "Usuarios", icon: Users },
  { href: "/admin/courses/", label: "Gestionar Cursos", icon: GraduationCap },
  { href: "/admin/invitations/", label: "Invitaciones", icon: Mail },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin" || user?.role === "instructor";
  const navItems = isAdmin ? adminNav : studentNav;

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-slate-900 text-slate-100">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-700">
        <GraduationCap className="h-7 w-7 text-primary" />
        <span className="text-xl font-bold">GELearning</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href.replace(/\/$/, "/"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3 w-3" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <p className="px-3 text-xs text-slate-400 truncate">{user?.email}</p>
      </div>
    </aside>
  );
}
