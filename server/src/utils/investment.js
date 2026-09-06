// Total return for an INVESTMENT/ASSET_OTHER account, computed entirely
// from its own transaction history — same "ledger is truth" principle as
// the rest of the app, so nothing has to be manually kept in sync.
//
// Three kinds of events can touch such an account:
//  - A contribution (fresh money in — INCOME for a pre-app/historical entry
//    with no real wallet touched, or TRANSFER from an actual wallet) grows
//    what's invested.
//  - A withdrawal (money actually taken out — EXPENSE for a historical
//    "already received" entry, or TRANSFER to a real wallet) counts toward
//    total value realized, but doesn't reduce what was invested — that
//    money is still part of the return, just no longer sitting here.
//  - A REVALUATION (a profit/loss mark — the investment matured, the stock
//    moved, the plot's estimated worth changed) changes the account's
//    balance directly but affects neither invested nor withdrawn, since no
//    cash actually changed hands.
//
// `investedFallback` covers accounts set up before any of this — a single
// manually-entered "invested amount" with no real contribution transaction
// behind it — and is ignored the moment a real contribution exists.
export function getInvestmentSummary(accountId, transactions, balance, investedFallback = 0) {
  const id = String(accountId);
  let invested = 0;
  let withdrawn = 0;

  for (const tx of transactions) {
    const toThis = tx.toAccount && String(tx.toAccount) === id;
    const fromThis = tx.fromAccount && String(tx.fromAccount) === id;
    if (toThis && (tx.type === "INCOME" || tx.type === "TRANSFER")) invested += tx.amount;
    if (fromThis && (tx.type === "EXPENSE" || tx.type === "TRANSFER")) withdrawn += tx.amount;
  }

  if (invested === 0) invested = investedFallback || 0;
  if (invested === 0) return null;

  const totalValue = balance + withdrawn;
  const profit = totalValue - invested;
  return { invested, withdrawn, totalValue, profit, profitPct: (profit / invested) * 100 };
}
