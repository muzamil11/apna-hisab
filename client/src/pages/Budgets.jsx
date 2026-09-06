import { useEffect, useState } from "react";
import { Trash2, Pencil, Check, Plus } from "lucide-react";
import api from "../api/client.js";
import Spinner from "../components/Spinner.jsx";

const money = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [minSavings, setMinSavings] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [addingCap, setAddingCap] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDirection, setNewCatDirection] = useState("EXPENSE");
  const [addingCat, setAddingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState("");
  const [savingCatId, setSavingCatId] = useState(null);
  const [deletingCatId, setDeletingCatId] = useState(null);
  const [catError, setCatError] = useState("");

  const categories = allCategories.filter((c) => c.direction === "EXPENSE");

  async function load() {
    const [budgetsRes, categoriesRes] = await Promise.all([api.get("/budgets"), api.get("/categories")]);
    setBudgets(budgetsRes.data);
    setAllCategories(categoriesRes.data);
    const savings = budgetsRes.data.find((b) => b.type === "MIN_SAVINGS");
    if (savings) setMinSavings(savings.limitAmount);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function addSpendCap(e) {
    e.preventDefault();
    if (!category || !limitAmount) return;
    setAddingCap(true);
    try {
      await api.post("/budgets", { type: "SPEND_CAP", category, limitAmount: Number(limitAmount) });
      setCategory("");
      setLimitAmount("");
      await load();
    } finally {
      setAddingCap(false);
    }
  }

  async function saveSavingsGoal(e) {
    e.preventDefault();
    if (!minSavings) return;
    setSavingGoal(true);
    try {
      await api.post("/budgets", { type: "MIN_SAVINGS", limitAmount: Number(minSavings) });
      await load();
    } finally {
      setSavingGoal(false);
    }
  }

  async function removeBudget(id) {
    setRemovingId(id);
    try {
      await api.delete(`/budgets/${id}`);
      await load();
    } finally {
      setRemovingId(null);
    }
  }

  function pickCategory(id) {
    setCategory(id);
    // Re-picking a category that already has a cap loads its current limit
    // instead of leaving the field blank — SPEND_CAP is an upsert on the
    // backend, so submitting here edits it rather than making a duplicate.
    const existing = spendCaps.find((b) => b.category?._id === id);
    setLimitAmount(existing ? String(existing.limitAmount) : "");
  }

  async function addCategory(e) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      await api.post("/categories", { name: newCatName.trim(), direction: newCatDirection });
      setNewCatName("");
      await load();
    } finally {
      setAddingCat(false);
    }
  }

  async function saveCategoryName(cat) {
    const value = editCatName.trim();
    if (!value || value === cat.name) return setEditingCatId(null);
    setSavingCatId(cat._id);
    try {
      await api.patch(`/categories/${cat._id}`, { name: value });
      setEditingCatId(null);
      await load();
    } finally {
      setSavingCatId(null);
    }
  }

  async function deleteCategory(cat) {
    if (!window.confirm(`Delete "${cat.name}"? This only works if no transaction or budget uses it.`)) return;
    setCatError("");
    setDeletingCatId(cat._id);
    try {
      await api.delete(`/categories/${cat._id}`);
      await load();
    } catch (err) {
      setCatError(err.response?.data?.error || "Could not delete this category.");
    } finally {
      setDeletingCatId(null);
    }
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

      {loading ? (
        <div className="flex items-center justify-center py-16 text-ink-faint">
          <Spinner size={22} />
        </div>
      ) : (
        <>
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
              <button
                type="submit"
                disabled={savingGoal}
                className="flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-ink text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {savingGoal && <Spinner size={15} />}
                Save
              </button>
            </form>
          </div>

          <div className="bg-surface border border-border shadow-card rounded-xl p-5">
            <h2 className="text-sm font-semibold text-ink-muted mb-1">🔴 Category spend limits</h2>
            <p className="text-xs text-ink-faint mb-3">A hard warning when a category goes over its limit.</p>
            <form onSubmit={addSpendCap} className="flex flex-wrap gap-3 mb-4">
              <select value={category} onChange={(e) => pickCategory(e.target.value)} className={inputClass}>
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
              <button
                type="submit"
                disabled={addingCap}
                className="flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-ink text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {addingCap && <Spinner size={15} />}
                Add
              </button>
            </form>
            <div className="divide-y divide-border">
              {spendCaps.map((b) => (
                <div key={b._id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium">{b.category?.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold tabular-nums">{money(b.limitAmount)} / month</span>
                    <button
                      onClick={() => removeBudget(b._id)}
                      disabled={removingId === b._id}
                      aria-label="Remove"
                      className="text-ink-faint hover:text-bad disabled:opacity-40"
                    >
                      {removingId === b._id ? <Spinner size={15} /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
              ))}
              {spendCaps.length === 0 && <p className="text-sm text-ink-faint py-4 text-center">No limits set yet.</p>}
            </div>
          </div>

          <div className="bg-surface border border-border shadow-card rounded-xl p-5">
            <h2 className="text-sm font-semibold text-ink-muted mb-1">Manage categories</h2>
            <p className="text-xs text-ink-faint mb-3">
              Rename or remove one, or add a new one — a category can only be removed once nothing uses it.
            </p>
            <form onSubmit={addCategory} className="flex flex-wrap gap-3 mb-4">
              <input
                type="text"
                placeholder="New category name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className={`${inputClass} flex-1 min-w-[160px]`}
              />
              <select
                value={newCatDirection}
                onChange={(e) => setNewCatDirection(e.target.value)}
                className={inputClass}
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
              <button
                type="submit"
                disabled={addingCat}
                className="flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-ink text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {addingCat ? <Spinner size={15} /> : <Plus size={15} strokeWidth={2.5} />}
                Add
              </button>
            </form>

            {catError && <p className="text-sm text-bad mb-3">{catError}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              {["INCOME", "EXPENSE"].map((direction) => (
                <div key={direction}>
                  <div className="text-xs uppercase text-ink-faint font-semibold mb-1.5">
                    {direction === "INCOME" ? "Income" : "Expense"}
                  </div>
                  <div className="divide-y divide-border mb-4">
                    {allCategories
                      .filter((c) => c.direction === direction)
                      .map((c) => {
                        const isEditing = editingCatId === c._id;
                        return (
                          <div key={c._id} className="flex items-center justify-between gap-2 py-2 text-sm">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <input
                                  autoFocus
                                  value={editCatName}
                                  onChange={(e) => setEditCatName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveCategoryName(c);
                                    if (e.key === "Escape") setEditingCatId(null);
                                  }}
                                  className="min-w-0 flex-1 border border-accent rounded px-1.5 py-0.5 text-sm outline-none"
                                />
                                <button
                                  onClick={() => saveCategoryName(c)}
                                  disabled={savingCatId === c._id}
                                  aria-label="Save name"
                                  className="text-accent-ink shrink-0 disabled:opacity-40"
                                >
                                  {savingCatId === c._id ? <Spinner size={14} /> : <Check size={14} />}
                                </button>
                              </div>
                            ) : (
                              <span className="font-medium truncate">{c.name}</span>
                            )}
                            {!isEditing && (
                              <div className="flex items-center gap-2.5 shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingCatId(c._id);
                                    setEditCatName(c.name);
                                  }}
                                  aria-label={`Rename ${c.name}`}
                                  className="text-ink-faint hover:text-accent-ink"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => deleteCategory(c)}
                                  disabled={deletingCatId === c._id}
                                  aria-label={`Delete ${c.name}`}
                                  className="text-ink-faint hover:text-bad disabled:opacity-40"
                                >
                                  {deletingCatId === c._id ? <Spinner size={14} /> : <Trash2 size={14} />}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {allCategories.filter((c) => c.direction === direction).length === 0 && (
                      <p className="text-sm text-ink-faint py-2">None yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
