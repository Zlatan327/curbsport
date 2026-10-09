"use client";

import { useEffect, type ReactNode } from "react";
import { SWRConfig } from "swr";
import { useAuthStore } from "@/store/auth";
import { PwaInstallBanner } from "@/components/pwa-install-banner";

export function AppProviders({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <SWRConfig value={{ revalidateOnFocus: false, shouldRetryOnError: false }}>
      {children}
      <PwaInstallBanner />
    </SWRConfig>
  );
}
