"use client";

import { useMemo, useState, useRef, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Camera, Check, Clock3, Crown, LoaderCircle, MapPin, MessageCircle, Navigation, Plus, Send, Share2, ShieldCheck, Swords, Trophy, Users, X } from "lucide-react";
import { AppFrame } from "@/components/app-frame";
import { AsyncButton } from "@/components/async-button";
import { MapPlaceholder } from "@/components/map-placeholder";
import { Notice } from "@/components/notice";
import { EmptyState, LoadingState } from "@/components/page-state";
import { StatusBadge } from "@/components/status-badge";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { StatKing } from "@/components/stat-king";
import { MatchScoreModal } from "@/components/match-score-modal";
import { MatchResultCard } from "@/components/match-result-card";
import { GroundConditionPills } from "@/components/ground-condition-pills";
import { useBanter, useLobbies, usePitch } from "@/hooks/use-data";
import { DEMO_BANTER, DEMO_LOBBIES, DEMO_PITCHES } from "@/lib/demo";
import { checkinBall, createLobby, getDirectionsUrl, joinLobby, leaveLobby, sendBanter, updatePitchImage, votePitch } from "@/lib/api";
import { formatLobbyWhatsAppMessage, formatBallBeaconWhatsAppMessage, shareToWhatsApp } from "@/lib/share";
import { balanceSquad, formatBalancedSquadWhatsAppMessage } from "@/lib/balancer";
import type { BanterMessage, Lobby, LobbyPlayer } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

type Tab = "info" | "sets" | "banter";

const FOOTBALL_QUICK_MESSAGES = ["We dey ground!", "Any keeper dey?", "5-a-side?", "Light / Gen dey?", "I dey pull up now"];
const BASKETBALL_QUICK_MESSAGES = ["We dey court!", "Set dey fly?", "Who hold ball?", "Light dey for court?", "I dey pull up now"];

function messageAuthor(message: BanterMessage): string {
  return (message.author as string) || (typeof message.user === "string" ? message.user : (message.user?.alias as string)) || "Player";
}

function displayTime(value?: string): string {
  if (!value) return "JUST NOW";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
}

