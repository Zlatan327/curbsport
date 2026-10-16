"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Flame, HelpCircle, MapPin, RefreshCw, Search, Sparkles, Trophy } from "lucide-react";
import { AppFrame } from "@/components/app-frame";
import { MapPlaceholder } from "@/components/map-placeholder";
import { Notice } from "@/components/notice";
import { EmptyState, LoadingState } from "@/components/page-state";
import { PitchCard } from "@/components/pitch-card";
import { HowToUseModal } from "@/components/how-to-use-modal";
import { DEMO_PITCHES } from "@/lib/demo";
import { useSchoolId, CAMPUS_LIST } from "@/hooks/use-school-id";
import { usePitches } from "@/hooks/use-data";
import { useAuthStore } from "@/store/auth";

type FilterSport = "ALL" | "FOOTBALL" | "BASKETBALL";
type FilterStatus = "ALL" | "ACTIVE_NOW" | "HAS_BALL";

export default function FeedPage() {
  const { user } = useAuthStore();
  const { schoolId, schoolName, shortName, updateSchoolId, campuses } = useSchoolId();
  const { data, error, isLoading, mutate } = usePitches(schoolId);
  const [query, setQuery] = useState("");
  const [showHowToUse, setShowHowToUse] = useState(false);

  // Default to ALL so the user immediately sees all grounds on their campus with zero cold-start emptiness
  const [sportFilter, setSportFilter] = useState<FilterSport>("ALL");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");

  const pitches = useMemo(() => data ?? (error ? DEMO_PITCHES : []), [data, error]);

  const visiblePitches = useMemo(() => {
    return pitches.filter((pitch) => {
      // 1. Sport Filter
      const isBball = pitch.sportType === "BASKETBALL" || pitch.name.toLowerCase().includes("court") || pitch.name.toLowerCase().includes("hoop");
      if (sportFilter === "FOOTBALL" && isBball) return false;
      if (sportFilter === "BASKETBALL" && !isBball) return false;

      // 2. Status Filter
      if (statusFilter === "ACTIVE_NOW") {
        const s = (pitch.activeStatus || "").toUpperCase();
        if (s !== "LIVE" && s !== "BUILDING") return false;
      } else if (statusFilter === "HAS_BALL") {
        if (!pitch.hasBallNow) return false;
      }

      // 3. Search query filter
      const text = `${pitch.name} ${pitch.address || ""} ${pitch.area || ""} ${pitch.landmarkDescription || ""}`.toLowerCase();
      return text.includes(query.toLowerCase());
    });
  }, [pitches, query, sportFilter, statusFilter]);

  const liveCount = pitches.filter((pitch) => pitch.activeStatus.toUpperCase() === "LIVE").length;
  const buildingCount = pitches.filter((pitch) => pitch.activeStatus.toUpperCase() === "BUILDING").length;
  const withBallCount = pitches.filter((pitch) => pitch.hasBallNow).length;

  const topCampuses = [
    { id: 6, label: "UNIZIK (Awka)", count: 9 },
    { id: 9, label: "UNILAG (Akoka)", count: 18 },
    { id: 12, label: "UI (Ibadan)", count: 19 },
    { id: 13, label: "OAU (Ife)", count: 13 },
    { id: 11, label: "UNN (Nsukka)", count: 7 },
  ];

  return (
    <AppFrame>
      <section className="feed-masthead">
        <div className="feed-masthead__headline">
          <p className="eyebrow"><span className="eyebrow-mark" /> CAMPUS GROUND RADAR</p>
          <h1>CAMPUS RADAR</h1>
          <p className="feed-intro">
            Live pickup football pitches and basketball courts across <strong>{schoolName}</strong>.
          </p>
        </div>

        {/* Quick Multi-Campus Bar */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center", overflowX: "auto", padding: "6px 0", scrollbarWidth: "none" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#888", textTransform: "uppercase", whiteSpace: "nowrap", marginRight: "4px" }}>
            Campus:
          </span>
          {topCampuses.map((c) => {
            const isActive = String(c.id) === String(schoolId);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => updateSchoolId(String(c.id))}
                style={{
                  padding: "4px 9px",
                  borderRadius: "9999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  border: isActive ? "1px solid var(--turf)" : "1px solid rgba(255,255,255,0.1)",
                  background: isActive ? "rgba(0, 255, 102, 0.15)" : "#131814",
                  color: isActive ? "var(--turf)" : "#bbb",
                  transition: "all .15s ease",
                }}
              >
                {c.label.split(" ")[0]} ({c.count})
              </button>
            );
          })}
        </div>

        <div className="feed-ticker">
          <div className="feed-ticker__status">
            <span className="feed-ticker__dot" />
            <span>
              {liveCount > 0
                ? `${liveCount} matches LIVE right now on ${shortName}!`
                : buildingCount > 0
                ? `${buildingCount} sets gathering right now • Pull up!`
                : withBallCount > 0
                ? `${withBallCount} grounds have equipment confirmed on ground`
                : `${pitches.length} grounds ready for pickup across ${shortName}`}
            </span>
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
          <span className="eyebrow">{shortName.toUpperCase()} MAP</span>
          <strong>Explore map & nearby spots ({pitches.length} grounds)</strong>
          <span className="map-teaser__link">Open map</span>
        </div>
      </Link>

      {error && (
        <Notice tone="warning" className="offline-notice">
          <strong>CONNECTING TO CAMPUS NETWORK</strong>
          <span>Showing cached verified grounds while live sync connects.</span>
          <button type="button" onClick={() => void mutate()} aria-label="Retry API connection">
            <RefreshCw size={14} /> Retry
          </button>
        </Notice>
      )}

      <section className="feed-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{schoolName.toUpperCase()}</p>
            <h2>ACTIVE GROUNDS<span className="section-heading__count">{visiblePitches.length}</span></h2>
          </div>
          <Link href="/add" className="text-link">+ Add spot</Link>
        </div>

        <div className="feed-controls-row">
          {/* Sport Filter Segmented Control */}
          <div className="sport-filter-bar" role="tablist" aria-label="Filter by sport">
            <button
              type="button"
              role="tab"
              aria-selected={sportFilter === "ALL"}
              className={`sport-filter-btn${sportFilter === "ALL" ? " is-active-all" : ""}`}
              onClick={() => setSportFilter("ALL")}
            >
              All grounds ({pitches.length})
            </button>
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
          </div>

          <label className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={sportFilter === "BASKETBALL" ? "Search courts & hoops..." : "Search pitches, fields, hostels..."}
              aria-label="Search pitches"
            />
          </label>
        </div>

        {/* Status Quick Filter Chips */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "16px", overflowX: "auto", scrollbarWidth: "none" }}>
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              border: statusFilter === "ALL" ? "1px solid #00f076" : "1px solid #333",
              background: statusFilter === "ALL" ? "rgba(0, 240, 118, 0.12)" : "transparent",
              color: statusFilter === "ALL" ? "#00f076" : "#888",
            }}
          >
            All statuses
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "ACTIVE_NOW" ? "ALL" : "ACTIVE_NOW")}
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              border: statusFilter === "ACTIVE_NOW" ? "1px solid #eab308" : "1px solid #333",
              background: statusFilter === "ACTIVE_NOW" ? "rgba(234, 179, 8, 0.15)" : "transparent",
              color: statusFilter === "ACTIVE_NOW" ? "#facc15" : "#888",
            }}
          >
            ⚡ Live / Gathering now {liveCount + buildingCount > 0 ? `(${liveCount + buildingCount})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "HAS_BALL" ? "ALL" : "HAS_BALL")}
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              border: statusFilter === "HAS_BALL" ? "1px solid #00f076" : "1px solid #333",
              background: statusFilter === "HAS_BALL" ? "rgba(0, 240, 118, 0.15)" : "transparent",
              color: statusFilter === "HAS_BALL" ? "#00f076" : "#888",
            }}
          >
            ⚽ Ball on Ground {withBallCount > 0 ? `(${withBallCount})` : ""}
          </button>
        </div>

        {isLoading && !data && (
          <div className="feed-loading">
            <LoadingState label={`Scanning ${schoolName} ground network…`} />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        )}

        {!isLoading && visiblePitches.length === 0 && (
          <div style={{ padding: "32px 16px", textAlign: "center", background: "#111412", border: "1px solid #222", borderRadius: "10px", margin: "10px 0" }}>
            <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>
              {query
                ? `No grounds found matching &ldquo;${query}&rdquo;`
                : statusFilter !== "ALL"
                ? "No grounds currently matching that live status."
                : `No ${sportFilter.toLowerCase()} grounds on ${shortName} yet.`}
            </p>
            <p style={{ margin: "8px 0 16px", fontSize: "0.85rem", color: "#888" }}>
              {pitches.length > 0
                ? `There are ${pitches.length} total grounds active across ${schoolName}.`
                : `Be the first to add a spot on ${schoolName}!`}
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
              {sportFilter !== "ALL" || statusFilter !== "ALL" || query ? (
                <button
                  type="button"
                  onClick={() => {
                    setSportFilter("ALL");
                    setStatusFilter("ALL");
                    setQuery("");
                  }}
                  className="button button--outline"
                  style={{ fontSize: "12px", padding: "6px 14px" }}
                >
                  Reset filters & show all {pitches.length} grounds
                </button>
              ) : null}
              <Link
                href="/add"
                className="button button--green"
                style={{ fontSize: "12px", padding: "6px 14px" }}
              >
                + Add ground to {shortName}
              </Link>
            </div>
          </div>
        )}

        <div className="pitch-list">
          {visiblePitches.map((pitch) => (
            <PitchCard key={pitch.id} pitch={pitch} />
          ))}
        </div>
      </section>

      <div className="feed-footer-note">
        <Sparkles size={15} />
        <span>Every ground starts with somebody putting their people on.</span>
        <MapPin size={15} />
      </div>

      <HowToUseModal isOpen={showHowToUse} onClose={() => setShowHowToUse(false)} />
    </AppFrame>
  );
}
