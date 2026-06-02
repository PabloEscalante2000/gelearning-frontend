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

  const login = async (email: string, password: string, redirectUrl = "/dashboard/") => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post<{ token: string; user: import("@/types").User }>(
        "/api/auth/login",
        { email, password }
      );
      setAuth(data.token, data.user);
      router.push(redirectUrl);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message ?? err.response?.data ?? err.message;
        setError(typeof msg === "string" ? msg : "Credenciales inválidas.");
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
      await apiClient.post("/api/auth/logout");
    } catch {
      // continue even if logout request fails
    } finally {
      clear();
      router.push("/login/");
    }
  };
}

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  const register = async (name: string, email: string, password: string, redirectUrl = "/dashboard/") => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post<{ token: string; user: import("@/types").User }>(
        "/api/auth/register",
        { name, email, password, password_confirmation: password }
      );
      setAuth(data.token, data.user);
      router.push(redirectUrl);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const serverErrors = err.response?.data?.errors as Record<string, string[]> | undefined;
        if (serverErrors?.email) {
          setError(serverErrors.email[0]);
        } else {
          const msg = err.response?.data?.message ?? err.message;
          setError(typeof msg === "string" ? msg : "Error al registrarse.");
        }
      } else {
        setError("Error al conectar con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
}

export function useMe() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  return async () => {
    if (!token) return;
    try {
      const { data } = await apiClient.get<import("@/types").User>("/api/auth/me");
      const currentToken = useAuthStore.getState().token!;
      setAuth(currentToken, data);
    } catch {
      // ignore
    }
  };
}
