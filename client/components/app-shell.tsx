"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LogIn, LogOut, Map, Plus, Search, ShieldCheck, UserRound } from "lucide-react";
import { campuses, demoPitches } from "@/lib/data";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { BrandLockup } from "@/components/brand";
import { CommandPalette } from "@/components/command-palette";
import { RealtimeBridge } from "@/components/realtime-bridge";
import { AuthModal } from "@/components/auth-modal";

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
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const initializeAuth = useAuthStore((state) => state.initialize);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
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
            <div className="set-counter" title={`${visibleSets} active sets on this campus`}><Activity size={14} aria-hidden="true" /><strong>{visibleSets}</strong> SETS</div>
            
            {token && user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className="profile-chip" aria-label={`Player profile for ${user.alias}`}>
                  <span className="avatar is-small" style={{ background: "linear-gradient(145deg,#1b4a31,#111311)" }}>
                    {user.alias.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="profile-chip-copy">
                    <strong>{user.alias}</strong>
                    <span><ShieldCheck size={11} style={{ display: "inline", verticalAlign: "-1px" }} /> REP {user.reputationScore ?? 10}</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="icon-button text-red-400 hover:text-red-300 hover:border-red-500/40"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode("login"); setAuthModalOpen(true); }}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 border border-[#F0F0E8]/20 hover:border-[#00FF66] bg-[#191C19] text-xs font-bold uppercase tracking-wider text-[#F0F0E8] rounded-md transition-colors"
                >
                  <LogIn size={14} />
                  <span>Log In</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode("register"); setAuthModalOpen(true); }}
                  className="inline-flex items-center justify-center min-h-[40px] px-3.5 bg-[#00FF66] hover:bg-[#00FF66]/90 text-black text-xs font-bold uppercase tracking-wider rounded-md transition-colors"
                >
                  Join
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mobile-header-row flex items-center justify-between px-4 py-2 border-t border-[#F0F0E8]/10 bg-[#111311]">
          <CampusSelect />
          <div className="flex items-center gap-2">
            {token && user ? (
              <button
                type="button"
                onClick={() => logout()}
                className="text-xs text-red-400 font-semibold uppercase tracking-wider px-2 py-1 rounded border border-red-500/30"
              >
                Log Out ({user.alias})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setAuthMode("login"); setAuthModalOpen(true); }}
                className="text-xs text-[#00FF66] font-semibold uppercase tracking-wider px-2 py-1 rounded border border-[#00FF66]/40"
              >
                Log In
              </button>
            )}
          </div>
        </div>
        <div className="mobile-sport-row"><SportToggle /></div>
      </header>
      <div className="page-shell">{children}</div>
      <MobileNavigation />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AuthModal open={authModalOpen} initialMode={authMode} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
