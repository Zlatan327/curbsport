"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, CheckCircle2, Clock3, Crown, Flag, MapPin, ShieldCheck, Users, X } from "lucide-react";
import type { Pitch, Player } from "@/lib/types";
import { campuses, pendingResults, samplePlayers } from "@/lib/data";
import { balanceSquads, formatSquadShare } from "@/lib/squad";
import { fetchPitch, isApiConfigured, postDemoAware } from "@/lib/api";
import { DemoIndicator, GroundFacts, PlayerAvatar, StatusPill } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useAppStore } from "@/store/app-store";

function openShare(target: "whatsapp" | "telegram", text: string) {
  const encoded = encodeURIComponent(text);
  const url = target === "whatsapp"
    ? `https://wa.me/?text=${encoded}`
    : `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encoded}`;
  window.open(url, "_blank", "noopener,noreferrer,width=760,height=620");
}

function LobbyCard({ pitch, players, onJoin, onBalance, onInspect }: { pitch: Pitch; players: Player[]; onJoin: (id: string) => void; onBalance: (players: Player[]) => void; onInspect: (setId: string) => void }) {
  return <div className="lobby-list">
    {pitch.sets.map((set) => <article key={set.id} className="lobby-card">
      <div className="lobby-card-head"><div><h3>{set.title}</h3><div className="lobby-card-sub">{set.sport === "football" ? "⚽ Football" : "🏀 Basketball"} · starts in {set.startsInMinutes} min · host roster</div></div><StatusPill status={set.spotsOpen <= 2 ? "building" : "live"} label={set.spotsOpen <= 2 ? `${set.spotsOpen} SPOTS LEFT` : `${set.spotsOpen} OPEN`} /></div>
      <div className="roster-avatars"><div className="avatar-stack">{set.players.slice(0, 5).map((player) => <PlayerAvatar key={player.id} player={player} size="small" />)}</div><span className="roster-count">{set.players.length}/{set.spotsTotal} players · {set.spotsOpen} spots open</span></div>
      <div className="spots-bar"><span style={{ width: `${Math.min(100, (set.players.length / set.spotsTotal) * 100)}%` }} /></div>
      <div className="lobby-card-footer"><button type="button" className="secondary-button" onClick={() => onBalance(set.players.length >= 2 ? set.players : players)}>Balance squads <Users size={13} /></button><button type="button" className="mobile-lobby-open secondary-button" aria-label={`View roster for ${set.title}`} onClick={() => onInspect(set.id)}>Roster <Users size={13} /></button>{set.spotsOpen > 0 ? <button type="button" className="primary-button desktop-lobby-join" onClick={() => onJoin(set.id)}>Join set <ArrowUpRight size={14} /></button> : <span className="status-pill is-quiet desktop-lobby-full">SET FULL</span>}</div>
    </article>)}
    {pitch.sets.length === 0 && <div className="empty-state">No open lobby yet. Start a set and pull in nearby players.</div>}
  </div>;
}

