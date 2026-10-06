import { create } from "zustand";
import { clearSessionStorage, saveSession, TOKEN_KEY, USER_KEY } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  hydrate: () => void;
  setSession: (token: string, user: AuthUser) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem(TOKEN_KEY);
    let user: AuthUser | null = null;
    try {
      const saved = window.localStorage.getItem(USER_KEY);
      user = saved ? (JSON.parse(saved) as AuthUser) : null;
    } catch {
      window.localStorage.removeItem(USER_KEY);
    }
    set({ token, user, hydrated: true });
  },
  setSession: (token, user) => {
    saveSession(token, user);
    set({ token, user, hydrated: true });
  },
  signOut: () => {
    clearSessionStorage();
    set({ token: null, user: null, hydrated: true });
  },
}));

export function userDisplayName(user: AuthUser | null): string {
  return user?.alias || "Player";
}
