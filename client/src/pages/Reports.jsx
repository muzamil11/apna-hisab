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
  { value: "week", label: "Pichla hafta" },
  { value: "month", label: "Pichla mahina" },
  { value: "quarter", label: "3 mahine" },
  { value: "6months", label: "6 mahine" },
  { value: "year", label: "1 saal" },
];

export default function Reports() {
  const [period, setPeriod] = useState("month");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const { from, to } = rangeFor(period);
    api.get("/transactions", { params: { from, to, limit: 2000 } }).then((res) => setTransactions(res.data));
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                period === p.value ? "border-accent text-accent bg-blue-50" : "border-slate-200 text-slate-500"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs uppercase text-slate-400 mb-1">Aamdani</div>
          <div className="text-xl font-semibold tabular-nums text-good">{money(stats.income)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs uppercase text-slate-400 mb-1">Kharcha</div>
          <div className="text-xl font-semibold tabular-nums text-bad">{money(stats.expense)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs uppercase text-slate-400 mb-1">Bachat</div>
          <div className={`text-xl font-semibold tabular-nums ${stats.saved >= 0 ? "text-good" : "text-bad"}`}>
            {money(stats.saved)}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-medium text-slate-500 mb-3">Category-wise kharcha</h2>
        <div className="divide-y divide-slate-100">
          {stats.byCategory.map(([name, total]) => (
            <div key={name} className="flex justify-between py-2 text-sm">
              <span>{name}</span>
              <span className="font-medium tabular-nums">{money(total)}</span>
            </div>
          ))}
          {stats.byCategory.length === 0 && <p className="text-sm text-slate-400 py-2">Is period mein data nahi</p>}
        </div>
      </div>
    </div>
  );
}
