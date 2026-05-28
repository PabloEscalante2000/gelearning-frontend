"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import apiClient from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post("/login", { email, password });
      setAuth(data.token, data.user);
      router.push("/dashboard/");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        setError("Credenciales inválidas.");
      } else if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Email o contraseña incorrectos.");
      } else {
        setError("Error al conectar con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const router = useRouter();

  return async () => {
    try {
      await apiClient.post("/logout");
    } catch {
      // continue even if logout request fails
    } finally {
      clear();
      router.push("/login/");
    }
  };
}
