import { useEffect, useState } from "react";
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

  const spendCaps = budgets.filter((b) => b.type === "SPEND_CAP");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Budgets</h1>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-medium text-slate-500 mb-3">🟡 Minimum monthly savings goal</h2>
        <form onSubmit={saveSavingsGoal} className="flex gap-3">
          <input
            type="number"
            placeholder="e.g. 30000"
            value={minSavings}
            onChange={(e) => setMinSavings(e.target.value)}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2"
          />
          <button type="submit" className="bg-accent text-white px-4 py-2 rounded-lg font-medium">
            Save
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-medium text-slate-500 mb-3">🔴 Category spend limits</h2>
        <form onSubmit={addSpendCap} className="flex flex-wrap gap-3 mb-4">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2">
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
            className="border border-slate-200 rounded-lg px-3 py-2"
          />
          <button type="submit" className="bg-accent text-white px-4 py-2 rounded-lg font-medium">
            Add
          </button>
        </form>
        <div className="divide-y divide-slate-100">
          {spendCaps.map((b) => (
            <div key={b._id} className="flex justify-between py-2 text-sm">
              <span>{b.category?.name}</span>
              <span className="font-medium tabular-nums">{money(b.limitAmount)} / month</span>
            </div>
          ))}
          {spendCaps.length === 0 && <p className="text-sm text-slate-400 py-2">Koi limit set nahi</p>}
        </div>
      </div>
    </div>
  );
}
