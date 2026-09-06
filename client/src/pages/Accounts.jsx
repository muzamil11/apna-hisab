import { useEffect, useState } from "react";
import { Landmark, Wallet, CreditCard, LineChart, PiggyBank, Building2 } from "lucide-react";
import api from "../api/client.js";

const money = (n) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

const TYPES = [
  { value: "BANK", label: "Bank Account", icon: Landmark },
  { value: "CASH", label: "Cash", icon: Wallet },
  { value: "CREDIT_CARD", label: "Credit Card", icon: CreditCard },
  { value: "INVESTMENT", label: "Investment", icon: LineChart },
  { value: "COMMITTEE", label: "Committee", icon: PiggyBank },
  { value: "ASSET_OTHER", label: "Other Asset (e.g. a flat)", icon: Building2 },
];

const iconFor = (type) => TYPES.find((t) => t.value === type)?.icon || Wallet;

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [netWorth, setNetWorth] = useState(0);
  const [name, setName] = useState("");
  const [type, setType] = useState("BANK");
  const [startingBalance, setStartingBalance] = useState("");

  async function load() {
    const { data } = await api.get("/accounts");
    setAccounts(data.accounts.filter((a) => !["RECEIVABLE", "PAYABLE"].includes(a.type)));
    setNetWorth(data.netWorth);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name) return;
    await api.post("/accounts", { name, type, startingBalance: startingBalance ? Number(startingBalance) : 0 });
    setName("");
    setStartingBalance("");
    load();
  }

  const inputClass =
    "border border-border rounded-lg px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow bg-surface";

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
            placeholder="Account name — e.g. Meezan Bank"
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
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="number"
            placeholder="Starting balance (optional, if it isn't zero today)"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
            className={`${inputClass} flex-1 min-w-[220px]`}
          />
          <button type="submit" className="bg-accent hover:bg-accent-ink text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors">
            Add Account
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {accounts.map((a) => {
          const Icon = iconFor(a.type);
          return (
            <div key={a._id} className="bg-surface border border-border shadow-card rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-accent-soft text-accent-ink flex items-center justify-center shrink-0">
                <Icon size={18} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-ink-faint font-medium">{a.type.replace("_", " ")}</div>
                <div className="font-semibold truncate">{a.name}</div>
              </div>
              <div className={`text-lg font-bold tabular-nums shrink-0 ${a.kind === "LIABILITY" ? "text-bad" : "text-ink"}`}>
                {money(a.balance)}
              </div>
            </div>
          );
        })}
        {accounts.length === 0 && (
          <p className="text-sm text-ink-faint py-4 text-center col-span-2">No accounts yet — add your first one above.</p>
        )}
      </div>
    </div>
  );
}
