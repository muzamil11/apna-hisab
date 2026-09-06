import { useEffect, useState } from "react";
import {
  Landmark,
  Wallet,
  CreditCard,
  LineChart,
  PiggyBank,
  Building2,
  Target,
  AlertCircle,
  ChevronDown,
  X,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
} from "lucide-react";
import api from "../api/client.js";
import Spinner from "../components/Spinner.jsx";
import AddTransactionModal from "../components/AddTransactionModal.jsx";

const money = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short" });
const fmtDateLong = (d) => new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });

const TYPES = [
  { value: "BANK", label: "Bank Account", icon: Landmark },
  { value: "CASH", label: "Cash", icon: Wallet },
  { value: "CREDIT_CARD", label: "Credit Card", icon: CreditCard },
  { value: "INVESTMENT", label: "Investment", icon: LineChart },
  { value: "COMMITTEE", label: "Committee", icon: PiggyBank },
  { value: "GOAL", label: "Savings Goal (e.g. wedding)", icon: Target },
  { value: "ASSET_OTHER", label: "Other Asset (e.g. a flat)", icon: Building2 },
];

const iconFor = (type) => TYPES.find((t) => t.value === type)?.icon || Wallet;
const inputClass =
  "border border-border rounded-lg px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow bg-surface";

function PayBillForm({ card, cashAccounts, onClose, onDone }) {
  const [amount, setAmount] = useState(card.cardSummary?.billed || "");
  const [fromAccount, setFromAccount] = useState(cashAccounts[0]?._id || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!amount || !fromAccount) return;
    setSaving(true);
    try {
      await api.post("/transactions", {
        type: "TRANSFER",
        amount: Number(amount),
        title: `${card.name} — bill payment`,
        fromAccount,
        toAccount: card._id,
        date,
      });
      onDone();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-end md:items-center justify-center z-50">
      <form onSubmit={submit} className="bg-surface w-full md:max-w-sm md:rounded-2xl rounded-t-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Pay {card.name}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-faint hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`${inputClass} w-full text-xl font-bold tabular-nums`}
        />
        <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} className={`${inputClass} w-full`}>
          {cashAccounts.map((a) => (
            <option key={a._id} value={a._id}>
              Pay from {a.name}
            </option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} w-full`} />
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-ink text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving && <Spinner />}
          {saving ? "Saving…" : "Record payment"}
        </button>
      </form>
    </div>
  );
}

function ContributeForm({ goal, cashAccounts, onClose, onDone }) {
  const [amount, setAmount] = useState("");
  const [fromAccount, setFromAccount] = useState(cashAccounts[0]?._id || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!amount || !fromAccount) return;
    setSaving(true);
    try {
      await api.post("/transactions", {
        type: "TRANSFER",
        amount: Number(amount),
        title: `${goal.name} — contribution`,
        fromAccount,
        toAccount: goal._id,
        date,
      });
      onDone();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-end md:items-center justify-center z-50">
      <form onSubmit={submit} className="bg-surface w-full md:max-w-sm md:rounded-2xl rounded-t-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Add to {goal.name}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-faint hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <input
          type="number"
          inputMode="decimal"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`${inputClass} w-full text-xl font-bold tabular-nums`}
        />
        <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} className={`${inputClass} w-full`}>
          {cashAccounts.map((a) => (
            <option key={a._id} value={a._id}>
              From {a.name}
            </option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} w-full`} />
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-ink text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving && <Spinner />}
          {saving ? "Saving…" : "Add to goal"}
        </button>
        <p className="text-xs text-ink-faint text-center">
          This just earmarks the money — your net worth doesn't change, it's still yours until you actually spend it.
        </p>
      </form>
    </div>
  );
}

