"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { login, register } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { AsyncButton } from "@/components/async-button";
import { Notice } from "@/components/notice";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    
    if (alias.trim().length < 2) return setError("Username needs at least 2 characters.");
    if (password.length < 6) return setError("Password needs at least 6 characters.");
    
    setBusy(true);
    try {
      // NOTE: schoolId defaults to 1 (UNIZIK Awka) for now during MVP auth flow
      const result = isRegister
        ? await register({ alias: alias.trim(), password, schoolId: 1 })
        : await login({ alias: alias.trim(), password });
        
      if (!result?.token) throw new Error("The API response did not include a token.");
      
      const user = result.user || { alias: alias.trim() };
      setSession(result.token, user);
      router.replace("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't finish that request. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card__topline"><ShieldCheck size={15} /><span>LOCAL FOOTBALL / REAL PEOPLE</span></div>
      <p className="eyebrow">{isRegister ? "NEW TO THE GROUND?" : "BACK ON THE GROUND?"}</p>
      <h1>{isRegister ? <>JOIN<br /><em>THE SET.</em></> : <>BALL<br /><em>KNOWS.</em></>}</h1>
      <p className="auth-card__intro">{isRegister ? "Pick a unique username. No Google sign-in. Your account is bound to your device." : "Your local pitch is calling. Enter your username and get back in play."}</p>
      {error && <Notice tone="warning" className="auth-error">{error}</Notice>}
      <form className="form-stack" onSubmit={onSubmit}>
        <label className="field">
          <span>USERNAME</span>
          <input autoComplete="username" value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="e.g. NnewiMessi" required minLength={2} />
        </label>
        <label className="field">
          <span>PASSWORD</span>
          <span className="password-field">
            <input autoComplete={isRegister ? "new-password" : "current-password"} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 6 characters" required minLength={6} />
            <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
        <AsyncButton type="submit" busy={busy} className="button--full">{isRegister ? "CREATE PLAYER PROFILE" : "LOG IN / GET IN"}<ArrowUpRight size={18} /></AsyncButton>
      </form>
      <div className="auth-card__switch">
        <span>{isRegister ? "Already in the game?" : "New around here?"}</span>
        <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Join the set"}</Link>
      </div>
      <p className="auth-card__fine">Your password goes straight to the API over your connection. We don&apos;t use Google or third-party trackers.</p>
    </div>
  );
}
