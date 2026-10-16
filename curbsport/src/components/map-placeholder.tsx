"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";
import type { Pitch } from "@/lib/types";

interface MapPlaceholderProps {
  pitches?: Pitch[];
  large?: boolean;
  selectedPitchId?: string | number | null;
  onSelectPitch?: (pitch: Pitch) => void;
  campusName?: string;
}

export function MapPlaceholder({
  pitches = [],
  large = false,
  selectedPitchId = null,
  onSelectPitch,
  campusName,
}: MapPlaceholderProps) {
  // Compute normalized coordinate positions if real lat/lng exist
  const positionedMarkers = useMemo(() => {
    if (pitches.length === 0) return [];

    const withCoords = pitches.filter((p) => typeof p.latitude === "number" && typeof p.longitude === "number");

    if (withCoords.length >= 2) {
      let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
      for (const p of withCoords) {
        if (p.latitude! < minLat) minLat = p.latitude!;
        if (p.latitude! > maxLat) maxLat = p.latitude!;
        if (p.longitude! < minLng) minLng = p.longitude!;
        if (p.longitude! > maxLng) maxLng = p.longitude!;
      }

      const latDiff = maxLat - minLat || 0.01;
      const lngDiff = maxLng - minLng || 0.01;

      return pitches.map((pitch, idx) => {
        if (typeof pitch.latitude === "number" && typeof pitch.longitude === "number") {
          // Normalize to 15% - 85% range
          const leftPct = 15 + ((pitch.longitude - minLng) / lngDiff) * 70;
          const topPct = 85 - ((pitch.latitude - minLat) / latDiff) * 70;
          return { pitch, left: `${Math.round(leftPct)}%`, top: `${Math.round(topPct)}%` };
        }
        // Fallback positioning for items without GPS
        const angle = (idx / Math.max(pitches.length, 1)) * 2 * Math.PI;
        const leftPct = 50 + Math.cos(angle) * 32;
        const topPct = 50 + Math.sin(angle) * 32;
        return { pitch, left: `${Math.round(leftPct)}%`, top: `${Math.round(topPct)}%` };
      });
    }

    // Default static distributor
    const defaultPositions = [
      { left: "22%", top: "35%" },
      { left: "54%", top: "25%" },
      { left: "76%", top: "52%" },
      { left: "38%", top: "68%" },
      { left: "80%", top: "78%" },
      { left: "45%", top: "45%" },
      { left: "62%", top: "75%" },
      { left: "28%", top: "82%" },
    ];

    return pitches.map((pitch, idx) => ({
      pitch,
      ...(defaultPositions[idx % defaultPositions.length] || { left: "50%", top: "50%" }),
    }));
  }, [pitches]);

  return (
    <div
      className={`map-placeholder${large ? " map-placeholder--large" : ""}`}
      role="img"
      aria-label="Stylized campus ground map radar"
    >
      <div className="map-grid" />
      <svg className="map-roads" viewBox="0 0 420 240" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-20 70 C70 36 120 120 220 80 S360 30 440 60" />
        <path d="M-10 188 C80 140 150 220 230 175 S355 138 440 185" />
        <path d="M105 -20 C142 45 115 100 165 145 S190 220 220 260" />
        <path d="M330 -20 C285 45 330 105 290 150 S300 218 265 260" />
        <circle cx="210" cy="120" r="70" stroke="rgba(0, 255, 102, 0.12)" strokeWidth="1" strokeDasharray="4 4" fill="none" />
      </svg>

      <div className="map-label map-label--one">{campusName ? campusName.toUpperCase() : "CAMPUS GROUND RADAR"}</div>
      <div className="map-label map-label--two">{pitches.length} REGISTERED SPOTS</div>

      {positionedMarkers.map(({ pitch, left, top }, index) => {
        const isSelected = selectedPitchId !== null && String(pitch.id) === String(selectedPitchId);
        const isLive = pitch.activeStatus === "LIVE";
        const hasBall = Boolean(pitch.hasBallNow);
        const isBball = pitch.sportType === "BASKETBALL" || pitch.name.toLowerCase().includes("court");

        return (
          <button
            key={pitch.id}
            type="button"
            className={`map-marker${isSelected ? " map-marker--selected" : ""}${isLive ? " map-marker--live" : ""}`}
            style={{
              position: "absolute",
              left,
              top,
              background: isSelected ? "#00f076" : isLive ? "#22c55e" : hasBall ? "#eab308" : isBball ? "#ea580c" : "#1b221c",
              color: isSelected ? "#000" : "#fff",
              border: isSelected ? "2px solid #fff" : "1px solid rgba(255,255,255,0.4)",
              borderRadius: "50%",
              width: isSelected ? "32px" : "26px",
              height: isSelected ? "32px" : "26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: onSelectPitch ? "pointer" : "default",
              transform: isSelected ? "translate(-50%, -50%) scale(1.15)" : "translate(-50%, -50%)",
              boxShadow: isLive ? "0 0 12px #22c55e" : isSelected ? "0 0 15px #00f076" : "0 2px 6px rgba(0,0,0,0.6)",
              transition: "all .18s ease",
              zIndex: isSelected ? 10 : 2,
            }}
            onClick={(e) => {
              if (onSelectPitch) {
                e.preventDefault();
                e.stopPropagation();
                onSelectPitch(pitch);
              }
            }}
            title={`${pitch.name} (${pitch.activeStatus})`}
            aria-label={`${pitch.name}`}
          >
            <span style={{ fontSize: isSelected ? "13px" : "11px", lineHeight: 1 }}>
              {isBball ? "🏀" : "⚽"}
            </span>
            {isLive && (
              <span
                style={{
                  position: "absolute",
                  top: "-3px",
                  right: "-3px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 6px #22c55e",
                }}
              />
            )}
          </button>
        );
      })}

      {pitches.length === 0 && (
        <span
          className="map-marker"
          style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
        >
          <MapPin size={18} strokeWidth={2.8} />
        </span>
      )}

      <div className="map-scale"><span /> GPS CALIBRATED RADAR</div>
    </div>
  );
}
