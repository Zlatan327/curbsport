"use client";

import { useState } from "react";
import { X, ShieldCheck, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginUser, registerUser } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/components/toast";

interface AuthModalProps {
  open: boolean;
  initialMode?: "login" | "register";
  onClose: () => void;
}

export function AuthModal({ open, initialMode = "login", onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);
  const { showToast } = useToast();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanAlias = alias.trim();
    if (cleanAlias.length < 2) {
      setError("Username must have at least 2 characters.");
      return;
    }
    if (password.length < 6) {
      setError("Password must have at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res =
        mode === "register"
          ? await registerUser({ alias: cleanAlias, password, schoolId: 9 })
          : await loginUser({ alias: cleanAlias, password });

      setSession(res.token, res.user);
      showToast(
        mode === "register" ? "Welcome to the pitch!" : "Logged in successfully",
        `Playing as ${res.user.alias} · REP ${res.user.reputationScore ?? 10}`,
        "success"
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-6 bg-[#191C19] border border-[#F0F0E8]/15 rounded-2xl shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#8B908A] hover:text-[#F0F0E8] transition-colors rounded-lg"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-2 text-[#00FF66] text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck size={14} />
          <span>Local Nigerian Campus Ballers</span>
        </div>

        <h2 className="text-2xl font-bold font-heading uppercase text-[#F0F0E8] tracking-wide">
          {mode === "register" ? "Join the Roster" : "Baller Login"}
        </h2>
        <p className="mt-1 text-xs text-[#8B908A]">
          {mode === "register"
            ? "Create your player card to claim King of the Ground, join sets, and verify match stats."
            : "Sign in to join sets, verify match scores, and drop ground pins."}
        </p>

        {error && (
          <div className="p-3 mt-4 text-xs font-medium text-red-400 bg-red-950/40 border border-red-500/30 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8B908A] uppercase tracking-wider mb-1.5">
              Baller Alias / Username
            </label>
            <input
              type="text"
              autoComplete="username"
              required
              minLength={2}
              placeholder="e.g. OAU_MidfieldKing"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#111311] border border-[#F0F0E8]/15 rounded-lg text-sm text-[#F0F0E8] placeholder:text-[#8B908A]/50 focus:border-[#00FF66] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8B908A] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 bg-[#111311] border border-[#F0F0E8]/15 rounded-lg text-sm text-[#F0F0E8] placeholder:text-[#8B908A]/50 focus:border-[#00FF66] focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#8B908A] hover:text-[#F0F0E8] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-[#00FF66] hover:bg-[#00FF66]/90 text-black font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Connecting to ground...</span>
              </>
            ) : (
              <>
                <span>{mode === "register" ? "Create Player Profile" : "Log In & Pull Up"}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#F0F0E8]/10 flex items-center justify-between text-xs text-[#8B908A]">
          <span>{mode === "register" ? "Already have an alias?" : "New to the ground?"}</span>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "register" ? "login" : "register");
              setError(null);
            }}
            className="text-[#00FF66] hover:underline font-semibold"
          >
            {mode === "register" ? "Log in here" : "Claim an alias"}
          </button>
        </div>
      </div>
    </div>
  );
}
