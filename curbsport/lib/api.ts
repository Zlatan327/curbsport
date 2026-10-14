import type { Pitch, Player, SetLobby, Sport, Surface } from "@/lib/types";
import { readStoredToken } from "@/store/auth-store";

export class ApiUnavailableError extends Error {
  constructor(message = "The Curbsport API is not configured.") { super(message); this.name = "ApiUnavailableError"; }
}

export const getApiBaseUrl = (): string | null => {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  return value ? value.replace(/\/+$/, "") : null;
};
export const isApiConfigured = (): boolean => getApiBaseUrl() !== null;

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new ApiUnavailableError();
  const token = readStoredToken();
  const headers = new Headers(init.headers);
  if (typeof init.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`, { ...init, headers, cache: "no-store" });
  if (!response.ok) throw new Error(`Curbsport API returned ${response.status} for ${path}.`);
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return undefined as T;
  return response.json() as Promise<T>;
}

export function postDemoAware(path: string, body: unknown): Promise<void> {
  return apiRequest<void>(path, { method: "POST", body: JSON.stringify(body) });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const validPosition = (position: unknown, sport: unknown): boolean => sport === "football"
  ? position === "GK" || position === "DEF" || position === "MID" || position === "FWD"
  : sport === "basketball" && (position === "PG" || position === "SG" || position === "SF" || position === "PF" || position === "C");

export function isPlayer(value: unknown): value is Player {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.alias === "string" && typeof value.campusId === "string" &&
    (value.primarySport === "football" || value.primarySport === "basketball") && validPosition(value.position, value.primarySport) &&
    finite(value.reputation) && value.reputation >= 0 && value.reputation <= 100 &&
    (value.tier === "Rookie" || value.tier === "Baller" || value.tier === "Campus Legend") &&
    typeof value.avatarColor === "string" && /^#[\da-fA-F]{6}$/.test(value.avatarColor);
}

export function isSetLobby(value: unknown): value is SetLobby {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.title === "string" &&
    (value.sport === "football" || value.sport === "basketball") && finite(value.startsInMinutes) && value.startsInMinutes >= 0 &&
    finite(value.spotsTotal) && value.spotsTotal > 0 && finite(value.spotsOpen) && value.spotsOpen >= 0 && value.spotsOpen <= value.spotsTotal &&
    Array.isArray(value.players) && value.players.every(isPlayer) && (value.status === "forming" || value.status === "ready");
}

export function isPitch(value: unknown): value is Pitch {
  if (!isRecord(value) || !isRecord(value.coordinates) || !isPlayer(value.king)) return false;
  const surfaces: Surface[] = ["Turf", "Red sand", "Concrete", "Natural grass"];
  return typeof value.id === "string" && typeof value.campusId === "string" && typeof value.name === "string" &&
    (value.sport === "football" || value.sport === "basketball") && typeof value.verified === "boolean" &&
    typeof value.landmark === "string" && surfaces.includes(value.surface as Surface) && typeof value.floodlights === "boolean" &&
    (value.status === "live" || value.status === "building" || value.status === "quiet") &&
    value.king.campusId === value.campusId && value.king.primarySport === value.sport &&
    finite(value.liveCount) && value.liveCount >= 0 && typeof value.ballPresent === "boolean" &&
    (value.ballBroughtBy === undefined || typeof value.ballBroughtBy === "string") &&
    finite(value.coordinates.x) && value.coordinates.x >= 0 && value.coordinates.x <= 100 &&
    finite(value.coordinates.y) && value.coordinates.y >= 0 && value.coordinates.y <= 100 &&
    Array.isArray(value.sets) && value.sets.every((set) => isSetLobby(set) && set.sport === value.sport) && typeof value.condition === "string" &&
    finite(value.updatedMinutesAgo) && value.updatedMinutesAgo >= 0;
}

function pitchListFromResponse(value: unknown): Pitch[] {
  const list = Array.isArray(value) ? value : isRecord(value) && Array.isArray(value.data) ? value.data : null;
  if (!list || !list.every(isPitch)) throw new Error("The API response did not match the documented Curbsport Pitch[] shape.");
  return list;
}

export async function fetchCampusPitches(campusId: string, sport: Sport): Promise<Pitch[]> {
  const query = new URLSearchParams({ campusId, sport });
  return pitchListFromResponse(await apiRequest<unknown>(`/pitches?${query.toString()}`));
}

export async function fetchPitch(id: string): Promise<Pitch> {
  const result = await apiRequest<unknown>(`/pitches/${encodeURIComponent(id)}`);
  const pitch = isRecord(result) && "data" in result ? result.data : result;
  if (!isPitch(pitch)) throw new Error("The API response did not match the documented Curbsport Pitch shape.");
  return pitch;
}
