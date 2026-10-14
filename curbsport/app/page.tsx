import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Live Campus Ground Radar",
  description: "Find pickup football and basketball happening across Nigerian campuses. Check the pitch, ball status, open sets and ground king.",
  openGraph: { type: "website", title: "Live Campus Ground Radar · Curbsport", description: "Find the game. Check the ground. Pull up." },
};

export default function HomePage() {
  return <Dashboard />;
}
