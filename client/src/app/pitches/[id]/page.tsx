"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, Clock3, LoaderCircle, MapPin, MessageCircle, Plus, Send, ShieldCheck, Users, X } from "lucide-react";
import { AppFrame } from "@/components/app-frame";
import { AsyncButton } from "@/components/async-button";
import { MapPlaceholder } from "@/components/map-placeholder";
import { Notice } from "@/components/notice";
import { EmptyState, LoadingState } from "@/components/page-state";
import { StatusBadge } from "@/components/status-badge";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { useBanter, useLobbies, usePitch } from "@/hooks/use-data";
import { DEMO_BANTER, DEMO_LOBBIES, DEMO_PITCHES } from "@/lib/demo";
import { createLobby, joinLobby, sendBanter, votePitch } from "@/lib/api";
import type { BanterMessage } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

type Tab = "info" | "sets" | "banter";

const QUICK_MESSAGES = ["We dey ground!", "Any keeper dey?", "5-a-side?", "Be there soon"];

function messageAuthor(message: BanterMessage): string {
  return message.author || (typeof message.user === "string" ? message.user : message.user?.name) || "Player";
}

function displayTime(value?: string): string {
  if (!value) return "JUST NOW";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
}

export default function PitchDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { token, hydrated } = useAuthStore();
  const isDemoId = id.startsWith("demo-");
  const { data, error: pitchError, isLoading, mutate: refreshPitch } = usePitch(isDemoId ? "" : id);
  const demoPitch = DEMO_PITCHES.find((pitch) => pitch.id === id);
  const pitch = data ?? demoPitch;
  const isDemo = Boolean(isDemoId || pitch?.isDemo);
  const [tab, setTab] = useState<Tab>("info");
  const [actionError, setActionError] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [voting, setVoting] = useState(false);
  const [lobbyBusy, setLobbyBusy] = useState("");
  const [banterBusy, setBanterBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [lobbyTitle, setLobbyTitle] = useState("Evening set");
  const [lobbyTime, setLobbyTime] = useState("");
  const [lobbyPlayers, setLobbyPlayers] = useState("10");
  const [lobbyNote, setLobbyNote] = useState("");
  const { data: banterData, error: banterError, isLoading: banterLoading, mutate: refreshBanter } = useBanter(isDemo ? "" : id);
  const { data: lobbyData, error: lobbyError, isLoading: lobbyLoading, mutate: refreshLobbies } = useLobbies();

  const messages = useMemo(() => banterData ?? (banterError || isDemo ? DEMO_BANTER : []), [banterData, banterError, isDemo]);
  const lobbies = useMemo(() => {
    if (isDemo) return DEMO_LOBBIES;
    const matching = (lobbyData || []).filter((item) => !item.pitchId || String(item.pitchId) === id);
    return matching.length ? matching : lobbyError ? DEMO_LOBBIES : [];
  }, [lobbyData, lobbyError, isDemo, id]);

  async function handleVote(isUp: boolean) {
    if (!pitch || isDemo) return;
    if (!token) return setActionError("Log in before verifying a pitch.");
    setActionError(""); setActionNote(""); setVoting(true);
    try {
      await votePitch(id, isUp);
      setActionNote(isUp ? "Your ground check is in." : "Thanks — the community will re-check this pitch.");
      await refreshPitch();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Vote could not be sent.");
    } finally { setVoting(false); }
  }

  async function handleJoin(lobbyId: string) {
    if (!token) return setActionError("Log in before joining a set.");
    setActionError(""); setActionNote(""); setLobbyBusy(lobbyId);
    try {
      await joinLobby(lobbyId);
      setActionNote("You're on the list. Check the set details with the host.");
      await refreshLobbies();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Couldn't join that set.");
    } finally { setLobbyBusy(""); }
  }

  async function handleCreateLobby(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return setActionError("Log in before creating a set.");
    if (!lobbyTime) return setActionError("Choose a kick-off time.");
    setActionError(""); setActionNote(""); setLobbyBusy("create");
    try {
      await createLobby({ pitchId: id, startsAt: new Date(lobbyTime).toISOString(), maxPlayers: Number(lobbyPlayers), note: `${lobbyTitle.trim()}${lobbyNote.trim() ? ` — ${lobbyNote.trim()}` : ""}` });
      setActionNote("Set posted. Pull your people in.");
      setShowCreate(false);
      setLobbyTitle("Evening set"); setLobbyTime(""); setLobbyNote("");
      await refreshLobbies();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Couldn't post that set.");
    } finally { setLobbyBusy(""); }
  }

  async function handleSend(messageValue = message) {
    const trimmed = messageValue.trim();
    if (!trimmed || isDemo) return;
    if (!token) return setActionError("Log in to join the banter.");
    setActionError(""); setActionNote(""); setBanterBusy(true);
    try {
      await sendBanter(id, trimmed);
      setMessage("");
      await refreshBanter();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Message did not go through.");
    } finally { setBanterBusy(false); }
  }

  if (isLoading && !pitch) return <AppFrame><LoadingState label="Finding this ground…" /></AppFrame>;
  if (!pitch) return <AppFrame><div className="detail-not-found"><p className="eyebrow">PITCH NOT AVAILABLE</p><h1>GROUND<br /><em>UNKNOWN.</em></h1>{pitchError ? <Notice tone="warning" className="detail-notice">Unable to load this pitch. {pitchError.message}</Notice> : <p className="pitch-description">This pitch may have moved or the ID may be incorrect.</p>}<div className="button-row"><button type="button" className="button button--outline" onClick={() => void refreshPitch()}>RETRY</button><Link href="/" className="button button--green">BACK TO FEED <ArrowUpRight size={16} /></Link></div></div></AppFrame>;

  const verified = pitch.verificationStatus.toUpperCase() === "COMMUNITY_VERIFIED";

  return <AppFrame>
    <Link href="/" className="back-link"><ArrowLeft size={15} /> BACK TO THE LIST</Link>
    <section className="detail-hero">
      <MapPlaceholder large />
      <div className="detail-hero__top"><StatusBadge status={pitch.activeStatus} /><span className={`verification-tag${verified ? " is-verified" : " is-ghost"}`}>{verified ? <><ShieldCheck size={14} /> COMMUNITY VERIFIED</> : "👻 GHOST PITCH"}</span></div>
      <div className="detail-hero__caption"><p className="eyebrow">ANAMBRA / FIELD REPORT</p><h1>{pitch.name}</h1><p><MapPin size={14} /> {pitch.area || pitch.address || "Anambra State"}</p></div>
    </section>
    {isDemo && <Notice tone="warning" className="offline-notice"><strong>SAMPLE PREVIEW</strong><span>This is demo content; connect the API for live pitch data and actions.</span></Notice>}
    {pitchError && !isDemo && <Notice tone="warning" className="offline-notice"><strong>API ERROR</strong><span>{pitchError.message}</span><button type="button" onClick={() => void refreshPitch()}>RETRY</button></Notice>}

    <section className="detail-stats"><div><strong>{pitch.playersNow || 0}</strong><span>ON THE GROUND</span></div><div><strong>{pitch.setsToday || 0}</strong><span>SETS TODAY</span></div><div><strong>{pitch.upvotes || 0}</strong><span>GROUND CHECKS</span></div></section>

    <div className="detail-tabs" role="tablist" aria-label="Pitch sections">
      {(["info", "sets", "banter"] as Tab[]).map((item) => <button type="button" key={item} role="tab" aria-selected={tab === item} className={tab === item ? "is-selected" : ""} onClick={() => { setTab(item); setActionError(""); setActionNote(""); }}>{item === "info" ? "INFO" : item === "sets" ? "SETS" : "BANTER"}{item === "sets" && <span>{lobbies.length}</span>}</button>)}
    </div>

    {actionError && <Notice tone="warning" className="detail-notice">{actionError}</Notice>}
    {actionNote && <Notice tone="success" className="detail-notice">{actionNote}</Notice>}

    {tab === "info" && <section className="tab-panel info-panel" role="tabpanel">
      <div className="info-panel__heading"><p className="eyebrow">THE GROUND CHECK</p><h2>KNOW BEFORE<br /><em>YOU MOVE.</em></h2></div>
      <p className="pitch-description">{pitch.description || "The local ground is on the board. Add a banter message or start a set to get the people moving."}</p>
      <div className="info-location"><MapPin size={17} /><div><strong>{pitch.address || pitch.area || "Location not listed"}</strong><span>{pitch.area || pitch.city || "Anambra State"}</span></div></div>
      {!verified && <div className="ghost-detail"><div><span>👻</span><div><strong>GHOST PITCH</strong><p>Community still needs to confirm this ground.</p></div></div><p className="ghost-detail__copy">Does ball fly here?</p></div>}
      <div className="vote-box"><div><p className="eyebrow">COMMUNITY CHECK</p><strong>Been here? Verify the ground.</strong></div><div className="vote-actions"><button type="button" onClick={() => void handleVote(true)} disabled={voting || isDemo} aria-label="Confirm this pitch is real"><Check size={18} /> YES</button><button type="button" onClick={() => void handleVote(false)} disabled={voting || isDemo} aria-label="Report this pitch for checking"><X size={18} /> NO</button></div></div>
      {isDemo && <p className="demo-explainer">Voting is disabled for sample preview data.</p>}
      {!hydrated && <p className="demo-explainer">Checking player session…</p>}
    </section>}

    {tab === "sets" && <section className="tab-panel sets-panel" role="tabpanel">
      <div className="section-heading"><div><p className="eyebrow">WHO DEY HOLD SET?</p><h2>GET IN PLAY.</h2></div><button type="button" className="icon-action" onClick={() => setShowCreate((value) => !value)} aria-expanded={showCreate}>{showCreate ? <X size={18} /> : <Plus size={18} />} <span>{showCreate ? "CLOSE" : "CREATE SET"}</span></button></div>
      {lobbyError && <Notice tone="warning" className="inline-notice"><strong>SET PREVIEW</strong> Unable to load live lobbies. Sample sets are clearly labelled below.</Notice>}
      {showCreate && <form className="lobby-create" onSubmit={handleCreateLobby}><div className="form-section-heading"><span>+</span><div><p className="eyebrow">CALL YOUR PEOPLE</p><h2>POST A SET</h2></div></div><label className="field"><span>SET NAME</span><input value={lobbyTitle} onChange={(event) => setLobbyTitle(event.target.value)} required maxLength={60} placeholder="Evening 5-a-side" /></label><label className="field"><span>KICK-OFF</span><input type="datetime-local" value={lobbyTime} onChange={(event) => setLobbyTime(event.target.value)} required /></label><label className="field"><span>PLAYER CAP</span><input type="number" value={lobbyPlayers} onChange={(event) => setLobbyPlayers(event.target.value)} min={2} max={30} required /></label><label className="field"><span>NOTE FOR THE SET <small>OPTIONAL</small></span><input value={lobbyNote} onChange={(event) => setLobbyNote(event.target.value)} placeholder="Keeper needed. Bring a dark jersey." maxLength={100} /></label><AsyncButton type="submit" busy={lobbyBusy === "create"} className="button--full">POST THE SET <ArrowUpRight size={16} /></AsyncButton></form>}
      {lobbyLoading && !lobbyData && <LoadingState label="Calling the set list…" />}
      {!lobbyLoading && lobbies.length === 0 && <EmptyState title="No set on this ground yet.">Create the first one and get the ball moving.</EmptyState>}
      <div className="lobby-list">{lobbies.map((lobby) => {
        const isDemoLobby = lobby.id.startsWith("demo-") || isDemo;
        const players = Array.isArray(lobby.players) ? lobby.players : [];
        return <article className="lobby-card" key={lobby.id}>
          <div className="lobby-card__top"><span className="lobby-open"><i /> OPEN SET</span>{isDemoLobby && <span className="demo-tag demo-tag--inline">SAMPLE</span>}</div>
          <h3>{lobby.title || "Local football set"}</h3>
          <p className="lobby-card__note">{lobby.note || "No extra notes. Check in with the host."}</p>
          <div className="lobby-card__meta"><span><Clock3 size={14} /> {lobby.startsAt ? displayTime(lobby.startsAt) : lobby.date || "Time not listed"}</span><span><Users size={14} /> {lobby.playerCount || players.length}/{lobby.maxPlayers || "?"}</span></div>
          <div className="player-stack" aria-label={`${players.length} players in set`}>{players.slice(0, 5).map((player, index) => { const name = typeof player === "string" ? player : player.name || "P"; return <span key={`${lobby.id}-${index}`} title={name}>{name.slice(0, 1).toUpperCase()}</span>; })}<small>{players.length ? `${players.length} IN` : "BE FIRST IN"}</small></div>
          <button type="button" className="button button--green button--full lobby-join" disabled={isDemoLobby || lobbyBusy === lobby.id} onClick={() => void handleJoin(lobby.id)}>{lobbyBusy === lobby.id ? <LoaderCircle className="spin" size={16} /> : <Users size={16} />} JOIN THE SET <ArrowUpRight size={16} /></button>
          {isDemoLobby && <p className="demo-explainer">Connect to the API to join live sets.</p>}
        </article>;
      })}</div>
      {!token && <SignInPrompt title="Get on the team." copy="Log in to post a set or join players at this ground." />}
    </section>}

    {tab === "banter" && <section className="tab-panel banter-panel" role="tabpanel">
      <div className="section-heading"><div><p className="eyebrow">PITCH-SIDE CHAT</p><h2>THE BANTER.</h2></div><span className="chat-live"><i /> LIVE CHAT</span></div>
      {banterError && !isDemo && <Notice tone="warning" className="inline-notice"><strong>CHAT PREVIEW</strong> Unable to load live messages; sample chat will appear.</Notice>}
      <div className="chat-window" aria-live="polite">
        {banterLoading && !banterData && !isDemo && <LoadingState label="Tuning into the ground…" />}
        {messages.length === 0 && <EmptyState title="Quiet on the touchline.">Drop the first message.</EmptyState>}
        {messages.map((item, index) => <article className={`chat-message${index === 0 ? " chat-message--other" : " chat-message--other"}`} key={item.id}><div className="chat-message__avatar">{messageAuthor(item).slice(0, 1).toUpperCase()}</div><div className="chat-message__body"><div className="chat-message__meta"><strong>{messageAuthor(item)}</strong><span>{displayTime(item.createdAt)}</span></div><p>{item.message || item.text}</p></div></article>)}
      </div>
      <div className="quick-chips"><p className="eyebrow">QUICK SHOUT</p>{QUICK_MESSAGES.map((text) => <button type="button" key={text} disabled={isDemo} onClick={() => void handleSend(text)}>{text}</button>)}</div>
      {isDemo && <Notice tone="warning" className="inline-notice">Sample messages only. Connect the API to send or receive live banter.</Notice>}
      {!isDemo && token ? <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); void handleSend(); }}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Who dey hold set today?" maxLength={500} aria-label="Write a chat message" /><button type="submit" disabled={banterBusy || !message.trim()} aria-label="Send message">{banterBusy ? <LoaderCircle className="spin" size={18} /> : <Send size={18} />}</button></form> : !token ? <SignInPrompt title="Join the conversation." copy="Log in to message the players at this pitch." /> : null}
      <p className="chat-footnote"><MessageCircle size={13} /> Keep the banter good. Respect the ground and the people on it.</p>
    </section>}
  </AppFrame>;
}
