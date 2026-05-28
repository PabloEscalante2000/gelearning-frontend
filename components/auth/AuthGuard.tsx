"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "instructor";
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.replace("/login/");
      return;
    }
    if (requiredRole === "admin" && user?.role === "student") {
      router.replace("/dashboard/");
    }
  }, [token, user, router, requiredRole]);

  if (!token) return null;
  if (requiredRole === "admin" && user?.role === "student") return null;

  return <>{children}</>;
}
