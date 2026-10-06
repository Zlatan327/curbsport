"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, RefreshCw, Search, Sparkles } from "lucide-react";
import { AppFrame } from "@/components/app-frame";
import { MapPlaceholder } from "@/components/map-placeholder";
import { Notice } from "@/components/notice";
import { EmptyState, LoadingState } from "@/components/page-state";
import { PitchCard } from "@/components/pitch-card";
import { DEMO_PITCHES } from "@/lib/demo";
import { useSchoolId } from "@/hooks/use-school-id";
import { usePitches } from "@/hooks/use-data";

export default function FeedPage() {
  const { schoolId, schoolName } = useSchoolId();
  const { data, error, isLoading, mutate } = usePitches(schoolId);
  const [query, setQuery] = useState("");
  const pitches = useMemo(() => data ?? (error ? DEMO_PITCHES : []), [data, error]);
  const visiblePitches = useMemo(() => pitches.filter((pitch) => `${pitch.name} ${pitch.address || ""} ${pitch.area || ""}`.toLowerCase().includes(query.toLowerCase())), [pitches, query]);
  const liveCount = pitches.filter((pitch) => pitch.activeStatus.toUpperCase() === "LIVE").length;

  return (
    <AppFrame>
      <section className="feed-masthead">
        <div className="feed-masthead__headline">
          <p className="eyebrow"><span className="eyebrow-mark" /> STREET FOOTBALL / ANAMBRA</p>
          <h1>FIND<br /><em>YOUR</em> GROUND.</h1>
          <p className="feed-intro">Real pitches. Real sets. Right around you.</p>
        </div>
        <div className="feed-stamp"><span>NO.</span><strong>01</strong><small>LOCAL<br />GAME</small></div>
        <div className="feed-masthead__rule"><span>THE GROUND CHECK</span><span>{liveCount.toString().padStart(2, "0")} LIVE RIGHT NOW</span></div>
      </section>

      <Link href="/map" className="map-teaser">
        <MapPlaceholder pitches={pitches} />
        <div className="map-teaser__copy"><span className="eyebrow">PITCHES ON THE MAP</span><strong>See what&apos;s close</strong><span className="map-teaser__link">OPEN MAP <ArrowUpRight size={15} /></span></div>
      </Link>

      {error && <Notice tone="warning" className="offline-notice"><strong>API OFFLINE / PREVIEW MODE</strong><span>Showing sample grounds. Check the backend URL, CORS, and campus ID before sharing live data.</span><button type="button" onClick={() => void mutate()} aria-label="Retry API connection"><RefreshCw size={14} /> RETRY</button></Notice>}

      <section className="feed-section">
        <div className="section-heading"><div><p className="eyebrow">GROUND REPORT / {schoolName.toUpperCase()}</p><h2>THE PITCH LIST<span className="section-heading__count">{pitches.length.toString().padStart(2, "0")}</span></h2></div><Link href="/add" className="text-link">DROP A PIN <ArrowUpRight size={15} /></Link></div>
        <label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your side..." aria-label="Search pitches" /></label>
        {isLoading && !data && <div className="feed-loading"><LoadingState label="Checking the ground..." /><div className="skeleton-card" /><div className="skeleton-card" /></div>}
        {!isLoading && visiblePitches.length === 0 && <EmptyState title={query ? "No ground by that name." : "No pitches logged yet."}>{query ? "Try another name or area." : "Be the first to drop a pin in your area."}</EmptyState>}
        <div className="pitch-list">{visiblePitches.map((pitch) => <PitchCard key={pitch.id} pitch={pitch} />)}</div>
      </section>

      <div className="feed-footer-note"><Sparkles size={15} /><span>Every ground starts with somebody putting their people on.</span><MapPin size={15} /></div>
    </AppFrame>
  );
}
