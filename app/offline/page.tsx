"use client";

import Link from "next/link";
import { FaWifi, FaRotateRight } from "react-icons/fa6";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col items-center justify-center p-6 text-center font-mono">
      <div className="border-2 border-ink bg-surface p-8 max-w-md w-full shadow-[6px_6px_0px_0px_var(--color-ink)] space-y-5">
        <div className="w-14 h-14 bg-red-100 border-2 border-red-800 text-red-900 mx-auto flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_var(--color-ink)]">
          <FaWifi className="opacity-75" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-destructive">
            Connection Lost
          </span>
          <h1 className="font-serif text-2xl font-black text-ink">
            You Are Currently Offline
          </h1>
          <p className="text-xs text-ink-dim leading-relaxed">
            The scanner or admin interface requires an active connection to verify cryptographic tokens and update headcounts in real-time.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 bg-grove-600 text-paper font-bold text-xs uppercase tracking-wider border-2 border-ink shadow-[2px_2px_0px_0px_var(--color-ink)] hover:bg-grove-800 active:translate-x-px active:translate-y-px active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FaRotateRight className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>

          <Link
            href="/admin"
            className="w-full py-2 px-4 bg-paper text-ink font-bold text-xs uppercase tracking-wider border border-ink/40 hover:bg-surface text-center"
          >
            Go to Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
