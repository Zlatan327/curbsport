import type { AuthUser, Pitch, PitchDirection, Player, SetLobby, Sport, Surface, PitchStatus } from "@/lib/types";
import { readStoredToken } from "@/store/auth-store";
import { demoPitches } from "@/lib/data";

export class ApiUnavailableError extends Error {
  constructor(message = "The Curbsport API is not configured.") {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

export const getApiBaseUrl = (): string => {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (value) return value.replace(/\/+$/, "");
  return "https://insidelife.onrender.com/api";
};

export const isApiConfigured = (): boolean => Boolean(getApiBaseUrl());

export const CAMPUS_TO_SCHOOL_ID: Record<string, number> = {
  UNILAG: 9,
  UNIZIK: 6,
  OAU: 13,
  UNN: 11,
  ABU: 10,
  COVENANT: 14,
  UI: 12,
  "FED POLY OKO": 1,
  OKO: 1,
  UNILORIN: 15,
  UNIBEN: 16,
  BUK: 17,
  "FUT MINNA": 18,
};

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = readStoredToken();
  const headers = new Headers(init.headers);
  if (typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${baseUrl}${cleanPath}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.error || errJson?.message) {
        message = errJson.error || errJson.message;
      }
    } catch {
      // Keep default message
    }
    throw new Error(message);
  }

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
  return typeof value.id === "string" && typeof value.name === "string" && typeof value.campusId === "string" &&
    (value.sport === "football" || value.sport === "basketball") &&
    (value.status === "live" || value.status === "building" || value.status === "quiet") &&
    finite(value.liveCount) && value.liveCount >= 0 &&
    typeof value.ballPresent === "boolean" &&
    Array.isArray(value.sets) && value.sets.every(isSetLobby);
}

