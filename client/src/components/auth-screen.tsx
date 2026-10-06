import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Crosshair } from "lucide-react";
import { Brand } from "@/components/brand";

export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <main className="auth-screen">
      <div className="auth-screen__noise" />
      <header className="auth-screen__header"><Brand /><span className="auth-live"><i /> OPEN PLAY / ANAMBRA</span></header>
      <Link href="/" className="auth-back"><ArrowLeft size={15} /> BACK TO THE GROUND</Link>
      {children}
      <div className="auth-screen__footer"><span><Crosshair size={13} /> LOCAL GAME. LOCAL PEOPLE.</span><span>EST. ON THE STREET</span></div>
    </main>
  );
}
