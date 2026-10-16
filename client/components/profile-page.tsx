/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Flame,
  LockKeyhole,
  LogOut,
  MapPin,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Loader2,
  Target,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { fetchSchools, fetchUserStats, updateUserProfile } from "@/lib/api";
import { useToast } from "@/components/toast";
import { AuthModal } from "@/components/auth-modal";

interface MatchStatsResponse {
  userId?: number;
  alias?: string;
  reputationScore?: number;
  totalMatches?: number;
  football?: {
    goals: number;
    assists: number;
    cleanSheets: number;
    saves: number;
    tackles: number;
  };
  basketball?: {
    points: number;
    rebounds: number;
    steals: number;
    blocks: number;
    threePointers: number;
  };
  crowns?: number;
  isCrownBanned?: boolean;
  slashCount?: number;
}

export function ProfilePage() {
  const { user, token, setSession, logout, ready } = useAuthStore();
  const { showToast, ToastViewport } = useToast();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [stats, setStats] = useState<MatchStatsResponse | null>(null);

  // Form states
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [heightCm, setHeightCm] = useState(user?.heightCm ? String(user.heightCm) : "");
  const [heightFeet, setHeightFeet] = useState(
    user?.heightCm ? String(Math.floor(user.heightCm / 30.48)) : "5"
  );
  const [heightInches, setHeightInches] = useState(
    user?.heightCm ? String(Math.round((user.heightCm % 30.48) / 2.54)) : "10"
  );
  const [weightKg, setWeightKg] = useState(user?.weightKg ? String(user.weightKg) : "");
  const [medicalInfo, setMedicalInfo] = useState(user?.medicalInfo || "");
  const [schoolId, setSchoolId] = useState<number>(user?.schoolId || 9);
  const [primarySport, setPrimarySport] = useState<string>(user?.primarySport || "FOOTBALL");
  const [footballPosition, setFootballPosition] = useState<string>(
    user?.footballPosition || "MIDFIELDER"
  );
  const [basketballPosition, setBasketballPosition] = useState<string>(
    user?.basketballPosition || "GUARD"
  );
  const [hasBall, setHasBall] = useState<boolean>(Boolean(user?.hasBall));
  const [ballType, setBallType] = useState<string>(user?.ballType || "");

  // Stats display tab
  const [statsSport, setStatsSport] = useState<"FOOTBALL" | "BASKETBALL">(
    (user?.primarySport as "FOOTBALL" | "BASKETBALL") || "FOOTBALL"
  );

  // Avatar & Saving state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [avatarError, setAvatarError] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [savingSchool, setSavingSchool] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever store user changes
  useEffect(() => {
    if (user) {
      if (user.avatarUrl) {
        setAvatarPreview(user.avatarUrl);
        setAvatarError(false);
      }
      if (user.heightCm) {
        setHeightCm(String(user.heightCm));
        setHeightFeet(String(Math.floor(user.heightCm / 30.48)));
        setHeightInches(String(Math.round((user.heightCm % 30.48) / 2.54)));
      }
      if (user.weightKg) setWeightKg(String(user.weightKg));
      if (user.medicalInfo) setMedicalInfo(user.medicalInfo);
      if (user.schoolId) setSchoolId(user.schoolId);
      if (user.primarySport) {
        setPrimarySport(user.primarySport);
        setStatsSport(user.primarySport as "FOOTBALL" | "BASKETBALL");
      }
      if (user.footballPosition) setFootballPosition(user.footballPosition);
      if (user.basketballPosition) setBasketballPosition(user.basketballPosition);
      setHasBall(Boolean(user.hasBall));
      if (user.ballType) setBallType(user.ballType);
    }
  }, [user]);

  // Load campus list & real user stats
  useEffect(() => {
    fetchSchools().then(setSchools).catch(() => {});
    if (user?.id) {
      fetchUserStats(user.id)
        .then((data) => setStats(data as MatchStatsResponse))
        .catch(() => {});
    }
  }, [user?.id]);

  // Gallery photo picker with lightweight client-side canvas compression
  const handleAvatarFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Invalid image", "Please select a photo from your gallery.", "error");
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const maxDim = 320;
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
          setAvatarPreview(compressed);
          setAvatarError(false);

          if (token && user) {
            try {
              const res = await updateUserProfile({ avatarUrl: compressed });
              setSession(token, { ...user, ...res.user, avatarUrl: compressed });
              showToast("Profile photo updated!", "Your photo is now visible across the ground.", "success");
            } catch (err) {
              showToast("Photo upload failed", err instanceof Error ? err.message : "Could not save photo", "error");
            } finally {
              setUploadingAvatar(false);
            }
          } else {
            setUploadingAvatar(false);
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleHeightUnitToggle = (unit: "cm" | "ft") => {
    if (unit === heightUnit) return;
    if (unit === "ft") {
      const cmVal = parseFloat(heightCm);
      if (cmVal && !isNaN(cmVal)) {
        setHeightFeet(String(Math.floor(cmVal / 30.48)));
        setHeightInches(String(Math.round((cmVal % 30.48) / 2.54)));
      }
    } else {
      const f = parseFloat(heightFeet) || 0;
      const i = parseFloat(heightInches) || 0;
      const calculated = Math.round(f * 30.48 + i * 2.54);
      if (calculated > 0) setHeightCm(String(calculated));
    }
    setHeightUnit(unit);
  };

  const saveBiometrics = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !user) {
      setAuthModalOpen(true);
      return;
    }

    setSavingBio(true);
    let finalCm: number | undefined;
    if (heightUnit === "cm") {
      finalCm = heightCm ? parseInt(heightCm, 10) : undefined;
    } else {
      const f = parseFloat(heightFeet) || 0;
      const i = parseFloat(heightInches) || 0;
      finalCm = Math.round(f * 30.48 + i * 2.54);
    }

    try {
      const res = await updateUserProfile({
        heightCm: finalCm && !isNaN(finalCm) ? finalCm : undefined,
        weightKg: weightKg ? parseInt(weightKg, 10) : undefined,
        medicalInfo: medicalInfo.trim() || undefined,
        hasBall,
        ballType: hasBall ? ballType.trim() : undefined,
        primarySport: (primarySport as "FOOTBALL" | "BASKETBALL") || "FOOTBALL",
        footballPosition: (footballPosition as "GOALKEEPER" | "DEFENDER" | "MIDFIELDER" | "FORWARD") || "MIDFIELDER",
        basketballPosition: (basketballPosition as "GUARD" | "FORWARD" | "CENTER") || "GUARD",
      });
      setSession(token, { ...user, ...res.user });
      showToast("Player card updated", "Your sport, position, and locker details were saved.", "success");
    } catch (err) {
      showToast("Could not save details", err instanceof Error ? err.message : "Server error", "error");
    } finally {
      setSavingBio(false);
    }
  };

  const saveSchoolTransfer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !user) {
      setAuthModalOpen(true);
      return;
    }
    setSavingSchool(true);
    try {
      const res = await updateUserProfile({ schoolId });
      setSession(token, { ...user, ...res.user, schoolId });
      showToast("Campus updated", "Your home ground campus has been set.", "success");
    } catch (err) {
      showToast("Campus transfer failed", err instanceof Error ? err.message : "Transfer error", "error");
    } finally {
      setSavingSchool(false);
    }
  };

  // 1. Loading / Hydrating state (when token exists but user profile is syncing from server)
  if (!ready || (token && !user)) {
    return (
      <main className="page-content">
        <div className="page-header">
          <div className="page-header-copy">
            <div className="breadcrumb">
              <Link href="/">Radar</Link>
              <span>/</span>
              <span>Locker room</span>
            </div>
            <h1 className="page-title">Player Locker</h1>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 340, gap: 14 }}>
          <Loader2 size={32} className="animate-spin text-[#00FF66]" />
          <p className="soft-copy">Syncing player profile & peer records…</p>
        </div>
        <ToastViewport />
      </main>
    );
  }

  // 2. Unauthenticated state (ready and genuinely no token)
  if (ready && !token) {
    return (
      <main className="page-content">
        <div className="page-header">
          <div className="page-header-copy">
            <div className="breadcrumb">
              <Link href="/">Radar</Link>
              <span>/</span>
              <span>Locker room</span>
            </div>
            <h1 className="page-title">Player Locker</h1>
            <p className="page-subtitle">Sign in to view your verified match stats, profile picture, and equipment badge.</p>
          </div>
          <Link href="/" className="secondary-button">
            <ArrowLeft size={14} /> Back to radar
          </Link>
        </div>

        <section className="panel" style={{ maxWidth: 540, margin: "24px auto", textAlign: "center", padding: "36px 24px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#1B1E1B", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <UserRound size={32} style={{ color: "#00FF66" }} />
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 8 }}>Your Ground Awaits</h2>
          <p className="soft-copy" style={{ marginBottom: 24 }}>
            Sign in with your campus alias to access your locker, upload your profile picture, and check in match balls.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              type="button"
              className="primary-button"
              onClick={() => setAuthModalOpen(true)}
            >
              Sign In / Register
            </button>
            <Link href="/" className="secondary-button">
              Explore Grounds
            </Link>
          </div>
        </section>

        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        <ToastViewport />
      </main>
    );
  }

  const currentSchool = schools.find((s) => s.id === (user?.schoolId || schoolId));
  const reputation = user?.reputationScore ?? 50;
  const tier = reputation >= 90 ? "Campus Legend" : reputation >= 70 ? "Baller" : "Rookie";

  // Position labels and signature metric calculations
  const isBasketball = primarySport === "BASKETBALL";
  const userPositionLabel = isBasketball
    ? basketballPosition === "GUARD"
      ? "Guard (Point / Shooting)"
      : basketballPosition === "CENTER"
      ? "Center (Rim Protector)"
      : "Forward (Wing / Slasher)"
    : footballPosition === "GOALKEEPER"
    ? "Goalkeeper (Shot Stopper)"
    : footballPosition === "DEFENDER"
    ? "Defender (Back Line)"
    : footballPosition === "FORWARD"
    ? "Forward (Striker / Winger)"
    : "Midfielder (Maestro)";

  return (
    <main className="page-content">
      <div className="page-header">
        <div className="page-header-copy">
          <div className="breadcrumb">
            <Link href="/">Radar</Link>
            <span>/</span>
            <span>Locker room</span>
          </div>
          <h1 className="page-title">Player Locker</h1>
          <p className="page-subtitle">Your identity, verified on Nigerian campus grounds.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/" className="secondary-button">
            <ArrowLeft size={14} /> Back to radar
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="secondary-button text-red-400 border-red-500/30"
            title="Sign out of this session"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      <div className="profile-layout">
        <div className="stack">
          {/* Hero Card */}
          <section className="player-hero-card">
            <div className="player-hero-top">
              <div className="player-identity">
                {/* Profile Picture with Upload Overlay */}
                <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                  {avatarPreview && !avatarError ? (
                    <img
                      src={avatarPreview}
                      alt={user?.alias || "Player"}
                      onError={() => setAvatarError(true)}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #00FF66",
                        background: "#141714",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        background: "linear-gradient(145deg, #1b4a31, #111311)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.4rem",
                        fontWeight: 800,
                        color: "#00FF66",
                        border: "1px solid rgba(0,255,102,0.3)",
                      }}
                    >
                      {user?.alias ? user.alias.slice(0, 2).toUpperCase() : "PL"}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#00FF66",
                      color: "#000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #111311",
                      cursor: "pointer",
                    }}
                    title="Upload profile picture"
                    aria-label="Upload profile picture"
                  >
                    {uploadingAvatar ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleAvatarFile}
                  />
                </div>

                <div>
                  <h2 className="player-hero-name">{user?.alias || "Campus Player"}</h2>
                  <div className="player-campus">
                    <MapPin size={12} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />
                    {currentSchool?.name || user?.school?.name || "Campus Ground"}
                  </div>
                  {user?.hasBall && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        marginTop: 4,
                        background: "linear-gradient(90deg, #ca8a04, #eab308)",
                        color: "#000",
                        fontWeight: 800,
                        fontSize: "0.68rem",
                        padding: "2px 7px",
                        borderRadius: 4,
                        letterSpacing: "0.04em",
                      }}
                    >
                      <span>{isBasketball ? "🏀 BALL OWNER" : "⚽ BALL OWNER"}</span>
                      {user.ballType && <span>• {user.ballType}</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="rep-score">
                <strong>{reputation}</strong>
                <span>REP SCORE</span>
              </div>
            </div>

            <div className="tier-bar" aria-label={`${tier} tier progress`}>
              <span style={{ width: `${Math.min(100, (reputation / 100) * 100)}%` }} />
            </div>
            <div className="tier-track">
              <span className={tier === "Rookie" ? "text-[#00FF66] font-bold" : ""}>ROOKIE</span>
              <span className={tier === "Baller" ? "text-[#00FF66] font-bold" : ""}>BALLER</span>
              <strong className={tier === "Campus Legend" ? "text-[#00FF66]" : ""}>CAMPUS LEGEND</strong>
            </div>

            {/* Position-Aware Player Facts */}
            <div className="player-facts">
              <div className="player-fact">
                <span>Role & position</span>
                <strong>{userPositionLabel}</strong>
              </div>
              <div className="player-fact">
                <span>Matches played</span>
                <strong>{stats?.totalMatches ?? user?.matchesPlayed ?? 0} games</strong>
              </div>
              <div className="player-fact">
                <span>Signature stat</span>
                <strong>
                  {isBasketball
                    ? `${stats?.basketball?.points ?? 0} PTS · ${stats?.basketball?.rebounds ?? 0} REB`
                    : footballPosition === "GOALKEEPER"
                    ? `${stats?.football?.saves ?? 0} saves · ${stats?.football?.cleanSheets ?? 0} CS`
                    : footballPosition === "DEFENDER"
                    ? `${stats?.football?.tackles ?? 0} tackles · ${stats?.football?.cleanSheets ?? 0} CS`
                    : footballPosition === "MIDFIELDER"
                    ? `${stats?.football?.assists ?? 0} AST · ${stats?.football?.goals ?? user?.goalsScored ?? 0} G`
                    : `${stats?.football?.goals ?? user?.goalsScored ?? 0} goals · ${stats?.football?.assists ?? 0} AST`}
                </strong>
              </div>
              <div className="player-fact">
                <span>Verification</span>
                <strong>
                  <ShieldCheck size={13} style={{ display: "inline", verticalAlign: "-2px", color: "var(--turf)" }} /> Peer verified
                </strong>
              </div>
            </div>
            <div className="divider" />
            <div className="inline-feedback">
              <Sparkles size={14} />
              Tap the camera icon on your photo to upload or update your picture.
            </div>
          </section>

          {/* Home Campus Selector */}
          <section className="panel">
            <div className="panel-head">
              <h2>Select Home Campus</h2>
              <span className="status-pill is-live"><MapPin size={12} />CAMPUS SYNC</span>
            </div>
            <div className="panel-body">
              <p className="soft-copy" style={{ marginTop: 0 }}>
                Set your primary university ground. Your sets and radar alerts will default to this campus.
              </p>
              <form onSubmit={saveSchoolTransfer} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <select
                  value={schoolId}
                  onChange={(e) => setSchoolId(parseInt(e.target.value, 10))}
                  className="input"
                  style={{ flex: 1, minWidth: 220 }}
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="primary-button" disabled={savingSchool}>
                  {savingSchool ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Save Campus
                </button>
              </form>
            </div>
          </section>

          {/* Locker Details, Sport & Positions */}
          <section className="panel" aria-labelledby="biometrics-heading">
            <div className="panel-head">
              <h2 id="biometrics-heading">Locker Details, Sport & Positions</h2>
              <span className="status-pill">
                <LockKeyhole size={12} /> PRIVATE
              </span>
            </div>
            <div className="panel-body">
              <form className="form-grid" onSubmit={saveBiometrics}>
                {/* Primary Sport Selector */}
                <div className="field">
                  <label htmlFor="primary-sport-select">Primary Sport</label>
                  <select
                    id="primary-sport-select"
                    className="input"
                    value={primarySport}
                    onChange={(e) => {
                      const sp = e.target.value;
                      setPrimarySport(sp);
                      setStatsSport(sp as "FOOTBALL" | "BASKETBALL");
                    }}
                  >
                    <option value="FOOTBALL">⚽ Football (Soccer)</option>
                    <option value="BASKETBALL">🏀 Basketball</option>
                  </select>
                </div>

                {/* Football Position */}
                <div className="field">
                  <label htmlFor="fb-position-select">Football Position</label>
                  <select
                    id="fb-position-select"
                    className="input"
                    value={footballPosition}
                    onChange={(e) => setFootballPosition(e.target.value)}
                  >
                    <option value="FORWARD">Forward / Striker / Winger</option>
                    <option value="MIDFIELDER">Midfielder / Maestro</option>
                    <option value="DEFENDER">Defender / Centre Back</option>
                    <option value="GOALKEEPER">Goalkeeper / Shot Stopper</option>
                  </select>
                </div>

                {/* Basketball Position */}
                <div className="field">
                  <label htmlFor="bb-position-select">Basketball Position</label>
                  <select
                    id="bb-position-select"
                    className="input"
                    value={basketballPosition}
                    onChange={(e) => setBasketballPosition(e.target.value)}
                  >
                    <option value="GUARD">Guard (PG / SG · Floor General)</option>
                    <option value="FORWARD">Forward (SF / PF · Slasher)</option>
                    <option value="CENTER">Center (C · Big Man / Rim Protector)</option>
                  </select>
                </div>

                {/* Height */}
                <div className="field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label htmlFor="height-input">Height</label>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => handleHeightUnitToggle("cm")}
                        style={{
                          fontSize: "0.7rem",
                          padding: "2px 6px",
                          borderRadius: 3,
                          background: heightUnit === "cm" ? "#00FF66" : "#222",
                          color: heightUnit === "cm" ? "#000" : "#888",
                          border: "none",
                          fontWeight: 700,
                        }}
                      >
                        CM
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHeightUnitToggle("ft")}
                        style={{
                          fontSize: "0.7rem",
                          padding: "2px 6px",
                          borderRadius: 3,
                          background: heightUnit === "ft" ? "#00FF66" : "#222",
                          color: heightUnit === "ft" ? "#000" : "#888",
                          border: "none",
                          fontWeight: 700,
                        }}
                      >
                        FT/IN
                      </button>
                    </div>
                  </div>

                  {heightUnit === "cm" ? (
                    <input
                      id="height-input"
                      className="input"
                      type="number"
                      min="100"
                      max="250"
                      placeholder="e.g. 178"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                    />
                  ) : (
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        className="input"
                        type="number"
                        min="3"
                        max="8"
                        placeholder="5"
                        value={heightFeet}
                        onChange={(e) => setHeightFeet(e.target.value)}
                      />
                      <span style={{ alignSelf: "center", fontSize: "0.75rem", color: "#888" }}>FT</span>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        max="11"
                        placeholder="10"
                        value={heightInches}
                        onChange={(e) => setHeightInches(e.target.value)}
                      />
                      <span style={{ alignSelf: "center", fontSize: "0.75rem", color: "#888" }}>IN</span>
                    </div>
                  )}
                </div>

                {/* Weight */}
                <div className="field">
                  <label htmlFor="weight">Weight · kg</label>
                  <input
                    id="weight"
                    className="input"
                    type="number"
                    min="30"
                    max="200"
                    placeholder="e.g. 72"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                  />
                </div>

                {/* Ball Owner VIP Section */}
                <div className="field full" style={{
                  padding: 14,
                  background: hasBall ? "linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(0,0,0,0.5))" : "#141714",
                  border: hasBall ? "1px solid rgba(234, 179, 8, 0.4)" : "1px solid #282e28",
                  borderRadius: 8,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ color: hasBall ? "#fde047" : "#fff", fontSize: "0.9rem" }}>
                        {isBasketball ? "🏀 Basketball Owner Status" : "⚽ Match Ball Owner Status (VIP)"}
                      </strong>
                      <p className="soft-copy" style={{ margin: "2px 0 0", fontSize: "0.75rem" }}>
                        Own a match ball? Ball owners get priority lobby starter slots and +10 REP on equipment check-ins.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={hasBall}
                      onChange={(e) => setHasBall(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: "#eab308", cursor: "pointer" }}
                    />
                  </div>

                  {hasBall && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Ball Model / Brand
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Nike Premier League Size 5 / Molten BG4500"
                        value={ballType}
                        onChange={(e) => setBallType(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Medical History */}
                <div className="field full">
                  <label htmlFor="medical">Medical / Injury Notes (Private)</label>
                  <textarea
                    id="medical"
                    className="input"
                    rows={2}
                    placeholder="e.g. Previous knee ligament recovery, asthmatic. Visible only in your locker."
                    value={medicalInfo}
                    onChange={(e) => setMedicalInfo(e.target.value)}
                  />
                </div>

                <div className="field full">
                  <button type="submit" className="primary-button" disabled={savingBio}>
                    {savingBio ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                    Save Locker Details
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>

        {/* Dynamic, Position-Aware Performance & Ground Record */}
        <section className="panel" aria-labelledby="history-heading">
          <div className="panel-head">
            <h2 id="history-heading">Performance & Ground Record</h2>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => setStatsSport("FOOTBALL")}
                style={{
                  fontSize: "0.72rem",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontWeight: 700,
                  background: statsSport === "FOOTBALL" ? "#00FF66" : "#222",
                  color: statsSport === "FOOTBALL" ? "#000" : "#888",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ⚽ FOOTBALL
              </button>
              <button
                type="button"
                onClick={() => setStatsSport("BASKETBALL")}
                style={{
                  fontSize: "0.72rem",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontWeight: 700,
                  background: statsSport === "BASKETBALL" ? "#00FF66" : "#222",
                  color: statsSport === "BASKETBALL" ? "#000" : "#888",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                🏀 BASKETBALL
              </button>
            </div>
          </div>
          <div className="panel-body">
            {statsSport === "BASKETBALL" ? (
              // BASKETBALL STATS (Points, Rebounds, Steals, Blocks, 3-Pointers)
              <>
                <div className="radar-stats" style={{ marginTop: 0 }}>
                  <div className="radar-stat">
                    <div className="radar-stat-top">
                      <span>POINTS</span>
                      <Target size={13} />
                    </div>
                    <div className="radar-stat-value is-live">{stats?.basketball?.points ?? 0}</div>
                  </div>
                  <div className="radar-stat">
                    <div className="radar-stat-top">
                      <span>{basketballPosition === "GUARD" ? "3-POINTERS" : "REBOUNDS"}</span>
                      <Flame size={13} />
                    </div>
                    <div className="radar-stat-value">
                      {basketballPosition === "GUARD"
                        ? stats?.basketball?.threePointers ?? 0
                        : stats?.basketball?.rebounds ?? 0}
                    </div>
                  </div>
                  <div className="radar-stat">
                    <div className="radar-stat-top">
                      <span>{basketballPosition === "CENTER" ? "BLOCKS" : "STEALS"}</span>
                      <Shield size={13} />
                    </div>
                    <div className="radar-stat-value">
                      {basketballPosition === "CENTER"
                        ? stats?.basketball?.blocks ?? 0
                        : stats?.basketball?.steals ?? 0}
                    </div>
                  </div>
                </div>

                {/* Complete Basketball Box-Score Metrics */}
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
                  <div style={{ background: "#151815", padding: "8px 12px", borderRadius: 6, border: "1px solid #232823" }}>
                    <span style={{ fontSize: "0.68rem", color: "#888", display: "block" }}>TOTAL GAMES</span>
                    <strong style={{ fontSize: "1.1rem" }}>{stats?.totalMatches ?? 0}</strong>
                  </div>
                  <div style={{ background: "#151815", padding: "8px 12px", borderRadius: 6, border: "1px solid #232823" }}>
                    <span style={{ fontSize: "0.68rem", color: "#888", display: "block" }}>3-POINTERS</span>
                    <strong style={{ fontSize: "1.1rem" }}>{stats?.basketball?.threePointers ?? 0}</strong>
                  </div>
                  <div style={{ background: "#151815", padding: "8px 12px", borderRadius: 6, border: "1px solid #232823" }}>
                    <span style={{ fontSize: "0.68rem", color: "#888", display: "block" }}>REBOUNDS</span>
                    <strong style={{ fontSize: "1.1rem" }}>{stats?.basketball?.rebounds ?? 0}</strong>
                  </div>
                  <div style={{ background: "#151815", padding: "8px 12px", borderRadius: 6, border: "1px solid #232823" }}>
                    <span style={{ fontSize: "0.68rem", color: "#888", display: "block" }}>STEALS</span>
                    <strong style={{ fontSize: "1.1rem" }}>{stats?.basketball?.steals ?? 0}</strong>
                  </div>
                  <div style={{ background: "#151815", padding: "8px 12px", borderRadius: 6, border: "1px solid #232823" }}>
                    <span style={{ fontSize: "0.68rem", color: "#888", display: "block" }}>BLOCKS</span>
                    <strong style={{ fontSize: "1.1rem" }}>{stats?.basketball?.blocks ?? 0}</strong>
                  </div>
                </div>
              </>
            ) : (
              // FOOTBALL STATS (Tailored to Goalkeeper, Defender, Midfielder, Forward)
              <>
                <div className="radar-stats" style={{ marginTop: 0 }}>
                  {footballPosition === "GOALKEEPER" ? (
                    <>
                      <div className="radar-stat">
                        <div className="radar-stat-top">
                          <span>SAVES</span>
                          <Shield size={13} />
                        </div>
                        <div className="radar-stat-value is-live">{stats?.football?.saves ?? 0}</div>
                      </div>
                      <div className="radar-stat">
                        <div className="radar-stat-top">
                          <span>CLEAN SHEETS</span>
                          <CheckCircle2 size={13} />
                        </div>
                        <div className="radar-stat-value">{stats?.football?.cleanSheets ?? 0}</div>
                      </div>
                      <div className="radar-stat">
                        <div className="radar-stat-top">
                          <span>MOTM</span>
                          <Sparkles size={13} />
                        </div>
                        <div className="radar-stat-value">{user?.manOfTheMatch ?? 0}</div>
                      </div>
                    </>
                  ) : footballPosition === "DEFENDER" ? (
                    <>
                      <div className="radar-stat">
                        <div className="radar-stat-top">
                          <span>TACKLES</span>
                          <Shield size={13} />
                        </div>
                        <div className="radar-stat-value is-live">{stats?.football?.tackles ?? 0}</div>
                      </div>
                      <div className="radar-stat">
                        <div className="radar-stat-top">
                          <span>CLEAN SHEETS</span>
                          <CheckCircle2 size={13} />
                        </div>
                        <div className="radar-stat-value">{stats?.football?.cleanSheets ?? 0}</div>
                      </div>
                      <div className="radar-stat">
                        <div className="radar-stat-top">
                          <span>MOTM</span>
                          <Sparkles size={13} />
                        </div>
                        <div className="radar-stat-value">{user?.manOfTheMatch ?? 0}</div>
                      </div>
                    </>
                  ) : footballPosition === "MIDFIELDER" ? (
                    <>
                      <div className="radar-stat">
                        <div className="radar-stat-top">
                          <span>ASSISTS</span>
                          <Sparkles size={13} />
                        </div>
                        <div className="radar-stat-value is-live">{stats?.football?.assists ?? 0}</div>
                      </div>
                      <div className="radar-stat">
                        <div className="radar-stat-top">
                          <span>GOALS</span>
                          <CheckCircle2 size={13} />
                        </div>
                        <div className="radar-stat-value">{stats?.football?.goals ?? user?.goalsScored ?? 0}</div>
                      </div>
                      <div className="radar-stat">
                        <div className="radar-stat-top">
                          <span>TACKLES</span>
                          <Shield size={13} />
                        </div>
                        <div className="radar-stat-value">{stats?.football?.tackles ?? 0}</div>
                      </div>
                    </>
                  ) : (
                    // FORWARD
                    <>
                      <div className="radar-stat">
                        <div className="radar-stat-top">
                          <span>GOALS</span>
                          <CheckCircle2 size={13} />
                        </div>
                        <div className="radar-stat-value is-live">{stats?.football?.goals ?? user?.goalsScored ?? 0}</div>
                      </div>
                      <div className="radar-stat">
                        <div className="radar-stat-top">
                          <span>ASSISTS</span>
                          <Sparkles size={13} />
                        </div>
                        <div className="radar-stat-value">{stats?.football?.assists ?? 0}</div>
                      </div>
                      <div className="radar-stat">
                        <div className="radar-stat-top">
                          <span>MOTM</span>
                          <Trophy size={13} />
                        </div>
                        <div className="radar-stat-value">{user?.manOfTheMatch ?? 0}</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Complete Football Box-Score Metrics */}
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
                  <div style={{ background: "#151815", padding: "8px 12px", borderRadius: 6, border: "1px solid #232823" }}>
                    <span style={{ fontSize: "0.68rem", color: "#888", display: "block" }}>TOTAL MATCHES</span>
                    <strong style={{ fontSize: "1.1rem" }}>{stats?.totalMatches ?? user?.matchesPlayed ?? 0}</strong>
                  </div>
                  <div style={{ background: "#151815", padding: "8px 12px", borderRadius: 6, border: "1px solid #232823" }}>
                    <span style={{ fontSize: "0.68rem", color: "#888", display: "block" }}>GOALS</span>
                    <strong style={{ fontSize: "1.1rem" }}>{stats?.football?.goals ?? user?.goalsScored ?? 0}</strong>
                  </div>
                  <div style={{ background: "#151815", padding: "8px 12px", borderRadius: 6, border: "1px solid #232823" }}>
                    <span style={{ fontSize: "0.68rem", color: "#888", display: "block" }}>ASSISTS</span>
                    <strong style={{ fontSize: "1.1rem" }}>{stats?.football?.assists ?? 0}</strong>
                  </div>
                  <div style={{ background: "#151815", padding: "8px 12px", borderRadius: 6, border: "1px solid #232823" }}>
                    <span style={{ fontSize: "0.68rem", color: "#888", display: "block" }}>CLEAN SHEETS</span>
                    <strong style={{ fontSize: "1.1rem" }}>{stats?.football?.cleanSheets ?? 0}</strong>
                  </div>
                  <div style={{ background: "#151815", padding: "8px 12px", borderRadius: 6, border: "1px solid #232823" }}>
                    <span style={{ fontSize: "0.68rem", color: "#888", display: "block" }}>TACKLES</span>
                    <strong style={{ fontSize: "1.1rem" }}>{stats?.football?.tackles ?? 0}</strong>
                  </div>
                  <div style={{ background: "#151815", padding: "8px 12px", borderRadius: 6, border: "1px solid #232823" }}>
                    <span style={{ fontSize: "0.68rem", color: "#888", display: "block" }}>SAVES</span>
                    <strong style={{ fontSize: "1.1rem" }}>{stats?.football?.saves ?? 0}</strong>
                  </div>
                </div>
              </>
            )}

            <div className="divider" style={{ margin: "20px 0" }} />

            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 8 }}>Ground Activity Status</h3>
            <p className="soft-copy" style={{ fontSize: "0.82rem", lineHeight: 1.5 }}>
              Your reputation score is <strong>{reputation}</strong> ({tier}). REP increases when you participate in campus sets, confirm match results with opponents, and bring equipment to dry grounds.
            </p>

            <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "#151815", border: "1px solid #232823" }}>
              <strong style={{ fontSize: "0.8rem", color: "#00FF66", display: "block", marginBottom: 4 }}>
                🏆 Ground King Eligibility
              </strong>
              <p className="soft-copy" style={{ margin: 0, fontSize: "0.75rem" }}>
                To claim the crown at any campus ground, play sets at that pitch and receive peer confirmation on submitted results.
              </p>
            </div>
          </div>
        </section>
      </div>

      <ToastViewport />
    </main>
  );
}
