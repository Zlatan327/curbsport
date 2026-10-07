"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, HelpCircle, MapPin, RefreshCw, Search, Sparkles } from "lucide-react";
import { AppFrame } from "@/components/app-frame";
import { MapPlaceholder } from "@/components/map-placeholder";
import { Notice } from "@/components/notice";
import { EmptyState, LoadingState } from "@/components/page-state";
import { PitchCard } from "@/components/pitch-card";
import { HowToUseModal } from "@/components/how-to-use-modal";
import { DEMO_PITCHES } from "@/lib/demo";
import { useSchoolId } from "@/hooks/use-school-id";
import { usePitches } from "@/hooks/use-data";
import { useAuthStore } from "@/store/auth";

type FilterSport = "ALL" | "FOOTBALL" | "BASKETBALL";

export default function FeedPage() {
  const { user } = useAuthStore();
  const { schoolId, schoolName } = useSchoolId();
  const { data, error, isLoading, mutate } = usePitches(schoolId);
  const [query, setQuery] = useState("");
  const [showHowToUse, setShowHowToUse] = useState(false);

  // Default to player's primary sport preference so there is zero noise
  const [sportFilter, setSportFilter] = useState<FilterSport>("FOOTBALL");

  useEffect(() => {
    if (user?.primarySport) {
      setSportFilter(user.primarySport as FilterSport);
    }
  }, [user?.primarySport]);

  const pitches = useMemo(() => data ?? (error ? DEMO_PITCHES : []), [data, error]);

  const visiblePitches = useMemo(() => {
    return pitches.filter((pitch) => {
      // 1. Sport Noise Filter
      if (sportFilter === "FOOTBALL") {
        const isBball = pitch.sportType === "BASKETBALL" || pitch.name.toLowerCase().includes("court");
        if (isBball) return false;
      } else if (sportFilter === "BASKETBALL") {
        const isBball = pitch.sportType === "BASKETBALL" || pitch.name.toLowerCase().includes("court");
        if (!isBball) return false;
      }

      // 2. Search query filter
      return `${pitch.name} ${pitch.address || ""} ${pitch.area || ""}`.toLowerCase().includes(query.toLowerCase());
    });
  }, [pitches, query, sportFilter]);

  const liveCount = pitches.filter((pitch) => pitch.activeStatus.toUpperCase() === "LIVE").length;

  return (
    <AppFrame>
      <section className="feed-masthead">
        <div className="feed-masthead__headline">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p className="eyebrow"><span className="eyebrow-mark" /> CAMPUS GROUND MAP</p>
            <button
              type="button"
              onClick={() => setShowHowToUse(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "#1c281e",
                border: "1px solid #00f076",
                color: "#00f076",
                borderRadius: "20px",
                padding: "3px 10px",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <HelpCircle size={13} /> HOW TO PLAY
            </button>
          </div>
          <h1>FIND<br /><em>YOUR</em> GROUND.</h1>
          <p className="feed-intro">Real pitches. Real sets. Right around {schoolName}.</p>
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
        <div className="section-heading">
          <div>
            <p className="eyebrow">GROUND REPORT / {schoolName.toUpperCase()}</p>
            <h2>THE PITCH LIST<span className="section-heading__count">{visiblePitches.length.toString().padStart(2, "0")}</span></h2>
          </div>
          <Link href="/add" className="text-link">DROP A PIN <ArrowUpRight size={15} /></Link>
        </div>

        {/* Sport Noise Filter Pills */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <button
            type="button"
            onClick={() => setSportFilter("FOOTBALL")}
            style={{
              flex: 1,
              padding: "7px 12px",
              borderRadius: "20px",
              border: sportFilter === "FOOTBALL" ? "1px solid #00f076" : "1px solid #333",
              background: sportFilter === "FOOTBALL" ? "#00381b" : "#141414",
              color: sportFilter === "FOOTBALL" ? "#00f076" : "#aaa",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ⚽ Football
          </button>
          <button
            type="button"
            onClick={() => setSportFilter("BASKETBALL")}
            style={{
              flex: 1,
              padding: "7px 12px",
              borderRadius: "20px",
              border: sportFilter === "BASKETBALL" ? "1px solid #00f076" : "1px solid #333",
              background: sportFilter === "BASKETBALL" ? "#00381b" : "#141414",
              color: sportFilter === "BASKETBALL" ? "#00f076" : "#aaa",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🏀 Basketball
          </button>
          <button
            type="button"
            onClick={() => setSportFilter("ALL")}
            style={{
              padding: "7px 14px",
              borderRadius: "20px",
              border: sportFilter === "ALL" ? "1px solid #00f076" : "1px solid #333",
              background: sportFilter === "ALL" ? "#00381b" : "#141414",
              color: sportFilter === "ALL" ? "#00f076" : "#aaa",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🔥 Both
          </button>
        </div>

        <label className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={sportFilter === "BASKETBALL" ? "Search basketball courts..." : "Search pitches and fields..."}
            aria-label="Search pitches"
          />
        </label>

        {isLoading && !data && <div className="feed-loading"><LoadingState label="Checking the ground..." /><div className="skeleton-card" /><div className="skeleton-card" /></div>}
        {!isLoading && visiblePitches.length === 0 && (
          <EmptyState title={query ? "No ground by that name." : `No ${sportFilter.toLowerCase()} grounds logged yet.`}>
            {query ? "Try another name or area." : "Be the first to drop a pin on this campus!"}
          </EmptyState>
        )}
        <div className="pitch-list">{visiblePitches.map((pitch) => <PitchCard key={pitch.id} pitch={pitch} />)}</div>
      </section>

      <div className="feed-footer-note"><Sparkles size={15} /><span>Every ground starts with somebody putting their people on.</span><MapPin size={15} /></div>

      <HowToUseModal isOpen={showHowToUse} onClose={() => setShowHowToUse(false)} />
    </AppFrame>
  );
}
