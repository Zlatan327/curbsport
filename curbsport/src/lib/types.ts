export type PitchActiveStatus = "DRY" | "BUILDING" | "LIVE" | string;
export type PitchVerificationStatus = "GHOST" | "COMMUNITY_VERIFIED" | string;

export interface Pitch {
  id: string;
  name: string;
  sportType?: SportType;
  description?: string;
  landmarkDescription?: string;
  address?: string;
  area?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  activeStatus: PitchActiveStatus;
  verificationStatus: PitchVerificationStatus;
  imageUrl?: string;
  hasBallNow?: boolean;
  ballBroughtBy?: string;
  ballReportedAt?: string;
  playersNow?: number;
  setsToday?: number;
  upvotes?: number;
  downvotes?: number;
  isDemo?: boolean;
  directions?: PitchDirection[];
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
  heightCm?: number;
  weightKg?: number;
  primarySport?: SportType;
  avatarUrl?: string;
  hasBall?: boolean;
  ballType?: string;
  lastSchoolChangeAt?: string;
  lastAliasChangeAt?: string;
  medicalInfo?: string;
  physicalHistory?: {
    heightCm?: number;
    weightKg?: number;
    medicalInfo?: string;
    createdAt: string;
  }[];
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

export interface LobbyPlayer {
  id?: string | number;
  alias?: string;
  reputationScore?: number;
  avatarUrl?: string;
  hasBall?: boolean;
  ballType?: string;
  position?: string;
  isHost?: boolean;
  isCaptain?: boolean;
}

export interface MatchConfirmationInfo {
  userId: number;
  confirmed: boolean;
  user?: {
    id: number;
    alias: string;
  };
}

export interface MatchStat {
  userId: number;
  alias?: string;
  avatarUrl?: string;
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
  confirmations?: MatchConfirmationInfo[] | number;
  submittedById?: number;
  submittedBy?: { id: number; alias: string };
  confirmationsNeeded?: number;
}

export interface Lobby {
  id: string;
  pitchId?: string | number;
  title?: string;
  startsAt?: string;
  date?: string;
  maxPlayers?: number;
  playerCount?: number;
  players?: Array<LobbyPlayer | AuthUser | string>;
  host?: LobbyPlayer | AuthUser;
  hostUserId?: number;
  hasBall?: boolean;
  note?: string;
  status?: string;
  matchResult?: MatchResult | null;
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
