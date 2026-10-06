"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, LogOut, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { AppFrame } from "@/components/app-frame";
import { AsyncButton } from "@/components/async-button";
import { Notice } from "@/components/notice";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { useCityId } from "@/hooks/use-city-id";
import { useAuthStore, userDisplayName } from "@/store/auth";

export default function ProfilePage() {
  const { token, user, hydrated, signOut } = useAuthStore();
  const { cityId, setCityId } = useCityId();
  const [cityDraft, setCityDraft] = useState(cityId);
  const [saved, setSaved] = useState(false);

  useEffect(() => setCityDraft(cityId), [cityId]);

  function saveCity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCityId(cityDraft);
    setSaved(true);
  }

  return <AppFrame>
    <section className="page-intro page-intro--profile"><p className="eyebrow">THE PLAYER CARD</p><h1>YOUR<br /><em>SIDE.</em></h1><p>Make your home ground yours.</p></section>
    {!hydrated ? <div className="sign-in-loading">Checking player session…</div> : !token ? <SignInPrompt title="Your people are waiting." copy="Sign in to set your home city and join local football sets." /> : <>
      <section className="player-card"><div className="player-card__stamp"><UserRound size={28} /></div><div><p className="eyebrow">PLAYER / VERIFIED SESSION</p><h2>{userDisplayName(user)}</h2><p>{user?.phone || user?.phoneNumber || "Phone linked to your account"}</p></div><ShieldCheck className="player-card__shield" size={21} /></section>
      <form className="profile-settings" onSubmit={saveCity}><div className="form-section-heading"><span>01</span><div><p className="eyebrow">YOUR HOME GROUND</p><h2>SET YOUR CITY ID</h2></div></div>
        <Notice tone="info">The API contract requires `cityId` but does not include a city list. Enter an ID from your backend; this value filters Feed and Map.</Notice>
        <label className="field"><span>BACKEND CITY ID</span><input value={cityDraft} onChange={(event) => { setCityDraft(event.target.value); setSaved(false); }} placeholder="1" required /></label>
        <AsyncButton type="submit" variant="outline"><MapPin size={16} /> SAVE CITY ID <ArrowUpRight size={16} /></AsyncButton>
        {saved && <Notice tone="success">City ID {cityDraft} saved on this device.</Notice>}
      </form>
      <button className="signout-button" type="button" onClick={signOut}><LogOut size={16} /> SIGN OUT <span>↗</span></button>
      <p className="profile-note">JWT stays in this browser&apos;s localStorage and is sent as a Bearer token on API calls.</p>
    </>}
  </AppFrame>;
}
