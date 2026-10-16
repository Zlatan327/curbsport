"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, type ReactNode } from "react";
import { Check, CircleDashed, Crown, MapPin, Users } from "lucide-react";
import type { PitchStatus, Sport } from "@/lib/types";

export function BallIcon({ size = 14, sport = "football" }: { size?: number; sport?: "football" | "basketball" }) {
  if (sport === "basketball") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2.5 12h19M12 2.5v19" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4.8 5.2c4.4 2.4 7.2 6.8 7.2 6.8s-2.8 4.4-7.2 6.8M19.2 5.2c-4.4 2.4-7.2 6.8-7.2 6.8s2.8 4.4 7.2 6.8" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" /><path d="m9.8 8.1 4.4 0 1.4 4.3-3.6 2.7-3.6-2.7 1.4-4.3ZM9.8 8.1 7 5.9m7.2 2.2 2.8-2.2M8.4 12.4l-5.1.3m8.7 2.4-.2 5.8m3.8-8.5 5.1.3m-5.1-4.6 1.7 2.2m-6.5-2.2-1.7 2.2" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function PlayerAvatar({
  player,
  size = "regular",
}: {
  player: { alias: string; avatarUrl?: string | null; avatarColor?: string };
  size?: "small" | "regular" | "large";
}) {
  const [loadFailed, setLoadFailed] = useState(false);
  const sizeClass = size === "small" ? "is-small" : size === "large" ? "is-large" : "";

  if (player.avatarUrl && !loadFailed) {
    return (
      <span
        className={`avatar ${sizeClass}`}
        style={{ overflow: "hidden", padding: 0 }}
        aria-label={player.alias}
        title={player.alias}
      >
        <img
          src={player.avatarUrl}
          alt={player.alias}
          onError={() => setLoadFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
        />
      </span>
    );
  }
  const color = player.avatarColor || "#264453";
  const initials = player.alias
    .split(/[ .-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={`avatar ${sizeClass}`}
      style={{ background: `linear-gradient(140deg, ${color}, #101310 88%)` }}
      aria-label={player.alias}
      title={player.alias}
    >
      {initials}
    </span>
  );
}

export function StatusPill({ status, label }: { status: PitchStatus; label?: string }) {
  const text = label ?? (status === "live" ? "Live ball" : status === "building" ? "Building" : "Quiet");
  return <span className={`status-pill is-${status}`}><span className="filter-dot" />{text}</span>;
}

export function DemoIndicator() {
  return null;
}

export function GroundFacts({ pitch }: { pitch: { surface: string; floodlights: boolean; liveCount: number; ballPresent: boolean; sport?: Sport } }) {
  const isBasketball = pitch.sport === "basketball";
  return <div className="selected-ground-facts">
    <span className="fact-chip"><MapPin size={12} aria-hidden="true" />{pitch.surface}</span>
    <span className="fact-chip"><Users size={12} aria-hidden="true" />{pitch.liveCount} on ground</span>
    {pitch.floodlights && <span className="fact-chip">◌ Floodlights</span>}
    <span className="fact-chip">{pitch.ballPresent ? <Check size={12} aria-hidden="true" /> : <CircleDashed size={12} aria-hidden="true" />}{pitch.ballPresent ? (isBasketball ? "Ball on court" : "Ball dey ground") : (isBasketball ? "Ball not confirmed" : "Ball unconfirmed")}</span>
  </div>;
}

export function KingTag() {
  return <span className="status-pill is-building"><Crown size={12} aria-hidden="true" />KING ACTIVE</span>;
}

export function SectionHeading({ title, trailing }: { title: string; trailing?: ReactNode }) {
  return <div className="panel-head"><h2>{title}</h2>{trailing}</div>;
}
