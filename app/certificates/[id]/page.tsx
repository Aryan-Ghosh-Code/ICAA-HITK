import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  FaDownload,
  FaClock,
  FaShieldHalved,
  FaCircleCheck,
  FaFileLines,
} from "react-icons/fa6";
import { db, type UserDoc } from "@/lib/db";
import { ID_RE, parsePid } from "@/lib/ids";
import { certificatesReleased } from "@/lib/flags";
import { CATEGORIES } from "@/constants/2027/categories";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Certificates | ICAA 2027",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function CertificatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!ID_RE.test(id)) notFound();

  const d = await db();
  const user = await d.collection<UserDoc>("users").findOne({ _id: id });
  if (!user) notFound();

  const released = await certificatesReleased();

  const certs = user.PIDs.map((pid, idx) => {
    const p = parsePid(pid);
    if (!p) return null;
    const certEntry = user.certs?.[pid];
    const fileId =
      typeof certEntry === "string" ? certEntry : certEntry?.fileId;
    return {
      index: idx,
      pid,
      label: CATEGORIES[p.cat].certificate,
      role: CATEGORIES[p.cat].role,
      ready: released && Boolean(fileId),
    };
  }).filter((c): c is NonNullable<typeof c> => c !== null);

  const roles = [...new Set(certs.map((c) => c.role))].join(" · ");
  const readyCount = certs.filter((c) => c.ready).length;
  // const shortId = id.slice(0, 8);

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col gap-4 sm:gap-6 font-mono">
      {/* ── Technical Header / Console Bar ── */}
      <div className="border-2 border-ink bg-surface shadow-[4px_4px_0px_0px_var(--color-ink)] p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-grove-600 text-[10px] sm:text-xs uppercase tracking-widest font-bold">
            <FaShieldHalved className="w-3.5 h-3.5 shrink-0" />
            <span>ICAA 2027 CERTIFICATE DISPATCH REGISTRY</span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-black text-ink leading-tight wrap-break-word">
              {user.name}
            </h1>
          </div>
        </div>

        {/* Metadata Badges Group */}
        <div className="flex flex-wrap sm:flex-col sm:items-end gap-1.5 sm:gap-2">
          {/* <div className="flex items-center gap-1.5 px-2.5 py-1 bg-paper border border-ink text-ink text-[10px] sm:text-[11px] font-bold shadow-[2px_2px_0px_0px_var(--color-ink)]">
            <FaFingerprint className="w-3 h-3 text-ink/70" />
            <span className="text-ink/60">ID:</span>
            <span>{shortId}…</span>
          </div> */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider bg-paper border border-ink px-2 sm:px-2.5 py-0.5 font-bold text-ink">
              {roles || "Participant"}
            </span>
            {released && readyCount > 0 ? (
              <span className="flex items-center gap-1 text-[10px] sm:text-xs text-sea-700 font-bold bg-sea-500/10 border border-sea-500 px-2 py-0.5">
                <FaCircleCheck className="w-3 h-3 shrink-0" />
                <span>{readyCount}/{certs.length} READY</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] sm:text-xs text-gamboge font-bold bg-chrome-200/20 border border-gamboge px-2 py-0.5">
                <FaClock className="w-3 h-3 shrink-0" />
                <span>PENDING</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Certificate Release Notice (Conditional) ── */}
      {!released && (
        <div className="flex items-center gap-3 border-2 border-gamboge bg-chrome-200/20 p-3 sm:p-4 shadow-[3px_3px_0px_0px_var(--color-gamboge)] text-ink">
          <FaClock className="w-4 h-4 shrink-0 text-gamboge" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 w-full">
            <p className="font-bold text-xs sm:text-sm">
              Certificates Under Preparation
            </p>
            <p className="text-[11px] sm:text-xs text-ink-dim leading-relaxed">
              Official records unlock post-conference. Scan QR or revisit URL to download.
            </p>
          </div>
        </div>
      )}

      {/* ── Certificates Spread Grid ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-ink-dim font-bold flex items-center gap-1.5">
            <FaFileLines className="w-3 h-3" />
            <span>Available Documents ({certs.length})</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {certs.map((c) => (
            <div
              key={c.index}
              className="border-2 border-ink bg-surface shadow-[3px_3px_0px_0px_var(--color-ink)] flex flex-col justify-between transition-transform hover:translate-x-px hover:translate-y-px overflow-hidden group"
            >
              {/* Card Header & Content */}
              <div className="p-3.5 sm:p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 border-b border-ink/15 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        c.ready ? "bg-sea-500 animate-pulse" : "bg-ink/30"
                      }`}
                    />
                    <span className="text-[10px] uppercase font-bold text-ink/70">
                      REF: {c.pid}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-paper border border-ink/40 font-bold text-ink">
                    {c.role}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-ink leading-snug">
                    {c.label}
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-ink-dim">
                    ICAA 2027 Official Peer &amp; Attendance Record
                  </p>
                </div>
              </div>

              {/* Action Area Bar */}
              <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 flex items-center justify-between gap-3 border-t border-dashed border-ink/20 pt-2.5 bg-paper/50">
                <span className="text-[9px] sm:text-[10px] text-ink/50 uppercase">
                  {c.ready ? "Signed & Verified" : "Awaiting dispatch"}
                </span>

                {c.ready ? (
                  <a
                    href={`/api/certificates/${id}/${c.index}/download`}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 border-2 border-ink bg-grove-600 text-paper font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_var(--color-ink)] hover:bg-grove-800 active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer"
                  >
                    <FaDownload className="w-3 h-3" />
                    <span>Download PDF</span>
                  </a>
                ) : (
                  <div className="inline-flex items-center justify-center gap-1 px-2.5 py-1 border border-dashed border-ink/30 bg-paper text-[10px] text-ink-dim uppercase">
                    <FaClock className="w-2.5 h-2.5" />
                    <span>Pending</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer note ── */}
      <div className="border-t border-ink/20 pt-3 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-ink/50">
        <span>ICAA 2027 · Heritage Institute of Technology</span>
      </div>
    </div>
  );
}
