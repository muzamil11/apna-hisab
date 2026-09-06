import { ArrowUp, ArrowDown } from "lucide-react";

export default function StatCard({ label, value, tone = "default", icon: Icon, delta }) {
  const toneClass = {
    default: "text-ink",
    good: "text-good",
    bad: "text-bad",
    warn: "text-warn",
  }[tone];

  return (
    <div className="bg-surface border border-border shadow-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs uppercase tracking-wide text-ink-faint font-semibold">{label}</span>
        {Icon && <Icon size={15} className="text-ink-faint" strokeWidth={2} />}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${toneClass}`}>{value}</div>
      {delta && (
        <div className={`flex items-center gap-0.5 text-xs font-semibold mt-1 ${delta.positive ? "text-good" : "text-bad"}`}>
          {delta.positive ? <ArrowUp size={12} strokeWidth={2.5} /> : <ArrowDown size={12} strokeWidth={2.5} />}
          {delta.text}
        </div>
      )}
    </div>
  );
}
