import { create } from "zustand";

export const CURRENT_TOKEN_KEY = "curbsport-token";
export const LEGACY_TOKEN_KEY = "inside-life-token";

interface AuthState {
  token: string | null;
  ready: boolean;
  initialize: () => void;
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

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  ready: false,
  initialize: () => {
    if (typeof window === "undefined") return;
    try {
      const current = window.localStorage.getItem(CURRENT_TOKEN_KEY);
      const legacy = window.localStorage.getItem(LEGACY_TOKEN_KEY);
      const token = current || legacy;
      // Keep the legacy key intact: migration must not invalidate an existing Inside Life session.
      if (!current && legacy) window.localStorage.setItem(CURRENT_TOKEN_KEY, legacy);
      set({ token, ready: true });
    } catch {
      set({ token: null, ready: true });
    }
  },
  setToken: (token) => {
    try {
      if (token) window.localStorage.setItem(CURRENT_TOKEN_KEY, token);
      else {
        window.localStorage.removeItem(CURRENT_TOKEN_KEY);
        window.localStorage.removeItem(LEGACY_TOKEN_KEY);
      }
    } catch {
      // The in-memory session remains usable when browser storage is unavailable.
    }
    set({ token });
  },
  logout: () => {
    try {
      window.localStorage.removeItem(CURRENT_TOKEN_KEY);
      window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    } catch {
      // Continue with the in-memory logout if storage is unavailable.
    }
    set({ token: null });
  },
}));
