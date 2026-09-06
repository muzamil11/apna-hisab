import { useEffect, useState } from "react";
import api from "../api/client.js";
import AddTransactionModal from "../components/AddTransactionModal.jsx";

const money = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

const TYPE_TAG = {
  INCOME: { text: "Aamdani", className: "bg-green-50 text-good" },
  EXPENSE: { text: "Kharcha", className: "bg-red-50 text-bad" },
  TRANSFER: { text: "Transfer", className: "bg-blue-50 text-accent" },
  REVALUATION: { text: "Revalue", className: "bg-purple-50 text-purple-600" },
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
    setTransactions(txRes.data);
    setAccounts(accountsRes.data.accounts);
    setCategories(categoriesRes.data);
    setPeople(peopleRes.data.map((p) => ({ _id: p._id, name: p.name })));
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleDelete(id) {
    await api.delete(`/transactions/${id}`);
    loadAll();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <button onClick={() => setShowAdd(true)} className="bg-accent text-white px-4 py-2 rounded-lg font-medium">
          + Add
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {transactions.map((tx) => (
          <div key={tx._id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-medium text-sm">{tx.title}</div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className={`px-1.5 py-0.5 rounded ${TYPE_TAG[tx.type].className}`}>
                  {TYPE_TAG[tx.type].text}
                </span>
                {tx.category?.name}
                {tx.person?.name && ` · ${tx.person.name}`}
                {" · "}
                {new Date(tx.date).toLocaleDateString("en-PK")}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold tabular-nums">{money(tx.amount)}</span>
              <button onClick={() => handleDelete(tx._id)} className="text-slate-300 hover:text-bad text-sm">
                Delete
              </button>
            </div>
          </div>
        ))}
        {transactions.length === 0 && <p className="px-4 py-6 text-sm text-slate-400">Abhi koi transaction nahi</p>}
      </div>

      {showAdd && (
        <AddTransactionModal
          accounts={accounts}
          categories={categories}
          people={people}
          onClose={() => setShowAdd(false)}
          onCreated={loadAll}
        />
      )}
    </div>
  );
}
