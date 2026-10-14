"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Map, Plus, Search, ShieldCheck, UserRound } from "lucide-react";
import { campuses, demoPitches } from "@/lib/data";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { BrandLockup } from "@/components/brand";
import { CommandPalette } from "@/components/command-palette";
import { RealtimeBridge } from "@/components/realtime-bridge";

function SportToggle() {
  const sport = useAppStore((state) => state.sport);
  const setSport = useAppStore((state) => state.setSport);
  return (
    <div className="sport-toggle" role="group" aria-label="Choose a sport">
      <button className={`sport-button ${sport === "football" ? "is-active" : ""}`} type="button" aria-pressed={sport === "football"} onClick={() => setSport("football")}><span className="sport-dot" aria-hidden="true">⚽</span>Football</button>
      <button className={`sport-button ${sport === "basketball" ? "is-active" : ""}`} type="button" aria-pressed={sport === "basketball"} onClick={() => setSport("basketball")}><span className="sport-dot" aria-hidden="true">🏀</span>Basketball</button>
    </div>
  );
}

function CampusSelect() {
  const campusId = useAppStore((state) => state.campusId);
  const setCampus = useAppStore((state) => state.setCampus);
  return (
    <label className="campus-select-wrap">
      <span className="sr-only">Select campus</span>
      <select className="campus-select" value={campusId} onChange={(event) => setCampus(event.target.value)}>
        {campuses.map((campus) => <option value={campus.id} key={campus.id}>{campus.shortName} · {campus.city}</option>)}
      </select>
    </label>
  );
}

function MobileNavigation() {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Radar", icon: Activity, active: pathname === "/" },
    { href: "/#ground-map", label: "Grounds", icon: Map, active: pathname.startsWith("/pitches") },
    { href: "/add", label: "Drop pin", icon: Plus, active: pathname === "/add" },
    { href: "/profile", label: "Locker", icon: UserRound, active: pathname === "/profile" },
  ];
  return (
    <nav className="mobile-nav" aria-label="Primary navigation">
      {items.map(({ href, label, icon: Icon, active }) => <Link href={href} key={label} className={`mobile-nav-link ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined}><Icon size={19} strokeWidth={active ? 2.3 : 1.8} aria-hidden="true" /><span>{label}</span></Link>)}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const initializeAuth = useAuthStore((state) => state.initialize);
  const campusId = useAppStore((state) => state.campusId);
  const visibleSets = demoPitches.filter((pitch) => pitch.campusId === campusId).reduce((count, pitch) => count + pitch.sets.length, 0);
  const openSearch = useCallback(() => setSearchOpen(true), []);

  useEffect(() => { initializeAuth(); }, [initializeAuth]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openSearch(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openSearch]);

  return (
    <>
      <RealtimeBridge />
      <header className="topbar">
        <div className="topbar-inner">
          <BrandLockup />
          <div className="topbar-controls"><CampusSelect /><SportToggle /></div>
          <div className="topbar-actions">
            <button type="button" className="icon-button" onClick={openSearch} aria-label="Search grounds, players, and campuses"><Search size={17} /><span className="sr-only">Search</span></button>
            <Link href="/add" className="drop-pin-button"><Plus size={16} aria-hidden="true" />Drop a Pin</Link>
            <div className="set-counter" title={`${visibleSets} illustrative sample sets on this campus`}><Activity size={14} aria-hidden="true" /><strong>{visibleSets}</strong> SAMPLE SETS</div>
            <Link href="/profile" className="profile-chip" aria-label="Sample player profile, reputation 94"><span className="avatar is-small" style={{ background: "linear-gradient(145deg,#1b4a31,#111311)" }}>TR</span><span className="profile-chip-copy"><strong>Tobi R.</strong><span><ShieldCheck size={11} style={{ display: "inline", verticalAlign: "-1px" }} /> SAMPLE · REP 94</span></span></Link>
          </div>
        </div>
        <div className="mobile-header-row"><CampusSelect /><div className="set-counter" title="Illustrative sample set count"><Activity size={13} aria-hidden="true" /><strong>{visibleSets}</strong> SAMPLE SETS</div></div>
        <div className="mobile-sport-row"><SportToggle /></div>
      </header>
      <div className="page-shell">{children}</div>
      <MobileNavigation />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
