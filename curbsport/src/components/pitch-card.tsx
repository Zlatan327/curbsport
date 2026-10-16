import Link from "next/link";
import { MapPin, Navigation, Users } from "lucide-react";
import type { Pitch } from "@/lib/types";
import { getDirectionsUrl } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";

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
            <div className="pitch-art__lines" />
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
