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

  async function saveSchool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSchoolId(schoolDraft);
    setSaved(true);
    if (token && user) {
      try {
        const result = await updateProfile({ schoolId: parseInt(schoolDraft, 10) });
        setSession(token, { ...user, ...result.user });
      } catch (err) {
        console.error("Failed to sync school to backend", err);
      }
    }
  }

  return <AppFrame>
    <section className="page-intro page-intro--profile"><p className="eyebrow">THE PLAYER CARD</p><h1>YOUR<br /><em>SIDE.</em></h1><p>Make your home ground yours.</p></section>
    {!hydrated ? <div className="sign-in-loading">Checking player session...</div> : !token ? <SignInPrompt title="Your people are waiting." copy="Sign in to set your home campus and join local football sets." /> : <>
      <section className="player-card"><div className="player-card__stamp"><UserRound size={28} /></div><div><p className="eyebrow">PLAYER / VERIFIED SESSION</p><h2>{userDisplayName(user)}</h2><p>{user?.alias || "Username linked to your account"}</p></div><ShieldCheck className="player-card__shield" size={21} /></section>
      <form className="profile-settings" onSubmit={saveSchool}><div className="form-section-heading"><span>01</span><div><p className="eyebrow">YOUR HOME GROUND</p><h2>SELECT YOUR CAMPUS</h2></div></div>
        <Notice tone="info">Currently set to {schoolName}. Select your campus to see local courts and pitches.</Notice>
        <label className="field">
          <span>CAMPUS</span>
          <select value={schoolDraft} onChange={(event) => { setSchoolDraft(event.target.value); setSaved(false); }} required>
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
