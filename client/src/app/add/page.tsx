"use client";

import { useState, useRef, type ChangeEvent, type FormEvent, type MouseEvent } from "react";
import { ArrowUpRight, Camera, MapPin, Save, Trash2 } from "lucide-react";
import { z } from "zod";
import { AppFrame } from "@/components/app-frame";
import { MapPlaceholder } from "@/components/map-placeholder";
import { Notice } from "@/components/notice";
import { AsyncButton } from "@/components/async-button";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { useAuthStore } from "@/store/auth";
import { createPitch } from "@/lib/api";

const pitchSchema = z.object({
  name: z.string().trim().min(3, "Give this ground a name (at least 3 characters)."),
  area: z.string().trim().min(2, "Add the local area or community."),
  address: z.string().trim().min(4, "Add a landmark or directions players can use."),
  description: z.string().trim().max(240, "Keep the description under 240 characters."),
});

export default function AddPitchPage() {
  const { token, user, hydrated } = useAuthStore();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [sportType, setSportType] = useState<"FOOTBALL" | "BASKETBALL">(
    user?.primarySport === "BASKETBALL" ? "BASKETBALL" : "FOOTBALL"
  );
  const [status, setStatus] = useState("DRY");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pin, setPin] = useState({ x: 52, y: 48 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function placePin(event: MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPin({ x: Math.round(((event.clientX - bounds.left) / bounds.width) * 100), y: Math.round(((event.clientY - bounds.top) / bounds.height) * 100) });
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
      await createPitch({
        name,
        sportType,
        address: `${area} — ${address}`,
        landmarkDescription: `${area} — ${address}${description ? `. Note: ${description}` : ""}`,
        imageUrl: imageUrl || undefined,
        schoolId: Number(user?.schoolId || 1),
      });
      const draft = { ...result.data, sportType, status, imageUrl, mapX: pin.x, mapY: pin.y, createdAt: new Date().toISOString(), savedLocally: true };
      const draftsRaw = window.localStorage.getItem("curbsport-pitch-drafts") || window.localStorage.getItem("inside-life-pitch-drafts") || "[]";
      const savedDrafts = JSON.parse(draftsRaw) as unknown[];
      const updatedDrafts = JSON.stringify([draft, ...savedDrafts]);
      window.localStorage.setItem("curbsport-pitch-drafts", updatedDrafts);
      window.localStorage.setItem("inside-life-pitch-drafts", updatedDrafts);
      setSaved(true);
      setName(""); setArea(""); setAddress(""); setDescription(""); setImageUrl(null);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Could not publish ground to the server.");
    } finally {
      setBusy(false);
    }
  }

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
            {saved && (
              <Notice tone="success">
                <strong>Ground published!</strong> Your pitch is now active on the campus board for the community to play and verify.
              </Notice>
            )}

            {/* Sport Type Selector */}
            <div className="field">
              <span>Sport type</span>
              <div className="sport-filter-bar" style={{ margin: "4px 0" }}>
                <button
                  type="button"
                  className={`sport-filter-btn${sportType === "FOOTBALL" ? " is-active-football" : ""}`}
                  onClick={() => setSportType("FOOTBALL")}
                >
                  ⚽ Football (Soccer)
                </button>
                <button
                  type="button"
                  className={`sport-filter-btn${sportType === "BASKETBALL" ? " is-active-basketball" : ""}`}
                  onClick={() => setSportType("BASKETBALL")}
                >
                  🏀 Basketball
                </button>
              </div>
            </div>

            <label className="field">
              <span>Ground name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. New Hall Quad Court"
                maxLength={60}
                required
              />
            </label>

            <label className="field">
              <span>Area or community</span>
              <input
                value={area}
                onChange={(event) => setArea(event.target.value)}
                placeholder="e.g. Campus Central / Faculty of Arts"
                maxLength={60}
                required
              />
            </label>

            <label className="field">
              <span>Directions & landmarks</span>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Behind the hostel library, take the stone path…"
                maxLength={120}
                required
              />
            </label>

            <label className="field">
              <span>Current status</span>
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
                placeholder="Surface condition, lights, evening pickup hours, bring a ball…"
                maxLength={240}
                rows={3}
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
              This pins the ground to your active campus. Nearby ballers will be alerted on their feed.
            </Notice>

            <AsyncButton type="submit" busy={busy} className="button--full button--green">
              <Save size={16} /> Publish ground
            </AsyncButton>
          </form>

          <div className="add-footnote">Synced directly with campus radar</div>
        </>
      )}
    </AppFrame>
  );
}
