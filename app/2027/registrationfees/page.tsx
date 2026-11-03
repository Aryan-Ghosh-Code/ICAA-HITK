import type { Metadata } from "next";
import Link from "next/link";
import { FaArrowRight, FaEnvelope, FaClock } from "react-icons/fa6";
import BackButton from "@/components/2027/BackButton";
import {
  AUTHOR_FEES,
  ADDITIONAL_PAPER_FEE,
  ATTENDEE_FEES,
  FEE_NOTES,
} from "@/constants/2027/registrationFees";
import {
  IMPORTANT_DATES,
  // DEADLINE_NOTE,
  // TIMEZONE_INFO,
} from "@/constants/2027/importantDates";

export const metadata: Metadata = {
  title: "Registration Fees",
  description:
    "View registration fees for ICAA 2027. Fee details for authors, general attendees, and additional papers in INR, USD, and EUR.",
};

// Key dates we surface on the Registration Fees page (subset of full important dates)
const REGISTRATION_KEY_DATES = IMPORTANT_DATES.filter((d) =>
  [
    "Early Bird Registration (Authors) Starts",
    "Early Bird Registration",
    "Additional Authors and General Participants Early Bird Registration",
  ].includes(d.event),
);

// ── Shared cell styles ────────────────────────────────────────────────────────

const CURRENCY_COLS = ["INR", "USD", "EUR"] as const;

type FeeRow = { description: string; inr: number; usd: number; eur: number };

// Currency symbols render visually heavier/larger than digits in most
// monospace fonts (₹ especially). Sizing the symbol down relative to the
// number keeps all three currencies visually consistent.
function CurrencySymbol({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[0.7em] font-semibold align-baseline mr-0.5 relative -top-px">
      {children}
    </span>
  );
}

function formatINR(n: number) {
  return (
    <>
      <CurrencySymbol>₹</CurrencySymbol>
      {n.toLocaleString("en-IN")}
    </>
  );
}
function formatUSD(n: number) {
  return (
    <>
      <CurrencySymbol>$</CurrencySymbol>
      {n}
    </>
  );
}
function formatEUR(n: number) {
  return (
    <>
      <CurrencySymbol>€</CurrencySymbol>
      {n}
    </>
  );
}

function formatAmount(col: (typeof CURRENCY_COLS)[number], n: number) {
  if (col === "INR") return formatINR(n);
  if (col === "USD") return formatUSD(n);
  return formatEUR(n);
}

function getAmount(row: FeeRow, col: (typeof CURRENCY_COLS)[number]) {
  if (col === "INR") return row.inr;
  if (col === "USD") return row.usd;
  return row.eur;
}

// ── Mobile card (renders one fee row as a self-contained card) ────────────────

