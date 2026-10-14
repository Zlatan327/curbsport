"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, ChevronRight, LockKeyhole, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { campuses, profileMatches, samplePlayers } from "@/lib/data";
import { isApiConfigured, postDemoAware } from "@/lib/api";
import { DemoIndicator, PlayerAvatar } from "@/components/ui";
import { useToast } from "@/components/toast";

export function ProfilePage() {
  const { showToast, ToastViewport } = useToast();
  const player = samplePlayers[0];
  const campus = campuses.find((item) => item.id === player.campusId)!;
  const [height, setHeight] = useState("176");
  const [weight, setWeight] = useState("70");
  const [saved, setSaved] = useState(false);

  const saveBiometrics = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isApiConfigured()) {
      setSaved(true);
      showToast("Saved in this demo session", "Biometrics were not sent to an account server.", "success");
      return;
    }
    try {
      await postDemoAware("/users/me/biometrics", { heightCm: Number(height), weightKg: Number(weight) });
      setSaved(true);
      showToast("Biometrics updated", "The server accepted your private profile change.", "success");
    } catch (error) {
      setSaved(false);
      showToast("Update not saved", error instanceof Error ? error.message : "The server could not confirm the update.");
    }
  };

  return <main className="page-content">
    <div className="page-header"><div className="page-header-copy"><div className="breadcrumb"><Link href="/">Radar</Link><span>/</span><span>Locker room</span></div><h1 className="page-title">Player locker</h1><p className="page-subtitle">Your game, verified by the people you play against. Reputation comes from the ground—not the group chat.</p><DemoIndicator compact /></div><Link href="/" className="secondary-button"><ArrowLeft size={14} />Back to radar</Link></div>
    <div className="profile-layout">
      <div className="stack">
        <section className="player-hero-card">
          <div className="player-hero-top"><div className="player-identity"><PlayerAvatar player={player} size="large" /><div><h2 className="player-hero-name">{player.alias}</h2><div className="player-campus">{campus.shortName} · {campus.city}</div></div></div><div className="rep-score"><strong>{player.reputation}</strong><span>REP SCORE</span></div></div>
          <div className="tier-bar" aria-label="Campus Legend tier progress"><span /></div><div className="tier-track"><span>ROOKIE</span><span>BALLER</span><strong>CAMPUS LEGEND</strong></div>
          <div className="player-facts"><div className="player-fact"><span>Primary sport</span><strong>⚽ Football</strong></div><div className="player-fact"><span>Favorite position</span><strong>Forward · FWD</strong></div><div className="player-fact"><span>Ground crown</span><strong><Trophy size={13} style={{ display: "inline", verticalAlign: "-2px", color: "var(--amber)" }} /> 4× King</strong></div><div className="player-fact"><span>Peer checks</span><strong><ShieldCheck size={13} style={{ display: "inline", verticalAlign: "-2px", color: "var(--turf)" }} /> Verified</strong></div></div>
          <div className="divider" /><div className="inline-feedback"><Sparkles size={14} />Campus Legend · top reputation is based on opponent-confirmed match results.</div>
        </section>

        <section className="panel" aria-labelledby="biometrics-heading">
          <div className="panel-head"><h2 id="biometrics-heading">Private biometrics</h2><span className="status-pill"><LockKeyhole size={12} />PRIVATE</span></div>
          <div className="panel-body"><p className="soft-copy" style={{ marginTop: 0 }}>Only visible in your locker. Height and weight are never used as public reputation stats.</p>
            <form className="form-grid" onSubmit={saveBiometrics}>
              <div className="field"><label htmlFor="height">Height · cm</label><input id="height" className="input" type="number" min="100" max="250" inputMode="numeric" value={height} onChange={(event) => { setHeight(event.target.value); setSaved(false); }} required /></div>
              <div className="field"><label htmlFor="weight">Weight · kg</label><input id="weight" className="input" type="number" min="35" max="250" inputMode="numeric" value={weight} onChange={(event) => { setWeight(event.target.value); setSaved(false); }} required /></div>
              <div className="field full"><button type="submit" className="primary-button">Update private details <ChevronRight size={14} /></button>{saved && <span className="field-note" role="status"><Check size={12} /> Updated in the current session</span>}</div>
            </form>
          </div>
        </section>
      </div>

      <section className="panel" aria-labelledby="history-heading">
        <div className="panel-head"><h2 id="history-heading">Match history</h2><span className="status-pill is-live"><ShieldCheck size={12} />PEER VERIFIED</span></div>
        <div className="panel-body" style={{ paddingBottom: 10 }}><div className="radar-stats" style={{ marginTop: 0 }}><div className="radar-stat"><div className="radar-stat-top"><span>WINS</span><Trophy size={13} /></div><div className="radar-stat-value">18</div></div><div className="radar-stat"><div className="radar-stat-top"><span>GOALS</span><CheckCircle2 size={13} /></div><div className="radar-stat-value is-live">27</div></div><div className="radar-stat"><div className="radar-stat-top"><span>ASSISTS</span><Sparkles size={13} /></div><div className="radar-stat-value">14</div></div></div></div>
        <div className="match-timeline">
          {profileMatches.map((match) => <article className="match-history-row" key={match.id}>
            <span className={`match-result-mark ${match.result === "D" ? "is-draw" : ""}`}>{match.result}</span>
            <span className="match-opponent"><strong>{match.opponent}</strong><span>{match.playedAt} · {match.sport === "football" ? "Football" : "Basketball"}</span></span>
            <span className="match-stat"><strong>{match.sport === "football" ? match.goals : match.rebounds}</strong><span>{match.sport === "football" ? "Goals" : "Rebounds"}</span></span>
            <span className="match-stat"><strong>{match.sport === "football" ? match.assists : match.threes}</strong><span>{match.sport === "football" ? "Assists" : "3PT"}</span></span>
          </article>)}
        </div>
        <div className="panel-body"><p className="inline-feedback is-success"><CheckCircle2 size={14} />Verified rows were confirmed by match opponents. The history shown is illustrative sample data.</p></div>
      </section>
    </div>
    <ToastViewport />
  </main>;
}
