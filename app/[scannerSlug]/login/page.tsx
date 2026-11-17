"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  FaLock,
  FaUser,
  FaArrowRight,
  FaUtensils,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa6";

export default function VolunteerLoginPage() {
  const params = useParams();
  const slug = params.scannerSlug as string;

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      if (res.ok) {
        // Full navigation so the server page re-reads the new session cookie
        window.location.href = `/${slug}`;
      } else if (res.status === 429) {
        setError("Too many failed attempts. Please wait 10 minutes.");
        setBusy(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Invalid volunteer name or password.");
        setBusy(false);
      }
    } catch {
      setError("Network error. Please check your connection.");
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 w-full flex items-center justify-center px-4 sm:px-6 py-8 sm:py-16">
      <div className="w-full max-w-md flex flex-col gap-6 border-2 border-ink bg-surface p-6 sm:p-8 shadow-[4px_4px_0px_0px_var(--color-ink)] sm:shadow-[6px_6px_0px_0px_var(--color-ink)]">
        {/* Header Badge & Title */}
        <div className="border-b-2 border-ink/20 pb-5">
          <div className="inline-flex items-center gap-2 border-2 border-ink bg-chrome-400 text-ink font-mono font-bold text-xs uppercase tracking-wider px-3 py-1 shadow-[2px_2px_0px_0px_var(--color-ink)] mb-3">
            <FaUtensils className="w-3 h-3" />
            <span>ICAA 2027 · Food Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-ink leading-tight">
            Meal Scanner
          </h1>
          <p className="font-sans text-xs text-ink-dim mt-2 leading-relaxed">
            Enter your assigned volunteer username and password to access the
            badge scanner.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="flex flex-col gap-5">
          {/* Username */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
              Volunteer Username
            </label>
            <div className="relative">
              <input
                className="w-full border-2 border-ink bg-paper px-4 py-3 pl-10 font-mono text-sm text-ink placeholder:text-ink-ghost shadow-[2px_2px_0px_0px_var(--color-ink)] focus:outline-none focus:bg-white transition"
                placeholder="e.g. rahul"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="username"
                required
              />
              <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-dim w-3.5 h-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                className="w-full border-2 border-ink bg-paper px-4 py-3 pl-10 pr-11 font-mono text-sm text-ink placeholder:text-ink-ghost shadow-[2px_2px_0px_0px_var(--color-ink)] focus:outline-none focus:bg-white transition"
                placeholder="Enter password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-dim w-3.5 h-3.5 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <FaEyeSlash className="w-4 h-4" />
                ) : (
                  <FaEye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border-2 border-destructive text-destructive font-mono text-xs shadow-[2px_2px_0px_0px_var(--color-destructive)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="group flex items-center justify-center gap-2 mt-2 px-6 py-3.5 border-2 border-ink bg-sea-500 hover:bg-sea-700 text-paper font-sans font-bold text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150 disabled:opacity-60 cursor-pointer"
          >
            <span>{busy ? "Signing in…" : "Sign In to Scanner"}</span>
            <FaArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
