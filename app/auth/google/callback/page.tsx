"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, GraduationCap, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import apiClient from "@/lib/axios";

function GoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const err   = searchParams.get("error");

    if (err || !token) {
      setError("No se pudo completar el inicio de sesión con Google.");
      setTimeout(() => router.replace("/login"), 3000);
      return;
    }

    // Fetch user data using the token
    apiClient
      .get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setAuth(token, res.data);
        router.replace("/dashboard/");
      })
      .catch(() => {
        setError("Error al obtener los datos del usuario.");
        setTimeout(() => router.replace("/login"), 3000);
      });
  }, [searchParams, setAuth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-3">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Iniciando sesión con Google…</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense>
      <GoogleCallback />
    </Suspense>
  );
}
