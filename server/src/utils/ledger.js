import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";

// Liability accounts move opposite to asset accounts: receiving into a liability
// account means "you owe more", paying into it means "you owe less". This one
// polarity rule is what makes income / expense / transfer / credit-card / udhar
// all fall out of the same math instead of needing special cases per feature.
export function polarity(account, isIncoming) {
  const sign = isIncoming ? 1 : -1;
  return account.kind === "LIABILITY" ? -sign : sign;
}

export async function applyTransactionEffects(tx, { reverse = false } = {}) {
  const factor = reverse ? -1 : 1;
  const [fromAccount, toAccount] = await Promise.all([
    tx.fromAccount ? Account.findById(tx.fromAccount) : null,
    tx.toAccount ? Account.findById(tx.toAccount) : null,
  ]);

  if (fromAccount) {
    fromAccount.balance += factor * polarity(fromAccount, false) * tx.amount;
    await fromAccount.save();
  }
  if (toAccount) {
    toAccount.balance += factor * polarity(toAccount, true) * tx.amount;
    await toAccount.save();
  }
}

// Source of truth for balances is always this replay, not the cached Account.balance
// field — so a new feature that changes how transactions are created can never
// leave old balances silently wrong. Call this if balances ever look off.
export async function recomputeAccountBalance(accountId) {
  const account = await Account.findById(accountId);
  if (!account) return;

  const [asSource, asDestination] = await Promise.all([
    Transaction.find({ fromAccount: accountId }),
    Transaction.find({ toAccount: accountId }),
  ]);

  let balance = 0;
  for (const tx of asSource) balance += polarity(account, false) * tx.amount;
  for (const tx of asDestination) balance += polarity(account, true) * tx.amount;

  account.balance = balance;
  await account.save();
  return account;
}

export async function getNetWorth(userId) {
  const accounts = await Account.find({ user: userId, archived: false });
  let netWorth = 0;
  for (const account of accounts) {
    netWorth += account.kind === "LIABILITY" ? -account.balance : account.balance;
  }
  return { netWorth, accounts };
}

// Net worth at past month-ends, computed by replaying transactions in one
// pass rather than storing snapshots — so it's always consistent with the
// ledger even if old transactions get edited or deleted later.
export async function getNetWorthHistory(userId, months = 6) {
  const [accounts, transactions] = await Promise.all([
    Account.find({ user: userId, archived: false }),
    Transaction.find({ user: userId }).sort({ date: 1 }),
  ]);

  const kindById = new Map(accounts.map((a) => [String(a._id), a.kind]));
  const balances = new Map(accounts.map((a) => [String(a._id), 0]));

  function netWorthNow() {
    let total = 0;
    for (const [id, balance] of balances) {
      total += kindById.get(id) === "LIABILITY" ? -balance : balance;
    }
    return total;
  }

  const now = new Date();
  const boundaries = [];
  for (let i = months; i >= 1; i--) {
    boundaries.push(new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999));
  }
  boundaries.push(now);

  let txIndex = 0;
  const points = [];
  for (const boundary of boundaries) {
    while (txIndex < transactions.length && transactions[txIndex].date <= boundary) {
      const tx = transactions[txIndex];
      const fromId = tx.fromAccount && String(tx.fromAccount);
      const toId = tx.toAccount && String(tx.toAccount);
      if (fromId && balances.has(fromId)) {
        balances.set(fromId, balances.get(fromId) + polarity({ kind: kindById.get(fromId) }, false) * tx.amount);
      }
      if (toId && balances.has(toId)) {
        balances.set(toId, balances.get(toId) + polarity({ kind: kindById.get(toId) }, true) * tx.amount);
      }
      txIndex++;
    }
    points.push({ date: boundary, netWorth: netWorthNow() });
  }

  return points;
}
