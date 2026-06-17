"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "instructor" | "student";
  avatar_url: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  setAuth: (token: string, user: AuthUser) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),
      setAuth: (token, user) => set({ token, user }),
      clear: () => set({ token: null, user: null }),
    }),
    {
      name: "gelearning-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
