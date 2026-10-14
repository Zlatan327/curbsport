import type { Metadata } from "next";
import { AddPinPage } from "@/components/add-pin-page";

export const metadata: Metadata = {
  title: "Drop a Pin · Register a Ground",
  description: "Add a community-discovered football pitch or basketball court to the Curbsport campus ground radar.",
  robots: { index: false, follow: false },
};

export default function AddGroundPage() {
  return <AddPinPage />;
}
