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
  if (d.getDate() < billingCycleDay) candidate.setMonth(candidate.getMonth() - 1);
  return candidate;
}

// Splits what's owed on a card into "this cycle" (not due yet) and "already
// billed" (owed now), with the due date for that already-billed portion.
export async function getCardSummary(Transaction, card) {
  const { billingCycleDay, dueDay, creditLimit } = card.meta || {};
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
    creditLimit: creditLimit || null,
    utilizationPct: creditLimit ? Math.round((card.balance / creditLimit) * 100) : null,
  };
}

// A read-only "what did each past cycle cost" report, grouped by the
// statement they belong to. This never touches what's actually owed —
// getCardSummary's live balance stays the one source of truth for that —
// so a history view can't drift from the real numbers even if payments
// don't map cleanly onto a single statement.
export function groupIntoStatements(charges, billingCycleDay, dueDay) {
  const groups = new Map();
  for (const tx of charges) {
    const due = statementDueDate(tx.date, billingCycleDay, dueDay);
    const key = `${due.getFullYear()}-${due.getMonth()}`;
    if (!groups.has(key)) {
      const periodEnd = new Date(due.getFullYear(), due.getMonth() - 1, billingCycleDay);
      const periodStart = new Date(due.getFullYear(), due.getMonth() - 2, billingCycleDay + 1);
      groups.set(key, { periodStart, periodEnd, dueDate: due, total: 0 });
    }
    groups.get(key).total += tx.amount;
  }
  return [...groups.values()].sort((a, b) => b.dueDate - a.dueDate);
}

export async function getStatementHistory(Transaction, card, months = 6) {
  const { billingCycleDay, dueDay } = card.meta || {};
  if (!billingCycleDay || !dueDay) return [];

  const since = new Date();
  since.setMonth(since.getMonth() - months - 1);
  const charges = await Transaction.find({ fromAccount: card._id, date: { $gte: since } });

  const cutoff = lastBillingDate(billingCycleDay);
  const closedCharges = charges.filter((t) => t.date <= cutoff);
  return groupIntoStatements(closedCharges, billingCycleDay, dueDay).slice(0, months);
}
