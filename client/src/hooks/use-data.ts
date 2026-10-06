"use client";

import { useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import { getBanter, getLobbies, getPitch, getPitches, normalizeMessages } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { BanterMessage } from "@/lib/types";

export function usePitches(cityId: string) {
  return useSWR(cityId ? ["pitches", cityId] : null, ([, id]) => getPitches(id));
}

export function usePitch(id: string) {
  return useSWR(id ? ["pitch", id] : null, ([, pitchId]) => getPitch(pitchId));
}

export function useBanter(pitchId: string) {
  const { mutate } = useSWRConfig();
  
  useEffect(() => {
    if (!pitchId) return;
    const socket = getSocket();
    
    socket.emit("join_pitch", pitchId);
    
    const handleNewBanter = (newMessage: unknown) => {
      // Add the new message to the top of the SWR cache
      mutate(["banter", pitchId], (currentMessages: BanterMessage[] = []) => {
        const normalized = normalizeMessages([newMessage])[0];
        // Prevent duplicates
        if (currentMessages.find(m => m.id === normalized.id)) return currentMessages;
        return [normalized, ...currentMessages];
      }, false);
    };

    socket.on("banter:new", handleNewBanter);

    return () => {
      socket.off("banter:new", handleNewBanter);
    };
  }, [pitchId, mutate]);

  return useSWR(pitchId ? ["banter", pitchId] : null, ([, id]) => getBanter(id), {
    revalidateOnFocus: true,
  });
}

export function useLobbies() {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    const socket = getSocket();
    
    const handleLobbyUpdate = () => {
      // Re-fetch the lobbies list from the server to get fresh data
      mutate("lobbies");
    };

    socket.on("lobby:updated", handleLobbyUpdate);

    return () => {
      socket.off("lobby:updated", handleLobbyUpdate);
    };
  }, [mutate]);

  return useSWR("lobbies", getLobbies, { revalidateOnFocus: true });
}