function FeeCard({ row }: { row: FeeRow }) {
  const isEarlyBird = row.description.includes("Early");
  return (
    <div className="border-2 border-ink bg-surface shadow-[3px_3px_0px_0px_var(--color-ink)]">
      <div className="px-4 py-3 border-b-2 border-ink flex items-start justify-between gap-2">
        <span className="font-sans text-sm font-bold text-ink leading-snug">
          {row.description}
        </span>
        {isEarlyBird && (
          <span className="font-mono text-[9px] uppercase tracking-wider text-grove-600 font-bold border border-grove-600/30 px-1.5 py-0.5 bg-paper shrink-0 whitespace-nowrap">
            Early Bird
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 divide-x-2 divide-ink [-webkit-text-size-adjust:100%] [text-size-adjust:100%]">
        {CURRENCY_COLS.map((col) => (
          <div
            key={col}
            className="px-2 py-2.5 flex flex-col items-center gap-1"
          >
            <span className="font-mono text-base uppercase tracking-widest text-ink-dim/60 font-bold">
              {col}
            </span>
            <span className="font-mono text-base font-bold text-ink tabular-nums">
              {formatAmount(col, getAmount(row, col))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mt-2 first:mt-0">
      <span className="font-serif text-xs font-black text-paper tracking-widest uppercase bg-ink px-2.5 py-1">
        {children}
      </span>
      <span className="h-px flex-1 bg-ink/20" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function RegistrationFeesPage() {
  return (
    <div className="bg-paper text-ink px-4 md:px-6 pt-24 pb-10 max-w-7xl mx-auto flex flex-col gap-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="border-b-2 border-ink pb-4 flex justify-between items-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black text-ink">
          Registration Fees
        </h1>
        <BackButton />
      </div>

      {/* ── Mobile: stacked cards (< md) ─────────────────────────────────────── */}
      <div className="md:hidden flex flex-col gap-3">
        <MobileGroupLabel>{AUTHOR_FEES.category}</MobileGroupLabel>
        {AUTHOR_FEES.rows.map((row) => (
          <FeeCard key={row.description} row={row} />
        ))}

        <MobileGroupLabel>Additional</MobileGroupLabel>
        <FeeCard row={ADDITIONAL_PAPER_FEE} />

        <MobileGroupLabel>{ATTENDEE_FEES.category}</MobileGroupLabel>
        {ATTENDEE_FEES.rows.map((row) => (
          <FeeCard key={row.description} row={row} />
        ))}
      </div>

      {/* ── Desktop/tablet: full table (≥ md) ──────────────────────────────────── */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full border-collapse border-2 border-ink min-w-140 [-webkit-text-size-adjust:100%] [text-size-adjust:100%]">
          {/* thead */}
          <thead>
            <tr className="bg-ink text-paper">
              {/* Description header — spans 2 cols to align with category + row */}
              <th
                colSpan={2}
                className="border-r-2 border-paper/20 px-5 py-3.5 text-left font-serif text-base font-black tracking-wide"
              >
                Description
              </th>
              {CURRENCY_COLS.map((col) => (
                <th
                  key={col}
                  className="border-l-2 border-paper/20 px-5 py-3.5 text-center font-mono text-sm font-bold tracking-widest uppercase"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* ── AUTHORS group ──────────────────────────────────────────────── */}
            {AUTHOR_FEES.rows.map((row, i) => (
              <tr
                key={row.description}
                className="border-t-2 border-ink even:bg-surface odd:bg-paper hover:bg-border/40 transition-colors duration-100"
              >
                {/* Category label — only on first row, rowSpan */}
                {i === 0 && (
                  <td
                    rowSpan={AUTHOR_FEES.rows.length}
                    className="border-r-2 border-ink px-3 py-0 text-center align-middle w-10 bg-surface"
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                    }}
                  >
                    <span className="font-serif text-sm font-black text-ink tracking-widest uppercase">
                      {AUTHOR_FEES.category}
                    </span>
                  </td>
                )}

                {/* Row label */}
                <td className="border-r-2 border-ink px-5 py-3.5">
                  <span className="font-sans text-sm text-ink leading-snug">
                    {row.description}
                  </span>
                  {row.description.includes("Early") && (
                    <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-grove-600 font-bold border border-grove-600/30 px-1.5 py-0.5 bg-paper">
                      Early Bird
                    </span>
                  )}
                </td>

                {/* Amounts */}
                {CURRENCY_COLS.map((col) => (
                  <td
                    key={col}
                    className="border-l-2 border-ink px-5 py-3.5 text-center font-mono text-base font-bold text-ink tabular-nums"
                  >
                    {formatAmount(col, getAmount(row, col))}
                  </td>
                ))}
              </tr>
            ))}

            {/* ── ADDITIONAL PAPER — standalone row ─────────────────────────── */}
            <tr className="border-t-2 border-ink bg-ink/4">
              <td colSpan={2} className="border-r-2 border-ink px-5 py-3.5">
                <span className="font-serif text-sm font-black text-ink">
                  {ADDITIONAL_PAPER_FEE.description}
                </span>
              </td>
              {CURRENCY_COLS.map((col) => (
                <td
                  key={col}
                  className="border-l-2 border-ink px-5 py-3.5 text-center font-mono text-base font-bold text-ink tabular-nums"
                >
                  {formatAmount(col, getAmount(ADDITIONAL_PAPER_FEE, col))}
                </td>
              ))}
            </tr>

            {/* ── GENERAL ATTENDEES group ────────────────────────────────────── */}
            {ATTENDEE_FEES.rows.map((row, i) => (
              <tr
                key={row.description}
                className="border-t-2 border-ink even:bg-surface odd:bg-paper hover:bg-border/40 transition-colors duration-100"
              >
                {i === 0 && (
                  <td
                    rowSpan={ATTENDEE_FEES.rows.length}
                    className="border-r-2 border-ink px-3 py-0 text-center align-middle w-10 bg-surface"
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                    }}
                  >
                    <span className="font-serif text-sm font-black text-ink tracking-widest uppercase">
                      {ATTENDEE_FEES.category}
                    </span>
                  </td>
                )}

                <td className="border-r-2 border-ink px-5 py-3.5">
                  <span className="font-sans text-sm text-ink leading-snug">
                    {row.description}
                  </span>
                  {row.description.includes("Early") && (
                    <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-grove-600 font-bold border border-grove-600/30 px-1.5 py-0.5 bg-paper">
                      Early Bird
                    </span>
                  )}
                </td>

                {CURRENCY_COLS.map((col) => (
                  <td
                    key={col}
                    className="border-l-2 border-ink px-5 py-3.5 text-center font-mono text-base font-bold text-ink tabular-nums"
                  >
                    {formatAmount(col, getAmount(row, col))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Notes + CTA ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-2 items-start">
        {/* Notes */}
        <div className="lg:col-span-2 border border-ink bg-surface shadow-[3px_3px_0px_0px_var(--color-ink)] h-fit">
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

        {/* CTA stack */}
        <div className="flex flex-col gap-4">
          <div className="border border-ink bg-surface p-5 shadow-[4px_4px_0px_0px_var(--color-ink)] flex flex-col gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim/60 font-bold">
              Register for ICAA 2027
            </span>
            <p className="font-serif text-base font-bold text-ink leading-snug">
              Secure your spot at ICAA 2027 before the Early-Bird deadline.
            </p>
            <Link href="/2027/registration">
              <button className="group w-full flex items-center justify-between gap-2 px-5 py-3.5 border border-ink bg-abyss-500 text-paper font-bold text-xs uppercase tracking-widest -translate-x-0.5 -translate-y-0.5 shadow-[3px_3px_0px_0px_var(--color-ink)] hover:bg-abyss-700 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-150 cursor-pointer">
                <span>Register Now</span>
                <FaArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </Link>
          </div>

          <div className="border border-ink bg-surface shadow-[4px_4px_0px_0px_var(--color-ink)]">
            <div className="border-b border-ink px-5 py-3 flex items-center gap-2 bg-ink text-paper">
              <span className="font-mono text-xs uppercase tracking-widest font-bold">
                Key Deadlines
              </span>
            </div>
            <div className="divide-y-2 divide-ink">
              {REGISTRATION_KEY_DATES.map((d, i) => (
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
