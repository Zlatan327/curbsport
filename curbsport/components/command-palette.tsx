"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Command, MapPin, Search, UserRound, X } from "lucide-react";
import { campuses, demoPitches } from "@/lib/data";
import { useAppStore } from "@/store/app-store";

interface Props { open: boolean; onClose: () => void; }

export function CommandPalette({ open, onClose }: Props) {
  const router = useRouter();
  const setCampus = useAppStore((state) => state.setCampus);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groundItems = demoPitches.map((pitch) => ({ label: pitch.name, detail: `${pitch.campusId} · ${pitch.landmark}`, href: `/pitches/${pitch.id}`, icon: "ground" as const }));
    const campusItems = campuses.map((campus) => ({ label: campus.shortName, detail: campus.city, href: `/?campus=${campus.id}`, icon: "ground" as const }));
    const routeItems = [
      { label: "Player locker room", detail: "Your reputation, stats & match history", href: "/profile", icon: "player" as const },
      { label: "Drop a pin", detail: "Register a community-discovered ground", href: "/add", icon: "ground" as const },
    ];
    const items = [...groundItems, ...campusItems, ...routeItems];
    return (q ? items.filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(q)) : items).slice(0, 8);
  }, [query]);

  const openResult = useCallback((href: string) => {
    const target = new URL(href, window.location.origin);
    const campusId = target.searchParams.get("campus");
    if (target.pathname === "/" && campusId) { setCampus(campusId); router.push("/"); }
    else router.push(href);
    onClose();
  }, [onClose, router, setCampus]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowDown") { event.preventDefault(); setActive((index) => (index + 1) % Math.max(results.length, 1)); }
      if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => (index - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1)); }
      if (event.key === "Enter" && results[active]) openResult(results[active].href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onClose, open, openResult, results]);

  if (!open) return null;
  return <div className="command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="command-dialog" role="dialog" aria-modal="true" aria-label="Search grounds, players, and campuses">
      <div className="command-input-row"><Search size={18} aria-hidden="true" /><input ref={inputRef} className="command-input" placeholder="Search grounds, players, campuses…" value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} aria-label="Search Curbsport" aria-controls="command-results" /><button type="button" className="icon-button" onClick={onClose} aria-label="Close search"><X size={16} /></button></div>
      <div className="command-results" id="command-results" role="listbox" aria-label="Search results"><div className="command-label">{query ? "MATCHES" : "QUICK JUMP"}</div>
        {results.map((item, index) => <button type="button" role="option" aria-selected={index === active} className={`command-option ${index === active ? "is-active" : ""}`} key={`${item.href}-${item.label}`} onMouseEnter={() => setActive(index)} onClick={() => openResult(item.href)}>{item.icon === "player" ? <UserRound size={16} /> : <MapPin size={16} />}<span className="command-option-copy"><strong>{item.label}</strong><span>{item.detail}</span></span><ArrowDown size={13} aria-hidden="true" /></button>)}
        {results.length === 0 && <div className="empty-state">No grounds or campuses match that search.</div>}
      </div>
      <div className="command-footer"><span><ArrowUp size={12} /> <ArrowDown size={12} /> to navigate · Enter to open</span><span><Command size={12} /> K to search · Esc to close</span></div>
    </section>
  </div>;
}
