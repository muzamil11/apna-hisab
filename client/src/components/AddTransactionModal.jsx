import { useState } from "react";
import api from "../api/client.js";

const TYPE_LABELS = {
  INCOME: { label: "💰 Aamdani", hint: "Bahar se paisa aaya — salary, rent, freelance" },
  EXPENSE: { label: "💸 Kharcha", hint: "Paisa system se bahar gaya — khana, bill, shopping" },
  TRANSFER: { label: "🔁 Transfer", hint: "Apni hi jagah paisa gaya — investment, committee, udhar" },
};

export default function AddTransactionModal({ accounts, categories, people, onClose, onCreated }) {
  const [type, setType] = useState("EXPENSE");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [category, setCategory] = useState("");
  const [person, setPerson] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const relevantCategories = categories.filter((c) => c.direction === (type === "INCOME" ? "INCOME" : "EXPENSE"));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!amount || !title) return setError("Amount aur title zaroori hain");
    if (type !== "TRANSFER" && !category) return setError("Category chunein");
    if ((type === "EXPENSE" || type === "TRANSFER") && !fromAccount) return setError("Konse account se? chunein");
    if ((type === "INCOME" || type === "TRANSFER") && !toAccount) return setError("Kahan gaya? chunein");

    setSaving(true);
    try {
      await api.post("/transactions", {
        type,
        amount: Number(amount),
        title,
        note,
        date,
        fromAccount: fromAccount || undefined,
        toAccount: toAccount || undefined,
        category: type !== "TRANSFER" ? category : undefined,
        person: person || undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Save nahi ho saka");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50">
      <div className="bg-white w-full md:max-w-md md:rounded-xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Transaction</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {Object.entries(TYPE_LABELS).map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key)}
              className={`py-2 rounded-lg text-sm font-medium border ${
                type === key ? "border-accent bg-blue-50 text-accent" : "border-slate-200 text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mb-4">{TYPE_LABELS[type].hint}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-lg font-semibold tabular-nums"
          />
          <input
            type="text"
            placeholder="Title — e.g. Uni trip, Salary Sept"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2"
          />

          {(type === "EXPENSE" || type === "TRANSFER") && (
            <select
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
            >
              <option value="">Konse account se?</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}

          {(type === "INCOME" || type === "TRANSFER") && (
            <select
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
            >
              <option value="">Kahan gaya / kahan aaya?</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}

          {type !== "TRANSFER" && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
            >
              <option value="">Category</option>
              {relevantCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {type === "EXPENSE" && people.length > 0 && (
            <select
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
            >
              <option value="">Khud pe (default) — ya kisi aur pe?</option>
              {people.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2"
          />
          <textarea
            placeholder="Note (optional, detail yahan likhein)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            rows={2}
          />

          {error && <p className="text-sm text-bad">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-accent text-white font-medium py-2.5 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