function StatementHistory({ cardId }) {
  const [statements, setStatements] = useState(null);

  useEffect(() => {
    api.get(`/accounts/${cardId}/statements`, { params: { months: 6 } }).then((res) => setStatements(res.data));
  }, [cardId]);

  if (!statements) {
    return (
      <div className="flex items-center justify-center py-3 text-ink-faint">
        <Spinner size={16} />
      </div>
    );
  }

  if (statements.length === 0) {
    return <p className="text-xs text-ink-faint text-center py-2">No closed statements yet.</p>;
  }

  return (
    <div className="space-y-1.5">
      {statements.map((s) => (
        <div key={s.dueDate} className="flex items-center justify-between text-sm py-1">
          <div>
            <div className="font-medium">
              {fmtDate(s.periodStart)} – {fmtDate(s.periodEnd)}
            </div>
            <div className="text-xs text-ink-faint">Was due {fmtDateLong(s.dueDate)}</div>
          </div>
          <span className="font-bold tabular-nums">{money(s.total)}</span>
        </div>
      ))}
      <p className="text-xs text-ink-faint pt-1">
        This is what each cycle cost — the "Due by" amount above always reflects what's actually still owed right now.
      </p>
    </div>
  );
}

const PAGE_SIZE = 10;

function AccountHistory({ account, onEdit, onChanged }) {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  function reload() {
    setLoading(true);
    return api
      .get("/transactions", { params: { account: account._id, limit: PAGE_SIZE, skip: page * PAGE_SIZE } })
      .then((res) => {
        setEntries(res.data.transactions);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account._id, page]);

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
          const isIn = tx.toAccount?._id === account._id;
          const isDeleting = deletingId === tx._id;
          return (
            <div key={tx._id} className="group flex items-center gap-3 py-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  isIn ? "bg-good-soft text-good" : "bg-bad-soft text-bad"
                }`}
              >
                {isIn ? <ArrowDownLeft size={14} strokeWidth={2.5} /> : <ArrowUpRight size={14} strokeWidth={2.5} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{tx.title}</div>
                <div className="text-xs text-ink-faint truncate">
                  {fmtDateLong(tx.date)}
                  {tx.category?.name && ` · ${tx.category.name}`}
                  {tx.person?.name && ` · ${tx.person.name}`}
                </div>
              </div>
              <span className={`font-bold tabular-nums text-sm shrink-0 ${isIn ? "text-good" : "text-bad"}`}>
                {isIn ? "+" : "−"}
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

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [netWorth, setNetWorth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [type, setType] = useState("BANK");
  const [startingBalance, setStartingBalance] = useState("");
  const [billingCycleDay, setBillingCycleDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [payingCard, setPayingCard] = useState(null);
  const [contributingGoal, setContributingGoal] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [categories, setCategories] = useState([]);
  const [people, setPeople] = useState([]);
  const [closedAccounts, setClosedAccounts] = useState([]);
  const [showClosed, setShowClosed] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [editingTx, setEditingTx] = useState(null);
  const [archivingId, setArchivingId] = useState(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  async function load() {
    const [accountsRes, categoriesRes, peopleRes, closedRes] = await Promise.all([
      api.get("/accounts"),
      api.get("/categories"),
      api.get("/people"),
      api.get("/accounts/archived"),
    ]);
    setAccounts(accountsRes.data.accounts.filter((a) => !["RECEIVABLE", "PAYABLE"].includes(a.type)));
    setNetWorth(accountsRes.data.netWorth);
    setCategories(categoriesRes.data);
    setPeople(
      peopleRes.data.map((p) => ({
        _id: p._id,
        name: p.name,
        receivableId: p.accounts.find((a) => a.type === "RECEIVABLE")?._id,
      }))
    );
    setClosedAccounts(closedRes.data.filter((a) => !["RECEIVABLE", "PAYABLE"].includes(a.type)));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function handleArchive(account, archived) {
    if (archived && account.balance !== 0) {
      // Which way net worth would drift depends on whether this account is
      // something owned (archiving hides an asset) or owed (archiving hides
      // a debt, which is the more dangerous mistake — worth calling out).
      const impact =
        account.kind === "LIABILITY"
          ? `You still owe ${money(account.balance)} on this. Closing it will make your net worth look ${money(account.balance)} higher than it really is, since that debt won't be subtracted anymore.`
          : `This still holds ${money(account.balance)}. Closing it will remove that amount from your net worth, since it'll no longer be counted as something you own — make sure you've moved the money out first.`;
      const ok = window.confirm(`${impact} Close ${account.name} anyway?`);
      if (!ok) return;
    } else if (!window.confirm(archived ? `Close ${account.name}?` : `Reopen ${account.name}?`)) {
      return;
    }
    setArchivingId(account._id);
    try {
      await api.patch(`/accounts/${account._id}/${archived ? "archive" : "unarchive"}`);
      setExpandedId(null);
      await load();
    } finally {
      setArchivingId(null);
    }
  }

  async function handleRename(account) {
    const value = renameValue.trim();
    if (!value || value === account.name) return setRenamingId(null);
    setRenaming(true);
    try {
      await api.patch(`/accounts/${account._id}`, { name: value });
      setRenamingId(null);
      await load();
    } finally {
      setRenaming(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!name) return;
    let meta;
    if (type === "CREDIT_CARD") {
      meta = {
        billingCycleDay: Number(billingCycleDay) || undefined,
        dueDay: Number(dueDay) || undefined,
        creditLimit: Number(creditLimit) || undefined,
      };
    } else if (type === "GOAL") {
      meta = { targetAmount: Number(targetAmount) || undefined, targetDate: targetDate || undefined };
    }
    setAdding(true);
    try {
      await api.post("/accounts", {
        name,
        type,
        startingBalance: startingBalance ? Number(startingBalance) : 0,
        meta,
      });
      setName("");
      setStartingBalance("");
      setBillingCycleDay("");
      setDueDay("");
      setCreditLimit("");
      setTargetAmount("");
      setTargetDate("");
      await load();
    } finally {
      setAdding(false);
    }
  }

  const cashAccounts = accounts.filter((a) => a.type === "BANK" || a.type === "CASH");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-sm text-ink-muted mt-0.5">Every wallet that makes up your worth.</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-ink-faint uppercase font-semibold">Net Worth</div>
          <div className="text-xl font-bold tabular-nums">{money(netWorth)}</div>
        </div>
      </div>

      <form onSubmit={handleAdd} className="bg-surface border border-border shadow-card rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder={type === "GOAL" ? "Goal name — e.g. Wedding gold" : "Account name — e.g. Meezan Bank"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClass} flex-1 min-w-[180px]`}
          />
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {/* Billing cycle / due date / credit limit — paused for now, we're
            tracking cards as a plain liability (Expense + Transfer) until
            we build the cycle math back up together, deliberately, with
            real usage to test against. Backend (creditCard.js, the
            /statements route, its tests) is untouched and ready when we do. */}
        {type === "GOAL" && (
          <div className="flex flex-wrap gap-3">
            <input
              type="number"
              placeholder="Target amount — e.g. 500000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className={`${inputClass} flex-1 min-w-[200px]`}
            />
            <input
              type="date"
              placeholder="Target date (optional)"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={`${inputClass} flex-1 min-w-[200px]`}
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {type !== "GOAL" && (
            <input
              type="number"
              placeholder="Starting balance (optional, if it isn't zero today)"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              className={`${inputClass} flex-1 min-w-[220px]`}
            />
          )}
          <button
            type="submit"
            disabled={adding}
            className="flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-ink text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {adding && <Spinner size={15} />}
            {type === "GOAL" ? "Create Goal" : "Add Account"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-ink-faint">
          <Spinner size={22} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accounts.map((a) => {
            const Icon = iconFor(a.type);
            const goalPct =
              a.type === "GOAL" && a.meta?.targetAmount ? Math.min(100, (a.balance / a.meta.targetAmount) * 100) : null;
            const isCardOpen = expandedCard === a._id;
            const isHistoryOpen = expandedId === a._id;
            const isArchiving = archivingId === a._id;
            const isRenaming = renamingId === a._id;
            return (
              <div key={a._id} className="bg-surface border border-border shadow-card rounded-xl overflow-hidden">
                <div
                  className="p-4 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => !isRenaming && setExpandedId(isHistoryOpen ? null : a._id)}
                  onKeyDown={(e) => !isRenaming && e.key === "Enter" && setExpandedId(isHistoryOpen ? null : a._id)}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-accent-soft text-accent-ink flex items-center justify-center shrink-0">
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-ink-faint font-medium">{a.type.replace("_", " ")}</div>
                      {isRenaming ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(a);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            className="min-w-0 flex-1 border border-accent rounded px-1.5 py-0.5 text-sm font-semibold outline-none"
                          />
                          <button
                            onClick={() => handleRename(a)}
                            disabled={renaming}
                            aria-label="Save name"
                            className="text-accent-ink shrink-0 disabled:opacity-40"
                          >
                            {renaming ? <Spinner size={14} /> : <Check size={14} />}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="font-semibold truncate">{a.name}</div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingId(a._id);
                              setRenameValue(a.name);
                            }}
                            aria-label={`Rename ${a.name}`}
                            className="text-ink-faint hover:text-accent-ink shrink-0"
                          >
                            <Pencil size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={`text-lg font-bold tabular-nums shrink-0 ${a.kind === "LIABILITY" ? "text-bad" : "text-ink"}`}>
                      {money(a.balance)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchive(a, true);
                      }}
                      disabled={isArchiving}
                      aria-label={`Close ${a.name}`}
                      title="Close this account"
                      className="text-ink-faint hover:text-bad disabled:opacity-40 shrink-0"
                    >
                      {isArchiving ? <Spinner size={15} /> : <Archive size={15} />}
                    </button>
                    <ChevronDown
                      size={18}
                      aria-hidden="true"
                      className={`text-ink-faint transition-transform shrink-0 ${isHistoryOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                {goalPct !== null && (
                  <div className="px-4 pb-4 -mt-1 pt-3 border-t border-border space-y-2">
                    <div className="h-2 rounded-full bg-canvas overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${goalPct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-ink-faint">
                      <span>
                        {money(a.balance)} of {money(a.meta.targetAmount)} ({Math.round(goalPct)}%)
                      </span>
                      {a.meta.targetDate && <span>by {fmtDateLong(a.meta.targetDate)}</span>}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContributingGoal(a);
                      }}
                      className="w-full text-sm font-semibold text-accent-ink bg-accent-soft hover:bg-accent-soft/70 rounded-lg py-2 transition-colors"
                    >
                      Add money
                    </button>
                  </div>
                )}

                {/* Cycle/due-date/statement UI paused too — see note above.
                    Cards behave like any other liability account for now:
                    Expense to spend on it, Transfer to pay it down. */}
                {false && a.cardSummary && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    {a.cardSummary.creditLimit && (
                      <div className="space-y-1">
                        <div className="h-2 rounded-full bg-canvas overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              a.cardSummary.utilizationPct >= 90
                                ? "bg-bad"
                                : a.cardSummary.utilizationPct >= 70
                                  ? "bg-warn"
                                  : "bg-accent"
                            }`}
                            style={{ width: `${Math.min(100, a.cardSummary.utilizationPct)}%` }}
                          />
                        </div>
                        <div className="text-xs text-ink-faint">
                          {money(a.balance)} of {money(a.cardSummary.creditLimit)} limit ({a.cardSummary.utilizationPct}%)
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-faint">This cycle (not due yet)</span>
                      <span className="font-semibold tabular-nums">{money(a.cardSummary.unbilled)}</span>
                    </div>
                    {a.cardSummary.billed > 0 && (
                      <div
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                          a.cardSummary.overdue ? "bg-bad-soft" : "bg-warn-soft"
                        }`}
                      >
                        <span className={`flex items-center gap-1.5 font-medium ${a.cardSummary.overdue ? "text-bad" : "text-warn"}`}>
                          <AlertCircle size={14} />
                          {a.cardSummary.overdue ? "Overdue since" : "Due by"} {fmtDate(a.cardSummary.dueDate)}
                        </span>
                        <span className={`font-bold tabular-nums ${a.cardSummary.overdue ? "text-bad" : "text-warn"}`}>
                          {money(a.cardSummary.billed)}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => setPayingCard(a)}
                      className="w-full text-sm font-semibold text-accent-ink bg-accent-soft hover:bg-accent-soft/70 rounded-lg py-2 transition-colors"
                    >
                      Pay bill
                    </button>
                    <button
                      onClick={() => setExpandedCard(isCardOpen ? null : a._id)}
                      className="w-full flex items-center justify-center gap-1 text-xs font-medium text-ink-faint hover:text-ink pt-1"
                    >
                      Statement history
                      <ChevronDown size={14} className={`transition-transform ${isCardOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isCardOpen && (
                      <div className="pt-2 border-t border-border">
                        <StatementHistory cardId={a._id} />
                      </div>
                    )}
                  </div>
                )}

                {isHistoryOpen && (
                  <AccountHistory
                    key={historyKey}
                    account={a}
                    onEdit={(tx) => setEditingTx(tx)}
                    onChanged={load}
                  />
                )}
              </div>
            );
          })}
          {accounts.length === 0 && (
            <p className="text-sm text-ink-faint py-4 text-center col-span-2">No accounts yet — add your first one above.</p>
          )}
        </div>
      )}

      {!loading && (
        <div className="bg-surface border border-border shadow-card rounded-xl overflow-hidden">
          <button
            onClick={() => setShowClosed((s) => !s)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-ink-muted"
          >
            <span>Closed accounts ({closedAccounts.length})</span>
            <ChevronDown size={16} className={`transition-transform ${showClosed ? "rotate-180" : ""}`} />
          </button>
          {showClosed && (
            <div className="border-t border-border divide-y divide-border">
              {closedAccounts.length === 0 && (
                <p className="text-sm text-ink-faint text-center py-4">No closed accounts.</p>
              )}
              {closedAccounts.map((a) => {
                const Icon = iconFor(a.type);
                const isHistoryOpen = expandedId === a._id;
                const isArchiving = archivingId === a._id;
                return (
                  <div key={a._id}>
                    <div
                      className="p-4 cursor-pointer flex items-center gap-3.5"
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedId(isHistoryOpen ? null : a._id)}
                      onKeyDown={(e) => e.key === "Enter" && setExpandedId(isHistoryOpen ? null : a._id)}
                    >
                      <div className="w-10 h-10 rounded-lg bg-canvas text-ink-faint flex items-center justify-center shrink-0">
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-ink-faint font-medium">{a.type.replace("_", " ")}</div>
                        <div className="font-semibold truncate text-ink-muted">{a.name}</div>
                      </div>
                      <div className="text-lg font-bold tabular-nums shrink-0 text-ink-faint">{money(a.balance)}</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(a, false);
                        }}
                        disabled={isArchiving}
                        aria-label={`Reopen ${a.name}`}
                        title="Reopen this account"
                        className="text-ink-faint hover:text-accent-ink disabled:opacity-40 shrink-0"
                      >
                        {isArchiving ? <Spinner size={15} /> : <ArchiveRestore size={15} />}
                      </button>
                      <ChevronDown
                        size={18}
                        aria-hidden="true"
                        className={`text-ink-faint transition-transform shrink-0 ${isHistoryOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                    {isHistoryOpen && (
                      <AccountHistory key={historyKey} account={a} onEdit={(tx) => setEditingTx(tx)} onChanged={load} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {payingCard && (
        <PayBillForm card={payingCard} cashAccounts={cashAccounts} onClose={() => setPayingCard(null)} onDone={load} />
      )}
      {contributingGoal && (
        <ContributeForm
          goal={contributingGoal}
          cashAccounts={cashAccounts}
          onClose={() => setContributingGoal(null)}
          onDone={load}
        />
      )}

      {editingTx && (
        <AddTransactionModal
          accounts={[...accounts, ...closedAccounts]}
          categories={categories}
          people={people}
          editingTx={editingTx}
          onClose={() => setEditingTx(null)}
          onCreated={() => {
            load();
            setHistoryKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
