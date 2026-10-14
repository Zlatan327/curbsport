import type { ReactNode } from "react";
import { Check, CircleDashed, Crown, MapPin, Users } from "lucide-react";
import type { PitchStatus, Player } from "@/lib/types";

export function BallIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" /><path d="m9.8 8.1 4.4 0 1.4 4.3-3.6 2.7-3.6-2.7 1.4-4.3ZM9.8 8.1 7 5.9m7.2 2.2 2.8-2.2M8.4 12.4l-5.1.3m8.7 2.4-.2 5.8m3.8-8.5 5.1.3m-5.1-4.6 1.7 2.2m-6.5-2.2-1.7 2.2" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function PlayerAvatar({ player, size = "regular" }: { player: Player; size?: "small" | "regular" | "large" }) {
  const initials = player.alias.split(/[ .-]/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <span className={`avatar ${size === "small" ? "is-small" : size === "large" ? "is-large" : ""}`} style={{ background: `linear-gradient(140deg, ${player.avatarColor}, #101310 88%)` }} aria-label={player.alias} title={player.alias}>{initials}</span>;
}

export function StatusPill({ status, label }: { status: PitchStatus; label?: string }) {
  const text = label ?? (status === "live" ? "Live ball" : status === "building" ? "Building" : "Quiet");
  return <span className={`status-pill is-${status}`}><span className="filter-dot" />{text}</span>;
}

export function DemoIndicator({ compact = false }: { compact?: boolean }) {
  return <span className="demo-indicator" title="Illustrative sample activity, not verified live campus data"><CircleDashed size={13} aria-hidden="true" />{compact ? "DEMO DATA" : "DEMO DATA · SAMPLE ACTIVITY"}</span>;
}

export function GroundFacts({ pitch }: { pitch: { surface: string; floodlights: boolean; liveCount: number; ballPresent: boolean } }) {
  return <div className="selected-ground-facts">
    <span className="fact-chip"><MapPin size={12} aria-hidden="true" />{pitch.surface}</span>
    <span className="fact-chip"><Users size={12} aria-hidden="true" />{pitch.liveCount} on ground</span>
    {pitch.floodlights && <span className="fact-chip">◌ Floodlights</span>}
    <span className="fact-chip">{pitch.ballPresent ? <Check size={12} aria-hidden="true" /> : <CircleDashed size={12} aria-hidden="true" />}{pitch.ballPresent ? "Ball dey ground" : "Ball unconfirmed"}</span>
  </div>;
}

export function KingTag() {
  return <span className="status-pill is-building"><Crown size={12} aria-hidden="true" />KING ACTIVE</span>;
}

export function SectionHeading({ title, trailing }: { title: string; trailing?: ReactNode }) {
  return <div className="panel-head"><h2>{title}</h2>{trailing}</div>;
}
