import { create } from "zustand";
import type { AuthUser } from "@/lib/types";

export const CURRENT_TOKEN_KEY = "curbsport-token";
export const LEGACY_TOKEN_KEY = "inside-life-token";
export const CURRENT_USER_KEY = "curbsport-user";
export const LEGACY_USER_KEY = "inside-life-user";

export const TOKEN_KEYS = ["curbsport-token", "inside-life-token", "token", "auth_token", "jwt", "curbsport_token"] as const;
export const USER_KEYS = ["curbsport-user", "inside-life-user", "user", "authUser", "curbsport_user"] as const;

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  ready: boolean;
  initialize: () => void;
  setSession: (token: string, user: AuthUser) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    for (const key of TOKEN_KEYS) {
      const val = window.localStorage.getItem(key);
      if (val && val.trim().length > 0) return val.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    for (const key of USER_KEYS) {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object" && (parsed.id || parsed.alias)) {
            return parsed as AuthUser;
          }
        } catch {}
      }
    }
    return null;
  } catch {
    return null;
  }
}

import { fetchCurrentUser } from "@/lib/api";

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  ready: false,
  initialize: () => {
    if (typeof window === "undefined") return;
    try {
      const token = readStoredToken();
      const user = readStoredUser();

      set({ token, user, ready: true });

      if (token) {
        fetchCurrentUser()
          .then((freshUser) => {
            if (freshUser) {
              try {
                window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(freshUser));
                window.localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(freshUser));
              } catch {}
              set((state) => ({
                user: state.user ? { ...state.user, ...freshUser } : freshUser,
              }));
            }
          })
          .catch(() => {});
      }
    } catch {
      set({ token: null, user: null, ready: true });
    }
  },
  setSession: (token: string, user: AuthUser) => {
    try {
      window.localStorage.setItem(CURRENT_TOKEN_KEY, token);
      window.localStorage.setItem(LEGACY_TOKEN_KEY, token);
      window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      window.localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
    } catch {
      // In-memory fallback
    }
    set({ token, user, ready: true });

    fetchCurrentUser()
      .then((freshUser) => {
        if (freshUser) {
          const merged = { ...user, ...freshUser };
          try {
            window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(merged));
            window.localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(merged));
          } catch {}
          set({ user: merged });
        }
      })
      .catch(() => {});
  },
  setToken: (token: string | null) => {
    try {
      if (token) {
        window.localStorage.setItem(CURRENT_TOKEN_KEY, token);
        window.localStorage.setItem(LEGACY_TOKEN_KEY, token);
      } else {
        TOKEN_KEYS.forEach((k) => { try { window.localStorage.removeItem(k); } catch {} });
        USER_KEYS.forEach((k) => { try { window.localStorage.removeItem(k); } catch {} });
      }
    } catch {
      // In-memory fallback
    }
    set((state) => ({
      token,
      user: token ? (state.user ?? readStoredUser()) : null,
    }));
  },
  logout: () => {
    try {
      TOKEN_KEYS.forEach((k) => { try { window.localStorage.removeItem(k); } catch {} });
      USER_KEYS.forEach((k) => { try { window.localStorage.removeItem(k); } catch {} });
    } catch {
      // In-memory fallback
    }
    set({ token: null, user: null });
  },
}));
