import { MapPin } from "lucide-react";
import type { Pitch } from "@/lib/types";

const markerPositions = [
  { left: "17%", top: "34%" },
  { left: "52%", top: "21%" },
  { left: "75%", top: "51%" },
  { left: "36%", top: "72%" },
  { left: "84%", top: "79%" },
];

export function MapPlaceholder({ pitches = [], large = false }: { pitches?: Pitch[]; large?: boolean }) {
  const markers = pitches.slice(0, 5);
  return (
    <div className={`map-placeholder${large ? " map-placeholder--large" : ""}`} role="img" aria-label="Stylized pitch map preview; connect a map provider for real coordinates">
      <div className="map-grid" />
      <svg className="map-roads" viewBox="0 0 420 240" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-20 70 C70 36 120 120 220 80 S360 30 440 60" />
        <path d="M-10 188 C80 140 150 220 230 175 S355 138 440 185" />
        <path d="M105 -20 C142 45 115 100 165 145 S190 220 220 260" />
        <path d="M330 -20 C285 45 330 105 290 150 S300 218 265 260" />
      </svg>
      <div className="map-label map-label--one">ANAMBRA / EAST</div>
      <div className="map-label map-label--two">LOCAL GROUNDS</div>
      {markers.length > 0 ? markers.map((pitch, index) => {
        const pos = markerPositions[index];
        return (
          <span key={pitch.id} className={`map-marker${index === 0 ? " map-marker--featured" : ""}`} style={pos} title={pitch.name}>
            <MapPin size={index === 0 ? 18 : 15} strokeWidth={2.8} />
          </span>
        );
      }) : <span className="map-marker map-marker--featured" style={markerPositions[0]}><MapPin size={18} strokeWidth={2.8} /></span>}
      <div className="map-scale"><span /> NOT TO SCALE</div>
    </div>
  );
}
