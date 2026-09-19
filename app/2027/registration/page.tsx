"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BackButton from "@/components/2027/BackButton";
import CustomToast from "@/components/2027/CustomToast";
import {
  FEE_NOTES,
  AUTHOR_FEES,
  ATTENDEE_FEES,
} from "@/constants/2027/registrationFees";
import {
  IMPORTANT_DATES,
  DEADLINE_NOTE,
} from "@/constants/2027/importantDates";
import { FaArrowRight, FaEnvelope, FaCircleInfo, FaPaperPlane } from "react-icons/fa6";

// ── Manual portal state control — no date/time automation ──────────────────
// Precedence: IS_CLOSED > IS_LIVE > upcoming (both false).
const IS_LIVE = false;
const IS_CLOSED = false;

const REGISTRATION_URL = "";

const TOAST_MESSAGES = {
  closed: "The registration portal is now closed.",
  upcoming: "The registration portal has not opened yet.",
  misconfigured: "Registration link is not configured in the environment.",
} as const;

const REGISTRATION_KEY_DATES = IMPORTANT_DATES.filter((d) =>
  [
    "Camera Ready Papers due",
    "Author Registration starts",
    "Early Bird Registration by",
  ].includes(d.event),
);

export default function RegistrationPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRegisterButtonClick = () => {
    if (IS_CLOSED) {
      setToastMessage(TOAST_MESSAGES.closed);
      return;
    }

    if (!IS_LIVE) {
      setToastMessage(TOAST_MESSAGES.upcoming);
      return;
    }

    if (!REGISTRATION_URL) {
      setToastMessage(TOAST_MESSAGES.misconfigured);
      return;
    }

    window.open(REGISTRATION_URL, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const statusLabel = IS_CLOSED
    ? "Registration Closed"
    : IS_LIVE
      ? "Registration Open"
      : "Opening Soon";

  const statusDotColor = IS_CLOSED
    ? "bg-red-500"
    : IS_LIVE
      ? "bg-emerald-500"
      : "bg-amber-500";

  return (
    <div className="bg-paper text-ink px-4 md:px-6 pt-24 pb-10 max-w-7xl mx-auto flex flex-col gap-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <CustomToast
          toastMessage={toastMessage}
          setToastMessage={setToastMessage}
        />
      )}

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="border-b-2 border-ink pb-4 flex justify-between items-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black text-ink">
          Registration
        </h1>
        <BackButton />
      </div>

      {/* ── Main two-column grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT — Registration Portal + Notes ─────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Registration Portal */}
          <div className="border border-ink bg-surface shadow-[3px_3px_0px_0px_var(--color-ink)]">
            {/* Header bar */}
            <div className="border-b-2 border-ink px-4 sm:px-5 py-3 bg-ink text-paper flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] sm:text-xs uppercase tracking-widest font-bold shrink-0">
                Conference Registration
              </span>
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 shrink-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusDotColor} shrink-0`}
                />
                {statusLabel}
              </span>
            </div>

            {/* Body */}
            <div className="px-4 sm:px-5 py-5 sm:py-6 flex flex-col items-start gap-4">
              <div className="flex flex-col gap-2 w-full text-left">
                <h2 className="font-serif text-2xl sm:text-3xl font-black text-ink">
                  Secure your place at ICAA 2027
                </h2>
                <p className="font-sans text-sm text-ink-dim leading-relaxed text-justify">
                  Register to attend or present at the International Conference
                  on Applied Algorithms. At least one author per accepted paper
                  must complete registration before the camera-ready deadline to
                  ensure inclusion in the proceedings.
                </p>
              </div>

              {/* Info callout */}
              <div className="w-full flex items-start gap-3 px-3.5 sm:px-4 py-3 bg-paper border border-ink/10">
                <FaCircleInfo className="w-3.5 h-3.5 text-ink-dim mt-0.5 shrink-0" />
                <p className="font-sans text-[13px] text-ink-dim leading-relaxed text-justify">
                  Authors affiliated with non-Indian institutions must register
                  in <span className="font-bold text-ink">USD or EUR</span>.
                  Students must submit a letter from their Institute
                  authenticating full-time student status.
                </p>
              </div>

              {/* Buttons */}
              <div className="w-full flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <button
                  onClick={handleRegisterButtonClick}
                  className="group w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-ink bg-abyss-500 text-paper font-mono font-bold text-xs uppercase tracking-widest shadow-[2px_2px_0px_0px_var(--color-ink)] hover:bg-abyss-700 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_var(--color-ink)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-150 cursor-pointer"
                >
                  <span>Register Now</span>
                  <FaPaperPlane className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
                <Link
                  href="/2027/registrationfees"
                  className="w-full sm:flex-1 flex items-center justify-center px-6 py-3.5 border border-ink bg-paper text-ink font-mono font-bold text-xs uppercase tracking-widest hover:bg-border transition-colors duration-150"
                >
                  View Fee Structure
                </Link>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="border border-ink bg-surface shadow-[3px_3px_0px_0px_var(--color-ink)]">
            <div className="border-b-2 border-ink px-4 sm:px-5 py-3 bg-ink text-paper">
              <span className="font-mono text-xs uppercase tracking-widest font-bold">
                Important Notes
              </span>
            </div>
            <ul className="divide-y divide-ink/10">
              {FEE_NOTES.map((note, i) => (
                <li key={i} className="flex items-start gap-3 px-4 sm:px-5 py-3.5">
                  <span className="font-mono text-[10px] font-bold text-ink-dim mt-0.5 shrink-0 uppercase tracking-widest">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="font-sans text-sm text-ink-dim leading-relaxed text-justify">
                    {note}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── RIGHT — Key Deadlines + Fee Quick Reference ────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Key Deadlines */}
          <div className="border border-ink bg-surface shadow-[3px_3px_0px_0px_var(--color-ink)]">
            <div className="border-b-2 border-ink px-5 py-3 bg-ink text-paper">
              <span className="font-mono text-xs uppercase tracking-widest font-bold">
                Key Deadlines
              </span>
            </div>
            <div className="divide-y-2 divide-ink">
              {REGISTRATION_KEY_DATES.map((d, i) => (
                <div key={i} className="px-5 py-4 flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] text-ink-dim uppercase tracking-widest">
                    {d.event}
                  </span>
                  <span className="font-serif text-base font-black text-ink">
                    {d.date}
                  </span>
                  {d.note && (
                    <span className="font-mono text-[10px] text-grove-600 font-bold">
                      {d.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t-2 border-ink px-5 py-3">
              <p className="font-mono text-[10px] text-ink-dim/80 uppercase tracking-wider">
                {DEADLINE_NOTE}
              </p>
            </div>
          </div>

          {/* Fee Quick Reference */}
          <div className="border border-ink bg-surface shadow-[3px_3px_0px_0px_var(--color-ink)]">
            <div className="border-b-2 border-ink px-5 py-3 bg-ink text-paper">
              <span className="font-mono text-xs uppercase tracking-widest font-bold">
                Fee Quick Reference
              </span>
            </div>

            <div className="px-5 py-4 flex flex-col gap-4">
              {/* Authors */}
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-dim/60 font-bold mb-2">
                  {AUTHOR_FEES.category} — INR
                </p>
                <div className="flex flex-col divide-y divide-ink/8">
                  {AUTHOR_FEES.rows.map((row) => (
                    <div
                      key={row.description}
                      className="flex items-baseline justify-between py-1.5 gap-2"
                    >
                      <span className="font-sans text-[11px] text-ink-dim leading-snug">
                        {row.description}
                      </span>
                      <span className="font-serif text-[15px] text-ink shrink-0 tabular-nums">
                        ₹{row.inr.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-ink/10" />

              {/* General Attendees */}
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-dim/60 font-bold mb-2">
                  {ATTENDEE_FEES.category} — INR
                </p>
                <div className="flex flex-col divide-y divide-ink/8">
                  {ATTENDEE_FEES.rows.map((row) => (
                    <div
                      key={row.description}
                      className="flex items-baseline justify-between py-1.5 gap-2"
                    >
                      <span className="font-sans text-[11px] text-ink-dim leading-snug">
                        {row.description}
                      </span>
                      <span className="font-serif text-[15px] text-ink shrink-0 tabular-nums">
                        ₹{row.inr.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Link to full fee table */}
            <Link
              href="/2027/registrationfees"
              className="group flex items-center justify-between px-5 py-3 border-t-2 border-ink font-mono text-[10px] font-bold uppercase tracking-widest text-ink hover:bg-border transition-colors duration-150"
            >
              <span>Full fee table (USD / EUR)</span>
              <FaArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Email Conference Help Desk */}
      <div className="pt-2 flex flex-col items-center gap-4">
        <p className="text-ink-dim text-sm md:text-base leading-relaxed text-center max-w-2xl">
          For assistance, please contact our help desk.
        </p>

        <a
          href="mailto:icaa@heritageit.edu"
          className="group inline-flex items-center gap-2 px-6 py-3 border border-ink bg-chrome-400 text-ink font-mono font-bold text-xs uppercase tracking-widest hover:bg-paper transition-all duration-150 shadow-[3px_3px_0px_0px_var(--color-ink)] hover:shadow-[5px_5px_0px_0px_var(--color-ink)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none text-center"
        >
          <FaEnvelope className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
          <span>Email Conference Help Desk</span>
        </a>
      </div>
    </div>
  );
}
