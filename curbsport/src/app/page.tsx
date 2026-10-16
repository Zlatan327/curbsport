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
          <p className="eyebrow"><span className="eyebrow-mark" /> CAMPUS RADAR</p>
          <h1>CAMPUS GROUND RADAR</h1>
          <p className="feed-intro">Live pickup football pitches and basketball courts across {schoolName}.</p>
        </div>
        <div className="feed-ticker">
          <div className="feed-ticker__status">
            <span className="feed-ticker__dot" />
            <span>{liveCount > 0 ? `${liveCount} games live right now` : "Checking campus grounds"}</span>
          </div>
          <button
            type="button"
            className="feed-ticker__btn"
            onClick={() => setShowHowToUse(true)}
            aria-label="How pickup works"
          >
            <HelpCircle size={13} /> How to play
          </button>
        </div>
      </section>

      <Link href="/map" className="map-teaser">
        <MapPlaceholder pitches={pitches} />
        <div className="map-teaser__copy">
          <span className="eyebrow">CAMPUS OVERVIEW</span>
          <strong>Explore map & nearby spots</strong>
          <span className="map-teaser__link">Open map</span>
        </div>
      </Link>

      {error && (
        <Notice tone="warning" className="offline-notice">
          <strong>API OFFLINE / PREVIEW MODE</strong>
          <span>Showing sample grounds. Check the backend connection before sharing live data.</span>
          <button type="button" onClick={() => void mutate()} aria-label="Retry API connection">
            <RefreshCw size={14} /> Retry
          </button>
        </Notice>
      )}

      <section className="feed-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{schoolName.toUpperCase()} GROUNDS</p>
            <h2>ACTIVE GROUNDS<span className="section-heading__count">{visiblePitches.length}</span></h2>
          </div>
          <Link href="/add" className="text-link">Add ground</Link>
        </div>

        {/* Sport Noise Filter Segmented Control */}
        <div className="sport-filter-bar" role="tablist" aria-label="Filter by sport">
          <button
            type="button"
            role="tab"
            aria-selected={sportFilter === "FOOTBALL"}
            className={`sport-filter-btn${sportFilter === "FOOTBALL" ? " is-active-football" : ""}`}
            onClick={() => setSportFilter("FOOTBALL")}
          >
            ⚽ Football
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sportFilter === "BASKETBALL"}
            className={`sport-filter-btn${sportFilter === "BASKETBALL" ? " is-active-basketball" : ""}`}
            onClick={() => setSportFilter("BASKETBALL")}
          >
            🏀 Basketball
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sportFilter === "ALL"}
            className={`sport-filter-btn${sportFilter === "ALL" ? " is-active-all" : ""}`}
            onClick={() => setSportFilter("ALL")}
          >
            All grounds
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
