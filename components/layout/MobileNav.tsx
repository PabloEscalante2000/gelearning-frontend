"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Mail,
  GraduationCap,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin" || user?.role === "instructor";
  const navItems = isAdmin ? adminNav : studentNav;

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div
            className="relative flex flex-col w-72 min-h-screen p-0 z-10"
            style={{ background: "hsl(var(--sidebar))", color: "hsl(var(--sidebar-foreground))" }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold">GELearning</span>
              </div>
              <button
                className="opacity-60 hover:opacity-100 transition-opacity"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href.replace(/\/$/, "/"));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      active ? "text-white opacity-100" : "opacity-70 hover:opacity-100"
                    )}
                    style={active ? { background: "hsl(var(--sidebar-primary))" } : {}}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
