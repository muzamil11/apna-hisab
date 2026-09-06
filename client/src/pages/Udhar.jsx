import { useEffect, useState } from "react";
import { Plus, ArrowUpRight, ArrowDownLeft, ChevronDown, X } from "lucide-react";
import api from "../api/client.js";

const money = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
const PAGE_SIZE = 10;

const ACTIONS = {
  lent: { label: "You Lent", account: "RECEIVABLE", direction: "toAccount", sign: -1, tone: "bad" },
  repaidToYou: { label: "They Repaid You", account: "RECEIVABLE", direction: "fromAccount", sign: 1, tone: "good" },
  borrowed: { label: "You Borrowed", account: "PAYABLE", direction: "fromAccount", sign: 1, tone: "good" },
  repaidByYou: { label: "You Repaid Them", account: "PAYABLE", direction: "toAccount", sign: -1, tone: "bad" },
};

function actionForTx(tx, personAccounts) {
  const receivableId = personAccounts.receivable?._id;
  const payableId = personAccounts.payable?._id;
  if (tx.toAccount?._id === receivableId) return ACTIONS.lent;
  if (tx.fromAccount?._id === receivableId) return ACTIONS.repaidToYou;
  if (tx.fromAccount?._id === payableId) return ACTIONS.borrowed;
  if (tx.toAccount?._id === payableId) return ACTIONS.repaidByYou;
  return null;
}

