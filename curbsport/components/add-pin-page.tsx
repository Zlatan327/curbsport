"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CircleHelp, ImagePlus, MapPin, Moon, Sun } from "lucide-react";
import { campuses } from "@/lib/data";
import { apiRequest, isApiConfigured } from "@/lib/api";
import type { Surface } from "@/lib/types";
import { useToast } from "@/components/toast";

const surfaces: Surface[] = ["Turf", "Red sand", "Concrete", "Natural grass"];
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export function AddPinPage() {
  const router = useRouter();
  const { showToast, ToastViewport } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [campusId, setCampusId] = useState("UNILAG");
  const [name, setName] = useState("");
  const [landmark, setLandmark] = useState("");
  const [sport, setSport] = useState<"football" | "basketball">("football");
  const [surface, setSurface] = useState<Surface>("Turf");
  const [notes, setNotes] = useState("");
  const [floodlights, setFloodlights] = useState(false);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!photo) { setPhotoPreview(null); return; }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const selectPoint = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPoint({ x: Math.round(((event.clientX - rect.left) / rect.width) * 100), y: Math.round(((event.clientY - rect.top) / rect.height) * 100) });
  };

  const continueToDetails = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!point) { setMessage("Drop a pin on the campus schematic to continue."); return; }
    setMessage(null);
    setStep(2);
  };

  const submitPin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!isApiConfigured()) {
      setMessage("Demo mode: the pin was not submitted. Configure NEXT_PUBLIC_API_URL and the Express POST /pitches contract to publish it.");
      return;
    }
    setSubmitting(true);
    const payload = new FormData();
    payload.set("campusId", campusId);
    payload.set("name", name.trim());
    payload.set("landmark", landmark.trim());
    payload.set("sport", sport);
    payload.set("surface", surface);
    payload.set("notes", notes.trim());
    payload.set("floodlights", String(floodlights));
    payload.set("mapX", String(point?.x ?? 50));
    payload.set("mapY", String(point?.y ?? 50));
    if (photo) payload.set("photo", photo);
    try {
      await apiRequest<unknown>("/pitches", { method: "POST", body: payload });
      setMessage("The ground pin was accepted by the server.");
      showToast("Pin submitted", "The server accepted this ground registration.", "success");
      window.setTimeout(() => router.push("/"), 1500);
    } catch (error) {
      setMessage(error instanceof Error ? `${error.message} No pin was marked as published.` : "The server could not confirm this pin submission.");
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="page-content">
    <div className="page-header"><div className="page-header-copy"><div className="breadcrumb"><Link href="/">Radar</Link><span>/</span><span>Community pin</span></div><h1 className="page-title">Drop a pin.</h1><p className="page-subtitle">Know a ground the radar is missing? Map the spot, add the conditions and help the next set find it.</p></div><span className={`status-pill ${message?.startsWith("The ground pin was accepted") ? "is-building" : ""}`}>{message?.startsWith("The ground pin was accepted") ? "SUBMITTED · PENDING REVIEW" : "DRAFT · NOT LIVE"}</span></div>
    <div className="stepper" aria-label={`Step ${step} of 2`}><span className={`step-item ${step === 1 ? "is-active" : ""}`}><i className="step-number">{step > 1 ? <Check size={13} /> : "1"}</i>Location</span><span className="step-divider" /><span className={`step-item ${step === 2 ? "is-active" : ""}`}><i className="step-number">2</i>Ground details</span></div>
    <div className="add-layout" style={{ marginTop: 18 }}>
      <section className="panel"><div className="panel-head"><h2>{step === 1 ? "Place the ground" : "Ground details"}</h2><span className="eyebrow">STEP 0{step} / 02</span></div><div className="panel-body">
        {step === 1 ? <form className="form-grid" onSubmit={continueToDetails}>
          <div className="field"><label htmlFor="campus">Campus</label><select id="campus" className="select-input" value={campusId} onChange={(event) => setCampusId(event.target.value)}>{campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.shortName} · {campus.city}</option>)}</select></div>
          <div className="field"><label htmlFor="sport">Sport</label><select id="sport" className="select-input" value={sport} onChange={(event) => setSport(event.target.value as "football" | "basketball")}><option value="football">⚽ Football</option><option value="basketball">🏀 Basketball</option></select></div>
          <div className="field full"><label htmlFor="ground-name">Ground name</label><input id="ground-name" className="input" placeholder="e.g. Moremi Car Park Court" value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={70} required /></div>
          <div className="field full"><label htmlFor="landmark">Landmark / directions</label><input id="landmark" className="input" placeholder="A quick reference so your set can find the spot" value={landmark} onChange={(event) => setLandmark(event.target.value)} maxLength={120} required /></div>
          <div className="field full"><span className="field-label">Map point · {point ? `X ${point.x} / Y ${point.y}` : "tap or click the schematic"}</span><div ref={mapRef} className="coordinate-map" role="group" aria-label="Place the ground pin on a schematic campus map" onClick={selectPoint} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && event.currentTarget === event.target) { event.preventDefault(); setPoint((current) => current ? { x: (current.x + 7) % 100, y: (current.y + 7) % 100 } : { x: 50, y: 50 }); } }} tabIndex={0}>
            <svg viewBox="0 0 500 360" role="img" aria-label="Campus path schematic"><path d="M18 257 C142 242 148 107 270 115 S368 163 485 71M45 22 C121 99 202 180 260 214 S359 292 462 345M54 28 C177 70 332 74 485 71" fill="none" stroke="rgba(240,240,232,.18)" strokeWidth="2" strokeDasharray="6 7" /><path d="M186 137h116v69H186zM201 154h85M244 138v67M186 154h14v34h-14M288 154h14v34h-14" fill="rgba(0,255,102,.025)" stroke="rgba(0,255,102,.2)" strokeDasharray="4 5" /></svg>
            <span className="map-maplabel" style={{ left: "13%", top: "30%" }}>MAIN WALK</span><span className="map-maplabel" style={{ left: "62%", top: "70%" }}>SPORTS COMPLEX</span>{point && <span className="coordinate-pin" style={{ left: `${point.x}%`, top: `${point.y}%` }}><MapPin size={18} /></span>}<span className="coordinate-instructions">SCHEMATIC POSITION · NOT GPS · TAP TO DROP PIN</span>
          </div><span className="field-note"><CircleHelp size={12} style={{ display: "inline", verticalAlign: "-2px" }} /> Pin placement is relative to this campus schematic; this interface does not claim exact GPS coordinates.</span></div>
          {message && <div className="field full inline-feedback" role="alert">{message}</div>}<div className="field full form-step-footer"><button type="submit" className="primary-button">Continue to ground details <ArrowRight size={15} /></button></div>
        </form> : <form className="form-grid" onSubmit={submitPin}>
          <div className="field full"><span className="field-label">{name} · {campusId}</span><span className="field-note">{landmark} · map position X {point?.x} / Y {point?.y}</span></div>
          <div className="field full"><span className="field-label">Surface type</span><div className="segment-picker" role="group" aria-label="Choose a ground surface">{surfaces.map((item) => <button type="button" className={`segment-option ${surface === item ? "is-active" : ""}`} aria-pressed={surface === item} key={item} onClick={() => setSurface(item)}>{item}</button>)}</div></div>
          <div className="field full"><span className="field-label">Ground photo · optional</span><label className="upload-zone" htmlFor="photo-upload"><input id="photo-upload" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0] ?? null; if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setPhoto(null); setMessage("Choose a JPG, PNG or WebP image."); return; } if (file && file.size > MAX_PHOTO_BYTES) { setPhoto(null); setMessage("Choose an image no larger than 10 MB."); return; } setMessage(null); setPhoto(file); }} /><ImagePlus size={21} /><strong>{photo ? photo.name : "Tap to add a pitch or court photo"}</strong><span>JPG, PNG or WebP · up to 10 MB</span>{photoPreview && <Image className="upload-preview" src={photoPreview} alt="Local preview of the selected ground" width={600} height={400} unoptimized />}</label><span className="field-note">Photos preview locally until the configured API confirms upload.</span></div>
          <div className="field full"><label htmlFor="ground-notes">Notes for players</label><textarea id="ground-notes" className="textarea" placeholder="Court dry? Gate access? Bring a ball? Useful details for the next crew…" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={280} /></div>
          <div className="field full"><button type="button" className="secondary-button" onClick={() => setFloodlights((value) => !value)} aria-pressed={floodlights}>{floodlights ? <Sun size={14} /> : <Moon size={14} />}{floodlights ? "Floodlights available" : "No floodlights / not confirmed"}</button></div>
          {message && <div className={`field full inline-feedback ${message.startsWith("The ground pin was accepted") ? "is-success" : ""}`} role="status">{message.startsWith("The ground pin was accepted") ? <CheckCircle2 size={14} /> : <CircleHelp size={14} />}{message}</div>}
          <div className="field full form-step-footer" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><button type="button" className="secondary-button" onClick={() => { setStep(1); setMessage(null); }}><ArrowLeft size={14} />Back</button><button type="submit" className="primary-button" disabled={submitting}>{submitting ? "Submitting…" : "Submit ground pin"}<ArrowRight size={14} /></button></div>
        </form>}
      </div></section>
      <aside className="stack"><section className="panel"><div className="panel-head"><h2>Before you pin</h2></div><div className="panel-body"><div className="inline-feedback"><CheckCircle2 size={14} />Only add a ground you have visited. Verify access, surface and location with your campus crew.</div><div className="divider" /><p className="soft-copy">Community-discovered grounds stay marked unverified until they are checked by players on-site. Never add a private residential address.</p></div></section>
        <section className="panel"><div className="panel-head"><h2>Pin preview</h2><span className="status-pill">{message?.startsWith("The ground pin was accepted") ? "SUBMITTED" : "DRAFT"}</span></div><div className="panel-body"><div className="selected-ground-header"><div><h3>{name || "Unnamed ground"}</h3><p>{landmark || "Add a landmark or directions"}</p></div><MapPin size={18} color="var(--turf)" /></div><div className="divider" /><div className="selected-ground-facts"><span className="fact-chip">{surface}</span><span className="fact-chip">{sport === "football" ? "⚽ Football" : "🏀 Basketball"}</span>{floodlights && <span className="fact-chip"><Sun size={12} />Floodlights</span>}</div><p className="map-note"><CircleHelp size={13} />{message?.startsWith("The ground pin was accepted") ? "Submitted to the server; awaiting community verification before appearing to players." : "Not visible to other players until the server accepts the pin."}</p></div></section>
      </aside>
    </div><ToastViewport />
  </main>;
}
