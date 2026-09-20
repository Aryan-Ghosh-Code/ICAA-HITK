"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { FaCircleInfo, FaPaperPlane } from "react-icons/fa6";
import CustomToast from "@/components/2027/CustomToast";

interface RegisterNowButtonProps {
  registrationUrl: string;
  opensAt: string;
  closesAt: string;
}

export default function RegisterNowButton({
  registrationUrl,
  opensAt,
  closesAt,
}: RegisterNowButtonProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const { isBeforeOpen, isAfterClose, isOpen } = useMemo(() => {
    if (now === null) {
      // Default to loading/closed state until client-side time is resolved
      return { isBeforeOpen: false, isAfterClose: false, isOpen: false };
    }
    const opensAtMs = new Date(opensAt).getTime();
    const closesAtMs = new Date(closesAt).getTime();
    const before = now < opensAtMs;
    const after = now > closesAtMs;
    return {
      isBeforeOpen: before,
      isAfterClose: after,
      isOpen: !before && !after,
    };
  }, [now, opensAt, closesAt]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleClick = () => {
    if (isBeforeOpen) {
      setToastMessage("Registration to open soon.");
      return;
    }
    if (isAfterClose) {
      setToastMessage("Registration has ended.");
      return;
    }
    window.location.assign(registrationUrl);
  };

  // Status pill config
  const statusConfig = isOpen
    ? { label: "Registration Open", dot: "bg-green-500" }
    : isBeforeOpen
      ? { label: "Opening Soon", dot: "bg-amber-400" }
      : { label: "Registration Closed", dot: "bg-red-400" };

  return (
    <div className="border-2 border-ink bg-surface shadow-[4px_4px_0px_0px_var(--color-ink)]">
      {/* Header bar */}
      <div className="border-b-2 border-ink px-5 py-3 bg-ink text-paper flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-widest font-bold">
          Conference Registration
        </span>
        {/* Status pill */}
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-paper/70">
          <span
            className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} shrink-0`}
          />
          {statusConfig.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-5 py-5 flex flex-col gap-5">
        {/* Intro text */}
        <div className="flex flex-col gap-1.5">
          <p className="font-serif text-lg font-bold text-ink leading-snug">
            Secure your place at ICAA 2027
          </p>
          <p className="font-sans text-sm text-ink-dim leading-relaxed text-justify">
            Register to attend or present at the International Conference on
            Applied Algorithms. At least one author per accepted paper must
            complete registration before the camera-ready deadline to ensure
            inclusion in the proceedings.
          </p>
        </div>

        {/* Info strip */}
        <div className="flex items-start gap-2.5 border border-ink/10 bg-paper px-3.5 sm:px-4 py-3">
          <FaCircleInfo className="w-3.5 h-3.5 text-ink-dim/60 shrink-0 mt-0.5" />
          <p className="font-mono text-[11px] text-ink-dim/80 leading-relaxed text-justify">
            Authors affiliated with non-Indian institutions must register in{" "}
            <strong className="text-ink font-bold">USD or EUR</strong>. Students
            must submit a letter from their Head of Institute / Dean /
            Department authenticating full-time student status.
          </p>
        </div>

        {/* Button row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleClick}
            disabled={isAfterClose}
            className="group flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-ink bg-abyss-500 text-paper font-bold text-xs uppercase tracking-widest -translate-x-0.5 -translate-y-0.5 shadow-[3px_3px_0px_0px_var(--color-ink)] hover:bg-abyss-700 active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none transition-all duration-150 cursor-pointer"
          >
            <span>Register Now</span>
            <FaPaperPlane className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>

          <Link
            href="/2027/registrationfees"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-ink bg-surface text-ink font-bold text-xs uppercase tracking-widest hover:bg-border transition-colors duration-150 whitespace-nowrap"
          >
            View Fee Structure
          </Link>
        </div>
      </div>

      {toastMessage && (
        <CustomToast
          toastMessage={toastMessage}
          setToastMessage={setToastMessage}
        />
      )}
    </div>
  );
}
