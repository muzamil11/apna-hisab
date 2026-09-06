import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";

// Liability accounts move opposite to asset accounts: receiving into a liability
// account means "you owe more", paying into it means "you owe less". This one
// polarity rule is what makes income / expense / transfer / credit-card / udhar
// all fall out of the same math instead of needing special cases per feature.
function polarity(account, isIncoming) {
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
