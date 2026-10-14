import { create } from "zustand";
import type { FeedFilter, Pitch, SetLobby, Sport } from "@/lib/types";

type GroundOverride = Partial<Pick<Pitch, "status" | "liveCount" | "ballPresent" | "ballBroughtBy" | "condition" | "updatedMinutesAgo">>;
type SocketStatus = "demo" | "connecting" | "connected" | "offline";

interface AppState {
  campusId: string;
  sport: Sport;
  selectedPitchId: string | null;
  filter: FeedFilter;
  hasBallToday: boolean;
  liveSetsByPitch: Record<string, SetLobby[]>;
  liveGroundByPitch: Record<string, GroundOverride>;
  socketStatus: SocketStatus;
  setCampus: (campusId: string) => void;
  setSport: (sport: Sport) => void;
  setSelectedPitchId: (pitchId: string | null) => void;
  setFilter: (filter: FeedFilter) => void;
  setHasBallToday: (value: boolean) => void;
  setLiveSets: (pitchId: string, sets: SetLobby[]) => void;
  setLiveGround: (pitchId: string, patch: GroundOverride) => void;
  setSocketStatus: (status: SocketStatus) => void;
}

export const useAppStore = create<AppState>((set) => ({
  campusId: "UNILAG",
  sport: "football",
  selectedPitchId: null,
  filter: "all",
  hasBallToday: false,
  liveSetsByPitch: {},
  liveGroundByPitch: {},
  socketStatus: "demo",
  setCampus: (campusId) => set({ campusId }),
  setSport: (sport) => set({ sport }),
  setSelectedPitchId: (selectedPitchId) => set({ selectedPitchId }),
  setFilter: (filter) => set({ filter }),
  setHasBallToday: (hasBallToday) => set({ hasBallToday }),
  setLiveSets: (pitchId, sets) => set((state) => ({ liveSetsByPitch: { ...state.liveSetsByPitch, [pitchId]: sets } })),
  setLiveGround: (pitchId, patch) => set((state) => ({ liveGroundByPitch: { ...state.liveGroundByPitch, [pitchId]: { ...state.liveGroundByPitch[pitchId], ...patch } } })),
  setSocketStatus: (socketStatus) => set({ socketStatus }),
}));
