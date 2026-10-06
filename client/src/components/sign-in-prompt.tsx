import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export function SignInPrompt({ title = "You need a name on the team.", copy = "Sign in to get on a set, save your area, and rep your local ground." }: { title?: string; copy?: string }) {
  return (
    <section className="sign-in-prompt">
      <span className="sign-in-prompt__icon"><LockKeyhole size={20} /></span>
      <p className="eyebrow">PLAYERS ONLY</p>
      <h2>{title}</h2>
      <p>{copy}</p>
      <div className="button-row">
        <Link className="button button--green" href="/login">LOG IN <span>↗</span></Link>
        <Link className="button button--outline" href="/register">JOIN THE SET</Link>
      </div>
    </section>
  );
}
