"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Compass, MapPin, Navigation, Plus, ShieldCheck, ThumbsUp, X, Loader2 } from "lucide-react";
import type { Pitch, PitchDirection } from "@/lib/types";
import { fetchPitchDirections, getDirectionsUrl, submitPitchDirections, verifyPitchDirection } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

interface PitchDirectionsProps {
  pitch: Pitch;
  onOpenAuthModal?: () => void;
}

export function PitchDirectionsSection({ pitch, onOpenAuthModal }: PitchDirectionsProps) {
  const [directions, setDirections] = useState<PitchDirection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [dirText, setDirText] = useState("");
  const [landmarksText, setLandmarksText] = useState("");
  const [transitTip, setTransitTip] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPitchDirections(pitch.id)
      .then((data) => {
        if (active) setDirections(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pitch.id]);

  const mapsUrl = getDirectionsUrl(pitch);

  const handleOpenSubmit = () => {
    if (!token || !user) {
      setFeedback({ text: "Please log in to contribute directions for this pitch.", error: true });
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dirText.trim().length < 10) {
      setFeedback({ text: "Directions must be at least 10 characters.", error: true });
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitPitchDirections(pitch.id, {
        directions: dirText.trim(),
        landmarks: landmarksText.trim() || undefined,
        transitTip: transitTip.trim() || undefined,
      });

      setFeedback({ text: res.message || "Directions submitted for peer confirmation!" });
      setDirections((prev) => [res.direction, ...prev]);
      setModalOpen(false);
      setDirText("");
      setLandmarksText("");
      setTransitTip("");
    } catch (err) {
      setFeedback({ text: err instanceof Error ? err.message : "Submission failed.", error: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (directionId: number | string) => {
    if (!token || !user) {
      setFeedback({ text: "Log in to verify directions.", error: true });
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    setVerifyingId(directionId);
    try {
      const res = await verifyPitchDirection(pitch.id, directionId);
      setFeedback({ text: res.message });
      setDirections((prev) =>
        prev.map((d) => (String(d.id) === String(directionId) ? { ...d, ...res.direction } : d))
      );
    } catch (err) {
      setFeedback({ text: err instanceof Error ? err.message : "Failed to verify.", error: true });
    } finally {
      setVerifyingId(null);
    }
  };

  const verifiedOfficial = directions.find((d) => d.isVerified || d.verificationCount >= 2);

  return (
    <section className="form-section directions-section" style={{ marginTop: "24px" }} aria-labelledby="directions-heading">
      <div className="form-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Compass size={18} style={{ color: "#00f076" }} />
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>GROUND INTEL</p>
            <h2 id="directions-heading" style={{ margin: 0, fontSize: "1.15rem" }}>DIRECTIONS & NAVIGATION</h2>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem" }}
          >
            <Navigation size={13} /> GOOGLE MAPS
          </a>
          <button
            type="button"
            onClick={handleOpenSubmit}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              background: "#00f076",
              color: "#000",
              fontWeight: 700,
              fontSize: "0.75rem",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={13} /> ADD CUES
          </button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: "8px 12px",
            marginBottom: "14px",
            borderRadius: "6px",
            fontSize: "0.82rem",
            background: feedback.error ? "rgba(239, 68, 68, 0.15)" : "rgba(0, 240, 118, 0.15)",
            border: feedback.error ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(0, 240, 118, 0.3)",
            color: feedback.error ? "#f87171" : "#00f076",
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* Official / Verified Landmark Banner */}
      <div style={{ padding: "14px", background: "#141414", border: "1px solid #282828", borderRadius: "8px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "0.72rem", color: "#888", fontWeight: 700, textTransform: "uppercase" }}>
            <MapPin size={12} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px", color: "#00f076" }} />
            Official Landmark Cue
          </span>
          {verifiedOfficial ? (
            <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#00f076", background: "rgba(0,240,118,0.1)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(0,240,118,0.3)" }}>
              ✓ Community Verified ({verifiedOfficial.verificationCount} ballers)
            </span>
          ) : (
            <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#eab308", background: "rgba(234,179,8,0.1)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(234,179,8,0.3)" }}>
              Pending Peer Quorum
            </span>
          )}
        </div>
        <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "#f0f0e8", lineHeight: 1.5 }}>
          {verifiedOfficial ? verifiedOfficial.directions : pitch.landmarkDescription || pitch.address || "Campus grounds, Nigeria"}
        </p>
        {verifiedOfficial?.transitTip && (
          <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#00f076" }}>
            🚗 Transit Tip: {verifiedOfficial.transitTip}
          </p>
        )}
      </div>

      {/* Community Submitted Directions List */}
      <div>
        <p className="eyebrow" style={{ marginBottom: "8px" }}>BALLER SUBMISSIONS ({directions.length})</p>
        {loading && <p style={{ fontSize: "0.8rem", color: "#666" }}>Loading community directions...</p>}
        {!loading && directions.length === 0 && (
          <p style={{ fontSize: "0.82rem", color: "#888", fontStyle: "italic", margin: "6px 0" }}>
            No player has uploaded verified walking directions yet. Be the first to guide your squad!
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {directions.map((d) => (
            <div key={d.id} style={{ padding: "12px", background: "#111", border: "1px solid #222", borderRadius: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#aaa" }}>
                  By {d.authorAlias || d.user?.alias || "Baller"}
                </span>
                <button
                  type="button"
                  onClick={() => handleVerify(d.id)}
                  disabled={verifyingId === d.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "transparent",
                    border: "1px solid #333",
                    color: "#00f076",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "0.72rem",
                    cursor: "pointer",
                  }}
                >
                  <ThumbsUp size={11} /> Confirm ({d.verificationCount})
                </button>
              </div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#ddd", lineHeight: 1.45 }}>{d.directions}</p>
              {d.landmarks && (
                <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#888" }}>Landmarks: {d.landmarks}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 99, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#181818", border: "1px solid #333", borderRadius: "10px", padding: "20px", maxWidth: "460px", width: "100%", position: "relative" }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{ position: "absolute", top: "14px", right: "14px", background: "none", border: "none", color: "#888", cursor: "pointer" }}
            >
              <X size={18} />
            </button>
            <h3 style={{ margin: "0 0 6px", fontSize: "1.15rem", fontWeight: 800 }}>Upload Ground Directions</h3>
            <p style={{ margin: "0 0 14px", fontSize: "0.75rem", color: "#888" }}>
              Help other students find {pitch.name}. Once confirmed by other ballers, this becomes official.
            </p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#aaa", marginBottom: "4px" }}>
                  STEP-BY-STEP DIRECTIONS *
                </label>
                <textarea
                  required
                  rows={3}
                  value={dirText}
                  onChange={(e) => setDirText(e.target.value)}
                  placeholder="e.g. Enter via Main Gate, walk past Senate Building. Turn left at Faculty of Law. Ground is on the right."
                  style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: "6px", padding: "8px", color: "#fff", fontSize: "0.82rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#aaa", marginBottom: "4px" }}>
                  KEY LANDMARKS (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={landmarksText}
                  onChange={(e) => setLandmarksText(e.target.value)}
                  placeholder="e.g. Opposite Jaja Hall, behind sport centre"
                  style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: "6px", padding: "8px", color: "#fff", fontSize: "0.82rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#aaa", marginBottom: "4px" }}>
                  TRANSIT / SHUTTLE ADVICE (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={transitTip}
                  onChange={(e) => setTransitTip(e.target.value)}
                  placeholder="e.g. ₦100 campus shuttle drops directly at gate"
                  style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: "6px", padding: "8px", color: "#fff", fontSize: "0.82rem" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: "6px 14px", background: "transparent", border: "1px solid #444", color: "#aaa", borderRadius: "4px", fontSize: "0.78rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "6px 14px", background: "#00f076", border: "none", color: "#000", fontWeight: 800, borderRadius: "4px", fontSize: "0.78rem", cursor: "pointer" }}
                >
                  {submitting ? "Uploading..." : "Submit Directions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
