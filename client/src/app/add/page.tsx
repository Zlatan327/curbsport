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
      const savedDrafts = JSON.parse(window.localStorage.getItem("inside-life-pitch-drafts") || "[]") as unknown[];
      window.localStorage.setItem("inside-life-pitch-drafts", JSON.stringify([draft, ...savedDrafts]));
      setSaved(true);
      setName(""); setArea(""); setAddress(""); setDescription(""); setImageUrl(null);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Could not publish ground to the server.");
    } finally {
      setBusy(false);
    }
  }

  return <AppFrame>
    <section className="page-intro page-intro--add"><p className="eyebrow">MAKE THE GROUND KNOWN</p><h1>DROP<br /><em>A PIN.</em></h1><p>Know a spot? Put your people on.</p></section>
    {!hydrated ? <div className="sign-in-loading">Checking player session…</div> : !token ? <SignInPrompt title="Rep your ground." copy="Log in before adding a local pitch draft." /> : <>
      <form className="pitch-form" onSubmit={submit}>
        <div className="form-section-heading"><span>01</span><div><p className="eyebrow">PITCH DETAILS</p><h2>NAME THE GROUND</h2></div></div>
        {error && <Notice tone="warning">{error}</Notice>}
        {saved && <Notice tone="success"><strong>Ground published!</strong> Your pitch is now active on the campus board for the community to play and verify.</Notice>}
        
        {/* Sport Type Selector */}
        <div className="field">
          <span>SPORT TYPE</span>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={() => setSportType("FOOTBALL")}
              style={{
                flex: 1,
                padding: "9px 12px",
                border: sportType === "FOOTBALL" ? "2px solid #00f076" : "1px solid #333",
                background: sportType === "FOOTBALL" ? "#00381b" : "#191c19",
                color: sportType === "FOOTBALL" ? "#00f076" : "#aaa",
                fontWeight: 700,
                fontSize: "10px",
                cursor: "pointer",
              }}
            >
              ⚽ FOOTBALL (SOCCER)
            </button>
            <button
              type="button"
              onClick={() => setSportType("BASKETBALL")}
              style={{
                flex: 1,
                padding: "9px 12px",
                border: sportType === "BASKETBALL" ? "2px solid #00f076" : "1px solid #333",
                background: sportType === "BASKETBALL" ? "#00381b" : "#191c19",
                color: sportType === "BASKETBALL" ? "#00f076" : "#aaa",
                fontWeight: 700,
                fontSize: "10px",
                cursor: "pointer",
              }}
            >
              🏀 BASKETBALL
            </button>
          </div>
        </div>

        <label className="field"><span>GROUND NAME</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ochanja South Court" maxLength={60} required /></label>
        <label className="field"><span>AREA / COMMUNITY</span><input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Onitsha South" maxLength={60} required /></label>
        <label className="field"><span>LANDMARK / DIRECTIONS</span><input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="By the old motor park, opposite…" maxLength={120} required /></label>
        <label className="field"><span>GROUND STATUS</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="DRY">DRY — ready to play</option><option value="BUILDING">BUILDING — needs confirmation</option><option value="LIVE">LIVE — set happening now</option></select></label>
        
        {/* Ground Photo */}
        <div className="field">
          <span>GROUND PHOTO <small>OPTIONAL</small></span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageFile}
          />
          {imageUrl ? (
            <div style={{ position: "relative", width: "100%", height: "140px", border: "1px solid var(--turf)", overflow: "hidden" }}>
              <img src={imageUrl} alt="Ground preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "rgba(0,0,0,0.75)",
                  border: "1px solid #ff4444",
                  color: "#ff4444",
                  padding: "4px 8px",
                  fontSize: "9px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Trash2 size={12} /> REMOVE
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
                padding: "12px",
                border: "1px dashed var(--border)",
                background: "#181b18",
                color: "var(--smoke)",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Camera size={16} /> TAP TO SNAP OR CHOOSE GROUND PHOTO
            </button>
          )}
        </div>

        <label className="field"><span>NOTES FOR PLAYERS <small>OPTIONAL / 240 CHARACTERS</small></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Surface, best time to pull up, bring your own ball…" maxLength={240} rows={3} /></label>
        <div className="form-section-heading form-section-heading--map"><span>02</span><div><p className="eyebrow">PIN PREVIEW</p><h2>MARK THE SPOT</h2></div></div>
        <div className="pin-drop-surface" onClick={placePin} role="button" tabIndex={0} aria-label="Choose a decorative map preview location" onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setPin({ x: 52, y: 48 }); }}>
          <MapPlaceholder />
          <span className="selected-pin" style={{ left: `${pin.x}%`, top: `${pin.y}%` }}><MapPin size={25} fill="currentColor" /></span>
          <span className="pin-drop-hint"><MapPin size={12} /> TAP THE MAP TO SET A PREVIEW PIN</span>
        </div>
        <Notice tone="info" className="map-disclaimer">This pins the ground to your active campus. Other ballers nearby will be notified.</Notice>
        <AsyncButton type="submit" busy={busy} className="button--full"><Save size={16} /> PUBLISH GROUND <ArrowUpRight size={17} /></AsyncButton>
      </form>
      <div className="add-footnote">LIVE ON INSIDE LIFE · SYNCS DIRECTLY WITH CAMPUS RADAR</div>
    </>}
  </AppFrame>;
}
