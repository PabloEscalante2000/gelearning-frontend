"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "instructor";
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) {
      router.replace(`/login/?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (requiredRole === "admin" && user?.role === "student") {
      router.replace("/dashboard/");
    }
  }, [_hasHydrated, token, user, router, requiredRole, pathname]);

  if (!_hasHydrated) return null;
  if (!token) return null;
  if (requiredRole === "admin" && user?.role === "student") return null;

  return <>{children}</>;
}
