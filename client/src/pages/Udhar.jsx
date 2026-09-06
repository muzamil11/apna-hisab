import { useEffect, useState } from "react";
import api from "../api/client.js";

const money = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

const ACTIONS = {
  give: { label: "Diya", account: "RECEIVABLE", direction: "toAccount" },
  receiveBack: { label: "Wapas mila", account: "RECEIVABLE", direction: "fromAccount" },
  borrow: { label: "Liya", account: "PAYABLE", direction: "fromAccount" },
  repay: { label: "Wapas kiya", account: "PAYABLE", direction: "toAccount" },
};

function DebtActionForm({ person, cashAccounts, onClose, onDone }) {
  const [action, setAction] = useState("give");
  const [amount, setAmount] = useState("");
  const [cashAccount, setCashAccount] = useState(cashAccounts[0]?._id || "");
  const [note, setNote] = useState("");

  async function submit(e) {
    e.preventDefault();
    const target = action === "give" || action === "receiveBack" ? person.receivable : person.payable;
    const { direction } = ACTIONS[action];
    const payload = {
      type: "TRANSFER",
      amount: Number(amount),
      title: `${ACTIONS[action].label} — ${person.name}`,
      note,
      person: person._id,
    };
    payload[direction] = target._id;
    payload[direction === "fromAccount" ? "toAccount" : "fromAccount"] = cashAccount;

    await api.post("/transactions", payload);
    onDone();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={submit} className="bg-white rounded-xl p-5 w-full max-w-sm space-y-3">
        <h2 className="font-semibold">{person.name} — udhar entry</h2>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(ACTIONS).map(([key, a]) => (
            <button
              type="button"
              key={key}
              onClick={() => setAction(key)}
              className={`py-2 rounded-lg text-sm border ${
                action === key ? "border-accent text-accent bg-blue-50" : "border-slate-200 text-slate-500"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2"
        />
        <select value={cashAccount} onChange={(e) => setCashAccount(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2">
          {cashAccounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </select>
        <textarea
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          rows={2}
        />
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 border border-slate-200 rounded-lg py-2">
            Cancel
          </button>
          <button type="submit" className="flex-1 bg-accent text-white rounded-lg py-2 font-medium">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Udhar() {
  const [people, setPeople] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [name, setName] = useState("");
  const [activePerson, setActivePerson] = useState(null);

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Udhar</h1>

      <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3">
        <input
          type="text"
          placeholder="Naam — jise diya ya jisse liya"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2"
        />
        <button type="submit" className="bg-accent text-white px-4 py-2 rounded-lg font-medium">
          Add Person
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {people.map((p) => {
          const receivable = p.accounts.find((a) => a.type === "RECEIVABLE");
          const payable = p.accounts.find((a) => a.type === "PAYABLE");
          return (
            <div key={p._id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.name}</span>
                <button
                  onClick={() => setActivePerson({ ...p, receivable, payable })}
                  className="text-sm text-accent font-medium"
                >
                  + Entry
                </button>
              </div>
              <div className="text-sm flex justify-between">
                <span className="text-slate-500">Aapko milne hain</span>
                <span className="font-semibold text-good tabular-nums">{money(receivable?.balance || 0)}</span>
              </div>
              <div className="text-sm flex justify-between">
                <span className="text-slate-500">Aapko dene hain</span>
                <span className="font-semibold text-bad tabular-nums">{money(payable?.balance || 0)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {activePerson && (
        <DebtActionForm
          person={activePerson}
          cashAccounts={cashAccounts}
          onClose={() => setActivePerson(null)}
          onDone={load}
        />
      )}
    </div>
  );
}
