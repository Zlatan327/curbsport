import type { AuthResponse, AuthUser, BanterMessage, LeaderboardEntry, Lobby, LobbyPlayer, MatchResult, MatchStat, Pitch, PitchDirection, SportType, UserStats } from "@/lib/types";

export const TOKEN_KEY = "curbsport-token";
export const LEGACY_TOKEN_KEY = "inside-life-token";
export const USER_KEY = "curbsport-user";
export const LEGACY_USER_KEY = "inside-life-user";
export const CITY_ID_KEY = "curbsport-city-id";
export const LEGACY_CITY_ID_KEY = "inside-life-city-id";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? "https://insidelife.onrender.com/api" : "http://localhost:4000/api")
).replace(/\/$/, "");

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

const ALL_TOKEN_KEYS = ["curbsport-token", "inside-life-token", "token", "auth_token", "jwt", "curbsport_token"] as const;
const ALL_USER_KEYS = ["curbsport-user", "inside-life-user", "user", "authUser", "curbsport_user"] as const;

export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  for (const k of ALL_TOKEN_KEYS) {
    try {
      const val = window.localStorage.getItem(k);
      if (val && val.trim().length > 0) return val.trim();
    } catch {}
  }
  return null;
}

export function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  for (const k of ALL_USER_KEYS) {
    try {
      const raw = window.localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && (parsed.id || parsed.alias)) {
          return parsed as AuthUser;
        }
      }
    } catch {}
  }
  return null;
}

export function saveSession(token: string, user: AuthUser): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Mirror to legacy keys so existing browser tabs and previous versions remain authenticated
  window.localStorage.setItem(LEGACY_TOKEN_KEY, token);
  window.localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
}

