"use client";

import Link from "next/link";
import { ArrowUpRight, MapPin, RefreshCw } from "lucide-react";
import { AppFrame } from "@/components/app-frame";
import { MapPlaceholder } from "@/components/map-placeholder";
import { Notice } from "@/components/notice";
import { EmptyState, LoadingState } from "@/components/page-state";
import { DEMO_PITCHES } from "@/lib/demo";
import { useSchoolId } from "@/hooks/use-school-id";
import { usePitches } from "@/hooks/use-data";

export default function MapPage() {
  const { schoolId, schoolName } = useSchoolId();
  const { data, error, isLoading, mutate } = usePitches(schoolId);
  const pitches = data ?? (error ? DEMO_PITCHES : []);
  
  return (
    <AppFrame>
      <section className="page-intro page-intro--map">
        <p className="eyebrow">{schoolName.toUpperCase()}</p>
        <h1>WHERE WE<br /><em>PLAY.</em></h1>
        <p>Find the ground. Check the status. Call your people.</p>
      </section>
      
      <div className="map-page-map">
        <MapPlaceholder pitches={pitches} large />
        <span className="map-page-tag"><MapPin size={13} /> {pitches.length} GROUNDS / {schoolName.toUpperCase()}</span>
      </div>
      
      <Notice tone="info" className="map-disclaimer">This is an original map-style preview; the supplied API has no map tiles or coordinates. Connect a map provider to position pitches accurately.</Notice>
      {error && <Notice tone="warning" className="offline-notice"><strong>PREVIEW DATA</strong><span>Backend is unreachable. Sample pins are not real locations.</span><button type="button" onClick={() => void mutate()}><RefreshCw size={14} /> RETRY</button></Notice>}
      
      <section className="map-pitch-list"><div className="section-heading"><div><p className="eyebrow">CLOSE TO YOUR SIDE</p><h2>GROUNDS <span className="section-heading__count">{pitches.length.toString().padStart(2, "0")}</span></h2></div></div>
        {isLoading && !data && <LoadingState label="Finding local grounds..." />}
        {!isLoading && pitches.length === 0 && <EmptyState title="No pins around here yet.">Head to Add and put your ground on the map.</EmptyState>}
        {pitches.map((pitch, index) => <Link className="map-list-row" href={`/pitches/${encodeURIComponent(pitch.id)}`} key={pitch.id}><span className="map-list-row__index">{String(index + 1).padStart(2, "0")}</span><span className="map-list-row__body"><strong>{pitch.name}</strong><small>{pitch.area || pitch.address || "Campus"}</small></span><ArrowUpRight size={17} /></Link>)}
      </section>
    </AppFrame>
  );
}
