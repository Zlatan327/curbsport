"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Compass, MapPin, Navigation, RefreshCw, Share2, X } from "lucide-react";
import { AppFrame } from "@/components/app-frame";
import { MapPlaceholder } from "@/components/map-placeholder";
import { Notice } from "@/components/notice";
import { EmptyState, LoadingState } from "@/components/page-state";
import { StatusBadge } from "@/components/status-badge";
import { DEMO_PITCHES } from "@/lib/demo";
import { useSchoolId } from "@/hooks/use-school-id";
import { usePitches } from "@/hooks/use-data";
import { getDirectionsUrl } from "@/lib/api";
import { formatPitchRallyWhatsAppMessage, shareToWhatsApp } from "@/lib/share";
import type { Pitch } from "@/lib/types";

export default function MapPage() {
  const { schoolId, schoolName, shortName } = useSchoolId();
  const { data, error, isLoading, mutate } = usePitches(schoolId);
  const pitches = data ?? (error ? DEMO_PITCHES : []);
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
  const [sportFilter, setSportFilter] = useState<"ALL" | "FOOTBALL" | "BASKETBALL">("ALL");

  const filteredPitches = pitches.filter((p) => {
    const isBball = p.sportType === "BASKETBALL" || p.name.toLowerCase().includes("court");
    if (sportFilter === "FOOTBALL" && isBball) return false;
    if (sportFilter === "BASKETBALL" && !isBball) return false;
    return true;
  });

  return (
    <AppFrame>
      <section className="page-intro page-intro--map">
        <p className="eyebrow">{schoolName.toUpperCase()} RADAR</p>
        <h1>WHERE WE<br /><em>PLAY.</em></h1>
        <p>Interactive campus ground radar. Select any spot to get instant directions and live status.</p>
      </section>

      {/* Sport Segmented Bar */}
      <div className="sport-filter-bar" style={{ margin: "0 0 12px" }}>
        <button
          type="button"
          className={`sport-filter-btn${sportFilter === "ALL" ? " is-active-all" : ""}`}
          onClick={() => setSportFilter("ALL")}
        >
          All ({pitches.length})
        </button>
        <button
          type="button"
          className={`sport-filter-btn${sportFilter === "FOOTBALL" ? " is-active-football" : ""}`}
          onClick={() => setSportFilter("FOOTBALL")}
        >
          ⚽ Football
        </button>
        <button
          type="button"
          className={`sport-filter-btn${sportFilter === "BASKETBALL" ? " is-active-basketball" : ""}`}
          onClick={() => setSportFilter("BASKETBALL")}
        >
          🏀 Basketball
        </button>
      </div>

      <div className="map-page-map" style={{ position: "relative" }}>
        <MapPlaceholder
          pitches={filteredPitches}
          large
          selectedPitchId={selectedPitch?.id}
          onSelectPitch={(pitch) => setSelectedPitch(pitch)}
          campusName={shortName}
        />
        <span className="map-page-tag">
          <MapPin size={13} /> {filteredPitches.length} GROUNDS / {shortName.toUpperCase()}
        </span>
      </div>

      {/* Selected Ground Floating Drawer / Card */}
      {selectedPitch && (
        <div style={{ marginTop: "12px", padding: "16px", background: "#151a16", border: "1px solid #00f076", borderRadius: "10px", position: "relative" }}>
          <button
            type="button"
            onClick={() => setSelectedPitch(null)}
            style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "#888", cursor: "pointer" }}
            aria-label="Close ground preview"
          >
            <X size={16} />
          </button>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "6px" }}>
            <StatusBadge status={selectedPitch.activeStatus} />
            <span style={{ fontSize: "11px", color: "var(--turf)", fontWeight: 700 }}>
              {selectedPitch.sportType === "BASKETBALL" ? "🏀 Basketball Court" : "⚽ Football Pitch"}
            </span>
          </div>
          <h3 style={{ margin: "0 0 4px", fontSize: "1.2rem", fontWeight: 800 }}>{selectedPitch.name}</h3>
          <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "#bbb" }}>
            {selectedPitch.landmarkDescription || selectedPitch.address || "Campus ground, Nigeria"}
          </p>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <a
              href={getDirectionsUrl(selectedPitch)}
              target="_blank"
              rel="noopener noreferrer"
              className="button button--green"
              style={{ fontSize: "0.8rem", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Navigation size={13} /> Google Maps Directions
            </a>
            <Link
              href={`/pitches/${encodeURIComponent(selectedPitch.id)}`}
              className="button button--outline"
              style={{ fontSize: "0.8rem", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              Open Ground Page <ArrowUpRight size={13} />
            </Link>
            <button
              type="button"
              className="button button--outline"
              onClick={() => {
                const url = typeof window !== "undefined" ? `${window.location.origin}/pitches/${selectedPitch.id}` : "";
                const text = formatPitchRallyWhatsAppMessage({
                  pitchName: selectedPitch.name,
                  pitchArea: selectedPitch.area || selectedPitch.address,
                  sportType: selectedPitch.sportType === "BASKETBALL" ? "BASKETBALL" : "FOOTBALL",
                  activeStatus: selectedPitch.activeStatus,
                  hasBall: selectedPitch.hasBallNow,
                  pitchUrl: url,
                });
                shareToWhatsApp(text);
              }}
              style={{ fontSize: "0.8rem", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Share2 size={13} /> Rally
            </button>
          </div>
        </div>
      )}

      <Notice tone="info" className="map-disclaimer">
        Tap any radar pin above or ground below for instant routing, walking cues and live player activity.
      </Notice>

      {error && (
        <Notice tone="warning" className="offline-notice">
          <strong>PREVIEW RADAR</strong>
          <span>Syncing campus data. Tap Retry to reconnect.</span>
          <button type="button" onClick={() => void mutate()}><RefreshCw size={14} /> RETRY</button>
        </Notice>
      )}

      <section className="map-pitch-list">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{shortName.toUpperCase()} GROUNDS</p>
            <h2>GROUNDS <span className="section-heading__count">{filteredPitches.length.toString().padStart(2, "0")}</span></h2>
          </div>
          <Link href="/add" className="text-link">+ Add ground</Link>
        </div>

        {isLoading && !data && <LoadingState label={`Scanning ${schoolName} radar...`} />}
        {!isLoading && filteredPitches.length === 0 && (
          <EmptyState title="No grounds in this category yet.">
            Tap &ldquo;+ Add ground&rdquo; to place the first spot on this campus.
          </EmptyState>
        )}

        {filteredPitches.map((pitch, index) => {
          const isBball = pitch.sportType === "BASKETBALL" || pitch.name.toLowerCase().includes("basketball");
          const isSelected = selectedPitch?.id === pitch.id;
          return (
            <div
              className={`map-list-row${isSelected ? " is-selected" : ""}`}
              key={pitch.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                border: isSelected ? "1px solid var(--turf)" : undefined,
                background: isSelected ? "rgba(0, 255, 102, 0.08)" : undefined,
                borderRadius: "6px",
                margin: "4px 0",
              }}
              onClick={() => setSelectedPitch(pitch)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, cursor: "pointer" }}>
                <span className="map-list-row__index">{String(index + 1).padStart(2, "0")}</span>
                <span className="map-list-row__body">
                  <strong>{pitch.name} {isBball ? "🏀" : "⚽"}</strong>
                  <small>{pitch.area || pitch.address || "Campus"}</small>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <a
                  href={getDirectionsUrl(pitch)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-action"
                  title={`Directions to ${pitch.name}`}
                  style={{ fontSize: "9px", padding: "4px 8px" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Navigation size={12} /> MAP
                </a>
                <Link
                  href={`/pitches/${encodeURIComponent(pitch.id)}`}
                  style={{ color: "var(--turf)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ArrowUpRight size={17} />
                </Link>
              </div>
            </div>
          );
        })}
      </section>
    </AppFrame>
  );
}
