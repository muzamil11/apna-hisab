export default function StatCard({ label, value, tone = "default" }) {
  const toneClass = {
    default: "text-ink",
    good: "text-good",
    bad: "text-bad",
    warn: "text-warn",
  }[tone];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-1">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}
