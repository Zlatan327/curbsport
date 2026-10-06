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