export function clearSessionStorage(): void {
  for (const k of ALL_TOKEN_KEYS) {
    try { window.localStorage.removeItem(k); } catch {}
  }
  for (const k of ALL_USER_KEYS) {
    try { window.localStorage.removeItem(k); } catch {}
  }
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
    const detailList = Array.isArray(record?.details)
      ? record!.details
          .map((d: any) => (d && d.message ? `${d.field ? `${d.field}: ` : ""}${d.message}` : ""))
          .filter(Boolean)
          .join(", ")
      : "";
    const baseMessage = String(record?.message || record?.error || (typeof payload === "string" ? payload : `Request failed (${response.status})`));
    const message = detailList ? `${baseMessage}: ${detailList}` : baseMessage;
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

export function getDirectionsUrl(pitch: {
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  area?: string;
}): string {
  if (pitch.latitude && pitch.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${pitch.latitude},${pitch.longitude}`;
  }
  const query = `${pitch.name}, ${pitch.address || pitch.area || ""}, Nigeria`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function normalizePitch(value: unknown): Pitch {
  const root = asRecord(value);
  const record = (root.pitch && typeof root.pitch === "object" ? asRecord(root.pitch) : root);
  const stats = asRecord(record.stats);
  const count = asRecord(record._count);

  const rawSport = String(record.sportType ?? "").toUpperCase();
  const nameLower = String(record.name ?? "").toLowerCase();
  const isBball = rawSport === "BASKETBALL" || nameLower.includes("basketball") || nameLower.includes("hoop");
  const sportType: SportType = isBball ? "BASKETBALL" : "FOOTBALL";

  const lat = record.latitude !== undefined && record.latitude !== null ? Number(record.latitude) : undefined;
  const lng = record.longitude !== undefined && record.longitude !== null ? Number(record.longitude) : undefined;

  return {
    ...(record as Partial<Pitch>),
    id: String(record.id ?? record._id ?? "unknown"),
    name: String(record.name ?? record.title ?? record.pitchName ?? "Unnamed pitch"),
    sportType,
    description: typeof record.description === "string" ? record.description : (typeof record.landmarkDescription === "string" ? record.landmarkDescription : undefined),
    landmarkDescription: typeof record.landmarkDescription === "string" ? record.landmarkDescription : undefined,
    address: String(record.address ?? record.landmarkDescription ?? record.locationName ?? record.location ?? "Location not listed"),
    area: typeof record.area === "string" ? record.area : undefined,
    city: typeof record.city === "string" ? record.city : undefined,
    latitude: typeof lat === "number" && !isNaN(lat) ? lat : undefined,
    longitude: typeof lng === "number" && !isNaN(lng) ? lng : undefined,
    activeStatus: String(record.activeStatus ?? record.status ?? "DRY").toUpperCase(),
    verificationStatus: String(record.verificationStatus ?? record.verification ?? "GHOST").toUpperCase(),
    imageUrl: typeof record.imageUrl === "string" ? record.imageUrl : undefined,
    hasBallNow: Boolean(record.hasBallNow),
    ballBroughtBy: typeof record.ballBroughtBy === "string" ? record.ballBroughtBy : undefined,
    ballReportedAt: typeof record.ballReportedAt === "string" ? record.ballReportedAt : undefined,
    playersNow: Number(record.playersNow ?? stats.playersNow ?? stats.players ?? 0),
    setsToday: Number(record.setsToday ?? stats.setsToday ?? stats.sets ?? count.lobbies ?? 0),
    upvotes: Number(record.upvotes ?? stats.upvotes ?? record.confirmationCount ?? count.votes ?? 0),
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
      text: typeof record.text === "string" ? record.text : (typeof record.message === "string" ? record.message : undefined),
      author: String(record.authorName ?? user.alias ?? user.name ?? record.author ?? "Player"),
      createdAt: String(record.createdAt ?? record.created_at ?? ""),
      user: {
        id: (user.id as number | string) || undefined,
        alias: (user.alias as string) || (user.name as string) || "Player",
        hasBall: Boolean(user.hasBall),
        ballType: typeof user.ballType === "string" ? user.ballType : undefined,
      },
    };
  });
}

export function normalizeLobbies(value: unknown): Lobby[] {
  return asList(value, ["lobbies", "data"]).map((item, index) => {
    const record = asRecord(item);
    const count = record._count && typeof record._count === "object" ? (record._count as any).members : undefined;
    const rawMembers = Array.isArray(record.members)
      ? record.members.map((m: any) => m.user || m)
      : Array.isArray(record.players)
      ? record.players
      : [];
    const hostRec = record.host && typeof record.host === "object" ? asRecord(record.host) : undefined;

    const players: LobbyPlayer[] = rawMembers.map((m: any) => {
      if (typeof m === "string") {
        return { alias: m, reputationScore: 10 };
      }
      const rec = asRecord(m);
      const pid = rec.id !== undefined && rec.id !== null ? (typeof rec.id === "number" ? rec.id : String(rec.id)) : undefined;
      return {
        id: pid,
        alias: String(rec.alias || rec.name || "Player"),
        reputationScore: Number(rec.reputationScore ?? 10),
        avatarUrl: typeof rec.avatarUrl === "string" ? rec.avatarUrl : undefined,
        hasBall: Boolean(rec.hasBall),
        ballType: typeof rec.ballType === "string" ? rec.ballType : undefined,
      };
    });

    // Sort players: Ball Owners get priority starter spots, then by reputation descending
    players.sort((a, b) => {
      if (a.hasBall && !b.hasBall) return -1;
      if (!a.hasBall && b.hasBall) return 1;
      return (b.reputationScore ?? 0) - (a.reputationScore ?? 0);
    });

    const hostPlayer: LobbyPlayer | undefined = hostRec ? {
      id: hostRec.id !== undefined && hostRec.id !== null ? (typeof hostRec.id === "number" ? hostRec.id : String(hostRec.id)) : undefined,
      alias: String(hostRec.alias || "Host"),
      reputationScore: Number(hostRec.reputationScore ?? 10),
      avatarUrl: typeof hostRec.avatarUrl === "string" ? hostRec.avatarUrl : undefined,
      hasBall: Boolean(hostRec.hasBall),
      ballType: typeof hostRec.ballType === "string" ? hostRec.ballType : undefined,
    } : undefined;

    const lobbyHasBall = Boolean(record.hasBall || hostPlayer?.hasBall || players.some((p) => p.hasBall));

    const rawMatchResult = record.matchResult as any;
    let matchResult: MatchResult | undefined = undefined;
    if (rawMatchResult && typeof rawMatchResult === 'object') {
      const confirmations = Array.isArray(rawMatchResult.confirmations)
        ? rawMatchResult.confirmations.map((c: any) => ({
            userId: Number(c.userId),
            confirmed: Boolean(c.confirmed),
            user: c.user ? { id: Number(c.user.id), alias: String(c.user.alias) } : undefined,
          }))
        : typeof rawMatchResult.confirmations === 'number'
        ? rawMatchResult.confirmations
        : [];

      const stats: MatchStat[] = Array.isArray(rawMatchResult.stats)
        ? rawMatchResult.stats.map((s: any) => ({
            userId: Number(s.userId),
            alias: s.user?.alias || s.alias || `Player #${s.userId}`,
            avatarUrl: s.user?.avatarUrl || s.avatarUrl,
            goals: Number(s.goals || 0),
            assists: Number(s.assists || 0),
            cleanSheets: Number(s.cleanSheets || 0),
            saves: Number(s.saves || 0),
            tackles: Number(s.tackles || 0),
            points: Number(s.points || 0),
            rebounds: Number(s.rebounds || 0),
            steals: Number(s.steals || 0),
            blocks: Number(s.blocks || 0),
            threePointers: Number(s.threePointers || 0),
          }))
        : [];

      matchResult = {
        id: Number(rawMatchResult.id),
        lobbyId: Number(rawMatchResult.lobbyId ?? record.id),
        pitchId: Number(rawMatchResult.pitchId ?? record.pitchId),
        status: rawMatchResult.status || 'PENDING',
        sportType: (rawMatchResult.sportType || 'FOOTBALL') as SportType,
        matchDate: String(rawMatchResult.matchDate || ''),
        durationMins: Number(rawMatchResult.durationMins || 30),
        playerCount: Number(rawMatchResult.playerCount || stats.length),
        submittedById: rawMatchResult.submittedById ? Number(rawMatchResult.submittedById) : undefined,
        submittedBy: rawMatchResult.submittedBy,
        confirmations,
        stats,
      };
    }

    return {
      ...(record as Partial<Lobby>),
      id: String(record.id ?? record._id ?? index),
      pitchId: (record.pitchId as string | number) || undefined,
      title: String(record.teamName ?? record.title ?? record.name ?? "Open set"),
      startsAt: String(record.scheduledAt ?? record.startsAt ?? ""),
      maxPlayers: Number(record.maxPlayers ?? 10),
      playerCount: Number(count ?? record.playerCount ?? players.length),
      players,
      host: hostPlayer,
      hasBall: lobbyHasBall,
      note: typeof record.teamName === "string" ? record.teamName : (typeof record.note === "string" ? record.note : undefined),
      status: String(record.status ?? "BUILDING"),
      matchResult,
    };
  });
}

