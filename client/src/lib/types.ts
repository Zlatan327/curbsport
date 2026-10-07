export type PitchActiveStatus = "DRY" | "BUILDING" | "LIVE" | string;
export type PitchVerificationStatus = "GHOST" | "COMMUNITY_VERIFIED" | string;

export interface Pitch {
  id: string;
  name: string;
  description?: string;
  address?: string;
  area?: string;
  city?: string;
  activeStatus: PitchActiveStatus;
  verificationStatus: PitchVerificationStatus;
  imageUrl?: string;
  playersNow?: number;
  setsToday?: number;
  upvotes?: number;
  downvotes?: number;
  isDemo?: boolean;
}

export interface AuthUser {
  id?: string | number;
  alias?: string;
  schoolId?: number;
  school?: {
    id?: number;
    name?: string;
    institutionType?: string;
  };
  favoritePosition?: string;
  footballPosition?: string;
  basketballPosition?: string;
  crownBannedUntil?: string;
  reputationScore?: number;
  matchesPlayed?: number;
  goalsScored?: number;
  manOfTheMatch?: number;
  favoritePitches?: any[];
  [key: string]: unknown;
}

export interface BanterMessage {
  id: string;
  message: string;
  text?: string;
  createdAt?: string;
  user?: AuthUser | string;
  author?: string;
  [key: string]: unknown;
}

export interface Lobby {
  id: string;
  pitchId?: string | number;
  title?: string;
  startsAt?: string;
  date?: string;
  maxPlayers?: number;
  playerCount?: number;
  players?: Array<AuthUser | string>;
  note?: string;
  status?: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export type SportType = "FOOTBALL" | "BASKETBALL";
export type FootballPosition = "GOALKEEPER" | "DEFENDER" | "MIDFIELDER" | "FORWARD";
export type BasketballPosition = "GUARD" | "FORWARD" | "CENTER";
export type MatchResultStatus = "PENDING" | "CONFIRMED" | "DISPUTED" | "SLASHED";

export interface MatchStat {
  userId: number;
  alias?: string;
  goals: number;
  assists: number;
  cleanSheets: number;
  saves: number;
  tackles: number;
  points: number;
  rebounds: number;
  steals: number;
  blocks: number;
  threePointers: number;
}

export interface LeaderboardEntry {
  userId: number;
  alias: string;
  position?: string;
  score: number;
  goals?: number;
  assists?: number;
  cleanSheets?: number;
  saves?: number;
  tackles?: number;
  points?: number;
  rebounds?: number;
  steals?: number;
  blocks?: number;
  threePointers?: number;
  isKing?: boolean;
  isBanned?: boolean;
}

export interface MatchResult {
  id: number;
  lobbyId: number;
  pitchId: number;
  status: MatchResultStatus;
  sportType: SportType;
  matchDate: string;
  durationMins: number;
  playerCount: number;
  stats: MatchStat[];
  confirmations?: number;
  confirmationsNeeded?: number;
}

export interface UserStats {
  userId: number;
  alias: string;
  reputationScore: number;
  footballPosition?: FootballPosition;
  basketballPosition?: BasketballPosition;
  totalMatches: number;
  football: {
    goals: number;
    assists: number;
    cleanSheets: number;
    saves: number;
    tackles: number;
  };
  basketball: {
    points: number;
    rebounds: number;
    steals: number;
    blocks: number;
    threePointers: number;
  };
  crowns: number;
  isCrownBanned: boolean;
  slashCount: number;
}
