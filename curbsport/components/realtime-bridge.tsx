"use client";

import { useEffect } from "react";
import { connectLiveUpdates } from "@/lib/realtime";
import { isSetLobby } from "@/lib/api";
import type { Pitch } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseGroundPatch(value: unknown): { pitchId: string; patch: Partial<Pitch> } | null {
  if (!isRecord(value) || typeof value.pitchId !== "string") return null;
  const patch: Partial<Pitch> = {};
  if (typeof value.liveCount === "number" && Number.isFinite(value.liveCount) && value.liveCount >= 0) patch.liveCount = value.liveCount;
  if (typeof value.ballPresent === "boolean") patch.ballPresent = value.ballPresent;
  if (typeof value.ballBroughtBy === "string") patch.ballBroughtBy = value.ballBroughtBy;
  if (typeof value.condition === "string") patch.condition = value.condition;
  if (value.status === "live" || value.status === "building" || value.status === "quiet") patch.status = value.status;
  if (typeof value.updatedMinutesAgo === "number" && Number.isFinite(value.updatedMinutesAgo) && value.updatedMinutesAgo >= 0) patch.updatedMinutesAgo = value.updatedMinutesAgo;
  return Object.keys(patch).length ? { pitchId: value.pitchId, patch } : null;
}

export function RealtimeBridge() {
  useEffect(() => {
    const socket = connectLiveUpdates();
    if (!socket) { useAppStore.getState().setSocketStatus("demo"); return; }
    useAppStore.getState().setSocketStatus("connecting");
    const onConnect = () => useAppStore.getState().setSocketStatus("connected");
    const onDisconnect = () => useAppStore.getState().setSocketStatus("offline");
    const onSets = (payload: unknown) => {
      if (!isRecord(payload) || typeof payload.pitchId !== "string" || !Array.isArray(payload.sets) || !payload.sets.every(isSetLobby)) return;
      useAppStore.getState().setLiveSets(payload.pitchId, payload.sets);
    };
    const onGround = (payload: unknown) => {
      const update = parseGroundPatch(payload);
      if (update) useAppStore.getState().setLiveGround(update.pitchId, update.patch);
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onDisconnect);
    socket.on("sets:update", onSets);
    socket.on("ground:update", onGround);
    socket.on("ground:condition", onGround);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onDisconnect);
      socket.off("sets:update", onSets);
      socket.off("ground:update", onGround);
      socket.off("ground:condition", onGround);
      socket.disconnect();
    };
  }, []);
  return null;
}
