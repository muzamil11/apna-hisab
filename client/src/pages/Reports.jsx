import { useEffect, useMemo, useState } from "react";
import api from "../api/client.js";

const money = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

function rangeFor(period) {
  const now = new Date();
  const start = new Date(now);
  if (period === "week") start.setDate(now.getDate() - 7);
  if (period === "month") start.setMonth(now.getMonth() - 1);
  if (period === "quarter") start.setMonth(now.getMonth() - 3);
  if (period === "6months") start.setMonth(now.getMonth() - 6);
  if (period === "year") start.setFullYear(now.getFullYear() - 1);
  return { from: start.toISOString(), to: now.toISOString() };
}

const PERIODS = [
  { value: "week", label: "Last week" },
  { value: "month", label: "Last month" },
  { value: "quarter", label: "3 months" },
  { value: "6months", label: "6 months" },
  { value: "year", label: "1 year" },
];

export default function Reports() {
  const [period, setPeriod] = useState("month");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const { from, to } = rangeFor(period);
    api
      .get("/transactions", { params: { from, to, limit: 2000 } })
      .then((res) => setTransactions(res.data.transactions));
  }, [period]);

  const stats = useMemo(() => {
    const income = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    const byCategory = {};
    for (const t of transactions) {
      if (t.type !== "EXPENSE" || !t.category) continue;
      byCategory[t.category.name] = (byCategory[t.category.name] || 0) + t.amount;
    }
    return {
      income,
      expense,
      saved: income - expense,
      byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]),
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-ink-muted mt-0.5">See how money moved over a period.</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-full border whitespace-nowrap transition-colors ${
              period === p.value ? "border-accent bg-accent-soft text-accent-ink" : "border-border text-ink-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-border shadow-card rounded-xl p-4">
          <div className="text-xs uppercase text-ink-faint font-semibold mb-1">Income</div>
          <div className="text-lg md:text-xl font-bold tabular-nums text-good">{money(stats.income)}</div>
        </div>
        <div className="bg-surface border border-border shadow-card rounded-xl p-4">
          <div className="text-xs uppercase text-ink-faint font-semibold mb-1">Expense</div>
          <div className="text-lg md:text-xl font-bold tabular-nums text-bad">{money(stats.expense)}</div>
        </div>
        <div className="bg-surface border border-border shadow-card rounded-xl p-4">
          <div className="text-xs uppercase text-ink-faint font-semibold mb-1">Saved</div>
          <div className={`text-lg md:text-xl font-bold tabular-nums ${stats.saved >= 0 ? "text-good" : "text-bad"}`}>
            {money(stats.saved)}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-ink-muted mb-3">Spending by category</h2>
        <div className="divide-y divide-border">
          {stats.byCategory.map(([name, total]) => (
            <div key={name} className="flex justify-between py-2.5 text-sm">
              <span className="font-medium">{name}</span>
              <span className="font-bold tabular-nums">{money(total)}</span>
            </div>
          ))}
          {stats.byCategory.length === 0 && (
            <p className="text-sm text-ink-faint py-4 text-center">No data for this period.</p>
          )}
        </div>
      </div>
    </div>
  );
}
