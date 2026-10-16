"use client";

import { useState, useRef, type ChangeEvent, type FormEvent, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, Camera, CheckCircle2, MapPin, Save, Trash2 } from "lucide-react";
import { useSWRConfig } from "swr";
import { z } from "zod";
import { AppFrame } from "@/components/app-frame";
import { MapPlaceholder } from "@/components/map-placeholder";
import { Notice } from "@/components/notice";
import { AsyncButton } from "@/components/async-button";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { useAuthStore } from "@/store/auth";
import { createPitch } from "@/lib/api";
import { useSchoolId } from "@/hooks/use-school-id";

const pitchSchema = z.object({
  name: z.string().trim().min(3, "Give this ground a name (at least 3 characters)."),
  area: z.string().trim().min(2, "Add the local area or campus zone."),
  address: z.string().trim().min(4, "Add landmark cues or walking directions players can use."),
  description: z.string().trim().max(240, "Keep the description under 240 characters."),
});

export default function AddPitchPage() {
  const { token, user, hydrated } = useAuthStore();
  const { schoolId, updateSchoolId, campuses } = useSchoolId();
  const { mutate } = useSWRConfig();

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schoolId || "6");
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [sportType, setSportType] = useState<"FOOTBALL" | "BASKETBALL">("FOOTBALL");
  const [userToggledSport, setUserToggledSport] = useState(false);
  const [fieldType, setFieldType] = useState<"Street Arena" | "School Ground" | "Paid Turf">("Street Arena");
  const [priceBracket, setPriceBracket] = useState<string>("Free");
  const [status, setStatus] = useState("DRY");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pin, setPin] = useState({ x: 52, y: 48 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [publishedPitch, setPublishedPitch] = useState<{ id: string | number; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep selectedSchoolId in sync if schoolId changes externally
  if (selectedSchoolId !== schoolId && !userToggledSport && selectedSchoolId === "6" && schoolId) {
    setSelectedSchoolId(schoolId);
  }

  function handleNameChange(val: string) {
    setName(val);
    // Intelligent sport detection only if user hasn't manually pressed a sport toggle button
    if (!userToggledSport) {
      const lower = val.toLowerCase();
      if (lower.includes("court") || lower.includes("hoop") || lower.includes("basketball") || lower.includes("3v3") || lower.includes("dunk")) {
        setSportType("BASKETBALL");
      } else if (lower.includes("pitch") || lower.includes("turf") || lower.includes("field") || lower.includes("maracana") || lower.includes("stadium") || lower.includes("aside") || lower.includes("football") || lower.includes("soccer")) {
        setSportType("FOOTBALL");
      }
    }
  }

  function placePin(event: MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPin({
      x: Math.round(((event.clientX - bounds.left) / bounds.width) * 100),
      y: Math.round(((event.clientY - bounds.top) / bounds.height) * 100),
    });
  }

  function handleImageFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setImageUrl(canvas.toDataURL("image/jpeg", 0.82));
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    const result = pitchSchema.safeParse({ name, area, address, description });
    if (!result.success) return setError(result.error.issues[0]?.message || "Check the details and try again.");
    setBusy(true);

    try {
      const targetSchoolId = Number(selectedSchoolId) || Number(user?.schoolId) || 6;
      const created = await createPitch({
        name: name.trim(),
        sportType,
        fieldType,
        priceBracket,
        address: `${area.trim()} — ${address.trim()}`,
        landmarkDescription: `${area.trim()} — ${address.trim()}${description.trim() ? `. Note: ${description.trim()}` : ""}`,
        imageUrl: imageUrl || undefined,
        schoolId: targetSchoolId,
      });

      // Invalidate SWR cache so feed shows the new pitch immediately
      await mutate(["pitches", String(targetSchoolId)]);
      updateSchoolId(String(targetSchoolId));

      const draft = { ...result.data, sportType, status, imageUrl, mapX: pin.x, mapY: pin.y, createdAt: new Date().toISOString(), savedLocally: true };
      const draftsRaw = window.localStorage.getItem("curbsport-pitch-drafts") || window.localStorage.getItem("inside-life-pitch-drafts") || "[]";
      const savedDrafts = JSON.parse(draftsRaw) as unknown[];
      const updatedDrafts = JSON.stringify([draft, ...savedDrafts]);
      window.localStorage.setItem("curbsport-pitch-drafts", updatedDrafts);
      window.localStorage.setItem("inside-life-pitch-drafts", updatedDrafts);

      setSaved(true);
      setPublishedPitch({ id: created.id, name: created.name });
      setName(""); setArea(""); setAddress(""); setDescription(""); setImageUrl(null);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Could not publish ground to the server.");
    } finally {
      setBusy(false);
    }
  }

  const activeCampusObj = campuses.find((c) => String(c.id) === String(selectedSchoolId));

  return (
    <AppFrame>
      <section className="page-intro page-intro--add">
        <p className="eyebrow"><span className="eyebrow-mark" /> NEW SPOT</p>
        <h1>ADD A GROUND</h1>
        <p>Know a spot? Put your people on. Add a football pitch or basketball court to your campus radar.</p>
      </section>

      {!hydrated ? (
        <div className="sign-in-loading">Checking player session…</div>
      ) : !token ? (
        <SignInPrompt title="Rep your ground." copy="Log in before adding a local pitch draft." />
      ) : (
        <>
          <form className="pitch-form" onSubmit={submit}>
            <div className="form-section-heading">
              <div>
                <p className="eyebrow">SPOT DETAILS</p>
                <h2>GROUND INFORMATION</h2>
              </div>
            </div>

            {error && <Notice tone="warning">{error}</Notice>}
            {saved && publishedPitch && (
              <div style={{ padding: "14px", background: "rgba(0, 240, 118, 0.12)", border: "1px solid #00f076", borderRadius: "8px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#00f076", fontWeight: 800, fontSize: "0.95rem" }}>
                  <CheckCircle2 size={18} />
                  <span>Ground published to {activeCampusObj?.name || "your campus"}!</span>
                </div>
                <p style={{ margin: "6px 0 12px", fontSize: "0.82rem", color: "#ddd" }}>
                  &ldquo;{publishedPitch.name}&rdquo; is now live on the ground radar for teammates to pull up and verify.
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <Link
                    href={`/pitches/${encodeURIComponent(publishedPitch.id)}`}
                    className="button button--green"
                    style={{ fontSize: "0.8rem", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    Open Ground Page <ArrowUpRight size={14} />
                  </Link>
                  <Link
                    href="/"
                    className="button button--outline"
                    style={{ fontSize: "0.8rem", padding: "6px 14px" }}
                  >
                    Back to Feed
                  </Link>
                </div>
              </div>
            )}

            {/* Campus Selector */}
            <label className="field">
              <span>Campus / University *</span>
              <select
                value={selectedSchoolId}
                onChange={(e) => {
                  setSelectedSchoolId(e.target.value);
                  updateSchoolId(e.target.value);
                }}
                style={{ background: "#111", color: "#fff", border: "1px solid #333", borderRadius: "6px", padding: "8px 10px", fontSize: "0.85rem" }}
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.state} ({c.pitchesCount ?? 0} grounds)
                  </option>
                ))}
              </select>
            </label>

            {/* Sport Type Selector */}
            <div className="field">
              <span>Sport type *</span>
              <div className="sport-filter-bar" style={{ margin: "4px 0" }}>
                <button
                  type="button"
                  className={`sport-filter-btn${sportType === "FOOTBALL" ? " is-active-football" : ""}`}
                  onClick={() => {
                    setSportType("FOOTBALL");
                    setUserToggledSport(true);
                  }}
                >
                  ⚽ Football (Soccer)
                </button>
                <button
                  type="button"
                  className={`sport-filter-btn${sportType === "BASKETBALL" ? " is-active-basketball" : ""}`}
                  onClick={() => {
                    setSportType("BASKETBALL");
                    setUserToggledSport(true);
                  }}
                >
                  🏀 Basketball
                </button>
              </div>
            </div>

            <label className="field">
              <span>Ground name *</span>
              <input
                value={name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder={sportType === "FOOTBALL" ? "e.g. Science Village Pitch / Hostel E Quad" : "e.g. Bakassi Basketball Court"}
                maxLength={60}
                required
              />
            </label>

            <label className="field">
              <span>Area or Campus Zone *</span>
              <input
                value={area}
                onChange={(event) => setArea(event.target.value)}
                placeholder="e.g. Block E Hostel / Campus Central / Faculty of Arts"
                maxLength={60}
                required
              />
            </label>

            <label className="field">
              <span>Walking Directions & Landmarks *</span>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Directly opposite the female hostel gate, behind the library…"
                maxLength={120}
                required
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="field">
                <span>Field / Court Surface</span>
                <select value={fieldType} onChange={(event: any) => setFieldType(event.target.value)}>
                  <option value="Street Arena">Street Arena (Concrete / Quad)</option>
                  <option value="School Ground">School Ground (Open Field / Grass)</option>
                  <option value="Paid Turf">Paid Synthetic Turf</option>
                </select>
              </label>

              <label className="field">
                <span>Price Bracket</span>
                <select value={priceBracket} onChange={(event) => setPriceBracket(event.target.value)}>
                  <option value="Free">Free (Public ground)</option>
                  <option value="₦500 - ₦1,000 / set">₦500 - ₦1,000 / set</option>
                  <option value="Paid Turf">Paid Commercial Turf</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span>Initial ground status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="DRY">Dry — ready for pickup</option>
                <option value="BUILDING">Building sets — ballers pulling up</option>
                <option value="LIVE">Live match — currently in play</option>
              </select>
            </label>

            {/* Ground Photo */}
            <div className="field">
              <span>Ground photo (optional)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageFile}
              />
              {imageUrl ? (
                <div style={{ position: "relative", width: "100%", height: "140px", borderRadius: "8px", border: "1px solid var(--border)", overflow: "hidden" }}>
                  <img src={imageUrl} alt="Ground preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "rgba(0,0,0,0.8)",
                      border: "1px solid #ef4444",
                      color: "#ef4444",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "14px",
                    borderRadius: "8px",
                    border: "1px dashed var(--border)",
                    background: "var(--asphalt-2)",
                    color: "var(--smoke)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Camera size={16} /> Tap to upload or take a ground photo
                </button>
              )}
            </div>

            <label className="field">
              <span>Notes for ballers (optional)</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Surface condition, lights, evening pickup hours, who to ask for ball…"
                maxLength={240}
                rows={2}
              />
            </label>

            <div className="form-section-heading form-section-heading--map">
              <div>
                <p className="eyebrow">MAP POSITION</p>
                <h2>MARK CAMPUS SPOT</h2>
              </div>
            </div>

            <div
              className="pin-drop-surface"
              onClick={placePin}
              role="button"
              tabIndex={0}
              aria-label="Set map pin position"
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") setPin({ x: 52, y: 48 });
              }}
            >
              <MapPlaceholder />
              <span className="selected-pin" style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
                <MapPin size={24} fill="currentColor" />
              </span>
              <span className="pin-drop-hint">
                <MapPin size={12} /> Tap map to position pin
              </span>
            </div>

            <Notice tone="info" className="map-disclaimer">
              This publishes the ground to {activeCampusObj?.name || "your campus"}. All students on this radar will see it immediately.
            </Notice>

            <AsyncButton type="submit" busy={busy} className="button--full button--green">
              <Save size={16} /> Publish ground to campus
            </AsyncButton>
          </form>

          <div className="add-footnote">Synced directly with {activeCampusObj?.shortName || "campus"} ground radar</div>
        </>
      )}
    </AppFrame>
  );
}
