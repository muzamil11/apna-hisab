import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, TrendingUp, TrendingDown, ArrowLeftRight, Pencil, Trash2, X } from "lucide-react";
import api from "../api/client.js";
import AddTransactionModal from "../components/AddTransactionModal.jsx";
import Spinner from "../components/Spinner.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";

const money = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;
const PAGE_SIZE = 25;

const TYPE_META = {
  INCOME: { text: "Income", className: "bg-good-soft text-good", icon: TrendingUp },
  EXPENSE: { text: "Expense", className: "bg-bad-soft text-bad", icon: TrendingDown },
  TRANSFER: { text: "Transfer", className: "bg-accent-soft text-accent-ink", icon: ArrowLeftRight },
  REVALUATION: { text: "Revalue", className: "bg-accent-soft text-accent-ink", icon: ArrowLeftRight },
};

export default function Transactions() {
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const accountFilter = searchParams.get("account") || "";
  const personFilter = searchParams.get("person") || "";

  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [closedAccounts, setClosedAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function loadTransactions() {
    setLoading(true);
    const { data } = await api.get("/transactions", {
      params: {
        account: accountFilter || undefined,
        person: personFilter || undefined,
        limit: PAGE_SIZE,
        skip: page * PAGE_SIZE,
      },
    });
    setTransactions(data.transactions);
    setTotal(data.total);
    setLoading(false);
  }

  async function loadFilters() {
    const [accountsRes, closedRes, categoriesRes, peopleRes] = await Promise.all([
      api.get("/accounts"),
      api.get("/accounts/archived"),
      api.get("/categories"),
      api.get("/people"),
    ]);
    setAccounts(accountsRes.data.accounts);
    setClosedAccounts(closedRes.data);
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
    loadFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountFilter, personFilter, page]);

  // Any filter change resets to page 1 — a stale page number from a longer
  // list could otherwise land past the end of a shorter filtered one.
  function setAccountFilter(value) {
    setPage(0);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("account", value);
      else next.delete("account");
      return next;
    });
  }

  function setPersonFilter(value) {
    setPage(0);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set("person", value);
      else next.delete("person");
      return next;
    });
  }

  function clearFilters() {
    setPage(0);
    setSearchParams({});
  }

  async function handleDelete(tx) {
    if (!(await confirm(`Delete "${tx.title}" (${money(tx.amount)})? This can't be undone.`))) return;
    setDeletingId(tx._id);
    try {
      await api.delete(`/transactions/${tx._id}`);
      await loadTransactions();
    } finally {
      setDeletingId(null);
    }
  }

  const walletAccounts = accounts.filter((a) => !["RECEIVABLE", "PAYABLE"].includes(a.type));
  const allAccountsForFilter = [
    ...walletAccounts,
    ...closedAccounts.filter((a) => !["RECEIVABLE", "PAYABLE"].includes(a.type)),
  ];
  const editModalAccounts = [...walletAccounts, ...closedAccounts.filter((a) => !["RECEIVABLE", "PAYABLE"].includes(a.type))];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilter = accountFilter || personFilter;
  const filteredAccountName = allAccountsForFilter.find((a) => a._id === accountFilter)?.name;
  const filteredPersonName = people.find((p) => p._id === personFilter)?.name;
  const inputClass =
    "border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow bg-surface";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-ink-muted mt-0.5">Everything you've recorded, newest first.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="hidden md:flex items-center gap-1.5 bg-accent hover:bg-accent-ink text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          <Plus size={16} strokeWidth={2.5} /> Add
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className={inputClass}>
          <option value="">All accounts</option>
          {allAccountsForFilter.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
              {a.archived ? " (closed)" : ""}
            </option>
          ))}
        </select>
        <select value={personFilter} onChange={(e) => setPersonFilter(e.target.value)} className={inputClass}>
          <option value="">All people</option>
          {people.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        {hasFilter && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm font-medium text-ink-faint hover:text-ink transition-colors"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {hasFilter && !loading && (
        <p className="text-sm text-ink-faint">
          {total} {total === 1 ? "entry" : "entries"}
          {filteredAccountName && ` for ${filteredAccountName}`}
          {filteredPersonName && ` with ${filteredPersonName}`}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-ink-faint">
          <Spinner size={22} />
        </div>
      ) : (
        <div className="bg-surface border border-border shadow-card rounded-xl divide-y divide-border">
          {transactions.map((tx) => {
            const meta = TYPE_META[tx.type];
            const isDeleting = deletingId === tx._id;
            return (
              <div key={tx._id} className="flex items-center gap-3 px-4 py-3.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${meta.className}`}>
                  <meta.icon size={16} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{tx.title}</div>
                  <div className="text-xs text-ink-faint mt-0.5 truncate">
                    {tx.category?.name}
                    {tx.person?.name && ` · ${tx.person.name}`}
                    {" · "}
                    {new Date(tx.date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <span className="font-bold tabular-nums shrink-0">{money(tx.amount)}</span>
                <div className="flex items-center gap-2.5 shrink-0">
                  {tx.type !== "REVALUATION" && (
                    <button
                      onClick={() => setEditingTx(tx)}
                      disabled={isDeleting}
                      aria-label="Edit transaction"
                      className="text-ink-faint hover:text-accent-ink transition-colors disabled:opacity-40"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(tx)}
                    disabled={isDeleting}
                    aria-label="Delete transaction"
                    className="text-ink-faint hover:text-bad transition-colors disabled:opacity-40"
                  >
                    {isDeleting ? <Spinner size={16} /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
          {transactions.length === 0 && (
            <p className="px-4 py-8 text-sm text-ink-faint text-center">
              {hasFilter ? "No entries match this filter." : "No transactions yet — tap Add to record one."}
            </p>
          )}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 font-medium"
          >
            Previous
          </button>
          <span className="text-ink-faint">
            Page {page + 1} of {totalPages} ({total} total)
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 font-medium"
          >
            Next
          </button>
        </div>
      )}

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
          onCreated={loadTransactions}
        />
      )}

      {editingTx && (
        <AddTransactionModal
          accounts={editModalAccounts}
          categories={categories}
          people={people}
          editingTx={editingTx}
          onClose={() => setEditingTx(null)}
          onCreated={loadTransactions}
        />
      )}
    </div>
  );
}
