// A purchase on or before the billing day belongs to that month's statement,
// due the following month; after the billing day it rolls into next month's
// statement, due the month after that — matching how real card cycles work.
export function statementDueDate(purchaseDate, billingCycleDay, dueDay) {
  const d = new Date(purchaseDate);
  const statementMonthOffset = d.getDate() <= billingCycleDay ? 1 : 2;
  const due = new Date(d.getFullYear(), d.getMonth() + statementMonthOffset, dueDay);
  return due;
}

export function lastBillingDate(billingCycleDay, referenceDate = new Date()) {
  const d = new Date(referenceDate);
  const candidate = new Date(d.getFullYear(), d.getMonth(), billingCycleDay);
  if (d.getDate() <= billingCycleDay) candidate.setMonth(candidate.getMonth() - 1);
  return candidate;
}

// Splits what's owed on a card into "this cycle" (not due yet) and "already
// billed" (owed now), with the due date for that already-billed portion.
export async function getCardSummary(Transaction, card) {
  const { billingCycleDay, dueDay } = card.meta || {};
  if (!billingCycleDay || !dueDay) return null;

  const cutoff = lastBillingDate(billingCycleDay);
  const charges = await Transaction.find({ fromAccount: card._id, date: { $gt: cutoff } });
  const unbilled = charges.reduce((sum, t) => sum + t.amount, 0);
  const billed = Math.max(0, card.balance - unbilled);
  const dueDate = statementDueDate(cutoff, billingCycleDay, dueDay);

  return {
    unbilled,
    billed,
    dueDate,
    overdue: billed > 0 && new Date() > dueDate,
  };
}
