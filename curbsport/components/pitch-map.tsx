"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronRight, Clock3, MapPin, Sun, X } from "lucide-react";
import type { Pitch } from "@/lib/types";
import { BallIcon, StatusPill } from "@/components/ui";
import { useAppStore } from "@/store/app-store";

interface Props {
  pitches: Pitch[];
  campusLabel: string;
}

const labelOffsets = [
  { left: "15%", top: "47%", text: "NORTH WALK" },
  { left: "62%", top: "22%", text: "SPORTS COMPLEX" },
  { left: "45%", top: "80%", text: "STUDENT CENTRE" },
];

export function PitchMap({ pitches, campusLabel }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const selectedId = useAppStore((state) => state.selectedPitchId);
  const setSelectedPitchId = useAppStore((state) => state.setSelectedPitchId);
  const selected = pitches.find((pitch) => pitch.id === selectedId) ?? pitches[0] ?? null;
  const nextOpenSet = selected?.sets.find((set) => set.spotsOpen > 0);
  const selectPitch = (pitch: Pitch) => {
    setSelectedPitchId(pitch.id);
    if (window.matchMedia("(max-width: 1023px)").matches) setSheetOpen(true);
  };

  return <>
    <div className="map-header"><h2>Ground radar</h2><span className="map-live-count"><span className="live-kicker-dot" />{pitches.filter((pitch) => pitch.status === "live").length} active</span></div>
    <div className="map-surface" role="group" aria-label={`${campusLabel} schematic ground radar`}>
      <span className="map-grid-label north">N</span><span className="map-grid-label east">{campusLabel} · RADAR</span>
      <div className="map-legend" aria-label="Map status legend"><span className="map-legend-item"><i className="map-legend-dot" />Live</span><span className="map-legend-item"><i className="map-legend-dot is-pending" />Building</span></div>
      <svg className="map-route" viewBox="0 0 500 440" role="img" aria-label="Illustrative campus paths and ground locations, not to scale">
        <path className="map-campus-road" d="M22 311 C128 268 120 162 227 152 S359 173 470 73" /><path className="map-campus-road" d="M65 30 C111 107 164 173 220 226 S328 333 429 405" />
        <path className="map-campus-path" d="M22 311 C128 268 120 162 227 152 S359 173 470 73" /><path className="map-campus-path" d="M65 30 C111 107 164 173 220 226 S328 333 429 405" />
        <path className="map-campus-path" d="M65 30 C210 87 305 94 470 73" /><path className="map-campus-path" d="M22 311 C154 354 293 358 429 405" />
        <rect x="186" y="174" width="111" height="63" rx="3" fill="rgba(0,255,102,.025)" stroke="rgba(0,255,102,.18)" strokeDasharray="4 6" />
        <path d="M197 205h89M241 184v43M186 190h13v29h-13M284 190h13v29h-13" fill="none" stroke="rgba(240,240,232,.14)" strokeWidth="1" /><circle cx="242" cy="205" r="7" fill="none" stroke="rgba(240,240,232,.14)" />
        <path d="M93 101h58M93 101v36M386 272h57M443 272v36M112 371h57M112 371v-33" fill="none" stroke="rgba(240,240,232,.08)" strokeWidth="3" />
      </svg>
      {labelOffsets.map((label) => <span key={label.text} className="map-maplabel" style={{ left: label.left, top: label.top }}>{label.text}</span>)}
      {pitches.map((pitch) => <button className={`map-pin is-${pitch.status} ${selected?.id === pitch.id ? "is-selected" : ""}`} type="button" key={pitch.id} style={{ left: `${pitch.coordinates.x}%`, top: `${pitch.coordinates.y}%` }} onClick={() => selectPitch(pitch)} title={`${pitch.name} · ${pitch.status}`} aria-label={`Select ${pitch.name}, ${pitch.status}, ${pitch.liveCount} players on ground`} aria-pressed={selected?.id === pitch.id}><span className="map-pin-ring" /><span className="map-pin-dot" /></button>)}
      <div className="map-scale"><span />SCHEMATIC · NOT TO SCALE</div>
    </div>
    <p className="map-note"><MapPin size={13} aria-hidden="true" />Illustrative campus radar. Pin placement is approximate until ground coordinates are verified.</p>
    {selected && <div className="selected-ground-card desktop-ground-card">
      <div className="selected-ground-header"><div><h3>{selected.name}</h3><p>{selected.landmark}</p></div><StatusPill status={selected.status} /></div>
      <div className="selected-ground-facts"><span className="fact-chip"><MapPin size={12} />{selected.surface}</span><span className="fact-chip"><span className="live-kicker-dot" />{selected.liveCount} here now</span><span className="fact-chip">{selected.floodlights ? <Sun size={12} /> : <Clock3 size={12} />}{selected.floodlights ? "Floodlights" : "Daylight"}</span><span className="fact-chip">{selected.ballPresent ? <Check size={12} /> : <BallIcon size={12} />}{selected.ballPresent ? `Ball dey · ${selected.ballBroughtBy ?? "confirmed"}` : "Ball unconfirmed"}</span></div>
      <div className="beacon-row"><div className="beacon-copy"><span className="live-kicker-dot" />{selected.condition}</div><Link className="text-action" href={`/pitches/${selected.id}`}>Ground HQ <ArrowUpRight size={14} /></Link></div>
    </div>}
    {sheetOpen && selected && <div className="mobile-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSheetOpen(false); }}>
      <section className="mobile-ground-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-ground-title"><div className="sheet-handle" />
        <div className="selected-ground-header"><div><StatusPill status={selected.status} /><h3 id="mobile-ground-title" style={{ marginTop: 8 }}>{selected.name}</h3><p>{selected.landmark}</p></div><button type="button" className="sheet-close" onClick={() => setSheetOpen(false)} aria-label="Close ground details"><X size={17} /></button></div>
        <div style={{ marginTop: 14 }} className="selected-ground-facts"><span className="fact-chip"><MapPin size={12} />{selected.surface}</span><span className="fact-chip"><span className="live-kicker-dot" />{selected.liveCount} here now</span><span className="fact-chip">{selected.ballPresent ? "Ball dey ground" : "Ball unconfirmed"}</span></div>
        <p className="soft-copy" style={{ margin: "13px 0" }}>{selected.condition} · {nextOpenSet ? `${nextOpenSet.title} · ${nextOpenSet.spotsOpen} spots open` : selected.sets.length ? "All sets are full" : "No open set yet"}</p><Link className="primary-button" href={`/pitches/${selected.id}`} onClick={() => setSheetOpen(false)}>Open Ground HQ <ChevronRight size={15} /></Link>
      </section>
    </div>}
  </>;
}
