import { create } from "zustand";
import { clearSessionStorage, fetchMe, readStoredUser, readToken, saveSession } from "@/lib/api";
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
    const token = readToken();
    const user = readStoredUser();
    set({ token, user, hydrated: true });

    // Background refresh latest profile from DB to keep avatar, biometrics & ball status current
    if (token) {
      fetchMe()
        .then((res) => {
          if (res?.user) {
            saveSession(token, res.user);
            set({ user: res.user });
          }
        })
        .catch(() => {});
    }
  },
  setSession: (token, user) => {
    saveSession(token, user);
    set({ token, user, hydrated: true });

    // Fetch complete user profile from server to guarantee biometrics, ball ownership & avatar are populated
    fetchMe()
      .then((res) => {
        if (res?.user) {
          const merged = { ...user, ...res.user };
          saveSession(token, merged);
          set({ user: merged });
        }
      })
      .catch(() => {});
  },
  signOut: () => {
    clearSessionStorage();
    set({ token: null, user: null, hydrated: true });
  },
}));

export function userDisplayName(user: AuthUser | null): string {
  return user?.alias || "Player";
}
