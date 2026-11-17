"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";
import {
  FaQrcode,
  FaMagnifyingGlass,
  FaVolumeHigh,
  FaVolumeXmark,
  FaBolt,
  FaRightFromBracket,
  FaUtensils,
  FaCheck,
  FaTriangleExclamation,
  FaXmark,
  FaCameraRotate,
  FaChartPie,
} from "react-icons/fa6";
import { MEAL_SLOTS } from "@/constants/2027/mealSlots";
import type {
  ScanResult as Result,
  SlotStats as Stats,
  SearchUserResult as SearchUser,
} from "@/lib/types";

const ist = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : "";

// Online status helper using useSyncExternalStore to avoid setState in effects
function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

export default function Scanner({
  volunteer,
  slug,
  initialSlot = MEAL_SLOTS[0].id,
}: {
  volunteer: string;
  slug: string;
  initialSlot?: string;
}) {
  const [slot, setSlot] = useState(initialSlot);
  const [result, setResult] = useState<Result | null>(null);
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );
  const isOffline = !isOnline;

  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<"camera" | "stats" | "search">(
    "camera",
  );
  const [muted, setMuted] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const slotRef = useRef(slot);
  const lastScan = useRef({ id: "", t: 0 });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const scannerRef = useRef<unknown>(null);

  useEffect(() => {
    slotRef.current = slot;
  }, [slot]);

  // WebAudio Beeps
  const playSound = useCallback(
    (status: string) => {
      if (muted) return;
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") ctx.resume();

        if (status === "OK") {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        } else if (status === "ALREADY_CLAIMED") {
          [0, 0.15].forEach((delay) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(320, ctx.currentTime + delay);
            gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(
              0.01,
              ctx.currentTime + delay + 0.1,
            );
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.1);
          });
        } else {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(140, ctx.currentTime);
          gain.gain.setValueAtTime(0.35, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        }
      } catch {
        // Audio not supported
      }
    },
    [muted],
  );

  // Haptic feedback
  const triggerVibration = useCallback((status: string) => {
    if (!navigator.vibrate) return;
    if (status === "OK") {
      navigator.vibrate(60);
    } else if (status === "ALREADY_CLAIMED") {
      navigator.vibrate([100, 50, 100]);
    } else {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  // Fetch slot stats
  const fetchStats = useCallback(
    async (currentSlot: string) => {
      try {
        const res = await fetch(`/api/scan/stats?slot=${currentSlot}`);
        if (res.status === 401) {
          window.location.href = `/${slug}/login`;
          return;
        }
        if (res.ok) {
          const data: Stats = await res.json();
          setStats(data);
          if (data.activeSlot && data.activeSlot !== slotRef.current) {
            setSlot(data.activeSlot);
          }
        }
      } catch {
        // ignore
      }
    },
    [slug],
  );

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`/api/scan/stats?slot=${slot}`);
        if (res.status === 401) {
          window.location.href = `/${slug}/login`;
          return;
        }
        if (res.ok && !ignore) {
          const data: Stats = await res.json();
          setStats(data);
          if (data.activeSlot && data.activeSlot !== slotRef.current) {
            setSlot(data.activeSlot);
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      ignore = true;
    };
  }, [slot, slug]);

  // Auto-clear toast result after 6s
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), 6000);
    return () => clearTimeout(t);
  }, [result]);

  // Submit scan
  const submitScan = useCallback(
    async (id: string) => {
      if (isOffline) {
        setResult({ status: "NETWORK", name: "Offline: Scanning paused" });
        return;
      }

      try {
        const res = await fetch("/api/admin/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, slot: slotRef.current }),
        });

        if (res.status === 401) {
          window.location.href = `/${slug}/login`;
          return;
        }

        const data: Result = await res.json();
        setResult(data);
        playSound(data.status);
        triggerVibration(data.status);
        fetchStats(slotRef.current);
      } catch {
        setResult({ status: "NETWORK" });
        playSound("NETWORK");
      }
    },
    [isOffline, slug, playSound, triggerVibration, fetchStats],
  );

  // Unified camera initialization
  useEffect(() => {
    let cancelled = false;

    async function onDecode(text: string) {
      const m = text.match(/[a-f0-9]{32}/i);
      if (!m) return;
      const id = m[0].toLowerCase();
      const now = Date.now();
      if (lastScan.current.id === id && now - lastScan.current.t < 3000) return;
      lastScan.current = { id, t: now };

      await submitScan(id);
    }

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const el = document.getElementById("reader");
        if (!el) return;

        const s = new Html5Qrcode("reader");
        scannerRef.current = s;
        await s.start(
          { facingMode },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onDecode,
          () => {},
        );

        try {
          const track = (
            s as unknown as { getRunningTrack: () => MediaStreamTrack }
          ).getRunningTrack();
          if (track) {
            videoTrackRef.current = track;
            const capabilities = track.getCapabilities?.() as
              | (MediaTrackCapabilities & { torch?: boolean })
              | undefined;
            if (capabilities && "torch" in capabilities) {
              setHasTorch(true);
            }
          }
        } catch {
          // ignore
        }
      } catch {
        setResult({
          status: "NETWORK",
          name: "Camera unavailable. Allow camera access over HTTPS.",
        });
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current as {
        isScanning?: boolean;
        stop: () => Promise<void>;
        clear: () => void;
      } | null;
      if (s) {
        try {
          if (s.isScanning) {
            s.stop()
              .then(() => s.clear())
              .catch(() => {});
          } else {
            s.clear();
          }
        } catch {
          // ignore cleanup
        }
      }
    };
  }, [facingMode, submitScan]);

  // Torch Toggle
  const toggleTorch = async () => {
    if (!videoTrackRef.current) return;
    const nextTorch = !torchOn;
    try {
      const track = videoTrackRef.current as MediaStreamTrack & {
        applyConstraints: (constraints: {
          advanced?: Array<{ torch?: boolean }>;
        }) => Promise<void>;
      };
      await track.applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch {
      // not supported
    }
  };

  // Flip Camera
  const toggleCameraFacing = async () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Logout
  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = `/${slug}/login`;
  };

  // Manual search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length < 2) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/admin/search?q=${encodeURIComponent(searchQuery)}`,
      );
      if (res.status === 401) {
        window.location.href = `/${slug}/login`;
        return;
      }
      if (res.ok) setSearchResults(await res.json());
    } finally {
      setIsSearching(false);
    }
  };

  // Compact Neo-brutalist Toast Notification (matching CustomToast format)
  const ToastResult = result ? (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50">
      <div
        className={`flex items-center justify-between gap-3 px-4 py-3 sm:px-4 sm:py-3.5 border-2 border-ink text-ink font-bold shadow-[4px_4px_0px_0px_var(--color-ink)] ${
          result.status === "OK"
            ? "bg-sea-500 text-paper"
            : result.status === "ALREADY_CLAIMED"
              ? "bg-chrome-400 text-ink"
              : "bg-destructive text-paper"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {result.status === "OK" ? (
            <FaCheck className="w-4 h-4 shrink-0" />
          ) : result.status === "ALREADY_CLAIMED" ? (
            <FaTriangleExclamation className="w-4 h-4 shrink-0" />
          ) : (
            <FaXmark className="w-4 h-4 shrink-0" />
          )}

          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-serif font-black tracking-tight truncate leading-tight">
              {result.name ||
                (result.status === "OK" ? "Participant" : "Unknown")}
            </div>
            <div className="text-[11px] font-mono font-medium tracking-wide leading-tight opacity-90 truncate mt-0.5">
              {result.status === "OK"
                ? "Meal approved · Serve food"
                : result.status === "ALREADY_CLAIMED"
                  ? `Already taken at ${ist(result.at)}`
                  : result.status === "NOT_ELIGIBLE"
                    ? "Not eligible for this meal"
                    : result.status === "WRONG_TIME"
                      ? "Window closed"
                      : "Invalid / Scan again"}
            </div>
          </div>
        </div>

        <button
          onClick={() => setResult(null)}
          className="ml-1 hover:opacity-75 transition-opacity focus:outline-none cursor-pointer shrink-0 text-inherit"
          aria-label="Close notification"
        >
          <FaXmark className="w-4 h-4" />
        </button>
      </div>
    </div>
  ) : null;

  // Search UI Panel
  const SearchPanel = (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Search Name or PID (e.g. rahul)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border-2 border-ink bg-paper px-4 py-3 font-mono text-xs shadow-[2px_2px_0px_0px_var(--color-ink)] focus:outline-none focus:bg-white"
        />
        <button
          type="submit"
          disabled={isSearching || searchQuery.trim().length < 2}
          className="px-5 py-3 border-2 border-ink bg-sea-500 text-paper font-sans font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_var(--color-ink)] hover:bg-sea-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-40 cursor-pointer"
        >
          Find
        </button>
      </form>

      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
        {searchResults.map((u) => {
          const alreadyClaimed = u.claimedSlots.includes(slot);
          const eligible = u.foodSlots.includes(slot);
          return (
            <div
              key={u.id}
              className="border-2 border-ink bg-surface p-3 flex flex-col gap-1 text-xs font-mono shadow-[2px_2px_0px_0px_var(--color-ink)]"
            >
              <div className="flex justify-between font-bold">
                <span className="text-ink text-sm">{u.name}</span>
                <span className="text-ink-dim">{u.primaryPid}</span>
              </div>
              <div className="text-[10px] text-ink-dim">{u.roles}</div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-ink/20">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    alreadyClaimed
                      ? "text-gamboge"
                      : eligible
                        ? "text-grove-600"
                        : "text-destructive"
                  }`}
                >
                  {alreadyClaimed
                    ? "Already Claimed"
                    : eligible
                      ? "Eligible"
                      : "Not Eligible"}
                </span>
                <button
                  onClick={() => submitScan(u.id)}
                  disabled={alreadyClaimed || !eligible || isOffline}
                  className="px-3 py-1.5 border-2 border-ink bg-sea-500 text-paper font-bold text-[10px] uppercase shadow-[2px_2px_0px_0px_var(--color-ink)] hover:bg-sea-700 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-30 cursor-pointer"
                >
                  Record Meal
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Stats UI Panel
  const StatsPanel = (
    <div className="border-2 border-ink bg-surface p-5 shadow-[4px_4px_0px_0px_var(--color-ink)] space-y-4">
      <div className="border-b-2 border-ink/15 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-bold text-ink">
            Headcount Metrics
          </h3>
          <p className="font-mono text-[11px] text-ink-dim">
            Slot:{" "}
            <span className="font-bold text-ink">
              {MEAL_SLOTS.find((s) => s.id === slot)?.label || slot}
            </span>
          </p>
        </div>
        <button
          onClick={() => fetchStats(slot)}
          className="px-2.5 py-1 bg-paper font-mono text-xs border border-ink/40 shadow-[1px_1px_0px_0px_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
        >
          🔄 Refresh
        </button>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div className="bg-paper p-4 border-2 border-ink shadow-[3px_3px_0px_0px_var(--color-ink)]">
            <span className="text-[10px] text-ink-dim uppercase block tracking-wider font-bold">
              Total Served
            </span>
            <span className="text-3xl font-black text-grove-600 block my-1">
              {stats.claimed}
            </span>
            <span className="text-[11px] text-ink-dim block">
              out of {stats.eligible} eligible
            </span>
          </div>
          <div className="bg-paper p-4 border-2 border-ink shadow-[3px_3px_0px_0px_var(--color-ink)]">
            <span className="text-[10px] text-ink-dim uppercase block tracking-wider font-bold">
              Remaining
            </span>
            <span className="text-3xl font-black text-abyss-500 block my-1">
              {stats.remaining}
            </span>
            <span className="text-[11px] text-ink-dim block">meals left</span>
          </div>
        </div>
      ) : (
        <p className="font-mono text-xs text-ink/70 text-center py-4">
          Loading stats...
        </p>
      )}

      {stats && stats.eligible > 0 && (
        <div className="space-y-1.5 pt-2 font-mono text-xs">
          <div className="flex justify-between text-[11px] text-ink-dim">
            <span>Distribution Progress</span>
            <span>{Math.round((stats.claimed / stats.eligible) * 100)}%</span>
          </div>
          <div className="w-full h-3.5 bg-paper border-2 border-ink overflow-hidden">
            <div
              className="h-full bg-chrome-400 border-r-2 border-ink transition-all duration-300"
              style={{
                width: `${Math.min(100, (stats.claimed / stats.eligible) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col px-4 sm:px-6 lg:px-8 py-2 gap-4 pb-16 relative">
      {/* Dynamic Toast for Scan Feedback */}
      {ToastResult}

      {/* Offline Alert Strip */}
      {isOffline && (
        <div className="border-2 border-destructive bg-destructive text-paper p-2.5 font-mono font-bold text-center text-xs tracking-wider uppercase animate-pulse shadow-[4px_4px_0px_0px_var(--color-ink)]">
          OFFLINE: SCANNING PAUSED
        </div>
      )}

      {/* Top Header Bar across full width */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-2 border-ink bg-surface p-4 shadow-[4px_4px_0px_0px_var(--color-ink)] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-chrome flex items-center justify-center font-mono font-bold text-ink border-2 border-ink shadow-[2px_2px_0px_0px_var(--color-ink)] text-sm shrink-0">
            FD
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-ink-dim font-mono text-[10px] uppercase tracking-wider">
              <FaUtensils className="w-2.5 h-2.5 text-grove-600" />
              <span>Food Desk · Operations</span>
            </div>
            <span className="font-serif font-bold text-xl sm:text-2xl text-ink leading-tight block">
              Volunteer: @{volunteer}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Active Serving Slot Display (Controlled by Admin) */}
          <div className="flex items-center gap-2 border-2 border-ink bg-paper px-3 py-1.5 shadow-[2px_2px_0px_0px_var(--color-ink)]">
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-ink-dim">
              Slot:
            </span>
            <span className="font-mono text-xs font-black text-ink uppercase">
              {MEAL_SLOTS.find((s) => s.id === slot)?.label || slot}
            </span>
          </div>

          <button
            onClick={() => setMuted(!muted)}
            className="p-2.5 border-2 border-ink bg-paper text-ink hover:bg-white transition shadow-[2px_2px_0px_0px_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
            title="Toggle Sound"
          >
            {muted ? (
              <FaVolumeXmark className="w-4 h-4 text-destructive" />
            ) : (
              <FaVolumeHigh className="w-4 h-4 text-sea-500" />
            )}
          </button>
          <button
            onClick={handleLogout}
            className="p-2.5 border-2 border-ink bg-red-100 text-red-950 hover:bg-red-200 transition shadow-[2px_2px_0px_0px_var(--color-red-900)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
            title="Sign Out"
          >
            <FaRightFromBracket className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MOBILE-ONLY: Tabs Switcher (hidden on desktop lg:hidden) */}
      <div className="lg:hidden grid grid-cols-3 border-2 border-ink bg-surface font-sans text-xs shadow-[4px_4px_0px_0px_var(--color-ink)]">
        <button
          onClick={() => setActiveTab("camera")}
          className={`py-3 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === "camera"
              ? "bg-abyss-500 text-paper"
              : "text-ink hover:bg-paper"
          }`}
        >
          <FaQrcode className="w-3.5 h-3.5" />
          <span>Scanner</span>
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`py-3 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition border-x-2 border-ink cursor-pointer ${
            activeTab === "stats"
              ? "bg-abyss-500 text-paper"
              : "text-ink hover:bg-paper"
          }`}
        >
          <FaChartPie className="w-3.5 h-3.5" />
          <span>Stats</span>
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`py-3 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === "search"
              ? "bg-abyss-500 text-paper"
              : "text-ink hover:bg-paper"
          }`}
        >
          <FaMagnifyingGlass className="w-3.5 h-3.5" />
          <span>Search</span>
        </button>
      </div>

      {/* UNIFIED MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Camera Column: Always visible on desktop; on mobile, hidden when tab !== camera */}
        <div
          className={`lg:col-span-7 flex flex-col gap-4 ${activeTab !== "camera" ? "hidden lg:flex" : "flex"}`}
        >
          <div className="border-2 border-ink bg-surface p-4 shadow-[6px_6px_0px_0px_var(--color-ink)] space-y-3">
            <div className="flex items-center justify-between border-b-2 border-ink/15 pb-2.5">
              <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-ink">
                <FaQrcode className="w-4 h-4 text-abyss-500" />
                <span>Live Viewfinder Scanner</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleCameraFacing}
                  className="px-3 py-1 border-2 border-ink bg-paper text-ink font-mono text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_var(--color-ink)] hover:bg-white active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  title="Switch Camera (Front / Back)"
                >
                  <FaCameraRotate className="w-3.5 h-3.5" />
                  <span>Flip Camera</span>
                </button>
                {hasTorch && (
                  <button
                    onClick={toggleTorch}
                    className={`px-3 py-1 border-2 border-ink font-mono text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_var(--color-ink)] hover:bg-white active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
                      torchOn ? "bg-chrome-400 text-ink" : "bg-paper text-ink"
                    }`}
                  >
                    <FaBolt className="w-3 h-3" />
                    <span>{torchOn ? "Torch ON" : "Torch"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* The single reader element */}
            <div
              id="reader"
              className="w-full bg-paper min-h-80 sm:min-h-105 overflow-hidden border-2 border-ink"
            />

            {/* Subtle inline helper text */}
            <div className="py-1 text-center font-mono text-xs text-ink-dim uppercase tracking-wider">
              {isOffline
                ? "Offline mode active"
                : "Align badge QR code inside the frame"}
            </div>
          </div>
        </div>

        {/* Side Column (Stats & Search): On desktop always shown; on mobile shown only when selected */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Stats: visible on desktop, or mobile when activeTab === 'stats' */}
          <div className={activeTab !== "stats" ? "hidden lg:block" : "block"}>
            {StatsPanel}
          </div>

          {/* Manual Search: visible on desktop, or mobile when activeTab === 'search' */}
          <div className={activeTab !== "search" ? "hidden lg:block" : "block"}>
            <div className="border-2 border-ink bg-surface p-5 shadow-[4px_4px_0px_0px_var(--color-ink)] space-y-3">
              <div className="border-b-2 border-ink/15 pb-2.5 flex items-center gap-2 font-mono text-xs font-bold uppercase text-ink">
                <FaMagnifyingGlass className="w-3.5 h-3.5 text-abyss-500" />
                <span>Manual Search & Backup Claim</span>
              </div>
              {SearchPanel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
