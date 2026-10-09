import Link from "next/link";
import { ArrowUpRight, MapPin, Navigation, Users } from "lucide-react";
import type { Pitch } from "@/lib/types";
import { getDirectionsUrl } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";

export function PitchCard({ pitch }: { pitch: Pitch }) {
  const verified = pitch.verificationStatus.toUpperCase() === "COMMUNITY_VERIFIED";
  const isBasketball = pitch.sportType === "BASKETBALL" || pitch.name.toLowerCase().includes("basketball");
  const directionsUrl = getDirectionsUrl(pitch);

  return (
    <article className="pitch-card">
      <Link href={`/pitches/${encodeURIComponent(pitch.id)}`} className="pitch-card__link" aria-label={`View ${pitch.name}`}>
        <div className={`pitch-art pitch-art--${pitch.id.replace(/[^a-z0-9]/gi, "").slice(-1) || "0"}`}>
          {pitch.imageUrl ? (
            <img src={pitch.imageUrl} alt={pitch.name} className="pitch-art__image" />
          ) : (
            <div className="pitch-art__lines" />
          )}
          <div className="pitch-art__label">{isBasketball ? "HOOPS / BASKETBALL" : "INSIDE / PITCH LOG"}</div>
          <div className="pitch-art__number">{pitch.id.startsWith("demo-") ? `0${pitch.id.slice(-1)}` : "PITCH"}</div>
          <div className="pitch-art__sticker">{pitch.activeStatus === "LIVE" ? "BALL\nIN PLAY" : isBasketball ? "PICKUP\nCOURT" : "LOCAL\nGROUND"}</div>
          <div className="pitch-art__bottom">
            <StatusBadge status={pitch.activeStatus} />
            <span className="pitch-art__arrow"><ArrowUpRight size={21} /></span>
          </div>
        </div>
        <div className="pitch-card__body">
          <div className="pitch-card__meta">
            <MapPin size={13} />
            <span>{pitch.area || pitch.address || "Anambra State"}</span>
            <span className="sport-tag">{isBasketball ? "🏀 BASKETBALL" : "⚽ FOOTBALL"}</span>
          </div>
          <div className="pitch-card__title-row">
            <h3>{pitch.name}</h3>
            <span className={`verification-mark${verified ? " verification-mark--verified" : " verification-mark--ghost"}`} aria-label={verified ? "Community verified" : "Unverified pitch"}>{verified ? "✓" : "?"}</span>
          </div>
          <p className="pitch-card__description">{pitch.description || "Community ground. Check the status before you move."}</p>
          <div className="pitch-card__footer">
            <span><Users size={14} /> {pitch.playersNow || 0} playing</span>
            <span className="pitch-card__sets">{pitch.setsToday || 0} sets today</span>
          </div>
        </div>
      </Link>
      <div className="pitch-card__actions">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pitch-card__directions-btn"
          aria-label={`Get turn-by-turn directions to ${pitch.name}`}
        >
          <Navigation size={12} /> GET DIRECTIONS
        </a>
      </div>
      {!verified && <div className="ghost-warning"><span aria-hidden="true">👻</span><span>Unverified - Does ball fly here?</span></div>}
      {pitch.isDemo && <span className="demo-tag">SAMPLE PREVIEW</span>}
    </article>
  );
}
