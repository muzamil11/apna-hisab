import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import api from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import AddTransactionModal from "../components/AddTransactionModal.jsx";

const COLORS = ["#2B5CE7", "#1F9D6C", "#C68A15", "#D6432E", "#7C3AED", "#0891B2", "#DB2777"];

const money = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [people, setPeople] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  async function loadAll() {
    const [summaryRes, accountsRes, categoriesRes, peopleRes] = await Promise.all([
      api.get("/dashboard/summary"),
      api.get("/accounts"),
      api.get("/categories"),
      api.get("/people"),
    ]);
    setSummary(summaryRes.data);
    setAccounts(accountsRes.data.accounts);
    setCategories(categoriesRes.data);
    setPeople(peopleRes.data.map((p) => ({ _id: p._id, name: p.name })));
  }

  useEffect(() => {
    loadAll();
  }, []);

  if (!summary) return <p className="text-slate-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button onClick={() => setShowAdd(true)} className="bg-accent text-white px-4 py-2 rounded-lg font-medium">
          + Add
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Net Worth" value={money(summary.netWorth)} />
        <StatCard label="Is mahine aamdani" value={money(summary.month.income)} tone="good" />
        <StatCard label="Is mahine kharcha" value={money(summary.month.expense)} tone="bad" />
        <StatCard
          label="Is mahine bachat"
          value={money(summary.month.saved)}
          tone={summary.month.saved >= 0 ? "good" : "bad"}
        />
      </div>

      {summary.budgetStatus.some((b) => b.exceeded || b.missed) && (
        <div className="space-y-2">
          {summary.budgetStatus
            .filter((b) => b.exceeded || b.missed)
            .map((b, i) => (
              <div
                key={i}
                className={`rounded-lg px-4 py-3 text-sm ${
                  b.level === "red" ? "bg-red-50 text-bad" : "bg-amber-50 text-warn"
                }`}
              >
                {b.exceeded && `${b.budget.category?.name || "Budget"} ka limit cross ho gaya`}
                {b.missed && `Is mahine savings goal (${money(b.budget.limitAmount)}) miss ho gaya`}
              </div>
            ))}
        </div>
      )}

      {summary.byCategory.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-sm font-medium text-slate-500 mb-3">Is mahine kharcha — category wise</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={summary.byCategory} dataKey="total" nameKey="category" outerRadius={90} label>
                {summary.byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => money(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-medium text-slate-500 mb-3">Accounts</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {accounts.map((a) => (
            <div key={a._id} className="border border-slate-100 rounded-lg p-3">
              <div className="text-xs text-slate-400">{a.type.replace("_", " ")}</div>
              <div className="text-sm font-medium">{a.name}</div>
              <div className={`tabular-nums font-semibold ${a.kind === "LIABILITY" ? "text-bad" : "text-ink"}`}>
                {money(a.balance)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <AddTransactionModal
          accounts={accounts}
          categories={categories}
          people={people}
          onClose={() => setShowAdd(false)}
          onCreated={loadAll}
        />
      )}
    </div>
  );
}
