import Link from "next/link";
import { MapPin, Navigation, Users } from "lucide-react";
import type { Pitch } from "@/lib/types";
import { getDirectionsUrl } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";

function CourtSchematic({ isBasketball }: { isBasketball: boolean }) {
  if (isBasketball) {
    return (
      <div className="pitch-art__schematic" aria-hidden="true">
        <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="court-svg">
          {/* Half-court outline */}
          <rect x="12" y="10" width="216" height="120" rx="3" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="1.5" />
          {/* Center court line & center circle arc */}
          <line x1="12" y1="130" x2="228" y2="130" stroke="rgba(249, 115, 22, 0.3)" strokeWidth="1.5" />
          <path d="M 85 130 A 35 35 0 0 1 155 130" stroke="rgba(249, 115, 22, 0.3)" strokeWidth="1.5" />
          {/* 3-point arc */}
          <path d="M 38 10 L 38 42 A 82 82 0 0 0 202 42 L 202 10" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="1.5" />
          {/* Key / Paint area */}
          <rect x="85" y="10" width="70" height="65" stroke="rgba(249, 115, 22, 0.55)" strokeWidth="1.5" fill="rgba(249, 115, 22, 0.05)" />
          {/* Free throw circle */}
          <path d="M 85 75 A 35 35 0 0 0 155 75" stroke="rgba(249, 115, 22, 0.55)" strokeWidth="1.5" />
          <path d="M 85 75 A 35 35 0 0 1 155 75" stroke="rgba(249, 115, 22, 0.3)" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* Backboard & Rim */}
          <line x1="104" y1="18" x2="136" y2="18" stroke="rgba(255, 255, 255, 0.75)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="120" cy="23" r="5" stroke="rgba(249, 115, 22, 0.85)" strokeWidth="1.5" />
          {/* Lane hash marks */}
          <line x1="85" y1="36" x2="78" y2="36" stroke="rgba(249, 115, 22, 0.45)" strokeWidth="1.5" />
          <line x1="85" y1="52" x2="78" y2="52" stroke="rgba(249, 115, 22, 0.45)" strokeWidth="1.5" />
          <line x1="155" y1="36" x2="162" y2="36" stroke="rgba(249, 115, 22, 0.45)" strokeWidth="1.5" />
          <line x1="155" y1="52" x2="162" y2="52" stroke="rgba(249, 115, 22, 0.45)" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  return (
    <div className="pitch-art__schematic pitch-art__schematic--football" aria-hidden="true">
      <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="court-svg">
        {/* Pitch boundary */}
        <rect x="12" y="10" width="216" height="120" rx="3" stroke="rgba(34, 197, 94, 0.4)" strokeWidth="1.5" />
        {/* Halfway line & center circle */}
        <line x1="12" y1="130" x2="228" y2="130" stroke="rgba(34, 197, 94, 0.35)" strokeWidth="1.5" />
        <path d="M 85 130 A 35 35 0 0 1 155 130" stroke="rgba(34, 197, 94, 0.35)" strokeWidth="1.5" />
        <circle cx="120" cy="130" r="2.5" fill="rgba(34, 197, 94, 0.6)" />
        {/* Penalty box */}
        <rect x="55" y="10" width="130" height="55" stroke="rgba(34, 197, 94, 0.5)" strokeWidth="1.5" fill="rgba(34, 197, 94, 0.04)" />
        {/* 6-yard goal box */}
        <rect x="85" y="10" width="70" height="22" stroke="rgba(34, 197, 94, 0.45)" strokeWidth="1.5" />
        {/* Goal line / net */}
        <rect x="100" y="6" width="40" height="4" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.5" />
        {/* Penalty spot */}
        <circle cx="120" cy="45" r="2.5" fill="rgba(34, 197, 94, 0.8)" />
        {/* Penalty D-arc */}
        <path d="M 98 65 A 30 30 0 0 0 142 65" stroke="rgba(34, 197, 94, 0.45)" strokeWidth="1.5" />
        {/* Corner arcs */}
        <path d="M 12 22 A 12 12 0 0 0 24 10" stroke="rgba(34, 197, 94, 0.35)" strokeWidth="1.5" />
        <path d="M 216 10 A 12 12 0 0 0 228 22" stroke="rgba(34, 197, 94, 0.35)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export function PitchCard({ pitch }: { pitch: Pitch }) {
  const verified = pitch.verificationStatus.toUpperCase() === "COMMUNITY_VERIFIED";
  const isBasketball = pitch.sportType === "BASKETBALL" || pitch.name.toLowerCase().includes("basketball") || pitch.name.toLowerCase().includes("court");
  const directionsUrl = getDirectionsUrl(pitch);

  return (
    <article className="pitch-card">
      <Link href={`/pitches/${encodeURIComponent(pitch.id)}`} className="pitch-card__link" aria-label={`Inspect ${pitch.name}`}>
        <div className={`pitch-art${isBasketball ? " pitch-art--basketball" : ""}`}>
          {pitch.imageUrl ? (
            <img src={pitch.imageUrl} alt={pitch.name} className="pitch-art__image" />
          ) : (
            <CourtSchematic isBasketball={isBasketball} />
          )}
          <div className="pitch-art__scrim" />

          {/* Top Bar: Sport Pill + Verification */}
          <div className="pitch-art__badge-top">
            <span className={`sport-pill ${isBasketball ? "sport-pill--basketball" : "sport-pill--football"}`}>
              {isBasketball ? "🏀 Basketball" : "⚽ Football"}
            </span>
            <span
              className={`verification-mark ${verified ? "verification-mark--verified" : "verification-mark--ghost"}`}
              title={verified ? "Community verified" : "Unverified pitch"}
              aria-label={verified ? "Community verified" : "Unverified pitch"}
            >
              {verified ? "✓" : "?"}
            </span>
          </div>

          {/* Bottom Bar: Live Status + Ball Beacon */}
          <div className="pitch-art__badge-bottom">
            <StatusBadge status={pitch.activeStatus} />
            {pitch.hasBallNow && (
              <span className="ball-beacon" title={`Ball brought by ${pitch.ballBroughtBy || "baller"}`}>
                <span className="ball-pulse-dot" /> {isBasketball ? "Ball on court" : "Ball on ground"}
              </span>
            )}
          </div>
        </div>

        <div className="pitch-card__body">
          <div className="pitch-card__meta">
            <MapPin size={13} />
            <span>{pitch.area || pitch.address || "Campus grounds"}</span>
          </div>
          <div className="pitch-card__title-row">
            <h3>{pitch.name}</h3>
          </div>
          <p className="pitch-card__description">
            {pitch.description || "Active community pickup spot. Check in or report status before you move."}
          </p>
          <div className="pitch-card__footer">
            <span>
              <Users size={14} /> {pitch.playersNow || 0} ballers active
            </span>
            <span className="pitch-card__sets">{pitch.setsToday || 0} sets run today</span>
          </div>
        </div>
      </Link>

      <div className="pitch-card__actions">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pitch-card__directions-btn"
          aria-label={`Get directions to ${pitch.name}`}
        >
          <Navigation size={13} /> Get directions
        </a>
      </div>

      {!verified && (
        <div className="ghost-warning">
          <span aria-hidden="true">👻</span>
          <span>Unverified spot — does ball fly here?</span>
        </div>
      )}
    </article>
  );
}
