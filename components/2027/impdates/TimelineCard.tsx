import { ImportantDate } from "@/lib/types";
import { FaCalendarDays, FaClock } from "react-icons/fa6";

interface TimelineCardProps {
  item: ImportantDate;
}

const TimelineCard = ({ item }: TimelineCardProps) => {
  if (!item) return null;

  return (
    <article className="border border-ink bg-surface/40 shadow-[4px_4px_0px_0px_var(--color-ink)] hover:bg-surface hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_var(--color-ink)] transition-all duration-200">
      {/* ── Main row ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 pb-5">
        {/* Left: event name + note */}
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <h3 className="font-serif text-xl md:text-2xl font-semibold text-ink leading-snug">
            {item.event}
          </h3>
          {item.note && (
            <p className="font-mono text-sm text-ink-dim tracking-wide text-justify">
              {item.note}
            </p>
          )}
        </div>

        {/* Right: old date + date badge */}
        <div className="shrink-0 flex flex-col items-start md:items-end gap-1.5">
          {item.oldDate && (
            <span className="font-mono text-xs text-ink-dim/70 line-through decoration-2 decoration-ink-dim/70">
              {item.oldDate}
            </span>
          )}
          <span className="inline-flex items-center gap-2 font-mono text-sm font-bold text-ink bg-chrome-200 px-4 py-2 border border-ink shadow-[3px_3px_0px_0px_var(--color-ink)] md:-rotate-1 transition-transform duration-300 whitespace-nowrap">
            <FaCalendarDays className="w-3.5 h-3.5 shrink-0" />
            {item.date}
          </span>
        </div>
      </div>

      {/* ── Time footer — only rendered when time exists ───────────────────── */}
      {item.time && (
        <div className="flex items-center justify-end gap-2 px-6 py-2 border-t border-ink/10 bg-white/60">
          <FaClock className="w-3 h-3 text-ink-dim/70 shrink-0" />
          <span className="font-mono text-sm text-ink-dim tracking-wide">
            {item.time}
          </span>
        </div>
      )}
    </article>
  );
};

export default TimelineCard;
