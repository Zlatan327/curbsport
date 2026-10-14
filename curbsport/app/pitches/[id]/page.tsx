import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PitchDetail } from "@/components/pitch-detail";
import { demoPitches } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return demoPitches.map((pitch) => ({ id: pitch.id }));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const pitch = demoPitches.find((item) => item.id === params.id);
  if (!pitch) return { title: "Ground not found", robots: { index: false, follow: false } };
  return {
    title: `${pitch.name} · ${pitch.campusId} Ground HQ`,
    description: `${pitch.surface} at ${pitch.landmark}. Check ball status, open sets, ground conditions and the current King of the Ground.`,
    openGraph: { type: "website", title: `${pitch.name} · Curbsport Ground HQ`, description: `Live pitch status, sets and King of the Ground at ${pitch.campusId}.` },
  };
}

export default async function PitchPage({ params }: { params: { id: string } }) {
  const pitch = demoPitches.find((item) => item.id === params.id);
  if (!pitch) notFound();
  return <PitchDetail pitch={pitch} />;
}
