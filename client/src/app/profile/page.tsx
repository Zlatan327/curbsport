"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, LogOut, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { AppFrame } from "@/components/app-frame";
import { AsyncButton } from "@/components/async-button";
import { Notice } from "@/components/notice";
import { PlayerStats } from "@/components/player-stats";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { useSchoolId } from "@/hooks/use-school-id";
import { useAuthStore, userDisplayName } from "@/store/auth";

export default function ProfilePage() {
  const { token, user, hydrated, signOut } = useAuthStore();
  const { schoolId, schoolName, updateSchoolId } = useSchoolId();
  const [schoolDraft, setSchoolDraft] = useState(schoolId);
  const [saved, setSaved] = useState(false);

  useEffect(() => setSchoolDraft(schoolId), [schoolId]);

  function saveSchool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSchoolId(schoolDraft);
    setSaved(true);
  }

  return <AppFrame>
    <section className="page-intro page-intro--profile"><p className="eyebrow">THE PLAYER CARD</p><h1>YOUR<br /><em>SIDE.</em></h1><p>Make your home ground yours.</p></section>
    {!hydrated ? <div className="sign-in-loading">Checking player session...</div> : !token ? <SignInPrompt title="Your people are waiting." copy="Sign in to set your home campus and join local football sets." /> : <>
      <section className="player-card"><div className="player-card__stamp"><UserRound size={28} /></div><div><p className="eyebrow">PLAYER / VERIFIED SESSION</p><h2>{userDisplayName(user)}</h2><p>{user?.alias || "Username linked to your account"}</p></div><ShieldCheck className="player-card__shield" size={21} /></section>
      <form className="profile-settings" onSubmit={saveSchool}><div className="form-section-heading"><span>01</span><div><p className="eyebrow">YOUR HOME GROUND</p><h2>SET YOUR CAMPUS ID</h2></div></div>
        <Notice tone="info">Currently set to {schoolName}. Enter a new School ID from your backend to switch your campus view.</Notice>
        <label className="field"><span>BACKEND CAMPUS ID</span><input value={schoolDraft} onChange={(event) => { setSchoolDraft(event.target.value); setSaved(false); }} placeholder="1" required /></label>
        <AsyncButton type="submit" variant="outline"><MapPin size={16} /> SAVE CAMPUS ID <ArrowUpRight size={16} /></AsyncButton>
        {saved && <Notice tone="success">Campus ID {schoolDraft} saved on this device.</Notice>}
      </form>
      {user?.id && <PlayerStats userId={user.id} />}
      <button className="signout-button" type="button" onClick={signOut}><LogOut size={16} /> SIGN OUT</button>
      <p className="profile-note">JWT stays in this browser&apos;s localStorage and is sent as a Bearer token on API calls.</p>
    </>}
  </AppFrame>;
}
