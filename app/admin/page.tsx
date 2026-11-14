"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AdminStatsData as StatsData } from "@/lib/types";

const SLOTS = ["D1_LUNCH", "D2_LUNCH", "D2_DINNER", "D3_LUNCH"] as const;
type Slot = (typeof SLOTS)[number];

const SLOT_LABELS: Record<string, string> = {
  D1_LUNCH: "Day 1 · Lunch",
  D2_LUNCH: "Day 2 · Lunch",
  D2_DINNER: "Day 2 · Banquet Dinner",
  D3_LUNCH: "Day 3 · Lunch",
};

// Progress bar colour per slot (design system colours)
const SLOT_COLORS: Record<string, string> = {
  D1_LUNCH: "bg-sea-500",
  D2_LUNCH: "bg-grove-600",
  D2_DINNER: "bg-abyss-500",
  D3_LUNCH: "bg-gamboge",
};

type AdminTab = "overview" | "roster" | "volunteers";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [activeRosterSlot, setActiveRosterSlot] = useState<Slot>("D1_LUNCH");
  const [rosterSearch, setRosterSearch] = useState("");

  // Volunteer creation form
  const [newVolName, setNewVolName] = useState("");
  const [newVolPass, setNewVolPass] = useState("");
  const [volStatus, setVolStatus] = useState<string | null>(null);
  const [creatingVol, setCreatingVol] = useState(false);

  // Certificate toggle loading
  const [togglingCerts, setTogglingCerts] = useState(false);
  const [settingActiveSlot, setSettingActiveSlot] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load statistics");
      const data: StatsData = await res.json();
      setStats(data);
      setError(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to load statistics");
        const data: StatsData = await res.json();
        if (!ignore) {
          setStats(data);
          setError(null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to load dashboard data";
          setError(msg);
          setLoading(false);
        }
      }
    })();

    const interval = setInterval(() => {
      fetchStats();
    }, 10000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [fetchStats, router]);

  async function handleSetActiveSlot(slot: Slot) {
    if (!stats || stats.activeMealSlot === slot || settingActiveSlot) return;
    setSettingActiveSlot(true);
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-active-slot",
          slot,
        }),
      });
      if (!res.ok) throw new Error("Failed to change active meal slot");
      await fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set slot";
      alert(msg);
    } finally {
      setSettingActiveSlot(false);
    }
  }

  async function handleToggleCertificates() {
    if (!stats) return;
    const targetState = !stats.certificatesReleased;
    const confirmMsg = targetState
      ? "Are you sure you want to RELEASE all certificates? Participants will immediately be able to view and download their certificates."
      : "Are you sure you want to LOCK certificates? Participants will see 'Not yet available'.";

    if (!confirm(confirmMsg)) return;

    setTogglingCerts(true);
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-certificates",
          released: targetState,
        }),
      });
      if (!res.ok)
        throw new Error("Failed to update certificates release flag");
      await fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Toggle failed";
      alert(msg);
    } finally {
      setTogglingCerts(false);
    }
  }

  async function handleCreateVolunteer(e: React.FormEvent) {
    e.preventDefault();
    setVolStatus(null);
    setCreatingVol(true);
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-volunteer",
          name: newVolName,
          password: newVolPass,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create volunteer");

      setVolStatus(`Volunteer '${data.volunteer}' created successfully!`);
      setNewVolName("");
      setNewVolPass("");
      await fetchStats();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error creating volunteer";
      setVolStatus(`Error: ${msg}`);
    } finally {
      setCreatingVol(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-sm text-ink/70">
        <span className="inline-block animate-pulse">
          Loading real-time conference stats...
        </span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-100 border-2 border-red-800 text-red-950 font-mono text-sm shadow-[4px_4px_0px_0px_var(--color-destructive)]">
        <strong>Error:</strong> {error || "No data received"}
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "roster", label: "Meal Roster" },
    { id: "volunteers", label: "Volunteers" },
  ];

  // Roster filtered list
  const rosterList = (stats.roster?.[activeRosterSlot] ?? []).filter((p) =>
    rosterSearch.trim() === ""
      ? true
      : p.name.toLowerCase().includes(rosterSearch.toLowerCase()),
  );
  const servedCount = rosterList.filter((p) => p.served).length;
  const remainingCount = rosterList.filter((p) => !p.served).length;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border-2 border-ink p-4 shadow-[4px_4px_0px_0px_var(--color-ink)]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sea-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sea-500"></span>
          </span>
          <span className="font-mono text-xs uppercase font-bold text-ink tracking-wider">
            Live Database Synced (10s auto-refresh)
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Export all slots */}
          <a
            href="/api/admin/export-claims"
            className="px-3 py-1.5 bg-paper font-mono font-bold text-xs text-ink border-2 border-ink shadow-[2px_2px_0px_0px_var(--color-ink)] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all flex items-center gap-1.5"
            download
          >
            <span>📥</span> Export All Slots CSV
          </a>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-100 font-mono font-bold text-xs text-red-950 border-2 border-red-900 shadow-[2px_2px_0px_0px_var(--color-red-900)] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered */}
        <div className="bg-surface border-2 border-ink p-5 shadow-[4px_4px_0px_0px_var(--color-ink)]">
          <p className="font-mono text-xs uppercase font-bold text-ink/70">
            Total Registered
          </p>
          <p className="font-serif text-4xl font-black text-ink mt-2">
            {stats.totalUsers}
          </p>
          <div className="mt-3 flex flex-wrap gap-1 font-mono text-[10px]">
            {Object.entries(stats.categoryCounts).map(([cat, count]) => (
              <span
                key={cat}
                className="px-1.5 py-0.5 bg-paper border border-ink/30 text-ink"
              >
                {cat}: {count}
              </span>
            ))}
          </div>
        </div>

        {/* Certificates Status */}
        <div className="bg-surface border-2 border-ink p-5 shadow-[4px_4px_0px_0px_var(--color-ink)]">
          <p className="font-mono text-xs uppercase font-bold text-ink/70">
            Certificates Release
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                stats.certificatesReleased ? "bg-sea-500" : "bg-red-500"
              }`}
            />
            <p className="font-serif text-2xl font-bold text-ink">
              {stats.certificatesReleased ? "RELEASED" : "LOCKED"}
            </p>
          </div>
          <button
            onClick={handleToggleCertificates}
            disabled={togglingCerts}
            className={`mt-3 w-full py-1.5 px-3 font-mono font-bold text-xs uppercase border-2 border-ink shadow-[2px_2px_0px_0px_var(--color-ink)] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all cursor-pointer disabled:opacity-50 ${
              stats.certificatesReleased
                ? "bg-red-200 text-red-950"
                : "bg-sea-500 text-paper"
            }`}
          >
            {togglingCerts
              ? "Updating..."
              : stats.certificatesReleased
                ? "🔒 Lock Certificates"
                : "🚀 Release Certificates"}
          </button>
        </div>

        {/* Total Volunteers */}
        <div className="bg-surface border-2 border-ink p-5 shadow-[4px_4px_0px_0px_var(--color-ink)]">
          <p className="font-mono text-xs uppercase font-bold text-ink/70">
            Active Volunteers
          </p>
          <p className="font-serif text-4xl font-black text-ink mt-2">
            {stats.volunteers.length}
          </p>
          <p className="font-mono text-[11px] text-ink/60 mt-3">
            Authorized scanner accounts in database
          </p>
        </div>

        {/* Total Meal Claims */}
        <div className="bg-surface border-2 border-ink p-5 shadow-[4px_4px_0px_0px_var(--color-ink)]">
          <p className="font-mono text-xs uppercase font-bold text-ink/70">
            Total Meals Served
          </p>
          <p className="font-serif text-4xl font-black text-sea-500 mt-2">
            {Object.values(stats.slotCounts).reduce((a, b) => a + b, 0)}
          </p>
          <p className="font-mono text-[11px] text-ink/60 mt-3">
            Across all 4 conference meal slots
          </p>
        </div>
      </div>

      {/* Meal Slots Progress & Active Slot Control */}
      <div className="bg-surface border-2 border-ink p-6 shadow-[6px_6px_0px_0px_var(--color-ink)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <span>🍽️</span> Meal Slot Headcount &amp; Progress
          </h3>
          <span className="font-mono text-xs text-ink-dim">
            Click <strong>&quot;Set Active for Scanners&quot;</strong> to choose the slot volunteers scan.
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SLOTS.map((slot) => {
            const served = stats.slotCounts[slot] || 0;
            const eligible = stats.eligiblePerSlot[slot] || 0;
            const pct =
              eligible > 0 ? Math.round((served / eligible) * 100) : 0;
            const barColor = SLOT_COLORS[slot] ?? "bg-chrome-400";
            const isActiveSlot = stats.activeMealSlot === slot;

            return (
              <div
                key={slot}
                className={`bg-paper border-2 border-ink p-4 shadow-[3px_3px_0px_0px_var(--color-ink)] transition-all ${
                  isActiveSlot ? "ring-2 ring-sea-500 bg-sea-500/5" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ink uppercase">
                      {SLOT_LABELS[slot] || slot}
                    </span>
                    {isActiveSlot && (
                      <span className="px-1.5 py-0.5 bg-sea-500 text-paper font-mono font-bold text-[9px] uppercase tracking-wider">
                        ACTIVE ON SCANNER
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs bg-surface px-2 py-0.5 border border-ink/40">
                    {served} / {eligible} ({pct}%)
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-4 bg-surface border-2 border-ink overflow-hidden">
                  <div
                    className={`h-full ${barColor} transition-all duration-500 border-r-2 border-ink`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="mt-2.5 flex items-center justify-between font-mono text-[10px] text-ink/70">
                  <span>{Math.max(0, eligible - served)} remaining</span>
                  {isActiveSlot ? (
                    <span className="text-sea-700 font-bold">
                      ✓ Currently Active
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetActiveSlot(slot)}
                      disabled={settingActiveSlot}
                      className="px-2 py-0.5 border border-ink bg-surface text-ink hover:bg-paper font-bold cursor-pointer transition shadow-[1px_1px_0px_0px_var(--color-ink)] active:translate-x-px active:translate-y-px"
                    >
                      {settingActiveSlot ? "Setting..." : "Set Active for Scanners"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabbed Section */}
      <div className="bg-surface border-2 border-ink shadow-[6px_6px_0px_0px_var(--color-ink)]">
        {/* Tab Nav */}
        <div className="flex border-b-2 border-ink">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 font-mono text-xs uppercase font-bold tracking-wider border-r-2 border-ink cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? "bg-ink text-paper"
                  : "bg-paper text-ink hover:bg-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-ink">
                    Recent Scan Audit Trail
                  </h3>
                  <p className="font-mono text-xs text-ink/70 mt-1">
                    Live stream of meal redemption attempts and verification
                    results (Latest 10).
                  </p>
                </div>
                <button
                  onClick={() => fetchStats()}
                  className="px-3 py-1.5 bg-paper font-mono font-bold text-xs border-2 border-ink shadow-[2px_2px_0px_0px_var(--color-ink)] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                >
                  🔄 Refresh
                </button>
              </div>

              <div className="overflow-x-auto border-2 border-ink bg-paper">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-surface border-b-2 border-ink text-ink font-bold">
                    <tr>
                      <th className="p-2.5">Time</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Participant / PID</th>
                      <th className="p-2.5">Slot</th>
                      <th className="p-2.5">Volunteer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/20">
                    {stats.recentLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-6 text-center text-ink/60 italic"
                        >
                          No scans recorded yet.
                        </td>
                      </tr>
                    ) : (
                      stats.recentLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-surface/50">
                          <td className="p-2.5 text-ink/70 whitespace-nowrap">
                            {new Date(log.ts).toLocaleTimeString()}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            {log.success ? (
                              <span className="px-1.5 py-0.5 bg-sea-500/15 text-sea-700 font-bold border border-sea-500 text-[10px]">
                                SUCCESS
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-950 font-bold border border-red-800 text-[10px]">
                                {log.reason || "DENIED"}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-bold text-ink">
                            {log.name || log.pid || "—"}
                          </td>
                          <td className="p-2.5 text-ink/80">{log.slot}</td>
                          <td className="p-2.5 text-ink/60">
                            @{log.volunteer}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ROSTER TAB ── */}
          {activeTab === "roster" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-ink">
                    Meal Roster
                  </h3>
                  <p className="font-mono text-xs text-ink/70 mt-1">
                    Slot-wise breakdown of who has been served and who is
                    remaining.
                  </p>
                </div>
                {/* Slot CSV export */}
                <a
                  href={`/api/admin/export-claims?slot=${activeRosterSlot}`}
                  download
                  className="px-3 py-1.5 bg-paper font-mono font-bold text-xs text-ink border-2 border-ink shadow-[2px_2px_0px_0px_var(--color-ink)] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all flex items-center gap-1.5 shrink-0"
                >
                  📥 Export {activeRosterSlot} CSV
                </a>
              </div>

              {/* Slot selector */}
              <div className="flex flex-wrap gap-2">
                {SLOTS.map((slot) => {
                  const s = stats.slotCounts[slot] || 0;
                  const e = stats.eligiblePerSlot[slot] || 0;
                  return (
                    <button
                      key={slot}
                      onClick={() => {
                        setActiveRosterSlot(slot);
                        setRosterSearch("");
                      }}
                      className={`px-3 py-2 font-mono text-xs font-bold border-2 border-ink cursor-pointer transition-all shadow-[2px_2px_0px_0px_var(--color-ink)] hover:translate-x-px hover:translate-y-px hover:shadow-none ${
                        activeRosterSlot === slot
                          ? "bg-ink text-paper"
                          : "bg-paper text-ink"
                      }`}
                    >
                      {SLOT_LABELS[slot]}
                      <span
                        className={`ml-2 text-[10px] ${activeRosterSlot === slot ? "text-paper/70" : "text-ink/50"}`}
                      >
                        {s}/{e}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Search by name..."
                className="w-full max-w-sm px-3 py-2 bg-paper border-2 border-ink font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sea-500"
              />

              {/* Summary row */}
              <div className="flex gap-4 font-mono text-xs">
                <span className="px-2.5 py-1 bg-sea-500/15 text-sea-700 border border-sea-500 font-bold">
                  ✓ Served: {servedCount}
                </span>
                <span className="px-2.5 py-1 bg-chrome-200/40 text-ink border border-gamboge font-bold">
                  ○ Remaining: {remainingCount}
                </span>
                <span className="px-2.5 py-1 bg-paper border border-ink/30 text-ink/70">
                  Total shown: {rosterList.length}
                </span>
              </div>

              {/* Roster Table */}
              <div className="overflow-x-auto border-2 border-ink bg-paper">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-surface border-b-2 border-ink font-bold">
                    <tr>
                      <th className="p-2.5 w-8">#</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Claimed At</th>
                      <th className="p-2.5">By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/20">
                    {rosterList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-6 text-center text-ink/60 italic"
                        >
                          No participants found.
                        </td>
                      </tr>
                    ) : (
                      rosterList.map((p, idx) => (
                        <tr
                          key={p.userId}
                          className={
                            p.served ? "bg-sea-500/5" : "hover:bg-surface/50"
                          }
                        >
                          <td className="p-2.5 text-ink/40">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-ink">
                            {p.name}
                          </td>
                          <td className="p-2.5">
                            {p.served ? (
                              <span className="px-1.5 py-0.5 bg-sea-500/15 text-sea-700 font-bold border border-sea-500 text-[10px]">
                                SERVED
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-chrome-200/40 text-ink border border-gamboge text-[10px] font-bold">
                                REMAINING
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-ink/60">
                            {p.claimedAt
                              ? new Date(p.claimedAt).toLocaleTimeString()
                              : "—"}
                          </td>
                          <td className="p-2.5 text-ink/50">
                            {p.claimedBy ? `@${p.claimedBy}` : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── VOLUNTEERS TAB ── */}
          {activeTab === "volunteers" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Create volunteer form */}
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif text-xl font-bold text-ink">
                    Add Volunteer
                  </h3>
                  <p className="font-mono text-xs text-ink/70 mt-1">
                    Add volunteers with secure passwords to access the scanner.
                  </p>
                </div>

                <form onSubmit={handleCreateVolunteer} className="space-y-4">
                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-ink mb-1">
                      Volunteer Name
                    </label>
                    <input
                      type="text"
                      value={newVolName}
                      onChange={(e) => setNewVolName(e.target.value)}
                      placeholder="e.g. rahul"
                      required
                      className="w-full px-3 py-2 bg-paper border-2 border-ink font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sea-500"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-ink mb-1">
                      Password (min 8 chars)
                    </label>
                    <input
                      type="password"
                      value={newVolPass}
                      onChange={(e) => setNewVolPass(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      minLength={8}
                      className="w-full px-3 py-2 bg-paper border-2 border-ink font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sea-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creatingVol}
                    className="w-full py-2.5 bg-grove-600 text-paper font-mono font-bold text-xs uppercase tracking-wider border-2 border-ink shadow-[3px_3px_0px_0px_var(--color-ink)] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {creatingVol ? "Hashing & Saving..." : "+ Add Volunteer"}
                  </button>

                  {volStatus && (
                    <p
                      className={`font-mono text-xs p-2.5 border-2 ${
                        volStatus.startsWith("Error")
                          ? "bg-red-100 text-red-950 border-red-800"
                          : "bg-sea-500/15 text-sea-700 border-sea-500"
                      }`}
                    >
                      {volStatus}
                    </p>
                  )}
                </form>
              </div>

              {/* Existing volunteers */}
              <div>
                <h4 className="font-mono text-xs font-bold uppercase text-ink/80 mb-3">
                  Existing Volunteers ({stats.volunteers.length})
                </h4>
                <div className="space-y-2">
                  {stats.volunteers.map((v) => (
                    <div
                      key={v._id}
                      className="flex items-center justify-between px-3 py-2.5 bg-paper border-2 border-ink shadow-[2px_2px_0px_0px_var(--color-ink)] font-mono text-xs"
                    >
                      <span className="font-bold text-ink">👤 {v.name}</span>
                      <span className="text-[10px] uppercase bg-surface px-2 py-0.5 border border-ink/40 text-ink/60">
                        {v.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
