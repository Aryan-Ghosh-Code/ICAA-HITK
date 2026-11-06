import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { images } from "@/constants/2027/cloudinary_images";
import { FaFileArrowDown, FaArrowRight, FaClock } from "react-icons/fa6";
import {
  CFP_HEADING,
  CFP_INTRO,
  CFP_PDF_PATH,
} from "@/constants/2027/callForPapers";
import {
  IMPORTANT_DATES,
  // DEADLINE_NOTE,
  // TIMEZONE_INFO,
} from "@/constants/2027/importantDates";
import BackButton from "@/components/2027/BackButton";

export const metadata: Metadata = {
  title: "Call for Papers",
  description:
    "Submit your original contributions to ICAA 2027. We seek novel algorithmic approaches, real-world applications, and industrial case studies.",
};

// Key dates we surface on the CFP page (subset of full important dates)
const CFP_KEY_DATES = IMPORTANT_DATES.filter((d) =>
  [
    "Submission Portal Opens",
    "Paper Deadline (Final)",
    "Notification of Acceptance",
    "Camera Ready Papers Due (Hard Deadline)",
    "Due Date for Alt Text Files",
  ].includes(d.event),
);

export default function CallForPapersPage() {
  return (
    <div className="bg-paper text-ink px-4 md:px-6 pt-24 pb-20 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="border-b-2 border-ink pb-4 flex justify-between items-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black text-ink">
          {CFP_HEADING}
        </h1>
        <BackButton />
      </div>

      {/* ── Main body: intro text + key dates sidebar ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
        {/* LEFT: intro + highly prominent Download CFP Button */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Intro paragraph */}
          <div className="flex flex-col gap-4">
            <p className="text-ink-dim/95 leading-relaxed text-justify text-sm md:text-base">
              {CFP_INTRO}
            </p>
          </div>

          <hr className="border-t-2 border-ink/10 my-1" />

          <div className="flex flex-col sm:flex-row items-end sm:items-start justify-between gap-4">
            <div className="flex flex-col gap-1 w-full">
              <span className="font-mono text-xs uppercase tracking-wider text-ink-dim/60 font-bold">
                Publication
              </span>
              <p className="font-serif text-base leading-snug text-ink text-justify sm:text-left">
                Proceedings of ICAA 2027 will be published as part of the
                {" "}
                <a
                  href="https://link.springer.com/conference/icaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sea-700 hover:text-sea-700/80 font-black underline decoration-2 underline-offset-2 transition-colors duration-150"
                >
                  Springer Verlag LNCS
                </a>{" "}
                volume.
              </p>
            </div>
            <Image
              src={images.springer}
              alt="Springer Logo"
              width={140}
              height={48}
              className="h-12 w-auto object-contain shrink-0 border border-ink bg-white mt-1 self-end sm:self-auto"
            />
          </div>

          <hr className="border-t-2 border-ink/10 my-1" />

          {/* Prominent Call to Action - Download CFP */}
          <div className="bg-surface border border-ink p-6 md:p-8 shadow-[4px_4px_0px_0px_var(--color-ink)] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="font-serif text-lg font-bold text-ink">
                Official Call for Papers (PDF)
              </h3>
              <p className="font-mono text-xs text-ink-dim">
                Download the complete guidelines and formatting requirements.
              </p>
            </div>
            <a
              href={CFP_PDF_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full md:w-auto flex items-center justify-center gap-3 px-6 py-4 border-2 border-ink bg-surface text-ink font-mono text-sm font-bold uppercase tracking-widest whitespace-nowrap -translate-x-1 -translate-y-1 shadow-[4px_4px_0px_0px_var(--color-ink)] hover:bg-border active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-150 cursor-pointer"
            >
              <FaFileArrowDown className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" />
              <span>Download CFP</span>
            </a>
          </div>
        </div>

        {/* RIGHT: Key dates + submission note */}
        <div className="flex flex-col gap-6">
          {/* Key dates card */}
          <div className="border-2 border-ink bg-surface shadow-[4px_4px_0px_0px_var(--color-ink)]">
            <div className="border-b border-ink px-5 py-3 flex items-center gap-2 bg-ink text-paper">
              <span className="font-mono text-xs uppercase tracking-widest font-bold">
                Key Deadlines
              </span>
            </div>
            <div className="divide-y-2 divide-ink">
              {CFP_KEY_DATES.map((d, i) => (
                <div key={i} className="px-5 py-3.5 flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] text-ink-dim uppercase tracking-widest font-semibold">
                    {d.event}
                  </span>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {d.oldDate && (
                      <span className="font-mono text-xs text-ink-dim/60 line-through decoration-2 decoration-ink-dim/60">
                        {d.oldDate}
                      </span>
                    )}
                    <span className="font-serif text-base font-black text-ink">
                      {d.date}
                    </span>
                  </div>
                  {d.time && (
                    <span className="font-mono text-[11px] text-ink-dim/90 flex items-center gap-1.5 mt-0.5">
                      <FaClock className="w-3 h-3 text-ink-dim/70 shrink-0" />
                      {d.time}
                    </span>
                  )}
                  {d.note && (
                    <span className="font-mono text-[10px] text-grove-600 font-bold">
                      {d.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {/* <div className="border-t-2 border-ink px-5 py-3 flex flex-col gap-1">
              <p className="font-mono text-[10px] text-ink-dim/80 uppercase tracking-wider">
                {DEADLINE_NOTE}
              </p>
              <p className="font-mono text-[9px] text-ink-dim/60 leading-relaxed">
                {TIMEZONE_INFO}
              </p>
            </div> */}
          </div>

          {/* CTA to paper submission */}
          <Link href="/2027/papersubmission" className="block">
            <button className="group w-full flex items-center justify-between gap-2 px-5 py-3.5 border-2 border-ink bg-abyss-500 text-paper font-bold text-xs uppercase tracking-widest -translate-x-0.5 -translate-y-0.5 shadow-[3px_3px_0px_0px_var(--color-ink)] hover:bg-abyss-700 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-150 cursor-pointer">
              <span>Submit Your Paper</span>
              <FaArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