export async function login(payload: { alias: string; password: string }): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export async function register(payload: { alias: string; password: string; schoolId: number }): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(payload) });
}

export async function fetchMe(): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>("/users/me");
}

export async function updateProfile(payload: Partial<AuthUser>): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>("/users/me", { method: "PATCH", body: JSON.stringify(payload) });
}

export async function getSchools(): Promise<{ id: number; name: string }[]> {
  const res = await apiFetch<{ schools: { id: number; name: string }[] }>("/pitches/schools/list");
  return res.schools || [];
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

export async function createPitch(payload: {
  name: string;
  landmarkDescription?: string;
  address?: string;
  schoolId?: number;
  fieldType?: 'Paid Turf' | 'School Ground' | 'Street Arena';
  priceBracket?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  sportType?: 'FOOTBALL' | 'BASKETBALL';
}): Promise<Pitch> {
  return normalizePitch(await apiFetch<unknown>("/pitches", { method: "POST", body: JSON.stringify(payload) }));
}

export async function updatePitchImage(pitchId: string | number, imageUrl: string): Promise<Pitch> {
  const res = await apiFetch<{ pitch: unknown }>(`/pitches/${encodeURIComponent(pitchId)}/image`, {
    method: "PATCH",
    body: JSON.stringify({ imageUrl }),
  });
  return normalizePitch(res.pitch || res);
}

export async function checkinBall(
  pitchId: string | number,
  hasBallNow: boolean = true,
  reason?: 'BALL_LEAVING' | 'CHECKED_OUT' | 'ACCIDENTAL_CLICK' | 'MATCH_ENDED' | 'BALL_ARRIVED'
): Promise<{ pitch: Pitch; message: string }> {
  const res = await apiFetch<{ pitch: unknown; message: string }>(`/pitches/${encodeURIComponent(pitchId)}/ball-checkin`, {
    method: "POST",
    body: JSON.stringify({ hasBallNow, reason }),
  });
  return {
    pitch: normalizePitch(res.pitch || res),
    message: res.message || "Ball check-in registered!",
  };
}

export async function getBanter(pitchId: string): Promise<BanterMessage[]> {
  return normalizeMessages(await apiFetch<unknown>(`/banter?pitchId=${encodeURIComponent(pitchId)}`));
}

export async function sendBanter(pitchId: string, message: string): Promise<unknown> {
  return apiFetch(`/banter?pitchId=${encodeURIComponent(pitchId)}`, {
    method: "POST",
    body: JSON.stringify({ pitchId: Number(pitchId) || pitchId, text: message, message }),
  });
}

export async function getLobbies(): Promise<Lobby[]> {
  return normalizeLobbies(await apiFetch<unknown>("/lobbies"));
}

export function createLobby(payload: { pitchId: string | number; startsAt: string; maxPlayers: number; note: string; title?: string; hasBall?: boolean }): Promise<unknown> {
  const pitchIdNum = typeof payload.pitchId === "number" ? payload.pitchId : parseInt(payload.pitchId, 10);
  return apiFetch("/lobbies", {
    method: "POST",
    body: JSON.stringify({
      pitchId: isNaN(pitchIdNum) ? payload.pitchId : pitchIdNum,
      scheduledAt: payload.startsAt,
      startsAt: payload.startsAt,
      teamName: payload.title || payload.note,
      note: payload.note,
      maxPlayers: payload.maxPlayers,
      hasBall: payload.hasBall,
    }),
  });
}

export function joinLobby(lobbyId: string): Promise<unknown> {
  return apiFetch(`/lobbies/${encodeURIComponent(lobbyId)}/join`, { method: "POST" });
}

export function leaveLobby(lobbyId: string): Promise<unknown> {
  return apiFetch(`/lobbies/${encodeURIComponent(lobbyId)}/leave`, { method: "POST" });
}

export async function getLeaderboard(pitchId: string, sportType: string = 'FOOTBALL'): Promise<LeaderboardEntry[]> {
  const res = await apiFetch<{ leaderboard: any[]; reigningKing?: any }>(
    `/matches/leaderboard?pitchId=${encodeURIComponent(pitchId)}&sportType=${encodeURIComponent(sportType)}`
  );
  const rawList = res.leaderboard || [];
  const reigningKingId = res.reigningKing?.id;
  return rawList.map((item, index) => {
    const user = item.user || {};
    const userId = user.id ?? item.userId ?? index;
    const isKing = reigningKingId ? userId === reigningKingId : index === 0;
    const position = sportType === 'FOOTBALL' ? (user.footballPosition || item.position) : (user.basketballPosition || item.position);
    return {
      userId,
      alias: user.alias || item.alias || `Player #${userId}`,
      position,
      score: item.score ?? 0,
      goals: item.goals ?? 0,
      assists: item.assists ?? 0,
      cleanSheets: item.cleanSheets ?? 0,
      saves: item.saves ?? 0,
      tackles: item.tackles ?? 0,
      points: item.points ?? 0,
      rebounds: item.rebounds ?? 0,
      steals: item.steals ?? 0,
      blocks: item.blocks ?? 0,
      threePointers: item.threePointers ?? 0,
      isKing,
      isBanned: Boolean(user.crownBannedUntil && new Date(user.crownBannedUntil) > new Date()),
    };
  });
}

export async function getUserStats(userId: string): Promise<UserStats> {
  return apiFetch<UserStats>(`/matches/stats/${encodeURIComponent(userId)}`);
}

export async function submitMatchResult(payload: {
  lobbyId: number;
  durationMins: number;
  stats: Array<{ userId: number; goals?: number; assists?: number; cleanSheets?: number; saves?: number; tackles?: number; points?: number; rebounds?: number; steals?: number; blocks?: number; threePointers?: number }>;
}): Promise<unknown> {
  return apiFetch('/matches/result', { method: 'POST', body: JSON.stringify(payload) });
}

export async function confirmMatch(matchId: number, confirmed: boolean): Promise<unknown> {
  return apiFetch(`/matches/${matchId}/confirm`, { method: 'POST', body: JSON.stringify({ confirm: confirmed, confirmed }) });
}

export async function disputeMatch(matchId: number, reason: string): Promise<unknown> {
  return apiFetch(`/matches/${matchId}/dispute`, { method: 'POST', body: JSON.stringify({ reason }) });
}

export async function fetchPitchDirections(pitchId: string | number): Promise<PitchDirection[]> {
  try {
    const res = await apiFetch<{ directions?: PitchDirection[] }>(`/pitches/${encodeURIComponent(pitchId)}/directions`);
    return Array.isArray(res?.directions) ? res.directions : [];
  } catch {
    return [];
  }
}

export async function submitPitchDirections(
  pitchId: string | number,
  payload: { directions: string; landmarks?: string; transitTip?: string }
): Promise<{ message: string; direction: PitchDirection }> {
  return apiFetch<{ message: string; direction: PitchDirection }>(`/pitches/${encodeURIComponent(pitchId)}/directions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyPitchDirection(
  pitchId: string | number,
  directionId: string | number
): Promise<{ message: string; direction: PitchDirection }> {
  return apiFetch<{ message: string; direction: PitchDirection }>(
    `/pitches/${encodeURIComponent(pitchId)}/directions/${encodeURIComponent(directionId)}/verify`,
    { method: "POST" }
  );
}

