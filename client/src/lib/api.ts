import type { AuthResponse, AuthUser, BanterMessage, Lobby, Pitch } from "@/lib/types";

export const TOKEN_KEY = "inside-life-token";
export const USER_KEY = "inside-life-user";
export const CITY_ID_KEY = "inside-life-city-id";
export const DEFAULT_CITY_ID = process.env.NEXT_PUBLIC_DEFAULT_CITY_ID || "1";
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveSession(token: string, user: AuthUser): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSessionStorage(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const bodyIsForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !bodyIsForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = readToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Network request failed";
    throw new ApiError(`Could not reach the API at ${API_BASE_URL}. Check that the backend is running and allows this frontend origin. (${reason})`, 0, error);
  }

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }
  if (!response.ok) {
    const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : undefined;
    const message = String(record?.message || record?.error || (typeof payload === "string" ? payload : `Request failed (${response.status})`));
    throw new ApiError(message, response.status, payload);
  }
  return payload as T;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asList(value: unknown, keys: string[]): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  for (const key of keys) if (Array.isArray(record[key])) return record[key] as unknown[];
  return [];
}

export function normalizePitch(value: unknown): Pitch {
  const record = asRecord(value);
  const stats = asRecord(record.stats);
  return {
    ...(record as Partial<Pitch>),
    id: String(record.id ?? record._id ?? "unknown"),
    name: String(record.name ?? record.title ?? record.pitchName ?? "Unnamed pitch"),
    description: typeof record.description === "string" ? record.description : undefined,
    address: String(record.address ?? record.locationName ?? record.location ?? "Location not listed"),
    area: typeof record.area === "string" ? record.area : undefined,
    city: typeof record.city === "string" ? record.city : undefined,
    activeStatus: String(record.activeStatus ?? record.status ?? "DRY").toUpperCase(),
    verificationStatus: String(record.verificationStatus ?? record.verification ?? "GHOST").toUpperCase(),
    imageUrl: typeof record.imageUrl === "string" ? record.imageUrl : undefined,
    playersNow: Number(record.playersNow ?? stats.playersNow ?? stats.players ?? 0),
    setsToday: Number(record.setsToday ?? stats.setsToday ?? stats.sets ?? 0),
    upvotes: Number(record.upvotes ?? stats.upvotes ?? 0),
    downvotes: Number(record.downvotes ?? stats.downvotes ?? 0),
  };
}

export function normalizePitches(value: unknown): Pitch[] {
  return asList(value, ["pitches", "data"]).map(normalizePitch);
}

export function normalizeMessages(value: unknown): BanterMessage[] {
  return asList(value, ["messages", "banter", "data"]).map((item, index) => {
    const record = asRecord(item);
    const user = asRecord(record.user ?? record.author);
    return {
      ...(record as Partial<BanterMessage>),
      id: String(record.id ?? record._id ?? index),
      message: String(record.message ?? record.text ?? ""),
      text: typeof record.text === "string" ? record.text : undefined,
      author: String(record.authorName ?? user.name ?? record.author ?? "Player"),
      createdAt: String(record.createdAt ?? record.created_at ?? ""),
    };
  });
}

export function normalizeLobbies(value: unknown): Lobby[] {
  return asList(value, ["lobbies", "data"]).map((item, index) => {
    const record = asRecord(item);
    return {
      ...(record as Partial<Lobby>),
      id: String(record.id ?? record._id ?? index),
      title: String(record.title ?? record.name ?? "Open set"),
      playerCount: Number(record.playerCount ?? (Array.isArray(record.players) ? record.players.length : 0)),
    };
  });
}

export async function login(payload: { alias: string; password: string }): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export async function register(payload: { alias: string; password: string; schoolId: number }): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(payload) });
}

export async function getPitches(schoolId: string): Promise<Pitch[]> {
  return normalizePitches(await apiFetch<unknown>(`/pitches?schoolId=${encodeURIComponent(schoolId)}`));
}

export async function getPitch(id: string): Promise<Pitch> {
  return normalizePitch(await apiFetch<unknown>(`/pitches/${encodeURIComponent(id)}`));
}

export function votePitch(id: string, isUp: boolean): Promise<unknown> {
  return apiFetch(`/pitches/${encodeURIComponent(id)}/vote`, { method: "POST", body: JSON.stringify({ isUp }) });
}

export async function getBanter(pitchId: string): Promise<BanterMessage[]> {
  return normalizeMessages(await apiFetch<unknown>(`/banter?pitchId=${encodeURIComponent(pitchId)}`));
}

// The brief names the endpoint and pitchId query, but not the message body schema.
export async function sendBanter(pitchId: string, message: string): Promise<unknown> {
  return apiFetch(`/banter?pitchId=${encodeURIComponent(pitchId)}`, {
    method: "POST",
    body: JSON.stringify({ pitchId, message }),
  });
}

export async function getLobbies(): Promise<Lobby[]> {
  return normalizeLobbies(await apiFetch<unknown>("/lobbies"));
}

// These payload shapes are documented assumptions because the backend brief omits lobby schemas.
export function createLobby(payload: { pitchId: string; startsAt: string; maxPlayers: number; note: string }): Promise<unknown> {
  return apiFetch("/lobbies", { method: "POST", body: JSON.stringify(payload) });
}

export function joinLobby(lobbyId: string): Promise<unknown> {
  return apiFetch("/lobbies", { method: "POST", body: JSON.stringify({ lobbyId, action: "join" }) });
}
