"use client";

import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa6";

export default function AdminLoginPage() {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Full navigation to reload session cookie
      window.location.href = "/admin";
    } catch (err: any) {
      setError(err.message || "Invalid master key");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto my-8">
      <div className="bg-surface border-2 border-ink p-6 sm:p-8 shadow-[6px_6px_0px_0px_var(--color-ink)]">
        <div className="mb-6 border-b-2 border-ink/15 pb-4">
          <span className="font-mono text-xs uppercase tracking-wider bg-chrome-200 text-ink px-2.5 py-1 border border-ink/30 font-bold">
            Protected Area
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-3 text-ink">
            Admin Authentication
          </h2>
          <p className="font-sans text-xs text-ink-dim mt-1.5">
            Enter the master administrator key to access the command center.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-100 border-2 border-red-800 text-red-950 font-mono text-xs shadow-[3px_3px_0px_0px_var(--color-red-800)]">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-mono text-xs uppercase font-bold text-ink mb-1.5">
              Master Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter admin master key..."
                required
                autoFocus
                className="w-full px-4 py-3 pr-11 bg-paper border-2 border-ink font-mono text-sm focus:outline-none focus:ring-2 focus:ring-chrome-400 focus:border-ink shadow-[2px_2px_0px_0px_var(--color-ink)] transition"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? (
                  <FaEyeSlash className="w-4 h-4" />
                ) : (
                  <FaEye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-chrome-400 hover:bg-chrome-600 font-sans font-bold text-sm uppercase tracking-wider text-ink border-2 border-ink shadow-[4px_4px_0px_0px_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Authenticating..." : "Unlock Dashboard →"}
          </button>
        </form>
      </div>
    </div>
  );
}
