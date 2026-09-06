import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Wallet, TrendingUp, TrendingDown, PiggyBank, AlertTriangle } from "lucide-react";
import api from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import AddTransactionModal from "../components/AddTransactionModal.jsx";

const COLORS = ["#4F46E5", "#16A34A", "#D97706", "#DC2626", "#7C3AED", "#0891B2", "#DB2777"];

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
    setPeople(
      peopleRes.data.map((p) => ({
        _id: p._id,
        name: p.name,
        receivableId: p.accounts.find((a) => a.type === "RECEIVABLE")?._id,
      }))
    );
  }

  useEffect(() => {
    loadAll();
  }, []);

  if (!summary) return <p className="text-ink-faint">Loading…</p>;

  const walletAccounts = accounts.filter((a) => !["RECEIVABLE", "PAYABLE"].includes(a.type));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-ink-muted mt-0.5">Your money, at a glance.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="hidden md:flex items-center gap-1.5 bg-accent hover:bg-accent-ink text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          <Plus size={16} strokeWidth={2.5} /> Add
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Net Worth" value={money(summary.netWorth)} icon={Wallet} />
        <StatCard label="Income this month" value={money(summary.month.income)} tone="good" icon={TrendingUp} />
        <StatCard label="Spent this month" value={money(summary.month.expense)} tone="bad" icon={TrendingDown} />
        <StatCard
          label="Saved this month"
          value={money(summary.month.saved)}
          tone={summary.month.saved >= 0 ? "good" : "bad"}
          icon={PiggyBank}
        />
      </div>

      {summary.budgetStatus.some((b) => b.exceeded || b.missed) && (
        <div className="space-y-2">
          {summary.budgetStatus
            .filter((b) => b.exceeded || b.missed)
            .map((b, i) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium ${
                  b.level === "red" ? "bg-bad-soft text-bad" : "bg-warn-soft text-warn"
                }`}
              >
                <AlertTriangle size={16} strokeWidth={2} className="shrink-0" />
                {b.exceeded && `You've gone over your ${b.budget.category?.name || "budget"} limit this month.`}
                {b.missed && `You're below your ${money(b.budget.limitAmount)} savings goal this month.`}
              </div>
            ))}
        </div>
      )}

      {walletAccounts.some((a) => a.cardSummary?.billed > 0) && (
        <div className="space-y-2">
          {walletAccounts
            .filter((a) => a.cardSummary?.billed > 0)
            .map((a) => (
              <div
                key={a._id}
                className={`flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium ${
                  a.cardSummary.overdue ? "bg-bad-soft text-bad" : "bg-warn-soft text-warn"
                }`}
              >
                <AlertTriangle size={16} strokeWidth={2} className="shrink-0" />
                {a.name}: {money(a.cardSummary.billed)} {a.cardSummary.overdue ? "overdue since" : "due by"}{" "}
                {new Date(a.cardSummary.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
              </div>
            ))}
        </div>
      )}

      {summary.byCategory.length > 0 && (
        <div className="bg-surface border border-border shadow-card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink-muted mb-3">Spending by category this month</h2>
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

      <div className="bg-surface border border-border shadow-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-ink-muted mb-3">Accounts</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {walletAccounts.map((a) => (
            <div key={a._id} className="border border-border rounded-lg p-3">
              <div className="text-xs text-ink-faint font-medium">{a.type.replace("_", " ")}</div>
              <div className="text-sm font-semibold mt-0.5">{a.name}</div>
              <div className={`tabular-nums font-bold mt-1 ${a.kind === "LIABILITY" ? "text-bad" : "text-ink"}`}>
                {money(a.balance)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="md:hidden fixed bottom-20 right-4 z-20 w-14 h-14 rounded-full bg-accent hover:bg-accent-ink text-white shadow-lg flex items-center justify-center"
        aria-label="Add transaction"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {showAdd && (
        <AddTransactionModal
          accounts={walletAccounts}
          categories={categories}
          people={people}
          onClose={() => setShowAdd(false)}
          onCreated={loadAll}
        />
      )}
    </div>
  );
}
