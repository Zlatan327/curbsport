"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, LogOut, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { AppFrame } from "@/components/app-frame";
import { AsyncButton } from "@/components/async-button";
import { Notice } from "@/components/notice";
import { PlayerStats } from "@/components/player-stats";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { useSchoolId } from "@/hooks/use-school-id";
import { updateProfile, getSchools } from "@/lib/api";
import { useAuthStore, userDisplayName } from "@/store/auth";
import { EditProfile } from "@/components/edit-profile";

export default function ProfilePage() {
  const { token, user, hydrated, signOut, setSession } = useAuthStore();
  const { schoolId, schoolName, updateSchoolId } = useSchoolId();
  const [schoolDraft, setSchoolDraft] = useState(schoolId);
  const [schools, setSchools] = useState<{id: number, name: string}[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSchoolDraft(schoolId);
  }, [schoolId]);

  useEffect(() => {
    if (hydrated && token) {
      getSchools().then(setSchools).catch(console.error);
    }
  }, [hydrated, token]);

  const [schoolError, setSchoolError] = useState("");

  async function saveSchool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSchoolError("");
    setSaved(false);
    if (token && user) {
      try {
        const result = await updateProfile({ schoolId: parseInt(schoolDraft, 10) });
        setSession(token, { ...user, ...result.user });
        updateSchoolId(schoolDraft);
        setSaved(true);
      } catch (err: any) {
        setSchoolError(err.message || "Failed to transfer school");
      }
    } else {
      updateSchoolId(schoolDraft);
      setSaved(true);
    }
  }

  return <AppFrame>
    <section className="page-intro page-intro--profile"><p className="eyebrow">THE PLAYER CARD</p><h1>YOUR<br /><em>SIDE.</em></h1><p>Make your home ground yours.</p></section>
    {!hydrated ? <div className="sign-in-loading">Checking player session...</div> : !token ? <SignInPrompt title="Your people are waiting." copy="Sign in to set your home campus and join local pickup sets." /> : <>
      <section className="player-card">
        <div className="player-card__stamp" style={{ overflow: "hidden", padding: 0 }}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.alias || "Baller"} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} />
          ) : (
            <UserRound size={28} />
          )}
        </div>
        <div>
          <p className="eyebrow">PLAYER / VERIFIED SESSION</p>
          <h2>{userDisplayName(user)}</h2>
          <p>{user?.alias || "Username linked to your account"}</p>
          {user?.hasBall && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "6px",
              background: "linear-gradient(90deg, #ca8a04, #eab308)",
              color: "#000",
              fontWeight: 800,
              fontSize: "0.72rem",
              padding: "3px 8px",
              borderRadius: "4px",
              letterSpacing: "0.04em",
              boxShadow: "0 0 8px rgba(234, 179, 8, 0.4)"
            }}>
              <span>{user.primarySport === "BASKETBALL" ? "🏀" : "⚽"} BALL OWNER</span>
              {user.ballType && <span style={{ opacity: 0.9, fontWeight: 600 }}>• {user.ballType}</span>}
            </div>
          )}
        </div>
        <ShieldCheck className="player-card__shield" size={21} />
      </section>
      <form className="profile-settings" onSubmit={saveSchool}><div className="form-section-heading"><span>01</span><div><p className="eyebrow">YOUR HOME GROUND</p><h2>SELECT YOUR CAMPUS</h2></div></div>
        <Notice tone="info">Currently set to {schoolName}. Note: Once set, school transfers are locked for 14 days to prevent gaming.</Notice>
        {schoolError && <Notice tone="warning">{schoolError}</Notice>}
        {saved && <Notice tone="success">Campus successfully updated to {schools.find(s => s.id.toString() === schoolDraft)?.name || schoolDraft}.</Notice>}
        <label className="field">
          <span>CAMPUS</span>
          <select value={schoolDraft} onChange={(event) => { setSchoolDraft(event.target.value); setSaved(false); setSchoolError(""); }} required>
            <option value="" disabled>Select your school</option>
            {schools.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <AsyncButton type="submit" variant="outline"><MapPin size={16} /> SAVE CAMPUS <ArrowUpRight size={16} /></AsyncButton>
        {saved && <Notice tone="success">Campus successfully updated to {schools.find(s => s.id.toString() === schoolDraft)?.name || schoolDraft}.</Notice>}
      </form>
      {user?.id && <PlayerStats userId={user.id} />}
      <EditProfile />
      <button className="signout-button" type="button" onClick={signOut}><LogOut size={16} /> SIGN OUT</button>
      <p className="profile-note">JWT stays in this browser&apos;s localStorage and is sent as a Bearer token on API calls.</p>
    </>}
  </AppFrame>;
}
