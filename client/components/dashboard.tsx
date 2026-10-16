"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Check, Clock3, Crown, Footprints, MapPin, ShieldCheck, Users } from "lucide-react";
import { campuses, demoPitches } from "@/lib/data";
import { apiRequest, fetchCampusPitches, isApiConfigured, postDemoAware } from "@/lib/api";
import type { FeedFilter, Pitch } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { PitchMap } from "@/components/pitch-map";
import { BallIcon, PlayerAvatar, StatusPill } from "@/components/ui";
import { useToast } from "@/components/toast";

const filters: { id: FeedFilter; label: string; dot?: string }[] = [
  { id: "live", label: "LIVE BALL", dot: "live" },
  { id: "building", label: "BUILDING", dot: "building" },
  { id: "king", label: "KING ACTIVE" },
];

type ApiMode = "demo" | "connecting" | "live" | "offline";

export function Dashboard() {
  const router = useRouter();
  const { showToast, ToastViewport } = useToast();
  const campusId = useAppStore((state) => state.campusId);
  const sport = useAppStore((state) => state.sport);
  const filter = useAppStore((state) => state.filter);
  const setFilter = useAppStore((state) => state.setFilter);
  const selectedId = useAppStore((state) => state.selectedPitchId);
  const setSelectedId = useAppStore((state) => state.setSelectedPitchId);
  const hasBallToday = useAppStore((state) => state.hasBallToday);
  const setHasBallToday = useAppStore((state) => state.setHasBallToday);
  const liveSetsByPitch = useAppStore((state) => state.liveSetsByPitch);
  const liveGroundByPitch = useAppStore((state) => state.liveGroundByPitch);
  const socketStatus = useAppStore((state) => state.socketStatus);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [apiMode, setApiMode] = useState<ApiMode>("demo");
  const [remoteData, setRemoteData] = useState<{ key: string; pitches: Pitch[] } | null>(null);
  const refreshTimer = useRef<number | null>(null);
  const touchStart = useRef<number | null>(null);

  const campus = campuses.find((item) => item.id === campusId) ?? campuses[0];
  const requestKey = `${campusId}:${sport}`;

  useEffect(() => {
    if (!isApiConfigured()) { setApiMode("demo"); setRemoteData(null); return; }
    let active = true;
    setApiMode("connecting");
    fetchCampusPitches(campusId, sport).then((items) => {
      if (active) { setRemoteData({ key: requestKey, pitches: items }); setApiMode("live"); }
    }).catch(() => {
      if (active) { setRemoteData(null); setApiMode("offline"); }
    });
    return () => { active = false; };
  }, [campusId, refreshTick, requestKey, sport]);

  const sourcePitches = remoteData?.key === requestKey ? remoteData.pitches : demoPitches.filter((pitch) => pitch.campusId === campusId && pitch.sport === sport);
  const pitches = useMemo(() => sourcePitches.map((pitch) => ({
    ...pitch,
    ...liveGroundByPitch[pitch.id],
    sets: liveSetsByPitch[pitch.id] ?? pitch.sets,
  })), [liveGroundByPitch, liveSetsByPitch, sourcePitches]);
  const filtered = useMemo(() => {
    if (filter === "all") return pitches;
    if (filter === "king") return pitches.filter((pitch) => pitch.king && pitch.king.reputation >= 85);
    return pitches.filter((pitch) => pitch.status === filter);
  }, [filter, pitches]);
  const selected = pitches.find((pitch) => pitch.id === selectedId) ?? pitches[0] ?? null;
  const liveCount = pitches.filter((pitch) => pitch.status === "live").length;
  const setCount = pitches.reduce((count, pitch) => count + pitch.sets.filter((set) => set.spotsOpen > 0).length, 0);

  useEffect(() => () => { if (refreshTimer.current !== null) window.clearTimeout(refreshTimer.current); }, []);

  const handleJoin = useCallback(async (pitch: Pitch, setId: string) => {
    const set = pitch.sets.find((item) => item.id === setId);
    if (!set) return;
    if (set.spotsOpen <= 0) { showToast("Set is full", `There are no open spots in “${set.title}”.`); return; }
    if (apiMode !== "live") { showToast("Sample set · join not sent", "The current set roster is not confirmed by the API; no live request was made."); return; }
    if (!isApiConfigured()) { showToast("Demo mode · join not sent", `No live roster change was made for “${set.title}”.`); return; }
    try {
      await postDemoAware(`/sets/${encodeURIComponent(set.id)}/join`, { pitchId: pitch.id });
      showToast("Join request sent", "The API accepted your request.", "success");
      setRefreshTick((tick) => tick + 1);
    } catch (error) { showToast("Join request not completed", error instanceof Error ? error.message : "The server could not confirm this request."); }
  }, [apiMode, showToast]);

  const handleBallToggle = useCallback(async () => {
    const next = !hasBallToday;
    if (!isApiConfigured()) {
      setHasBallToday(next);
      showToast(next ? "Ball beacon on · preview only" : "Ball beacon off · preview only", "This change was not broadcast to other players.", next ? "success" : "info");
      return;
    }
    try {
      await apiRequest<void>("/ground-beacons", { method: "PUT", body: JSON.stringify({ campusId, sport, hasBall: next }) });
      setHasBallToday(next);
      showToast(next ? "Ball beacon broadcast" : "Ball beacon cleared", "The API accepted the update.", "success");
    } catch (error) { showToast("Beacon not updated", error instanceof Error ? error.message : "The server could not confirm this beacon."); }
  }, [campusId, hasBallToday, setHasBallToday, showToast, sport]);

  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshTick((tick) => tick + 1);
    router.refresh();
    refreshTimer.current = window.setTimeout(() => {
      setRefreshing(false);
      showToast("Radar refreshed", apiMode === "live" ? "Showing the latest API snapshot." : "Still showing clearly marked sample data.", "success");
    }, 700);
  }, [apiMode, refreshing, router, showToast]);

  const dataBadge = <span className="status-pill is-live"><span className="filter-dot" />CAMPUS RADAR</span>;

  return <main className="home-workspace">
    <section className="feed-pane" aria-label="Live campus pitch feed" onTouchStart={(event) => { if (event.currentTarget.scrollTop === 0) touchStart.current = event.touches[0]?.clientY ?? null; }} onTouchEnd={(event) => { const start = touchStart.current; const end = event.changedTouches[0]?.clientY; if (start !== null && end !== undefined && end - start > 86 && event.currentTarget.scrollTop === 0) handleRefresh(); touchStart.current = null; }}>
      <div className="hero-topline"><div><span className="page-kicker"><span className="live-kicker-dot" /> CAMPUS RADAR · {campus.shortName}</span><h1 className="page-heading">Where&apos;s<br />the <em>game?</em></h1><p className="lead-copy">Live ground intel for the next run. Find the ball, fill your set, pull up.</p></div>{dataBadge}</div>
      <div className="radar-stats" aria-label="Campus ground summary"><div className="radar-stat"><div className="radar-stat-top"><span>GROUNDS</span><MapPin size={14} /></div><div className="radar-stat-value">{pitches.length.toString().padStart(2, "0")}</div></div><div className="radar-stat"><div className="radar-stat-top"><span>LIVE NOW</span><span className="live-kicker-dot" /></div><div className="radar-stat-value is-live">{liveCount.toString().padStart(2, "0")}</div></div><div className="radar-stat"><div className="radar-stat-top"><span>OPEN SETS</span><Users size={14} /></div><div className="radar-stat-value">{setCount.toString().padStart(2, "0")}</div></div></div>
      {refreshing && <div className="inline-feedback is-success" role="status" style={{ marginTop: 11 }}><Check size={14} />Refreshing campus radar…</div>}
      <div className="feed-toolbar"><span className="section-label">Grounds near the game</span><div className="filter-pills" role="group" aria-label="Filter grounds">{filters.map((item) => <button key={item.id} className={`filter-pill ${filter === item.id ? "is-active" : ""}`} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(filter === item.id ? "all" : item.id)}>{item.dot && <i className={`filter-dot ${item.dot === "live" ? "is-live" : item.dot === "building" ? "is-building" : ""}`} />}{item.label}</button>)}</div></div>
      <div className="pitch-list">
        {filtered.map((pitch) => {
          const joinableSet = pitch.sets.find((set) => set.spotsOpen > 0);
          const featuredSet = joinableSet ?? pitch.sets[0];
          const ballText = pitch.sport === "basketball" ? "Ball on court" : "Ball dey";
          const ballNone = pitch.sport === "basketball" ? "Ball not confirmed" : "Ball not confirmed";
          return <article key={pitch.id} className={`pitch-card ${selected?.id === pitch.id ? "is-selected" : ""}`}>
            <div className="pitch-card-main"><div><div className="pitch-name-row"><h2 className="pitch-name">{pitch.name}</h2>{pitch.verified && <span className="verified-check" title="Community verified"><ShieldCheck size={12} /></span>}</div><div className="pitch-landmark">{pitch.landmark}</div></div><div className="pitch-status"><StatusPill status={pitch.status} /><span className="pitch-landmark">{pitch.surface}</span></div></div>
            <div className="pitch-meta-row"><span className="pitch-meta-item"><span className={pitch.status === "live" ? "live-kicker-dot" : "filter-dot"} />{pitch.liveCount} playing</span><span className="pitch-meta-item">{pitch.ballPresent ? <><BallIcon size={13} sport={pitch.sport} />{ballText} · <strong>{pitch.ballBroughtBy ?? "confirmed"}</strong></> : <><BallIcon size={13} sport={pitch.sport} />{ballNone}</>}</span>{pitch.floodlights && <span className="pitch-meta-item">◌ Floodlights</span>}{featuredSet && <span className="pitch-meta-item"><Clock3 size={13} />{pitch.sport === "basketball" ? "Tip-off" : "Kickoff"} in <strong>{featuredSet.startsInMinutes} min</strong></span>}</div>
            {featuredSet && <div className="roster-avatars" aria-label={`${featuredSet.title} roster`}><div className="avatar-stack">{featuredSet.players.slice(0, 4).map((player) => <PlayerAvatar key={player.id} player={player} size="small" />)}</div><span className="roster-count"><strong>{featuredSet.title}</strong> · {featuredSet.players.length}/{featuredSet.spotsTotal} players · {featuredSet.spotsOpen} open</span></div>}
            <div className="pitch-card-footer">
              {pitch.king ? (
                <div className="king-mini">
                  <PlayerAvatar player={pitch.king} size="small" />
                  <span className="king-mini-copy">
                    <strong>{pitch.king.alias}</strong>
                    <span>♛ King · REP {pitch.king.reputation}</span>
                  </span>
                </div>
              ) : (
                <div className="king-mini" style={{ opacity: 0.8 }}>
                  <Crown size={14} style={{ color: "var(--amber)", marginRight: 4 }} />
                  <span className="king-mini-copy">
                    <strong>Open Crown</strong>
                    <span>Claim court</span>
                  </span>
                </div>
              )}
              {joinableSet ? <button type="button" className="text-action" title={`Join ${joinableSet.title}`} onClick={() => void handleJoin(pitch, joinableSet.id)}>Join set <ArrowUpRight size={13} /></button> : pitch.sets.length > 0 ? <span className="lobby-summary"><Footprints size={13} />All sets full</span> : <span className="lobby-summary"><Footprints size={13} />No set yet</span>}<Link href={`/pitches/${pitch.id}`} className="text-action" onClick={() => setSelectedId(pitch.id)}>Inspect <ArrowUpRight size={13} /></Link>
            </div>
          </article>;
        })}
        {filtered.length === 0 && <div className="empty-state">
          No grounds found for {campus.shortName} in this view.
          <div style={{ marginTop: 10 }}>
            <Link href="/add" className="primary-button" style={{ display: "inline-flex" }}>
              <MapPin size={14} /> Drop the first pin
            </Link>
          </div>
        </div>}
      </div>
      <div className="ball-toggle-card"><span className="ball-toggle-copy"><strong>{hasBallToday ? "Your ball beacon is on" : "I have a ball today"}</strong><span>{hasBallToday ? "You’re ready to bring the game." : "Let nearby players know you can bring the match ball."}</span></span><button className="switch-button" type="button" role="switch" aria-checked={hasBallToday} aria-label="I have a ball today" onClick={() => void handleBallToggle()}><span className="switch-knob" /></button></div>
      <p className="map-note" style={{ marginTop: 12 }}><ArrowDownRight size={13} />{refreshing ? "Pulling latest…" : "Pull down to refresh the radar on mobile."}</p>
    </section>
    <aside className="map-pane" id="ground-map" aria-label="Campus ground map">
      {pitches.length ? <PitchMap pitches={pitches} campusLabel={campus.shortName} /> : <><div className="map-header"><h2>Ground radar</h2><span className="map-live-count">{campus.shortName}</span></div><div className="empty-state">No {sport} ground pins on this campus yet.</div></>}
      {socketStatus === "connected" && <p className="map-note" style={{ marginTop: 8 }}><span className="live-kicker-dot" />Live campus updates active.</p>}
    </aside>
    <ToastViewport />
  </main>;
}
