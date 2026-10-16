"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Compass, MapPin, Navigation, Plus, ShieldCheck, ThumbsUp, X, Loader2 } from "lucide-react";
import type { Pitch, PitchDirection } from "@/lib/types";
import { fetchPitchDirections, getDirectionsUrl, submitPitchDirections, verifyPitchDirection } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/components/toast";

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

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const { showToast } = useToast();

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
      showToast("Sign in required", "Please log in to contribute directions for this pitch.", "info");
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dirText.trim().length < 10) {
      showToast("Too short", "Directions must be at least 10 characters.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitPitchDirections(pitch.id, {
        directions: dirText.trim(),
        landmarks: landmarksText.trim() || undefined,
        transitTip: transitTip.trim() || undefined,
      });

      showToast("Directions uploaded!", res.message || "Submitted for peer confirmation.", "success");
      setDirections((prev) => [res.direction, ...prev]);
      setModalOpen(false);
      setDirText("");
      setLandmarksText("");
      setTransitTip("");
    } catch (err) {
      showToast("Could not submit", err instanceof Error ? err.message : "Submission failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (directionId: number | string) => {
    if (!token || !user) {
      showToast("Sign in required", "Log in to verify directions.", "info");
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    setVerifyingId(directionId);
    try {
      const res = await verifyPitchDirection(pitch.id, directionId);
      showToast("Verification confirmed", res.message, "success");
      setDirections((prev) =>
        prev.map((d) => (String(d.id) === String(directionId) ? { ...d, ...res.direction } : d))
      );
    } catch (err) {
      showToast("Verification note", err instanceof Error ? err.message : "Failed to verify.", "error");
    } finally {
      setVerifyingId(null);
    }
  };

  const verifiedOfficial = directions.find((d) => d.isVerified || d.verificationCount >= 2);

  return (
    <section className="panel" aria-labelledby="directions-heading">
      <div className="panel-head">
        <div className="flex items-center gap-2">
          <Compass size={16} className="text-[#00FF66]" />
          <h2 id="directions-heading">Ground Directions & Campus Navigation</h2>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="secondary-button text-xs"
            title="Open turn-by-turn directions in Google Maps"
          >
            <Navigation size={13} />
            <span>Google Maps</span>
          </a>
          <button
            type="button"
            onClick={handleOpenSubmit}
            className="secondary-button text-xs"
            title="Upload corrected or detailed directions"
          >
            <Plus size={13} />
            <span>Upload Directions</span>
          </button>
        </div>
      </div>

      <div className="panel-body space-y-4">
        {/* Official / Verified Landmark Banner */}
        <div className="p-4 bg-[#111311] border border-[#F0F0E8]/15 rounded-xl">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8B908A] flex items-center gap-1.5">
              <MapPin size={13} className="text-[#00FF66]" />
              Official Landmark Cue
            </span>
            {verifiedOfficial ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30 rounded">
                <CheckCircle2 size={11} />
                Community Verified ({verifiedOfficial.verificationCount} ballers)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 rounded">
                Pending Peer Quorum
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-[#F0F0E8] leading-relaxed">
            {verifiedOfficial ? verifiedOfficial.directions : pitch.landmark}
          </p>
          {verifiedOfficial?.transitTip && (
            <p className="mt-2 text-xs text-[#00FF66] flex items-center gap-1.5">
              <span>🚌 Transit tip:</span>
              <span className="text-[#F0F0E8]/80">{verifiedOfficial.transitTip}</span>
            </p>
          )}
        </div>

        {/* Community Contributions List */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B908A] mb-3">
            Community-Uploaded Directions ({directions.length})
          </h3>

          {loading ? (
            <div className="flex items-center justify-center p-6 text-xs text-[#8B908A]">
              <Loader2 size={16} className="animate-spin mr-2" />
              Loading ground directions...
            </div>
          ) : directions.length === 0 ? (
            <div className="p-5 border border-dashed border-[#F0F0E8]/15 rounded-xl text-center">
              <p className="text-xs text-[#8B908A]">
                Are the default directions wrong or vague?
              </p>
              <p className="mt-1 text-xs text-[#F0F0E8]">
                If you have played here or checked in, click <strong>Upload Directions</strong> to help campus ballers navigate easily.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {directions.map((dir) => {
                const isVerified = dir.isVerified || dir.verificationCount >= 2;
                const authorName = dir.user?.alias || dir.authorAlias || "Campus Baller";
                const isAuthor = user && (String(user.id) === String(dir.userId) || user.alias === authorName);

                return (
                  <div
                    key={dir.id}
                    className="p-3.5 bg-[#151815] border border-[#F0F0E8]/10 rounded-xl flex flex-col gap-2 hover:border-[#00FF66]/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F0F0E8]">{authorName}</span>
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#00FF66]/10 text-[#00FF66] rounded border border-[#00FF66]/20">
                            <ShieldCheck size={10} /> Verified
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#8B908A]">
                        {dir.verificationCount} verification{dir.verificationCount === 1 ? "" : "s"}
                      </span>
                    </div>

                    <p className="text-xs text-[#F0F0E8]/90 leading-relaxed">{dir.directions}</p>

                    {dir.landmarks && (
                      <p className="text-[11px] text-[#8B908A]">
                        <strong className="text-[#F0F0E8]/70">Landmarks:</strong> {dir.landmarks}
                      </p>
                    )}

                    <div className="mt-1 pt-2 border-t border-[#F0F0E8]/5 flex items-center justify-between">
                      <span className="text-[10px] text-[#8B908A]/70">
                        {new Date(dir.createdAt).toLocaleDateString()}
                      </span>

                      {!isAuthor && (
                        <button
                          type="button"
                          disabled={verifyingId === dir.id}
                          onClick={() => handleVerify(dir.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#191C19] hover:bg-[#252925] border border-[#F0F0E8]/15 hover:border-[#00FF66]/50 rounded text-[11px] font-semibold text-[#00FF66] transition-colors"
                        >
                          <ThumbsUp size={11} />
                          <span>I&apos;ve been here — Confirm</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal to Upload Directions */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg p-6 bg-[#191C19] border border-[#F0F0E8]/15 rounded-2xl shadow-2xl">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#8B908A] hover:text-[#F0F0E8] rounded-lg"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2 text-[#00FF66] text-xs font-semibold uppercase tracking-wider">
              <Compass size={14} />
              <span>Crowdsourced Ground Intelligence</span>
            </div>

            <h3 className="text-2xl font-bold font-heading uppercase text-[#F0F0E8]">
              Upload Pitch Directions
            </h3>
            <p className="mt-1 text-xs text-[#8B908A]">
              Help campus players find <strong>{pitch.name}</strong>. Only players who have attended can submit; other attendees will verify.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8B908A] uppercase tracking-wider mb-1.5">
                  Detailed Step-by-Step Directions *
                </label>
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={3}
                  value={dirText}
                  onChange={(e) => setDirText(e.target.value)}
                  placeholder="e.g. Enter via UNILAG Main Gate, take the campus shuttle or walk straight past Senate building. Turn left opposite Faculty of Education. Court is 30m ahead."
                  className="w-full px-3.5 py-2.5 bg-[#111311] border border-[#F0F0E8]/15 rounded-lg text-sm text-[#F0F0E8] placeholder:text-[#8B908A]/50 focus:border-[#00FF66] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8B908A] uppercase tracking-wider mb-1.5">
                  Key Visual Landmarks (Optional)
                </label>
                <input
                  type="text"
                  maxLength={500}
                  value={landmarksText}
                  onChange={(e) => setLandmarksText(e.target.value)}
                  placeholder="e.g. Opposite Moremi Hall, behind the sports pavilion"
                  className="w-full px-3.5 py-2.5 bg-[#111311] border border-[#F0F0E8]/15 rounded-lg text-sm text-[#F0F0E8] placeholder:text-[#8B908A]/50 focus:border-[#00FF66] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8B908A] uppercase tracking-wider mb-1.5">
                  Transit / Shuttle Advice (Optional)
                </label>
                <input
                  type="text"
                  maxLength={300}
                  value={transitTip}
                  onChange={(e) => setTransitTip(e.target.value)}
                  placeholder="e.g. ₦100 campus shuttle drops directly in front of the gate"
                  className="w-full px-3.5 py-2.5 bg-[#111311] border border-[#F0F0E8]/15 rounded-lg text-sm text-[#F0F0E8] placeholder:text-[#8B908A]/50 focus:border-[#00FF66] focus:outline-none transition-colors"
                />
              </div>

              <div className="p-3 bg-[#111311] border border-[#F0F0E8]/10 rounded-lg text-[11px] text-[#8B908A] flex items-start gap-2">
                <ShieldCheck size={14} className="text-[#00FF66] flex-shrink-0 mt-0.5" />
                <span>
                  Anti-fraud policy: Submissions are attributed to your alias ({user?.alias}). Once 2 verified attendees confirm, this becomes the official ground guide.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="secondary-button text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="primary-button text-xs"
                >
                  {submitting ? "Submitting..." : "Submit for Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
