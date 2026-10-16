export type Sport = "football" | "basketball";
export type PitchStatus = "live" | "building" | "quiet";
export type FeedFilter = "all" | "live" | "building" | "king";
export type FootballPosition = "GK" | "DEF" | "MID" | "FWD";
export type BasketballPosition = "PG" | "SG" | "SF" | "PF" | "C";
export type PlayerPosition = FootballPosition | BasketballPosition;
export type Surface = "Turf" | "Red sand" | "Concrete" | "Natural grass";

export interface Campus {
  id: string;
  name: string;
  shortName: string;
  city: string;
}

export interface Player {
  id: string;
  alias: string;
  campusId: string;
  primarySport: Sport;
  position: PlayerPosition;
  reputation: number;
  tier: "Rookie" | "Baller" | "Campus Legend";
  avatarColor: string;
  avatarUrl?: string | null;
  heightCm?: number;
  weightKg?: number;
}

export interface SetLobby {
  id: string;
  title: string;
  sport: Sport;
  startsInMinutes: number;
  spotsTotal: number;
  spotsOpen: number;
  players: Player[];
  status: "forming" | "ready";
}

export interface AuthUser {
  id: number | string;
  alias: string;
  avatarUrl?: string | null;
  reputationScore?: number;
  schoolId?: number;
  primarySport?: string;
  favoritePosition?: string;
  footballPosition?: string;
  basketballPosition?: string;
  heightCm?: number | null;
  weightKg?: number | null;
  medicalInfo?: string | null;
  hasBall?: boolean;
  ballType?: string | null;
  matchesPlayed?: number;
  goalsScored?: number;
  manOfTheMatch?: number;
  school?: { name: string; institutionType?: string };
}

export interface PitchDirection {
  id: number | string;
  pitchId: number | string;
  userId?: number;
  authorAlias?: string;
  user?: { id: number; alias: string; avatarUrl?: string | null; reputationScore?: number };
  directions: string;
  landmarks?: string | null;
  transitTip?: string | null;
  verificationCount: number;
  isVerified: boolean;
  createdAt: string;
  verifications?: { userId: number; createdAt: string }[];
}

export interface Pitch {
  id: string;
  campusId: string;
  name: string;
  sport: Sport;
  verified: boolean;
  landmark: string;
  surface: Surface;
  floodlights: boolean;
  status: PitchStatus;
  liveCount: number;
  ballPresent: boolean;
  ballBroughtBy?: string;
  coordinates: { x: number; y: number };
  king: Player | null;
  sets: SetLobby[];
  condition: string;
  updatedMinutesAgo: number;
  latitude?: number;
  longitude?: number;
  directions?: PitchDirection[];
}

export interface MatchRecord {
  id: string;
  opponent: string;
  playedAt: string;
  sport: Sport;
  result: "W" | "L" | "D";
  goals: number;
  assists: number;
  rebounds: number;
  threes: number;
  verified: boolean;
}

export interface PendingResult {
  id: string;
  submittedBy: string;
  opponent: string;
  score: string;
  submittedAt: string;
  goals: number;
  assists: number;
  status: "awaiting" | "disputed";
}
