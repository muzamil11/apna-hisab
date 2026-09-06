import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import api from "../api/client.js";

const money = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [minSavings, setMinSavings] = useState("");

  async function load() {
    const [budgetsRes, categoriesRes] = await Promise.all([api.get("/budgets"), api.get("/categories")]);
    setBudgets(budgetsRes.data);
    setCategories(categoriesRes.data.filter((c) => c.direction === "EXPENSE"));
    const savings = budgetsRes.data.find((b) => b.type === "MIN_SAVINGS");
    if (savings) setMinSavings(savings.limitAmount);
  }

  useEffect(() => {
    load();
  }, []);

  async function addSpendCap(e) {
    e.preventDefault();
    if (!category || !limitAmount) return;
    await api.post("/budgets", { type: "SPEND_CAP", category, limitAmount: Number(limitAmount) });
    setCategory("");
    setLimitAmount("");
    load();
  }

  async function saveSavingsGoal(e) {
    e.preventDefault();
    if (!minSavings) return;
    await api.post("/budgets", { type: "MIN_SAVINGS", limitAmount: Number(minSavings) });
    load();
  }

  async function removeBudget(id) {
    await api.delete(`/budgets/${id}`);
    load();
  }

  const spendCaps = budgets.filter((b) => b.type === "SPEND_CAP");
  const inputClass =
    "border border-border rounded-lg px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow bg-surface";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
        <p className="text-sm text-ink-muted mt-0.5">Set limits, get warned before you overspend.</p>
      </div>

      <div className="bg-surface border border-border shadow-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-ink-muted mb-1">🟡 Minimum monthly savings goal</h2>
        <p className="text-xs text-ink-faint mb-3">A soft warning if you save less than this in a month.</p>
        <form onSubmit={saveSavingsGoal} className="flex gap-3">
          <input
            type="number"
            placeholder="e.g. 30000"
            value={minSavings}
            onChange={(e) => setMinSavings(e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <button type="submit" className="bg-accent hover:bg-accent-ink text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors">
            Save
          </button>
        </form>
      </div>

      <div className="bg-surface border border-border shadow-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-ink-muted mb-1">🔴 Category spend limits</h2>
        <p className="text-xs text-ink-faint mb-3">A hard warning when a category goes over its limit.</p>
        <form onSubmit={addSpendCap} className="flex flex-wrap gap-3 mb-4">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Monthly limit"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            className={inputClass}
          />
          <button type="submit" className="bg-accent hover:bg-accent-ink text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors">
            Add
          </button>
        </form>
        <div className="divide-y divide-border">
          {spendCaps.map((b) => (
            <div key={b._id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-medium">{b.category?.name}</span>
              <div className="flex items-center gap-3">
                <span className="font-bold tabular-nums">{money(b.limitAmount)} / month</span>
                <button onClick={() => removeBudget(b._id)} aria-label="Remove" className="text-ink-faint hover:text-bad">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {spendCaps.length === 0 && <p className="text-sm text-ink-faint py-4 text-center">No limits set yet.</p>}
        </div>
      </div>
    </div>
  );
}
