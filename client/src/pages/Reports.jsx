import { useEffect, useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ArrowUp, ArrowDown } from "lucide-react";
import api from "../api/client.js";

const money = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;
const shortMoney = (n) => {
  const abs = Math.abs(n);
  if (abs >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${n}`;
};

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
  const [netWorthHistory, setNetWorthHistory] = useState([]);

  useEffect(() => {
    const { from, to } = rangeFor(period);
    api
      .get("/transactions", { params: { from, to, limit: 2000 } })
      .then((res) => setTransactions(res.data.transactions));
  }, [period]);

  useEffect(() => {
    api.get("/dashboard/networth-history", { params: { months: 6 } }).then((res) => {
      setNetWorthHistory(
        res.data.map((p, i, arr) => ({
          label: i === arr.length - 1 ? "Today" : new Date(p.date).toLocaleDateString("en-PK", { month: "short" }),
          netWorth: p.netWorth,
        }))
      );
    });
  }, []);

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

  const netWorthDelta =
    netWorthHistory.length >= 2
      ? netWorthHistory[netWorthHistory.length - 1].netWorth - netWorthHistory[netWorthHistory.length - 2].netWorth
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-ink-muted mt-0.5">See how money moved over a period.</p>
      </div>

      {netWorthHistory.length > 0 && (
        <div className="bg-surface border border-border shadow-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink-muted">Net worth trend</h2>
            {netWorthDelta !== null && (
              <span
                className={`flex items-center gap-0.5 text-xs font-bold ${netWorthDelta >= 0 ? "text-good" : "text-bad"}`}
              >
                {netWorthDelta >= 0 ? <ArrowUp size={12} strokeWidth={2.5} /> : <ArrowDown size={12} strokeWidth={2.5} />}
                {money(Math.abs(netWorthDelta))} vs last month
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={netWorthHistory} margin={{ left: -20, right: 10 }}>
              <defs>
                <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={shortMoney} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => money(v)} />
              <Area type="monotone" dataKey="netWorth" stroke="#4F46E5" strokeWidth={2} fill="url(#netWorthFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

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