export default function PitchDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { token, user, hydrated } = useAuthStore();
  const isDemoId = id.startsWith("demo-");
  const { data, error: pitchError, isLoading, mutate: refreshPitch } = usePitch(isDemoId ? "" : id);
  const demoPitch = DEMO_PITCHES.find((p) => p.id === id);
  const pitch = data ?? demoPitch;
  const isDemo = Boolean(isDemoId || pitch?.isDemo);
  const [tab, setTab] = useState<Tab>("info");
  const [actionError, setActionError] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [voting, setVoting] = useState(false);
  const [ballChecking, setBallChecking] = useState(false);
  const [showBallLeavingModal, setShowBallLeavingModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lobbyBusy, setLobbyBusy] = useState("");
  const [balancedLobbyId, setBalancedLobbyId] = useState<string | null>(null);
  const [scoreLobbyModal, setScoreLobbyModal] = useState<Lobby | null>(null);
  const [banterBusy, setBanterBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [lobbyTitle, setLobbyTitle] = useState("Evening set");
  const [lobbyTime, setLobbyTime] = useState("");
  const [lobbyPlayers, setLobbyPlayers] = useState("10");
  const [lobbyNote, setLobbyNote] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: banterData, error: banterError, isLoading: banterLoading, mutate: refreshBanter } = useBanter(isDemo ? "" : id);
  const { data: lobbyData, error: lobbyError, isLoading: lobbyLoading, mutate: refreshLobbies } = useLobbies();

  const messages = useMemo(() => banterData ?? (banterError || isDemo ? DEMO_BANTER : []), [banterData, banterError, isDemo]);
  const lobbies = useMemo(() => {
    if (isDemo) return DEMO_LOBBIES;
    const matching = (lobbyData || []).filter((item) => !item.pitchId || String(item.pitchId) === id);
    return matching.length ? matching : lobbyError ? DEMO_LOBBIES : [];
  }, [lobbyData, lobbyError, isDemo, id]);

  const isBasketball = Boolean(
    pitch && (pitch.sportType === "BASKETBALL" || pitch.name.toLowerCase().includes("basketball") || pitch.name.toLowerCase().includes("court"))
  );

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!token) {
      setActionError("Please log in to upload a photo of this ground.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setActionError("Please select a valid image file.");
      return;
    }

    setActionError("");
    setActionNote("");
    setUploadingImage(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const maxDim = 900;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.82);
            try {
              await updatePitchImage(id, compressed);
              setActionNote("Ground photo uploaded successfully! Real view now visible.");
              await refreshPitch();
            } catch (err) {
              setActionError(err instanceof Error ? err.message : "Failed to save photo.");
            } finally {
              setUploadingImage(false);
            }
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadingImage(false);
      setActionError("Error processing photo.");
    }
  }

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

  async function handleBallCheckin(
    hasBallNow = true,
    reason?: 'BALL_LEAVING' | 'CHECKED_OUT' | 'ACCIDENTAL_CLICK' | 'MATCH_ENDED' | 'BALL_ARRIVED'
  ) {
    if (!token) return setActionError("Log in before updating match equipment status.");
    if (isDemo) return setActionError("Match equipment check-in is disabled in sample mode.");
    setActionError(""); setActionNote(""); setBallChecking(true);
    try {
      const res = await checkinBall(id, hasBallNow, reason);
      if (hasBallNow) {
        setActionNote(res.message || (isBasketball ? "🏀 You're the MVP! Ball checked in on court. +10 REP awarded!" : "⚽ You're the MVP! Match ball reported on ground. +10 REP awarded!"));
      } else {
        if (reason === 'ACCIDENTAL_CLICK') {
          setActionNote("Ball check-in undone without penalty (oversight reverted).");
        } else {
          setActionNote(isBasketball ? "🏀 Equipment status cleared — campus notified that basketball has left the court." : "⚽ Equipment status cleared — campus notified that ball has left the ground.");
        }
      }
      setShowBallLeavingModal(false);
      await refreshPitch();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Could not update ball status.");
    } finally { setBallChecking(false); }
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

  async function handleLeave(lobbyId: string) {
    if (!token) return setActionError("Log in before leaving a set.");
    setActionError(""); setActionNote(""); setLobbyBusy(lobbyId);
    try {
      await leaveLobby(lobbyId);
      setActionNote("You left the set.");
      await refreshLobbies();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Couldn't leave that set.");
    } finally { setLobbyBusy(""); }
  }

  async function handleCreateLobby(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return setActionError("Log in before creating a set.");
    if (!lobbyTime) return setActionError("Choose a kick-off time.");
    setActionError(""); setActionNote(""); setLobbyBusy("create");
    try {
      await createLobby({
        pitchId: id,
        startsAt: new Date(lobbyTime).toISOString(),
        maxPlayers: Number(lobbyPlayers),
        title: lobbyTitle.trim(),
        note: `${lobbyTitle.trim()}${lobbyNote.trim() ? ` — ${lobbyNote.trim()}` : ""}`,
      });
      setActionNote("Set posted! Tap 'WHATSAPP RALLY' to pull your squad in.");
      setShowCreate(false);
      setLobbyTitle("Evening set"); setLobbyTime(""); setLobbyNote("");
      await refreshLobbies();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Couldn't post that set.");
    } finally { setLobbyBusy(""); }
  }

  async function handleShareLobby(lobby: any) {
    const players = Array.isArray(lobby.players) ? lobby.players : [];
    const hostRep = (typeof lobby.host === "object" && lobby.host ? (lobby.host as any).reputationScore : 0) || 0;
    const hostName = typeof lobby.host === "object" && lobby.host ? (lobby.host as any).alias : undefined;
    const currentUrl = typeof window !== "undefined" ? window.location.href : `https://insidelife.vercel.app/pitches/${id}`;

    const text = formatLobbyWhatsAppMessage({
      pitchName: pitch?.name || "Local Ground",
      pitchArea: pitch?.area || pitch?.address,
      sportType: isBasketball ? "BASKETBALL" : "FOOTBALL",
      lobbyTitle: lobby.title || "Pickup Set",
      startsAt: lobby.startsAt ? displayTime(lobby.startsAt) : undefined,
      playerCount: lobby.playerCount || players.length,
      maxPlayers: lobby.maxPlayers || 10,
      hasBall: Boolean(lobby.hasBall),
      hostName,
      hostRep,
      pitchUrl: currentUrl,
    });

    await shareToWhatsApp(text);
  }

  async function handleShareBallBeacon() {
    const currentUrl = typeof window !== "undefined" ? window.location.href : `https://insidelife.vercel.app/pitches/${id}`;
    const text = formatBallBeaconWhatsAppMessage({
      pitchName: pitch?.name || "Local Ground",
      pitchArea: pitch?.area || pitch?.address,
      sportType: isBasketball ? "BASKETBALL" : "FOOTBALL",
      ballBroughtBy: pitch?.ballBroughtBy,
      pitchUrl: currentUrl,
    });

    await shareToWhatsApp(text);
  }

  async function handleShareBalancedSquad(lobby: any) {
    const players = Array.isArray(lobby.players) ? lobby.players : [];
    const balanced = balanceSquad(players, isBasketball ? "BASKETBALL" : "FOOTBALL");
    const currentUrl = typeof window !== "undefined" ? window.location.href : `https://insidelife.vercel.app/pitches/${id}`;
    const text = formatBalancedSquadWhatsAppMessage({
      pitchName: pitch?.name || "Local Ground",
      sportType: isBasketball ? "BASKETBALL" : "FOOTBALL",
      teamA: balanced.teamA,
      teamB: balanced.teamB,
      pitchUrl: currentUrl,
    });

    await shareToWhatsApp(text);
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
  const directionsUrl = getDirectionsUrl(pitch);

  return <AppFrame>
    <Link href="/" className="back-link"><ArrowLeft size={15} /> BACK TO THE LIST</Link>
    <section className="detail-hero">
      {pitch.imageUrl ? (
        <img src={pitch.imageUrl} alt={pitch.name} className="detail-hero__image" />
      ) : (
        <MapPlaceholder large />
      )}
      <div className="detail-hero__top">
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <StatusBadge status={pitch.activeStatus} />
          <span className="sport-pill">{isBasketball ? "🏀 BASKETBALL" : "⚽ FOOTBALL"}</span>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <button
            type="button"
            className="hero-photo-btn"
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingImage || isDemo}
            title="Add or update ground photo"
          >
            <Camera size={13} /> {uploadingImage ? "SAVING..." : pitch.imageUrl ? "CHANGE PHOTO" : "ADD PHOTO"}
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handlePhotoUpload}
          />
          <span className={`verification-tag${verified ? " is-verified" : " is-ghost"}`}>
            {verified ? <><ShieldCheck size={14} /> COMMUNITY VERIFIED</> : "👻 GHOST PITCH"}
          </span>
        </div>
      </div>
      <div className="detail-hero__caption">
        <p className="eyebrow">ANAMBRA / FIELD REPORT</p>
        <h1>{pitch.name}</h1>
        <p><MapPin size={14} /> {pitch.area || pitch.address || "Anambra State"}</p>
        <div className="hero-actions-row" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hero-directions-link"
            aria-label={`Get turn-by-turn directions to ${pitch.name}`}
          >
            <Navigation size={14} /> GET DIRECTIONS (GOOGLE MAPS)
          </a>
          {pitch.hasBallNow ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span className="ball-confirmed-badge">
                {isBasketball ? "🏀 BALL ON COURT" : "⚽ BALL DEY GROUND"}
              </span>
              <button
                type="button"
                className="ball-leaving-btn"
                disabled={ballChecking || isDemo}
                onClick={() => setShowBallLeavingModal(true)}
                title="Report that the match ball is leaving or turn off equipment status"
              >
                {ballChecking ? <LoaderCircle className="spin" size={12} /> : <span>🏃</span>}
                <span>BALL LEAVING? TURN OFF</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="ball-checkin-btn"
              disabled={ballChecking || isDemo}
              onClick={() => void handleBallCheckin(true)}
              title="Check in with match equipment to alert campus and earn +10 REP"
            >
              {ballChecking ? (
                <LoaderCircle className="spin" size={13} />
              ) : isBasketball ? (
                <span>🏀</span>
              ) : (
                <span>⚽</span>
              )}
              {isBasketball ? "I DEY WITH BASKETBALL" : "I DEY GROUND WITH BALL"}
            </button>
          )}
        </div>
      </div>
    </section>

    <GroundConditionPills
      pitchId={id}
      pitchName={pitch.name}
      sportType={isBasketball ? "BASKETBALL" : "FOOTBALL"}
      isDemo={isDemo}
      token={token}
      onConditionBroadcast={(msg) => {
        setActionNote(msg);
        void refreshBanter();
      }}
    />

    {pitch.hasBallNow && (
      <div className="hero-ball-beacon">
        <span className="hero-ball-beacon__icon">{isBasketball ? "🏀" : "⚽"}</span>
        <div className="hero-ball-beacon__body">
          <strong>{isBasketball ? "BALL ON COURT RIGHT NOW!" : "MATCH BALL DEY GROUND RIGHT NOW!"}</strong>
          <span>Brought by <strong>{pitch.ballBroughtBy || "a baller"}</strong> {pitch.ballReportedAt ? `• Spotted ${displayTime(pitch.ballReportedAt)}` : ""} • Game can fly!</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px", alignItems: "center" }}>
          <button
            type="button"
            className="beacon-wa-btn"
            onClick={() => void handleShareBallBeacon()}
            title="Broadcast equipment status to WhatsApp group"
          >
            <Share2 size={12} /> <span>BROADCAST</span>
          </button>
          {token && (
            <button
              type="button"
              className="beacon-leaving-btn"
              disabled={ballChecking || isDemo}
              onClick={() => setShowBallLeavingModal(true)}
              title="Turn off ball on site status if ball is leaving"
            >
              {user?.alias === pitch.ballBroughtBy ? "I'M LEAVING WITH BALL" : "REPORT BALL LEFT"}
            </button>
          )}
        </div>
      </div>
    )}
    {isDemo && <Notice tone="warning" className="offline-notice"><strong>SAMPLE PREVIEW</strong><span>This is demo content; connect the API for live pitch data and actions.</span></Notice>}
    {pitchError && !isDemo && <Notice tone="warning" className="offline-notice"><strong>API ERROR</strong><span>{pitchError.message}</span><button type="button" onClick={() => void refreshPitch()}>RETRY</button></Notice>}

    <section className="detail-stats">
      <div><strong>{pitch.playersNow || 0}</strong><span>{isBasketball ? "ON THE COURT" : "ON THE GROUND"}</span></div>
      <div><strong>{pitch.setsToday || 0}</strong><span>{isBasketball ? "RUNS TODAY" : "SETS TODAY"}</span></div>
      <div><strong>{pitch.upvotes || 0}</strong><span>{isBasketball ? "COURT CHECKS" : "GROUND CHECKS"}</span></div>
    </section>

    <StatKing pitchId={id} isDemo={isDemo} sportType={isBasketball ? "BASKETBALL" : "FOOTBALL"} />

    <div className="detail-tabs" role="tablist" aria-label="Pitch sections">
      {(["info", "sets", "banter"] as Tab[]).map((item) => (
        <button
          type="button"
          key={item}
          role="tab"
          aria-selected={tab === item}
          className={tab === item ? "is-selected" : ""}
          onClick={() => { setTab(item); setActionError(""); setActionNote(""); }}
        >
          {item === "info" ? "INFO" : item === "sets" ? (isBasketball ? "RUNS" : "SETS") : "BANTER"}
          {item === "sets" && <span>{lobbies.length}</span>}
        </button>
      ))}
    </div>

    {actionError && <Notice tone="warning" className="detail-notice">{actionError}</Notice>}
    {actionNote && <Notice tone="success" className="detail-notice">{actionNote}</Notice>}

    {tab === "info" && <section className="tab-panel info-panel" role="tabpanel">
      <div className="info-panel__heading"><p className="eyebrow">{isBasketball ? "THE COURT CHECK" : "THE GROUND CHECK"}</p><h2>KNOW BEFORE<br /><em>YOU MOVE.</em></h2></div>
      <p className="pitch-description">{pitch.description || pitch.landmarkDescription || (isBasketball ? "The local court is on the board. Add a chat message or start a run to get ballers moving." : "The local ground is on the board. Add a banter message or start a set to get the people moving.")}</p>
      <div className="info-location">
        <MapPin size={17} />
        <div style={{ flex: 1 }}>
          <strong>{pitch.address || pitch.area || "Location not listed"}</strong>
          <span>{pitch.area || pitch.city || "Anambra State"}</span>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="button button--outline info-directions-btn"
        >
          <Navigation size={13} /> DIRECTIONS
        </a>
      </div>
      {!verified && <div className="ghost-detail"><div><span>👻</span><div><strong>GHOST {isBasketball ? "COURT" : "PITCH"}</strong><p>Community still needs to confirm this {isBasketball ? "court" : "ground"}.</p></div></div><p className="ghost-detail__copy">Does ball fly here?</p></div>}
      <div className="vote-box"><div><p className="eyebrow">COMMUNITY CHECK</p><strong>Been here? Verify the {isBasketball ? "court" : "ground"}.</strong></div><div className="vote-actions"><button type="button" onClick={() => void handleVote(true)} disabled={voting || isDemo} aria-label={`Confirm this ${isBasketball ? "court" : "pitch"} is real`}><Check size={18} /> YES</button><button type="button" onClick={() => void handleVote(false)} disabled={voting || isDemo} aria-label={`Report this ${isBasketball ? "court" : "pitch"} for checking`}><X size={18} /> NO</button></div></div>
      {isDemo && <p className="demo-explainer">Voting is disabled for sample preview data.</p>}
      {!hydrated && <p className="demo-explainer">Checking player session…</p>}
    </section>}

    {tab === "sets" && <section className="tab-panel sets-panel" role="tabpanel">
      <div className="section-heading"><div><p className="eyebrow">{isBasketball ? "WHO DEY RUN SET?" : "WHO DEY HOLD SET?"}</p><h2>{isBasketball ? "GET IN RUN." : "GET IN PLAY."}</h2></div><button type="button" className="icon-action" onClick={() => setShowCreate((value) => !value)} aria-expanded={showCreate}>{showCreate ? <X size={18} /> : <Plus size={18} />} <span>{showCreate ? "CLOSE" : isBasketball ? "POST A RUN" : "CREATE SET"}</span></button></div>
      {lobbyError && <Notice tone="warning" className="inline-notice"><strong>SET PREVIEW</strong> Unable to load live lobbies. Sample sets are clearly labelled below.</Notice>}
      {showCreate && <form className="lobby-create" onSubmit={handleCreateLobby}><div className="form-section-heading"><span>+</span><div><p className="eyebrow">{isBasketball ? "CALL YOUR BALLERS" : "CALL YOUR PEOPLE"}</p><h2>{isBasketball ? "POST A RUN" : "POST A SET"}</h2></div></div><label className="field"><span>{isBasketball ? "RUN NAME" : "SET NAME"}</span><input value={lobbyTitle} onChange={(event) => setLobbyTitle(event.target.value)} required maxLength={60} placeholder={isBasketball ? "Evening 3v3 / 5v5 run" : "Evening 5-a-side"} /></label><label className="field"><span>KICK-OFF</span><input type="datetime-local" value={lobbyTime} onChange={(event) => setLobbyTime(event.target.value)} required /></label><label className="field"><span>PLAYER CAP</span><input type="number" value={lobbyPlayers} onChange={(event) => setLobbyPlayers(event.target.value)} min={2} max={30} required /></label><label className="field"><span>NOTE <small>OPTIONAL</small></span><input value={lobbyNote} onChange={(event) => setLobbyNote(event.target.value)} placeholder={isBasketball ? "Guards needed. Bring light/dark jersey." : "Keeper needed. Bring a dark jersey."} maxLength={100} /></label><AsyncButton type="submit" busy={lobbyBusy === "create"} className="button--full">{isBasketball ? "POST THE RUN" : "POST THE SET"} <ArrowUpRight size={16} /></AsyncButton></form>}
      {lobbyLoading && !lobbyData && <LoadingState label={isBasketball ? "Calling the run list…" : "Calling the set list…"} />}
      {!lobbyLoading && lobbies.length === 0 && <EmptyState title={isBasketball ? "No run on this court yet." : "No set on this ground yet."}>{isBasketball ? "Create the first run and get hoops flying." : "Create the first one and get the ball moving."}</EmptyState>}
      <div className="lobby-list">{lobbies.map((lobby) => {
        const isDemoLobby = lobby.id.startsWith("demo-") || isDemo;
        const players = Array.isArray(lobby.players) ? (lobby.players as LobbyPlayer[]) : [];
        const isJoined = Boolean(user && players.some((p: any) => (p?.id && (p.id === user.id || String(p.id) === String(user.id))) || (p?.alias && p.alias === user.alias) || p === user.alias));
        const isHost = Boolean(user && lobby.host && typeof lobby.host === "object" && ((lobby.host as any).id === user.id || String((lobby.host as any).id) === String(user.id)));
        const canRecordScore = Boolean((isJoined || isHost) && players.length >= 2 && !lobby.matchResult && !isDemoLobby);
        const currentUrl = typeof window !== "undefined" ? window.location.href : `https://insidelife.vercel.app/pitches/${id}`;
        
        // Host reputation advantage
        const hostRep = (typeof lobby.host === "object" && lobby.host ? (lobby.host as any).reputationScore : 0) || 0;
        const isVerifiedSet = hostRep >= 50;

        return <article className="lobby-card" key={lobby.id}>
          <div className="lobby-card__top">
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span className="lobby-open"><i /> OPEN SET</span>
              {isVerifiedSet && (
                <span className="verified-set-badge" title={`Senior host with ${hostRep} reputation`}>
                  <Crown size={12} /> VERIFIED SET
                </span>
              )}
              {lobby.hasBall && (
                <span className="ball-provided-badge" title="Match equipment confirmed for this set">
                  {isBasketball ? "🏀 BALL PROVIDED" : "⚽ BALL PROVIDED"}
                </span>
              )}
            </div>
            {isDemoLobby && <span className="demo-tag demo-tag--inline">SAMPLE</span>}
          </div>
          <h3>{lobby.title || "Local game set"}</h3>
          <p className="lobby-card__note">{lobby.note || "No extra notes. Check in with the host."}</p>
          <div className="lobby-card__meta">
            <span><Clock3 size={14} /> {lobby.startsAt ? displayTime(lobby.startsAt) : lobby.date || "Time not listed"}</span>
            <span><Users size={14} /> {lobby.playerCount || players.length}/{lobby.maxPlayers || "?"}</span>
            {lobby.host && typeof lobby.host === "object" && (
              <span className="lobby-host-pill" title={`Hosted by ${(lobby.host as any).alias} (Rep: ${hostRep})`}>
                HOST: {(lobby.host as any).alias} {hostRep >= 50 ? "⭐" : ""}
              </span>
            )}
          </div>

          {/* Roster Sheet with Senior Man & Ball Owner Advantage */}
          <div className="lobby-roster">
            <div className="lobby-roster__heading">
              <span>SQUAD LIST ({players.length}/{lobby.maxPlayers || 10})</span>
              <small>ORDERED BY REPUTATION & BALL PRIORITY</small>
            </div>
            <div className="lobby-roster__list">
              {players.map((player: any, idx: number) => {
                const pName = typeof player === "string" ? player : (player.alias || "Player");
                const pRep = typeof player === "object" ? (player.reputationScore ?? 10) : 10;
                const pHasBall = typeof player === "object" ? Boolean(player.hasBall) : false;
                const pBallType = typeof player === "object" ? player.ballType : null;
                const isCaptain = idx === 0 && players.length > 0;
                const isSeniorMan = pRep >= 50;
                return (
                  <div key={`${lobby.id}-p-${idx}`} className={`roster-player ${isCaptain ? "roster-player--captain" : ""}`}>
                    <span className="roster-player__rank">#{idx + 1}</span>
                    <div className="roster-player__body">
                      <strong>{pName}</strong>
                      <span className="roster-player__rep">⭐ {pRep} REP</span>
                    </div>
                    {pHasBall && (
                      <span className="ball-owner-roster-pill" title={`Match Equipment VIP: ${pBallType || "Standard Ball"} (No-Bench Guarantee)`}>
                        {isBasketball ? "🏀" : "⚽"} BALL OWNER
                      </span>
                    )}
                    {isCaptain && (
                      <span className="captain-pill" title="Set Captain (Highest reputation in squad)">
                        <Crown size={10} /> CAPTAIN
                      </span>
                    )}
                    {!isCaptain && isSeniorMan && (
                      <span className="senior-pill" title="Senior Man (50+ reputation)">
                        ⭐ SENIOR MAN
                      </span>
                    )}
                  </div>
                );
              })}
              {players.length === 0 && (
                <div className="roster-empty">No players registered yet. Be first to take the captain spot!</div>
              )}
            </div>
          </div>

          {/* Squad Balancer (Shirt vs Up-Body / Team A vs Team B) */}
          {players.length >= 2 && (
            <div className="squad-balancer-section">
              <button
                type="button"
                className="squad-balancer-toggle"
                onClick={() => setBalancedLobbyId(balancedLobbyId === lobby.id ? null : lobby.id)}
              >
                <Swords size={13} />
                <span>{balancedLobbyId === lobby.id ? "HIDE BALANCED LINEUPS" : isBasketball ? "⚡ BALANCE SQUADS (WHITE VS DARK)" : "⚡ BALANCE SQUADS (SHIRT VS NO-SHIRT)"}</span>
              </button>

              {balancedLobbyId === lobby.id && (() => {
                const balanced = balanceSquad(players, isBasketball ? "BASKETBALL" : "FOOTBALL");
                return (
                  <div className="balanced-squads-card">
                    <div className="balanced-squads-header">
                      <strong>TACTICAL SQUAD SPLIT</strong>
                      <small>BALANCED BY REPUTATION & POSITIONS</small>
                    </div>

                    <div className="balanced-teams-grid">
                      {/* Team A */}
                      <div className="balanced-team-col balanced-team--a">
                        <div className="balanced-team-title">
                          <span>{balanced.teamA.badge} {balanced.teamA.name}</span>
                          <span className="team-avg-rep">Avg ⭐{balanced.teamA.avgRep}</span>
                        </div>
                        <div className="balanced-team-list">
                          {balanced.teamA.players.map((p: any, i: number) => {
                            const name = typeof p === "string" ? p : p.alias || "Player";
                            const rep = typeof p === "object" ? (p.reputationScore ?? 10) : 10;
                            const pos = typeof p === "object" ? (isBasketball ? p.basketballPosition : p.footballPosition) || p.favoritePosition : null;
                            return (
                              <div key={`ta-${i}`} className="balanced-player-row">
                                <span className="player-name">{name}</span>
                                {pos && <span className="player-pos">{pos.slice(0, 3)}</span>}
                                <span className="player-rep">⭐{rep}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Team B */}
                      <div className="balanced-team-col balanced-team--b">
                        <div className="balanced-team-title">
                          <span>{balanced.teamB.badge} {balanced.teamB.name}</span>
                          <span className="team-avg-rep">Avg ⭐{balanced.teamB.avgRep}</span>
                        </div>
                        <div className="balanced-team-list">
                          {balanced.teamB.players.map((p: any, i: number) => {
                            const name = typeof p === "string" ? p : p.alias || "Player";
                            const rep = typeof p === "object" ? (p.reputationScore ?? 10) : 10;
                            const pos = typeof p === "object" ? (isBasketball ? p.basketballPosition : p.footballPosition) || p.favoritePosition : null;
                            return (
                              <div key={`tb-${i}`} className="balanced-player-row">
                                <span className="player-name">{name}</span>
                                {pos && <span className="player-pos">{pos.slice(0, 3)}</span>}
                                <span className="player-rep">⭐{rep}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="balanced-share-wa-btn"
                      onClick={() => void handleShareBalancedSquad(lobby)}
                    >
                      <Share2 size={13} /> <span>SHARE BALANCED LINEUPS TO WHATSAPP</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Match Result Card if recorded */}
          {lobby.matchResult && (
            <MatchResultCard
              lobby={lobby}
              pitchName={pitch.name}
              sportType={isBasketball ? "BASKETBALL" : "FOOTBALL"}
              currentUserId={user?.id ? Number(user.id) : undefined}
              onRefresh={async () => {
                await refreshLobbies();
                await refreshPitch();
              }}
              pitchUrl={currentUrl}
            />
          )}

          <div className="lobby-actions-row">
            {!lobby.matchResult && (
              isJoined ? (
                <button type="button" className="button button--outline lobby-action-btn" disabled={isDemoLobby || lobbyBusy === lobby.id} onClick={() => void handleLeave(lobby.id)}>
                  {lobbyBusy === lobby.id ? <LoaderCircle className="spin" size={16} /> : <X size={16} />} LEAVE SET
                </button>
              ) : (
                <button type="button" className="button button--green lobby-action-btn" disabled={isDemoLobby || lobbyBusy === lobby.id} onClick={() => void handleJoin(lobby.id)}>
                  {lobbyBusy === lobby.id ? <LoaderCircle className="spin" size={16} /> : <Users size={16} />} JOIN SET <ArrowUpRight size={16} />
                </button>
              )
            )}

            {canRecordScore && (
              <button
                type="button"
                className="lobby-score-btn"
                onClick={() => setScoreLobbyModal(lobby)}
                title="Log match result, scorers and MVP"
              >
                <Trophy size={14} /> <span>{isBasketball ? "🏀 RECORD SCORE (30s)" : "⚽ RECORD SCORE (30s)"}</span>
              </button>
            )}

            <button
              type="button"
              className="lobby-wa-btn"
              onClick={() => void handleShareLobby(lobby)}
              title="Share set roster callout to WhatsApp group"
            >
              <Share2 size={14} /> <span>WHATSAPP RALLY</span>
            </button>
          </div>
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
        {messages.map((item, index) => {
          const author = messageAuthor(item);
          const isAuthorBallOwner = typeof item.user === "object" ? Boolean((item.user as any)?.hasBall) : false;
          return (
            <article className={`chat-message${index === 0 ? " chat-message--other" : " chat-message--other"}`} key={item.id}>
              <div className="chat-message__avatar">{author.slice(0, 1).toUpperCase()}</div>
              <div className="chat-message__body">
                <div className="chat-message__meta">
                  <strong>{author}</strong>
                  {isAuthorBallOwner && (
                    <span className="chat-message__ball-owner" title="Match equipment owner">
                      {isBasketball ? "🏀" : "⚽"} BALL OWNER
                    </span>
                  )}
                  <span>{displayTime(item.createdAt)}</span>
                </div>
                <p>{item.message || item.text}</p>
              </div>
            </article>
          );
        })}
      </div>
      <div className="quick-chips">
        <p className="eyebrow">QUICK SHOUT</p>
        {(isBasketball ? BASKETBALL_QUICK_MESSAGES : FOOTBALL_QUICK_MESSAGES).map((text) => (
          <button type="button" key={text} disabled={isDemo} onClick={() => void handleSend(text)}>
            {text}
          </button>
        ))}
      </div>
      {isDemo && <Notice tone="warning" className="inline-notice">Sample messages only. Connect the API to send or receive live banter.</Notice>}
      {!isDemo && token ? (
        <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); void handleSend(); }}>
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={isBasketball ? "Who dey run set today?" : "Who dey hold set today?"}
            maxLength={500}
            aria-label="Write a chat message"
          />
          <button type="submit" disabled={banterBusy || !message.trim()} aria-label="Send message">
            {banterBusy ? <LoaderCircle className="spin" size={18} /> : <Send size={18} />}
          </button>
        </form>
      ) : !token ? (
        <SignInPrompt title="Join the conversation." copy="Log in to message the players at this pitch." />
      ) : null}
      <p className="chat-footnote"><MessageCircle size={13} /> Keep the banter good. Respect the ground and the people on it.</p>
    </section>}

    {scoreLobbyModal && (
      <MatchScoreModal
        lobby={scoreLobbyModal}
        pitchName={pitch.name}
        sportType={isBasketball ? "BASKETBALL" : "FOOTBALL"}
        isOpen={Boolean(scoreLobbyModal)}
        onClose={() => setScoreLobbyModal(null)}
        onSuccess={async () => {
          setActionNote("Match score logged! Teammates and opponents can now tap confirm (+15 REP).");
          await refreshLobbies();
          await refreshPitch();
        }}
      />
    )}

    {showBallLeavingModal && (
      <div className="match-modal-backdrop" onClick={() => setShowBallLeavingModal(false)}>
        <div className="match-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
          <div className="match-modal-header">
            <div>
              <span className="match-modal-eyebrow">EQUIPMENT STATUS RADAR</span>
              <h2>{isBasketball ? "IS BASKETBALL LEAVING COURT?" : "IS MATCH BALL LEAVING GROUND?"}</h2>
              <span className="match-modal-subtitle">
                {pitch.ballBroughtBy
                  ? `Reported on ground by ${pitch.ballBroughtBy}.`
                  : "Match equipment is currently flagged as active."}
              </span>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowBallLeavingModal(false)}
              aria-label="Close"
              style={{ background: 'transparent', border: 'none', color: 'var(--smoke)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--smoke)", lineHeight: 1.5 }}>
              Turning off <strong>Ball on Site</strong> updates the touchline banter and campus radar so players know match equipment is no longer available on this pitch.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                className="button button--danger"
                style={{ width: "100%", justifyContent: "center", padding: "10px", gap: "6px" }}
                disabled={ballChecking}
                onClick={() => void handleBallCheckin(false, "BALL_LEAVING")}
              >
                {ballChecking ? <LoaderCircle className="spin" size={14} /> : <span>🏃</span>}
                <span>YES, BALL IS LEAVING / GONE</span>
              </button>

              <button
                type="button"
                className="button button--outline"
                style={{ width: "100%", justifyContent: "center", padding: "8px", fontSize: "10px", gap: "6px" }}
                disabled={ballChecking}
                onClick={() => void handleBallCheckin(false, "ACCIDENTAL_CLICK")}
              >
                <span>⚡</span> ACCIDENTAL CLICK / MISTAKE (UNDO WITHOUT PENALTY)
              </button>

              <button
                type="button"
                className="button button--ghost"
                style={{ width: "100%", justifyContent: "center", padding: "8px", fontSize: "10px", color: "var(--smoke)" }}
                onClick={() => setShowBallLeavingModal(false)}
              >
                KEEP ACTIVE (BALL IS STILL HERE)
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </AppFrame>;
}
