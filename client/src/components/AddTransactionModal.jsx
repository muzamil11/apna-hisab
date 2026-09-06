import { useState } from "react";
import { TrendingUp, TrendingDown, ArrowLeftRight, X } from "lucide-react";
import api from "../api/client.js";

const TYPES = [
  { key: "INCOME", label: "Income", hint: "Money came in — salary, rent, freelance", icon: TrendingUp, tone: "good" },
  { key: "EXPENSE", label: "Expense", hint: "Money left for good — food, bills, shopping", icon: TrendingDown, tone: "bad" },
  { key: "TRANSFER", label: "Transfer", hint: "Moved between your own accounts — investing, lending, committee", icon: ArrowLeftRight, tone: "accent" },
];

const toneClasses = {
  good: "border-good bg-good-soft text-good",
  bad: "border-bad bg-bad-soft text-bad",
  accent: "border-accent bg-accent-soft text-accent-ink",
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
  const [willBeRepaid, setWillBeRepaid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const relevantCategories = categories.filter((c) => c.direction === (type === "INCOME" ? "INCOME" : "EXPENSE"));
  const active = TYPES.find((t) => t.key === type);
  const selectedPerson = people.find((p) => p._id === person);
  const isRepayable = type === "EXPENSE" && selectedPerson && willBeRepaid;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!amount || !title) return setError("Amount and title are required.");
    if (type !== "TRANSFER" && !category && !isRepayable) return setError("Please choose a category.");
    if ((type === "EXPENSE" || type === "TRANSFER") && !fromAccount) return setError("Choose which account this came from.");
    if ((type === "INCOME" || type === "TRANSFER") && !toAccount) return setError("Choose where this went.");
    if (isRepayable && !selectedPerson.receivableId) return setError("This person's lending ledger couldn't be found.");

    setSaving(true);
    try {
      const payload = isRepayable
        ? {
            type: "TRANSFER",
            amount: Number(amount),
            title,
            note,
            date,
            fromAccount,
            toAccount: selectedPerson.receivableId,
            person,
          }
        : {
            type,
            amount: Number(amount),
            title,
            note,
            date,
            fromAccount: fromAccount || undefined,
            toAccount: toAccount || undefined,
            category: type !== "TRANSFER" ? category : undefined,
            person: person || undefined,
          };
      await api.post("/transactions", payload);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Could not save this transaction.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full border border-border rounded-lg px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow bg-surface";

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-surface w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold tracking-tight">Add Transaction</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink-faint hover:text-ink transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-colors ${
                type === t.key ? toneClasses[t.tone] : "border-border text-ink-muted hover:border-ink-faint"
              }`}
            >
              <t.icon size={18} strokeWidth={2} />
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-faint mb-5">{active.hint}</p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} text-2xl font-bold tabular-nums`}
          />
          <input
            type="text"
            placeholder="Title — e.g. Grocery run, Salary for September"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />

          {(type === "EXPENSE" || type === "TRANSFER") && (
            <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} className={inputClass}>
              <option value="">From which account?</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}

          {(type === "INCOME" || type === "TRANSFER") && (
            <select value={toAccount} onChange={(e) => setToAccount(e.target.value)} className={inputClass}>
              <option value="">Into which account?</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}

          {type !== "TRANSFER" && !isRepayable && (
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              <option value="">Category</option>
              {relevantCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {type === "EXPENSE" && people.length > 0 && (
            <>
              <select value={person} onChange={(e) => setPerson(e.target.value)} className={inputClass}>
                <option value="">Spent on yourself (default)</option>
                {people.map((p) => (
                  <option key={p._id} value={p._id}>
                    Spent on {p.name}
                  </option>
                ))}
              </select>
              {selectedPerson && (
                <label className="flex items-start gap-2.5 text-sm text-ink-muted bg-canvas rounded-lg px-3.5 py-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={willBeRepaid}
                    onChange={(e) => setWillBeRepaid(e.target.checked)}
                    className="mt-0.5 accent-accent"
                  />
                  <span>
                    {selectedPerson.name} will pay you back — add this to Lending instead of counting it as your own
                    expense.
                  </span>
                </label>
              )}
            </>
          )}

          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          <textarea
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${inputClass} text-sm`}
            rows={2}
          />

          {error && <p className="text-sm text-bad">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-accent hover:bg-accent-ink text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
