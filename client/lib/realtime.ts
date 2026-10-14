import { io, type Socket } from "socket.io-client";
import { getApiBaseUrl } from "@/lib/api";
import { readStoredToken } from "@/store/auth-store";

export type LiveEventName = "sets:update" | "ground:update" | "ground:condition";

export function connectLiveUpdates(): Socket | null {
  const base = getApiBaseUrl();
  const endpoint = process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || (base ? base.replace(/\/api$/, "") : null);
  if (!endpoint || typeof window === "undefined") return null;

  const token = readStoredToken();
  return io(endpoint, {
    autoConnect: true,
    reconnection: true,
    timeout: 8_000,
    auth: token ? { token } : undefined,
  });
}
