import { useEffect, useState } from "react";
import { Plus, TrendingUp, TrendingDown, ArrowLeftRight, Trash2 } from "lucide-react";
import api from "../api/client.js";
import AddTransactionModal from "../components/AddTransactionModal.jsx";

const money = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

const TYPE_META = {
  INCOME: { text: "Income", className: "bg-good-soft text-good", icon: TrendingUp },
  EXPENSE: { text: "Expense", className: "bg-bad-soft text-bad", icon: TrendingDown },
  TRANSFER: { text: "Transfer", className: "bg-accent-soft text-accent-ink", icon: ArrowLeftRight },
  REVALUATION: { text: "Revalue", className: "bg-accent-soft text-accent-ink", icon: ArrowLeftRight },
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [people, setPeople] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  async function loadAll() {
    const [txRes, accountsRes, categoriesRes, peopleRes] = await Promise.all([
      api.get("/transactions"),
      api.get("/accounts"),
      api.get("/categories"),
      api.get("/people"),
    ]);
    setTransactions(txRes.data.transactions);
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

  async function handleDelete(id) {
    await api.delete(`/transactions/${id}`);
    loadAll();
  }

  const walletAccounts = accounts.filter((a) => !["RECEIVABLE", "PAYABLE"].includes(a.type));

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

      <div className="bg-surface border border-border shadow-card rounded-xl divide-y divide-border">
        {transactions.map((tx) => {
          const meta = TYPE_META[tx.type];
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
              <button
                onClick={() => handleDelete(tx._id)}
                aria-label="Delete transaction"
                className="text-ink-faint hover:text-bad transition-colors shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
        {transactions.length === 0 && (
          <p className="px-4 py-8 text-sm text-ink-faint text-center">No transactions yet — tap Add to record one.</p>
        )}
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
