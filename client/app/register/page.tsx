"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { registerUser } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/components/toast";

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const { showToast } = useToast();
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanAlias = alias.trim();
    if (cleanAlias.length < 2) return setError("Username must be at least 2 characters.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const res = await registerUser({ alias: cleanAlias, password, schoolId: 9 });
      setSession(res.token, res.user);
      showToast("Profile created!", `Welcome to Curbsport, ${res.user.alias}!`, "success");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] p-4">
      <div className="w-full max-w-md p-8 bg-[#191C19] border border-[#F0F0E8]/15 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-2 mb-2 text-[#00FF66] text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck size={14} />
          <span>Local Nigerian Campus Ballers</span>
        </div>
        <h1 className="text-3xl font-bold font-heading uppercase text-[#F0F0E8] tracking-wide">
          Join the Roster
        </h1>
        <p className="mt-1 text-xs text-[#8B908A]">
          Pick your alias. No third-party trackers. Your account is bound to your device.
        </p>

        {error && (
          <div className="p-3 mt-4 text-xs font-medium text-red-400 bg-red-950/40 border border-red-500/30 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8B908A] uppercase tracking-wider mb-1.5">
              Choose Unique Alias
            </label>
            <input
              type="text"
              autoComplete="username"
              required
              minLength={2}
              placeholder="e.g. UNN_Sniper"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#111311] border border-[#F0F0E8]/15 rounded-lg text-sm text-[#F0F0E8] placeholder:text-[#8B908A]/50 focus:border-[#00FF66] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8B908A] uppercase tracking-wider mb-1.5">
              Password (Min. 6 Characters)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 bg-[#111311] border border-[#F0F0E8]/15 rounded-lg text-sm text-[#F0F0E8] placeholder:text-[#8B908A]/50 focus:border-[#00FF66] focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#8B908A] hover:text-[#F0F0E8] transition-colors"
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
                <span>Creating profile...</span>
              </>
            ) : (
              <>
                <span>Claim Alias & Join</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#F0F0E8]/10 flex items-center justify-between text-xs text-[#8B908A]">
          <span>Already registered?</span>
          <Link href="/login" className="text-[#00FF66] hover:underline font-semibold">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
