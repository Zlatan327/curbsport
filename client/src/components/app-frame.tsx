"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, House, MapPinned, Plus, UserRound, Bell } from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { useSchoolId } from "@/hooks/use-school-id";
import { getSocket } from "@/lib/socket";

const navigation = [
  { href: "/", label: "Feed", icon: House },
  { href: "/map", label: "Map", icon: MapPinned },
  { href: "/add", label: "Add", icon: Plus, accent: true },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { schoolId, schoolName } = useSchoolId();
  const [n1p, setN1p] = useState<{ message: string; pitchId: number } | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    const socket = getSocket();
    
    socket.emit("join_school", schoolId);

    const handleAlert = (data: { message: string; pitchId: number }) => {
      setN1p(data);
      // Auto-hide after 5 seconds
      setTimeout(() => setN1p(null), 5000);
    };

    socket.on("n1p:alert", handleAlert);
    socket.on("ball:alert", handleAlert);

    return () => {
      socket.off("n1p:alert", handleAlert);
      socket.off("ball:alert", handleAlert);
    };
  }, [schoolId]);

  return (
    <div className="app-frame">
      <header className="topbar">
        <Brand />
        <Link href="/profile" className="city-pill" aria-label="Change your school in Profile">
          <Compass size={14} />
          <span>{schoolName.toUpperCase()}</span>
        </Link>
      </header>
      
      {n1p && (
        <div className="n1p-toast" style={{ background: '#f59e0b', color: 'black', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px' }}>
          <Bell size={16} /> 
          <span style={{ flex: 1 }}>{n1p.message}</span>
          <Link href={`/pitches/${n1p.pitchId}`} style={{ background: 'black', color: 'white', padding: '4px 8px', borderRadius: '4px' }}>GO</Link>
        </div>
      )}

      <main className="page-content">{children}</main>
      <nav className="bottom-nav" aria-label="Main navigation">
        {navigation.map(({ href, label, icon: Icon, accent }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`nav-item${active ? " is-active" : ""}${accent ? " nav-item--add" : ""}`} aria-current={active ? "page" : undefined}>
              <span className="nav-icon"><Icon size={20} strokeWidth={active ? 2.8 : 2.2} /></span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