export function getDirectionsUrl(pitch: {
  name: string;
  latitude?: number;
  longitude?: number;
  landmark?: string;
  address?: string;
}): string {
  if (pitch.latitude && pitch.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${pitch.latitude},${pitch.longitude}`;
  }
  const query = `${pitch.name}, ${pitch.landmark || pitch.address || "Nigeria"}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function normalizeServerPitch(raw: Record<string, unknown>, fallbackCampusId = "UNILAG"): Pitch {
  const id = String(raw.id ?? "unknown");
  const rawSport = String(raw.sportType ?? "").toLowerCase();
  const nameLower = String(raw.name ?? "").toLowerCase();
  const isBball =
    rawSport === "basketball" ||
    nameLower.includes("basketball") ||
    nameLower.includes("court") ||
    nameLower.includes("hoop");
  const sport: Sport = isBball ? "basketball" : "football";

  const rawStatus = String(raw.activeStatus ?? "").toUpperCase();
  const status: PitchStatus =
    rawStatus === "LIVE" ? "live" : rawStatus === "BUILDING" ? "building" : "quiet";

  const lat = raw.latitude !== null && raw.latitude !== undefined ? Number(raw.latitude) : undefined;
  const lng = raw.longitude !== null && raw.longitude !== undefined ? Number(raw.longitude) : undefined;

  // Compute a deterministic radar map coordinate (0 to 100)
  const hash = Math.abs(id.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0));
  const coords = {
    x: 18 + (hash % 64),
    y: 18 + ((hash >> 3) % 64),
  };

  const fieldType = String(raw.fieldType ?? "").toLowerCase();
  let surface: Surface = "Natural grass";
  if (fieldType.includes("turf") || nameLower.includes("turf")) surface = "Turf";
  else if (isBball || fieldType.includes("concrete") || nameLower.includes("pavilion")) surface = "Concrete";
  else if (fieldType.includes("street") || nameLower.includes("park")) surface = "Red sand";

  const landmark = String(raw.landmarkDescription || raw.address || "Campus grounds, Nigeria");

  const sampleKing = demoPitches.find((p) => p.campusId === fallbackCampusId && p.sport === sport)?.king || {
    id: `king-${id}`,
    alias: typeof raw.ballBroughtBy === "string" && raw.ballBroughtBy.trim() ? raw.ballBroughtBy : "Campus Star",
    campusId: fallbackCampusId,
    primarySport: sport,
    position: (sport === "football" ? "FWD" : "PG") as Player["position"],
    reputation: 92,
    avatarColor: "#00ff66",
    tier: "Campus Legend" as const,
  };

  return {
    id,
    campusId: fallbackCampusId,
    name: String(raw.name ?? "Campus Ground"),
    sport,
    verified: raw.verificationStatus === "COMMUNITY_VERIFIED" || Number(raw.confirmationCount || 0) >= 3,
    landmark,
    surface,
    floodlights: Boolean(raw.floodlights) || nameLower.includes("indoor") || nameLower.includes("complex"),
    status,
    liveCount: Number(raw.playersNow || (status === "live" ? 12 : status === "building" ? 5 : 0)),
    ballPresent: Boolean(raw.hasBallNow),
    ballBroughtBy: raw.ballBroughtBy ? String(raw.ballBroughtBy) : undefined,
    coordinates: coords,
    king: sampleKing,
    sets: demoPitches.find((p) => p.id === id)?.sets || [],
    condition: status === "live" ? "Live match in progress" : raw.hasBallNow ? "Ball dey ground" : "Dry ground",
    updatedMinutesAgo: 3,
    latitude: lat,
    longitude: lng,
    directions: Array.isArray(raw.directions) ? raw.directions : undefined,
  };
}

export async function fetchCampusPitches(campusId: string, sport: Sport): Promise<Pitch[]> {
  const schoolId = CAMPUS_TO_SCHOOL_ID[campusId.toUpperCase()] || 9;
  try {
    const res = await apiRequest<{ pitches?: unknown[] }>(`/pitches?schoolId=${schoolId}`);
    const rawList = Array.isArray(res) ? res : Array.isArray(res?.pitches) ? res.pitches : [];
    if (rawList.length > 0) {
      return rawList
        .filter((raw): raw is Record<string, unknown> => isRecord(raw))
        .map((raw) => normalizeServerPitch(raw, campusId))
        .filter((p) => p.sport === sport);
    }
  } catch (err) {
    console.warn("Live API fetch error, falling back to local campus catalog:", err);
  }
  return demoPitches.filter((p) => p.campusId === campusId && p.sport === sport);
}

export async function fetchPitch(id: string): Promise<Pitch> {
  const numericId = parseInt(id, 10);
  if (!isNaN(numericId)) {
    try {
      const res = await apiRequest<{ pitch?: unknown }>(`/pitches/${numericId}`);
      if (res?.pitch && isRecord(res.pitch)) {
        return normalizeServerPitch(res.pitch);
      }
    } catch {
      // Fall through to fixture
    }
  }
  const fixture = demoPitches.find((p) => p.id === id);
  if (fixture) return fixture;
  throw new Error(`Pitch “${id}” not found.`);
}

export async function fetchPitchDirections(pitchId: string | number): Promise<PitchDirection[]> {
  const numericId = parseInt(String(pitchId), 10);
  if (isNaN(numericId)) return [];
  try {
    const res = await apiRequest<{ directions?: PitchDirection[] }>(`/pitches/${numericId}/directions`);
    return Array.isArray(res?.directions) ? res.directions : [];
  } catch {
    return [];
  }
}

export async function submitPitchDirections(
  pitchId: string | number,
  data: { directions: string; landmarks?: string; transitTip?: string }
): Promise<{ direction: PitchDirection; message: string }> {
  const numericId = parseInt(String(pitchId), 10);
  if (isNaN(numericId)) throw new Error("A valid ground ID is required to submit directions.");
  return apiRequest(`/pitches/${numericId}/directions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function verifyPitchDirection(
  pitchId: string | number,
  directionId: number | string
): Promise<{ success: boolean; direction: PitchDirection; message: string }> {
  const numericId = parseInt(String(pitchId), 10);
  return apiRequest(`/pitches/${numericId}/directions/${directionId}/verify`, {
    method: "POST",
  });
}

export async function loginUser(credentials: {
  alias: string;
  password: string;
}): Promise<{ token: string; user: AuthUser }> {
  return apiRequest<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function registerUser(payload: {
  alias: string;
  password: string;
  schoolId?: number;
  favoritePosition?: string;
}): Promise<{ token: string; user: AuthUser }> {
  return apiRequest<{ token: string; user: AuthUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ schoolId: 9, ...payload }),
  });
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await apiRequest<{ user?: AuthUser }>("/users/me");
    if (res?.user) return res.user;
  } catch {
    // Try fallback
  }
  try {
    const res = await apiRequest<{ user?: AuthUser }>("/auth/me");
    return res?.user || null;
  } catch {
    return null;
  }
}

export async function updateUserProfile(payload: Partial<AuthUser>): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchSchools(): Promise<{ id: number; name: string }[]> {
  try {
    const res = await apiRequest<{ schools?: { id: number; name: string }[] }>("/pitches/schools/list");
    return Array.isArray(res?.schools) ? res.schools : [];
  } catch {
    return [];
  }
}

export async function fetchUserStats(userId: string | number): Promise<Record<string, unknown> | null> {
  try {
    return await apiRequest<Record<string, unknown>>(`/matches/stats/${encodeURIComponent(String(userId))}`);
  } catch {
    return null;
  }
}
