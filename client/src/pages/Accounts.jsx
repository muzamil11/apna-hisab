import { useEffect, useState } from "react";
import api from "../api/client.js";

const money = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

const TYPES = [
  { value: "BANK", label: "Bank Account" },
  { value: "CASH", label: "Cash" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "COMMITTEE", label: "Committee" },
  { value: "ASSET_OTHER", label: "Other Asset (e.g. flat)" },
];

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [netWorth, setNetWorth] = useState(0);
  const [name, setName] = useState("");
  const [type, setType] = useState("BANK");

  async function load() {
    const { data } = await api.get("/accounts");
    setAccounts(data.accounts);
    setNetWorth(data.netWorth);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name) return;
    await api.post("/accounts", { name, type });
    setName("");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <div className="text-right">
          <div className="text-xs text-slate-400 uppercase">Net Worth</div>
          <div className="text-xl font-semibold tabular-nums">{money(netWorth)}</div>
        </div>
      </div>

      <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Account name — e.g. Meezan Bank"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-[180px] border border-slate-200 rounded-lg px-3 py-2"
        />
        <select value={type} onChange={(e) => setType(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2">
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button type="submit" className="bg-accent text-white px-4 py-2 rounded-lg font-medium">
          Add Account
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {accounts.map((a) => (
          <div key={a._id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">{a.type.replace("_", " ")}</div>
              <div className="font-medium">{a.name}</div>
            </div>
            <div className={`text-lg font-semibold tabular-nums ${a.kind === "LIABILITY" ? "text-bad" : "text-ink"}`}>
              {money(a.balance)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
