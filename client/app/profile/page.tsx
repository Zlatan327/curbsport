import type { Metadata } from "next";
import { ProfilePage } from "@/components/profile-page";

export const metadata: Metadata = {
  title: "Player Locker Room",
  description: "Player reputation, peer-verified match history and private biometrics locker room on Curbsport.",
  robots: { index: false, follow: false },
};

export default function LockerPage() {
  return <ProfilePage />;
}
