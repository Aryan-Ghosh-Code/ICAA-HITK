"use client";

import { useState } from "react";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import BackButton from "@/components/2027/BackButton";
import {
  ACCEPTED_PAPERS,
  type AcceptedPaper,
} from "@/constants/2027/acceptedPapers";

export default function AcceptedPapersPage() {
  const [query, setQuery] = useState("");

  const hasPapers = ACCEPTED_PAPERS.length > 0;
  const term = query.toLowerCase().trim().replace(/^#/, "");

  // Search by Chapter No., Title, or Author
  const filteredPapers = ACCEPTED_PAPERS.filter((p: AcceptedPaper) => {
    if (!term) return true;
    const matchesChapter =
      p.chapterNo.toString() === term ||
      `chapter ${p.chapterNo}`.includes(term) ||
      `ch ${p.chapterNo}`.includes(term) ||
      String(p.chapterNo).padStart(2, "0").includes(term);
    const matchesTitle = p.title.toLowerCase().includes(term);
    const matchesAuthors = (p.authors ?? []).some((a) =>
      a.toLowerCase().includes(term)
    );
    return matchesChapter || matchesTitle || matchesAuthors;
  });

  return (
    <div className="min-h-screen bg-paper text-ink-soft px-4 md:px-6 pt-24 pb-20 max-w-4xl mx-auto flex flex-col gap-8">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="border-b-2 border-ink pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black text-ink-soft">
            Accepted Papers
          </h1>
          {/* <p className="font-mono text-xs text-ink-dim mt-1.5 uppercase tracking-wider">
            Total Accepted Chapters / Papers: {ACCEPTED_PAPERS.length}
          </p> */}
        </div>
        <BackButton />
      </div>

      {hasPapers ? (
        <>
          {/* ── Search ────────────────────────────────────────────────────────── */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Chapter No. or Paper Title..."
              className="w-full font-mono text-[11px] border-2 border-ink bg-surface text-ink-soft pl-3 pr-8 py-2.5 focus:outline-none focus:bg-paper transition-colors duration-100 placeholder:text-ink-dim/40"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-0 top-0 bottom-0 px-2.5 flex items-center text-ink-dim hover:text-ink-soft transition-colors duration-100 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* ── Papers Ledger List ────────────────────────────────────────────── */}
          {filteredPapers.length > 0 ? (
            <div className="flex flex-col">
              <div className="flex items-baseline justify-between gap-4 mb-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink-dim/70">
                  Showing {filteredPapers.length}{" "}
                  {filteredPapers.length === 1 ? "paper" : "accepted papers"}
                </span>
              </div>

              <div className="flex flex-col">
                {filteredPapers.map((paper, idx) => (
                  <div
                    key={paper.chapterNo}
                    className={`flex gap-3 sm:gap-4 py-4 sm:py-5 items-start ${
                      idx === 0 ? "border-t-2 border-ink" : "border-t border-ink/15"
                    } ${idx === filteredPapers.length - 1 ? "border-b-2 border-ink" : ""}`}
                  >
                    {/* Chapter Number Badge */}
                    <div className="shrink-0 pt-0.5">
                      <span className="inline-flex items-center justify-center border-2 border-ink bg-surface text-ink-soft font-mono text-[11px] font-black tracking-wide px-2.5 py-1 shadow-[2px_2px_0px_0px_var(--color-ink)]">
                        Ch. {String(paper.chapterNo).padStart(2, "0")}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      <h3 className="font-serif text-[17px] sm:text-[18px] md:text-[19px] font-bold text-ink-soft leading-snug wrap-break-word">
                        {paper.title}
                      </h3>
                      {paper.authors && paper.authors.length > 0 && (
                        <p className="font-mono text-[11px] text-ink-dim leading-relaxed">
                          {paper.authors.map((author, i) => (
                            <span key={i}>
                              {author}
                              {i < paper.authors!.length - 1 && (
                                <span className="mx-1.5 text-ink-dim/30">·</span>
                              )}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── No results ─────────────────────────────────────────────────── */
            <div className="border-t-2 border-b-2 border-ink py-14 flex flex-col items-center gap-3 text-center">
              <h3 className="font-serif text-2xl font-bold text-ink-soft">
                No papers found
              </h3>
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">
                Try a different search term or chapter number
              </p>
              <button
                onClick={() => setQuery("")}
                className="mt-2 font-mono text-[10px] uppercase tracking-widest border-2 border-ink px-4 py-2 bg-paper text-ink-soft hover:bg-border transition-colors duration-150 cursor-pointer shadow-[2px_2px_0px_0px_var(--color-ink)]"
              >
                Clear search
              </button>
            </div>
          )}
        </>
      ) : (
        /* ── Empty state ──────────────────────────────────────────────────────── */
        <div className="border-t-2 border-b-2 border-ink py-16 flex flex-col items-center gap-4 text-center">
          <h3 className="font-serif text-2xl font-bold text-ink-soft">
            To be announced soon
          </h3>
          <p className="font-sans text-sm text-ink-dim max-w-sm leading-relaxed">
            The list of accepted papers for ICAA 2027 will be published
            following the completion of the review process. Please check back
            for updates.
          </p>
          <Link href="/2027/papersubmission">
            <button className="group mt-2 flex items-center gap-2 px-5 py-3 border-2 border-ink bg-surface text-ink-soft font-bold text-xs uppercase tracking-widest -translate-x-0.5 -translate-y-0.5 shadow-[3px_3px_0px_0px_var(--color-ink)] hover:bg-border active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-150 cursor-pointer">
              <span>Paper Submission</span>
              <FaArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
