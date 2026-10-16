import { create } from "zustand";
import type { AuthUser } from "@/lib/types";

export const CURRENT_TOKEN_KEY = "curbsport-token";
export const LEGACY_TOKEN_KEY = "inside-life-token";
export const CURRENT_USER_KEY = "curbsport-user";
export const LEGACY_USER_KEY = "inside-life-user";

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
    return window.localStorage.getItem(CURRENT_TOKEN_KEY) || window.localStorage.getItem(LEGACY_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_KEY) || window.localStorage.getItem(LEGACY_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  ready: false,
  initialize: () => {
    if (typeof window === "undefined") return;
    try {
      const currentToken = window.localStorage.getItem(CURRENT_TOKEN_KEY);
      const legacyToken = window.localStorage.getItem(LEGACY_TOKEN_KEY);
      const token = currentToken || legacyToken;
      const user = readStoredUser();

      if (!currentToken && legacyToken) {
        window.localStorage.setItem(CURRENT_TOKEN_KEY, legacyToken);
      }
      set({ token, user, ready: true });
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
  },
  setToken: (token: string | null) => {
    try {
      if (token) {
        window.localStorage.setItem(CURRENT_TOKEN_KEY, token);
        window.localStorage.setItem(LEGACY_TOKEN_KEY, token);
      } else {
        window.localStorage.removeItem(CURRENT_TOKEN_KEY);
        window.localStorage.removeItem(LEGACY_TOKEN_KEY);
        window.localStorage.removeItem(CURRENT_USER_KEY);
        window.localStorage.removeItem(LEGACY_USER_KEY);
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
      window.localStorage.removeItem(CURRENT_TOKEN_KEY);
      window.localStorage.removeItem(LEGACY_TOKEN_KEY);
      window.localStorage.removeItem(CURRENT_USER_KEY);
      window.localStorage.removeItem(LEGACY_USER_KEY);
    } catch {
      // In-memory fallback
    }
    set({ token: null, user: null });
  },
}));
