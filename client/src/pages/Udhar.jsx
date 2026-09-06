import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Plus, ArrowUpRight, ArrowDownLeft, ChevronDown, Pencil, Trash2, X } from "lucide-react";
import api from "../api/client.js";
import Spinner from "../components/Spinner.jsx";

const shortMoney = (n) => {
  const abs = Math.abs(n);
  if (abs >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${n}`;
};

const money = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
const PAGE_SIZE = 10;

const ACTIONS = {
  lent: { label: "You Lent", account: "RECEIVABLE", direction: "toAccount", sign: -1, tone: "bad" },
  repaidToYou: { label: "They Repaid You", account: "RECEIVABLE", direction: "fromAccount", sign: 1, tone: "good" },
  borrowed: { label: "You Borrowed", account: "PAYABLE", direction: "fromAccount", sign: 1, tone: "good" },
  repaidByYou: { label: "You Repaid Them", account: "PAYABLE", direction: "toAccount", sign: -1, tone: "bad" },
};

function actionKeyForTx(tx, personAccounts) {
  const receivableId = personAccounts.receivable?._id;
  const payableId = personAccounts.payable?._id;
  if (tx.toAccount?._id === receivableId) return "lent";
  if (tx.fromAccount?._id === receivableId) return "repaidToYou";
  if (tx.fromAccount?._id === payableId) return "borrowed";
  if (tx.toAccount?._id === payableId) return "repaidByYou";
  return null;
}

function EntryForm({ person, cashAccounts, editingTx, onClose, onDone }) {
  const personAccounts = { receivable: person.receivable, payable: person.payable };
  const editKey = editingTx ? actionKeyForTx(editingTx, personAccounts) : null;
  const editWasExisting = editingTx ? editingTx.type !== "TRANSFER" : false;
  const editCashAccountId = editingTx
    ? [editingTx.fromAccount?._id, editingTx.toAccount?._id].find(
        (id) => id && id !== person.receivable?._id && id !== person.payable?._id
      )
    : null;

  const [action, setAction] = useState(editKey || "lent");
  const [amount, setAmount] = useState(editingTx ? String(editingTx.amount) : "");
  const [date, setDate] = useState(editingTx ? editingTx.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [isExisting, setIsExisting] = useState(editWasExisting);
  const [cashAccount, setCashAccount] = useState(editCashAccountId || cashAccounts[0]?._id || "");
  const [note, setNote] = useState(editingTx?.note || "");
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

    try {
      if (editingTx) {
        // Editing replays as delete-then-recreate, so the old entry's effects
        // are cleanly reversed before the new ones are applied — no special
        // "diff the ledger" logic needed.
        await api.delete(`/transactions/${editingTx._id}`);
      }
      await api.post("/transactions", payload);
      onDone();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-end md:items-center justify-center z-50">
      <form onSubmit={submit} className="bg-surface w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">{editingTx ? `Edit — ${person.name}` : person.name}</h2>
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
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-ink text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving && <Spinner />}
          {saving ? "Saving…" : editingTx ? "Save changes" : "Save"}
        </button>
      </form>
    </div>
  );
}

function PersonHistory({ person, onEdit, onChanged }) {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  function reload() {
    setLoading(true);
    return api
      .get("/transactions", { params: { person: person._id, limit: PAGE_SIZE, skip: page * PAGE_SIZE } })
      .then((res) => {
        setEntries(res.data.transactions);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person._id, page]);

  async function handleDelete(tx) {
    if (!window.confirm(`Delete "${tx.title}" (${money(tx.amount)})? This can't be undone.`)) return;
    setDeletingId(tx._id);
    try {
      await api.delete(`/transactions/${tx._id}`);
      await reload();
      onChanged();
    } finally {
      setDeletingId(null);
    }
  }

  const personAccounts = { receivable: person.receivable, payable: person.payable };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="border-t border-border px-4 py-3 bg-canvas/50">
      {loading && (
        <div className="flex items-center justify-center py-4 text-ink-faint">
          <Spinner size={18} />
        </div>
      )}
      {!loading && entries.length === 0 && <p className="text-sm text-ink-faint py-2">No entries yet.</p>}
      <div className="space-y-1">
        {entries.map((tx) => {
          const key = actionKeyForTx(tx, personAccounts);
          const action = key && ACTIONS[key];
          if (!action) return null;
          const isDeleting = deletingId === tx._id;
          return (
            <div key={tx._id} className="group flex items-center gap-3 py-1.5">
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
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onEdit(tx)}
                  disabled={isDeleting}
                  aria-label="Edit entry"
                  className="text-ink-faint hover:text-accent-ink disabled:opacity-40"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(tx)}
                  disabled={isDeleting}
                  aria-label="Delete entry"
                  className="text-ink-faint hover:text-bad disabled:opacity-40"
                >
                  {isDeleting ? <Spinner size={14} /> : <Trash2 size={14} />}
                </button>
              </div>
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
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [addingPerson, setAddingPerson] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [activePerson, setActivePerson] = useState(null);
  const [editing, setEditing] = useState(null); // { person, tx }
  const [expanded, setExpanded] = useState(null);
  const [historyKey, setHistoryKey] = useState(0);

  async function load() {
    const [peopleRes, accountsRes] = await Promise.all([api.get("/people"), api.get("/accounts")]);
    setPeople(peopleRes.data);
    setAccounts(accountsRes.data.accounts);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name) return;
    setAddingPerson(true);
    try {
      await api.post("/people", { name });
      setName("");
      await load();
    } finally {
      setAddingPerson(false);
    }
  }

  async function handleRemovePerson(person) {
    if (!window.confirm(`Remove ${person.name}? This only works if their balance is fully settled.`)) return;
    setRemovingId(person._id);
    try {
      await api.delete(`/people/${person._id}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || "Could not remove this person.");
    } finally {
      setRemovingId(null);
    }
  }

  const cashAccounts = accounts.filter((a) => a.type === "BANK" || a.type === "CASH");
  const inputClass =
    "border border-border rounded-lg px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow bg-surface";

  const overview = useMemo(() => {
    return people
      .map((p) => {
        const receivable = p.accounts.find((a) => a.type === "RECEIVABLE")?.balance || 0;
        const payable = p.accounts.find((a) => a.type === "PAYABLE")?.balance || 0;
        return { name: p.name, net: receivable - payable };
      })
      .filter((p) => p.net !== 0)
      .sort((a, b) => b.net - a.net);
  }, [people]);
  const overviewHeight = Math.max(100, overview.length * 36);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lending</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Money you lend or borrow doesn't change your net worth — it just moves from cash into what someone owes you, or what you owe them.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-ink-faint">
          <Spinner size={22} />
        </div>
      ) : (
        <>
          {overview.length > 0 && (
            <div className="bg-surface border border-border shadow-card rounded-xl p-5">
              <h2 className="text-sm font-semibold text-ink-muted mb-3">Who owes what</h2>
              <ResponsiveContainer width="100%" height={overviewHeight}>
                <BarChart data={overview} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" tickFormatter={shortMoney} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fontSize: 12, fill: "#0F172A" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReferenceLine x={0} stroke="#E2E8F0" />
                  <Tooltip
                    formatter={(v) => [`Rs ${Math.abs(v).toLocaleString("en-PK")}`, v >= 0 ? "Owes you" : "You owe"]}
                    cursor={{ fill: "#F6F7FB" }}
                  />
                  <Bar dataKey="net" radius={4} barSize={16}>
                    {overview.map((p, i) => (
                      <Cell key={i} fill={p.net >= 0 ? "#16A34A" : "#DC2626"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <form onSubmit={handleAdd} className="bg-surface border border-border shadow-card rounded-xl p-4 flex gap-3">
            <input
              type="text"
              placeholder="Name — who you lent to or borrowed from"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClass} flex-1`}
            />
            <button
              type="submit"
              disabled={addingPerson}
              className="flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-ink text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shrink-0 disabled:opacity-50"
            >
              {addingPerson && <Spinner size={15} />}
              Add
            </button>
          </form>

          <div className="space-y-3">
            {people.map((p) => {
              const receivable = p.accounts.find((a) => a.type === "RECEIVABLE");
              const payable = p.accounts.find((a) => a.type === "PAYABLE");
              const isOpen = expanded === p._id;
              const isRemoving = removingId === p._id;
              return (
                <div key={p._id} className="bg-surface border border-border shadow-card rounded-xl overflow-hidden">
                  <div
                    className="p-4 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpanded(isOpen ? null : p._id)}
                    onKeyDown={(e) => e.key === "Enter" && setExpanded(isOpen ? null : p._id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold">{p.name}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePerson({ ...p, receivable, payable });
                          }}
                          className="flex items-center gap-1 text-sm text-accent-ink font-semibold"
                        >
                          <Plus size={15} strokeWidth={2.5} /> Entry
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePerson(p);
                          }}
                          disabled={isRemoving}
                          aria-label={`Remove ${p.name}`}
                          className="text-ink-faint hover:text-bad disabled:opacity-40"
                        >
                          {isRemoving ? <Spinner size={15} /> : <Trash2 size={15} />}
                        </button>
                        <ChevronDown
                          size={18}
                          aria-hidden="true"
                          className={`text-ink-faint transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
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
                  {isOpen && (
                    <PersonHistory
                      key={historyKey}
                      person={{ ...p, receivable, payable }}
                      onEdit={(tx) => setEditing({ person: { ...p, receivable, payable }, tx })}
                      onChanged={load}
                    />
                  )}
                </div>
              );
            })}
            {people.length === 0 && (
              <p className="text-sm text-ink-faint text-center py-6">Add someone above to start tracking what you lend or borrow.</p>
            )}
          </div>
        </>
      )}

      {activePerson && (
        <EntryForm
          person={activePerson}
          cashAccounts={cashAccounts}
          onClose={() => setActivePerson(null)}
          onDone={load}
        />
      )}

      {editing && (
        <EntryForm
          person={editing.person}
          editingTx={editing.tx}
          cashAccounts={cashAccounts}
          onClose={() => setEditing(null)}
          onDone={() => {
            load();
            setHistoryKey((k) => k + 1); // force PersonHistory to refetch its page
          }}
        />
      )}
    </div>
  );
}
