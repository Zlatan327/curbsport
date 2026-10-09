"use client";

import { useState, type FormEvent, type MouseEvent } from "react";
import { ArrowUpRight, MapPin, Save } from "lucide-react";
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
  const [status, setStatus] = useState("DRY");
  const [pin, setPin] = useState({ x: 52, y: 48 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function placePin(event: MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPin({ x: Math.round(((event.clientX - bounds.left) / bounds.width) * 100), y: Math.round(((event.clientY - bounds.top) / bounds.height) * 100) });
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
        address: `${area} — ${address}`,
        landmarkDescription: `${area} — ${address}${description ? `. Note: ${description}` : ""}`,
        schoolId: Number(user?.schoolId || 1),
      });
      const draft = { ...result.data, status, mapX: pin.x, mapY: pin.y, createdAt: new Date().toISOString(), savedLocally: true };
      const savedDrafts = JSON.parse(window.localStorage.getItem("inside-life-pitch-drafts") || "[]") as unknown[];
      window.localStorage.setItem("inside-life-pitch-drafts", JSON.stringify([draft, ...savedDrafts]));
      setSaved(true);
      setName(""); setArea(""); setAddress(""); setDescription("");
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
        <label className="field"><span>GROUND NAME</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ochanja South Court" maxLength={60} required /></label>
        <label className="field"><span>AREA / COMMUNITY</span><input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Onitsha South" maxLength={60} required /></label>
        <label className="field"><span>LANDMARK / DIRECTIONS</span><input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="By the old motor park, opposite…" maxLength={120} required /></label>
        <label className="field"><span>GROUND STATUS</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="DRY">DRY — ready to play</option><option value="BUILDING">BUILDING — needs confirmation</option><option value="LIVE">LIVE — set happening now</option></select></label>
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
