"use client";

import { useCallback, useEffect, useState } from "react";
import { CITY_ID_KEY, DEFAULT_CITY_ID } from "@/lib/api";

const EVENT_NAME = "inside-life-city-change";

export function useCityId() {
  const [cityId, setCityIdState] = useState(DEFAULT_CITY_ID);

  useEffect(() => {
    const saved = window.localStorage.getItem(CITY_ID_KEY);
    if (saved) setCityIdState(saved);
    const sync = () => setCityIdState(window.localStorage.getItem(CITY_ID_KEY) || DEFAULT_CITY_ID);
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setCityId = useCallback((value: string) => {
    const next = value.trim() || DEFAULT_CITY_ID;
    window.localStorage.setItem(CITY_ID_KEY, next);
    setCityIdState(next);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return { cityId, setCityId };
}