function EntryForm({ person, cashAccounts, onClose, onDone }) {
  const [action, setAction] = useState("lent");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isExisting, setIsExisting] = useState(false);
  const [cashAccount, setCashAccount] = useState(cashAccounts[0]?._id || "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!amount) return;
    setSaving(true);
    const target = action === "lent" || action === "repaidToYou" ? person.receivable : person.payable;
    const { direction } = ACTIONS[action];

    const payload = {
      amount: Number(amount),
      title: `${ACTIONS[action].label} — ${person.name}`,
      note,
      date,
      person: person._id,
    };

    if (isExisting) {
      // A balance carried over from before this app — record it against the
      // debt account only, so it doesn't move money out of a wallet that
      // never actually held it.
      payload.type = direction === "toAccount" ? "INCOME" : "EXPENSE";
      payload[direction] = target._id;
    } else {
      payload.type = "TRANSFER";
      payload[direction] = target._id;
      payload[direction === "fromAccount" ? "toAccount" : "fromAccount"] = cashAccount;
    }

    await api.post("/transactions", payload);
    setSaving(false);
    onDone();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-end md:items-center justify-center z-50">
      <form onSubmit={submit} className="bg-surface w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">{person.name}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-faint hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(ACTIONS).map(([key, a]) => (
            <button
              type="button"
              key={key}
              onClick={() => setAction(key)}
              className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                action === key
                  ? a.tone === "good"
                    ? "border-good bg-good-soft text-good"
                    : "border-bad bg-bad-soft text-bad"
                  : "border-border text-ink-muted"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        <input
          type="number"
          inputMode="decimal"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-xl font-bold tabular-nums outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />

        <label className="flex items-start gap-2.5 text-sm text-ink-muted bg-canvas rounded-lg px-3.5 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isExisting}
            onChange={(e) => setIsExisting(e.target.checked)}
            className="mt-0.5 accent-accent"
          />
          <span>This is a past balance from before you started tracking — don't move money out of an account.</span>
        </label>

        {!isExisting && (
          <select
            value={cashAccount}
            onChange={(e) => setCashAccount(e.target.value)}
            className="w-full border border-border rounded-lg px-3.5 py-2.5"
          >
            {cashAccounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
        )}

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-border rounded-lg px-3.5 py-2.5"
        />
        <textarea
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm"
          rows={2}
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-accent hover:bg-accent-ink text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}

function PersonHistory({ person }) {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/transactions", { params: { person: person._id, limit: PAGE_SIZE, skip: page * PAGE_SIZE } })
      .then((res) => {
        setEntries(res.data.transactions);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }, [person._id, page]);

  const personAccounts = { receivable: person.receivable, payable: person.payable };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="border-t border-border px-4 py-3 bg-canvas/50">
      {loading && <p className="text-sm text-ink-faint py-2">Loading…</p>}
      {!loading && entries.length === 0 && <p className="text-sm text-ink-faint py-2">No entries yet.</p>}
      <div className="space-y-2">
        {entries.map((tx) => {
          const action = actionForTx(tx, personAccounts);
          if (!action) return null;
          return (
            <div key={tx._id} className="flex items-center gap-3 py-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${action.tone === "good" ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}>
                {action.sign > 0 ? <ArrowDownLeft size={14} strokeWidth={2.5} /> : <ArrowUpRight size={14} strokeWidth={2.5} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{action.label}</div>
                <div className="text-xs text-ink-faint">
                  {fmtDate(tx.date)}
                  {tx.note && ` · ${tx.note}`}
                </div>
              </div>
              <span className={`font-bold tabular-nums text-sm ${action.tone === "good" ? "text-good" : "text-bad"}`}>
                {action.sign > 0 ? "+" : "−"}
                {money(tx.amount)}
              </span>
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-border text-xs">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-2.5 py-1 rounded border border-border disabled:opacity-40 font-medium"
          >
            Previous
          </button>
          <span className="text-ink-faint">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-2.5 py-1 rounded border border-border disabled:opacity-40 font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function Udhar() {
  const [people, setPeople] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [name, setName] = useState("");
  const [activePerson, setActivePerson] = useState(null);
  const [expanded, setExpanded] = useState(null);

  async function load() {
    const [peopleRes, accountsRes] = await Promise.all([api.get("/people"), api.get("/accounts")]);
    setPeople(peopleRes.data);
    setAccounts(accountsRes.data.accounts);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name) return;
    await api.post("/people", { name });
    setName("");
    load();
  }

  const cashAccounts = accounts.filter((a) => a.type === "BANK" || a.type === "CASH");
  const inputClass =
    "border border-border rounded-lg px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow bg-surface";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lending</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Money you lend or borrow doesn't change your net worth — it just moves from cash into what someone owes you, or what you owe them.
        </p>
      </div>

      <form onSubmit={handleAdd} className="bg-surface border border-border shadow-card rounded-xl p-4 flex gap-3">
        <input
          type="text"
          placeholder="Name — who you lent to or borrowed from"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${inputClass} flex-1`}
        />
        <button type="submit" className="bg-accent hover:bg-accent-ink text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shrink-0">
          Add
        </button>
      </form>

      <div className="space-y-3">
        {people.map((p) => {
          const receivable = p.accounts.find((a) => a.type === "RECEIVABLE");
          const payable = p.accounts.find((a) => a.type === "PAYABLE");
          const isOpen = expanded === p._id;
          return (
            <div key={p._id} className="bg-surface border border-border shadow-card rounded-xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActivePerson({ ...p, receivable, payable })}
                      className="flex items-center gap-1 text-sm text-accent-ink font-semibold"
                    >
                      <Plus size={15} strokeWidth={2.5} /> Entry
                    </button>
                    <button
                      onClick={() => setExpanded(isOpen ? null : p._id)}
                      aria-label="Toggle history"
                      className="text-ink-faint"
                    >
                      <ChevronDown size={18} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-ink-faint font-medium mb-0.5">They owe you</div>
                    <div className="font-bold text-good tabular-nums">{money(receivable?.balance || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-faint font-medium mb-0.5">You owe them</div>
                    <div className="font-bold text-bad tabular-nums">{money(payable?.balance || 0)}</div>
                  </div>
                </div>
              </div>
              {isOpen && <PersonHistory person={{ ...p, receivable, payable }} />}
            </div>
          );
        })}
        {people.length === 0 && (
          <p className="text-sm text-ink-faint text-center py-6">Add someone above to start tracking what you lend or borrow.</p>
        )}
      </div>

      {activePerson && (
        <EntryForm
          person={activePerson}
          cashAccounts={cashAccounts}
          onClose={() => setActivePerson(null)}
          onDone={load}
        />
      )}
    </div>
  );
}