export function PitchDetail({ pitch: initialPitch }: { pitch: Pitch }) {
  const { showToast, ToastViewport } = useToast();
  const [remotePitch, setRemotePitch] = useState<Pitch | null>(null);
  const [sourceStatus, setSourceStatus] = useState<"demo" | "loading" | "live" | "offline">("demo");
  const liveGround = useAppStore((state) => state.liveGroundByPitch[initialPitch.id]);
  const liveSets = useAppStore((state) => state.liveSetsByPitch[initialPitch.id]);
  useEffect(() => {
    if (!isApiConfigured()) { setSourceStatus("demo"); return; }
    let active = true;
    setSourceStatus("loading");
    fetchPitch(initialPitch.id).then((value) => { if (active) { setRemotePitch(value); setSourceStatus("live"); } }).catch(() => { if (active) { setRemotePitch(null); setSourceStatus("offline"); } });
    return () => { active = false; };
  }, [initialPitch.id]);
  const basePitch = remotePitch ?? initialPitch;
  const pitch: Pitch = { ...basePitch, ...(liveGround ?? {}), sets: liveSets ?? basePitch.sets };
  const campus = campuses.find((item) => item.id === pitch.campusId);
  const sportRoster = useMemo(() => samplePlayers.filter((item) => item.primarySport === pitch.sport && item.campusId === pitch.campusId), [pitch.campusId, pitch.sport]);
  const [squadRoster, setSquadRoster] = useState<Player[]>(pitch.sets[0]?.players.length ? pitch.sets[0].players : sportRoster);
  const [showBalance, setShowBalance] = useState(false);
  const [activeLobbyId, setActiveLobbyId] = useState<string | null>(null);
  const [showSetForm, setShowSetForm] = useState(false);
  const [setTitle, setSetTitle] = useState(pitch.sport === "football" ? "5-a-side · open run" : "3v3 · half-court");
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const team = useMemo(() => balanceSquads(squadRoster, pitch.sport), [pitch.sport, squadRoster]);
  const activeLobby = pitch.sets.find((set) => set.id === activeLobbyId) ?? null;

  const handleServerAction = async (label: string, path: string, payload?: unknown) => {
    if (sourceStatus !== "live") {
      showToast(`${label} · sample only`, "The current pitch is not confirmed by the API. No request or reputation change was sent.");
      return false;
    }
    if (!isApiConfigured()) {
      showToast(`${label} · demo only`, "The API is not connected. No live roster or reputation record was changed.");
      return false;
    }
    try {
      await postDemoAware(path, payload ?? {});
      showToast(`${label} sent`, "The server accepted the request.", "success");
      return true;
    } catch (error) {
      showToast(`${label} not completed`, error instanceof Error ? error.message : "The server could not confirm the action.");
      return false;
    }
  };

  const handleSampleResultAction = (label: string) => {
    showToast(`${label} · sample only`, "This illustrative result was not sent to the API and no reputation record was changed.");
  };

  const openSquadBalancer = (players: Player[]) => {
    const roster = players.length >= 2 ? players : sourceStatus === "live" ? players : sportRoster;
    if (roster.length < 2) {
      showToast("Not enough confirmed players", "At least two players from this campus are needed to balance teams.");
      return;
    }
    setSquadRoster(roster);
    setActiveLobbyId(null);
    setShowBalance(true);
  };

  const handleCreateSet = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const created = await handleServerAction("Set creation", "/sets", { pitchId: pitch.id, sport: pitch.sport, title: setTitle });
    if (created) { setShowSetForm(false); setFormMessage("The set request was accepted by the server."); }
  };

  const shareText = formatSquadShare(team, pitch.name, pitch.sport);

  return <main className="page-content">
    <div className="page-header"><div className="page-header-copy"><div className="breadcrumb"><Link href="/">Radar</Link><span>/</span><span>{pitch.campusId}</span></div><div style={{ marginTop: 10 }}>{sourceStatus === "live" ? <span className="status-pill is-live">LIVE API DATA</span> : sourceStatus === "loading" ? <span className="status-pill is-building">CONNECTING · FIXTURE FALLBACK</span> : sourceStatus === "offline" ? <span className="demo-indicator">API OFFLINE · SAMPLE</span> : <DemoIndicator compact />}</div></div><Link href="/" className="secondary-button"><ArrowLeft size={14} />Back to radar</Link></div>

    <section className="detail-hero">
      <div>
        <div className="eyebrow"><span className="live-kicker-dot" />{pitch.campusId} · PITCH HEADQUARTERS</div>
        <h1>{pitch.name}</h1>
        <p className="detail-hero-copy">{pitch.landmark} · {campus?.city ?? "Nigeria"}. Ground signals, active sets, match intel and community-verified conditions.</p>
        <div className="detail-hero-meta"><span className="fact-chip"><MapPin size={12} />{pitch.surface}</span><span className="fact-chip"><Clock3 size={12} />{pitch.condition}</span><span className="fact-chip"><Users size={12} />{pitch.liveCount} on ground</span>{pitch.verified && <span className="fact-chip"><ShieldCheck size={12} />Community verified</span>}</div>
      </div>
      <div className="detail-hero-status"><StatusPill status={pitch.status} /><span className="status-pill">{pitch.floodlights ? "FLOODLIGHTS" : "DAYLIGHT"}</span><span className="status-pill">{pitch.ballPresent ? "BALL DEY GROUND" : "BALL UNCONFIRMED"}</span></div>
    </section>

    <div className="detail-grid">
      <div className="stack">
        <section className="panel" aria-labelledby="king-heading">
          <div className="panel-head"><h2 id="king-heading">King of the ground</h2><span className="status-pill is-building"><Crown size={12} />CURRENT CROWN</span></div>
          <div className="panel-body"><div className="king-banner">
            <span className="king-crown-mark"><Crown size={26} /></span>
            <div><div className="king-title">Campus Legend · REP {pitch.king.reputation}</div><div className="king-name">{pitch.king.alias}</div><div className="king-campus">{pitch.king.position} · {pitch.campusId} · peer verified</div></div>
            <div className="king-metrics"><div className="king-metric"><strong>{pitch.sport === "football" ? "38" : "21"}</strong><span>{pitch.sport === "football" ? "Season goals" : "Rebounds"}</span></div><div className="king-metric"><strong>{pitch.sport === "football" ? "19" : "12"}</strong><span>{pitch.sport === "football" ? "Assists" : "3-pointers"}</span></div><div className="king-metric"><strong>82%</strong><span>Win rate</span></div></div>
          </div><p className="map-note" style={{ margin: "12px 2px 0" }}><ShieldCheck size={13} />Illustrative sample stats · crown eligibility depends on peer-verified results.</p></div>
        </section>

        <section className="panel" aria-labelledby="sets-heading">
          <div className="panel-head"><h2 id="sets-heading">Active sets & match lobbies</h2><button className="secondary-button" type="button" onClick={() => { setShowSetForm((value) => !value); setFormMessage(null); }}>{showSetForm ? <X size={13} /> : <Users size={13} />}{showSetForm ? "Close" : "Build a set"}</button></div>
          <div className="panel-body">
            {showSetForm && <form className="lobby-card" style={{ marginBottom: 12 }} onSubmit={handleCreateSet}><div className="field"><label htmlFor="set-title">Set name</label><input id="set-title" className="input" value={setTitle} onChange={(event) => setSetTitle(event.target.value)} required maxLength={70} /></div><div className="inline-feedback" style={{ marginTop: 10 }}><Users size={14} />Submitting to the configured Express POST `/sets` endpoint sends the campus broadcast.</div><button type="submit" className="primary-button" style={{ marginTop: 12 }}>Create set <ArrowUpRight size={14} /></button>{formMessage && <p className="soft-copy">{formMessage}</p>}</form>}
            <LobbyCard pitch={pitch} players={sportRoster} onJoin={(id) => void handleServerAction("Join request", `/sets/${encodeURIComponent(id)}/join`, { pitchId: pitch.id })} onInspect={setActiveLobbyId} onBalance={openSquadBalancer} />
          </div>
        </section>

        <section className="panel" aria-labelledby="results-heading">
          <div className="panel-head"><h2 id="results-heading">Peer confirmation</h2><span className="status-pill is-building">{pendingResults.length} SAMPLE ROWS</span></div>
          <div className="result-list">
            {pendingResults.map((result) => <div className="result-row" key={result.id}>
              <div className="result-main"><strong>{result.submittedBy} · {result.opponent}</strong><span>{result.goals} goals · {result.assists} assists · submitted {result.submittedAt} · awaiting opponent</span></div>
              <strong className="result-score">{result.score}</strong>
              <div className="result-actions">
                <button className="icon-action" type="button" title="Preview result confirmation feedback" aria-label={`Preview confirmation for sample match result from ${result.submittedBy}`} onClick={() => handleSampleResultAction("Peer confirmation")}><Check size={15} /></button>
                <button className="icon-action is-danger" type="button" title="Preview result dispute feedback" aria-label={`Preview dispute for sample match result from ${result.submittedBy}`} onClick={() => handleSampleResultAction("Dispute / slash")}><Flag size={15} /></button>
              </div>
            </div>)}
          </div>
          <div className="panel-body"><p className="inline-feedback"><ShieldCheck size={14} />A dispute requests opponent review. Reputation changes and crown ineligibility only take effect after the backend confirms the slash.</p></div>
        </section>
      </div>

      <aside className="stack">
        <section className="panel"><div className="panel-head"><h2>Ground conditions</h2><StatusPill status={pitch.status} /></div><div className="panel-body"><GroundFacts pitch={pitch} /><div className="divider" /><p className="soft-copy">{pitch.condition}. Community checks last refreshed {pitch.updatedMinutesAgo} minutes ago. Confirm surface and security access when you arrive.</p><Link href="/add" className="text-action">Update this ground <ArrowUpRight size={13} /></Link></div></section>
        <section className="panel"><div className="panel-head"><h2>Pitch quick signals</h2><span className="eyebrow"><span className="live-kicker-dot" />{pitch.liveCount} nearby</span></div><div className="panel-body"><div className="beacon-row" style={{ paddingTop: 0, border: 0 }}><span className="beacon-copy"><span className="live-kicker-dot" />Ball dey ground</span><strong>{pitch.ballPresent ? pitch.ballBroughtBy : "Not confirmed"}</strong></div><div className="divider" /><div className="selected-ground-facts"><span className="fact-chip"><CheckCircle2 size={12} />{pitch.verified ? "Verified ground" : "Community pin"}</span><span className="fact-chip">{pitch.surface}</span></div><p className="map-note" style={{ marginBottom: 0 }}><MapPin size={13} />Sample peer results and crown stats are illustrative; confirm access and conditions on arrival.</p></div></section>
      </aside>
    </div>

    {activeLobby && <div className="mobile-sheet-backdrop mobile-lobby-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveLobbyId(null); }}><section className="mobile-ground-sheet mobile-lobby-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-lobby-title" onKeyDown={(event) => { if (event.key === "Escape") setActiveLobbyId(null); }}><div className="sheet-handle" /><div className="selected-ground-header"><div><StatusPill status={activeLobby.spotsOpen > 0 ? "building" : "quiet"} label={activeLobby.spotsOpen > 0 ? `${activeLobby.spotsOpen} SPOTS OPEN` : "SET FULL"} /><h3 id="mobile-lobby-title" style={{ marginTop: 9 }}>{activeLobby.title}</h3><p>{activeLobby.sport === "football" ? "Football" : "Basketball"} · starts in {activeLobby.startsInMinutes} min · {activeLobby.players.length}/{activeLobby.spotsTotal} players</p></div><button type="button" className="sheet-close" autoFocus onClick={() => setActiveLobbyId(null)} aria-label="Close set roster"><X size={17} /></button></div><div className="divider" /><h4 className="section-label">Set roster · {pitch.campusId}</h4>{activeLobby.players.length ? <div className="squad-player-list mobile-lobby-roster">{activeLobby.players.map((player) => <div className="squad-player" key={player.id}><span>{player.alias} · {player.campusId}</span><span>{player.position} · REP {player.reputation}</span></div>)}</div> : <p className="soft-copy">The host roster has not been shared yet.</p>}<div className="lobby-card-footer"><button type="button" className="secondary-button" onClick={() => openSquadBalancer(activeLobby.players)}>Balance squads <Users size={13} /></button>{activeLobby.spotsOpen > 0 ? <button type="button" className="primary-button" onClick={async () => { const joined = await handleServerAction("Join request", `/sets/${encodeURIComponent(activeLobby.id)}/join`, { pitchId: pitch.id }); if (joined) setActiveLobbyId(null); }}>Join set <ArrowUpRight size={14} /></button> : <span className="status-pill is-quiet">SET FULL</span>}</div></section></div>}
    {showBalance && <>
      <div className="mobile-sheet-backdrop mobile-balance-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowBalance(false); }}><section className="mobile-ground-sheet mobile-balance-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-balance-title" onKeyDown={(event) => { if (event.key === "Escape") setShowBalance(false); }}><div className="sheet-handle" /><div className="panel-head"><h2 id="mobile-balance-title">Squad balance · position + REP</h2><button type="button" className="sheet-close" autoFocus onClick={() => setShowBalance(false)} aria-label="Close squad balancer"><X size={17} /></button></div><div className="panel-body"><div className="squad-grid">{[{ name: "Team A", people: team.teamA, rating: team.ratingA }, { name: "Team B", people: team.teamB, rating: team.ratingB }].map(({ name, people, rating }) => <div className="squad-team" key={name}><div className="squad-team-head"><span>{name}</span><strong>REP {rating}</strong></div><div className="squad-player-list">{people.map((player) => <div className="squad-player" key={player.id}><span>{player.alias}</span><span>{player.position} · {player.reputation}</span></div>)}</div></div>)}</div><div className="panel-action-row"><p className="soft-copy" style={{ margin: 0 }}>Deterministic split balances total REP and position mix.</p><div className="share-actions"><button type="button" className="share-button" onClick={() => openShare("whatsapp", shareText)}>Share WhatsApp <ArrowUpRight size={13} /></button><button type="button" className="share-button" onClick={() => openShare("telegram", shareText)}>Telegram <ArrowUpRight size={13} /></button></div></div></div></section></div>
      <section className="panel desktop-squad-panel" style={{ marginTop: 18 }} aria-live="polite"><div className="panel-head"><h2>Squad balance · position + REP</h2><button type="button" className="icon-button" onClick={() => setShowBalance(false)} aria-label="Close squad balancer"><X size={15} /></button></div><div className="panel-body"><div className="squad-grid">
        {[{ name: "Team A", people: team.teamA, rating: team.ratingA }, { name: "Team B", people: team.teamB, rating: team.ratingB }].map(({ name, people, rating }) => <div className="squad-team" key={name}><div className="squad-team-head"><span>{name}</span><strong>REP {rating}</strong></div><div className="squad-player-list">{people.map((player) => <div className="squad-player" key={player.id}><span>{player.alias}</span><span>{player.position} · {player.reputation}</span></div>)}</div></div>)}
      </div><div className="panel-action-row"><p className="soft-copy" style={{ margin: 0 }}>Deterministic split balances total REP and position mix.</p><div className="share-actions"><button type="button" className="share-button" onClick={() => openShare("whatsapp", shareText)}>Share WhatsApp <ArrowUpRight size={13} /></button><button type="button" className="share-button" onClick={() => openShare("telegram", shareText)}>Telegram <ArrowUpRight size={13} /></button></div></div></div></section>
    </>}
    <ToastViewport />
  </main>;
}
