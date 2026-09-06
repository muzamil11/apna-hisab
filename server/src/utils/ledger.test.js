import { describe, it, expect, vi, beforeEach } from "vitest";

// Ledger math is tested against the *real* applyTransactionEffects /
// getNetWorth / getNetWorthHistory from ledger.js, with the Mongoose models
// swapped for tiny in-memory fakes — so this exercises the actual production
// code path (not a re-implementation of it) without needing a real database.
function makeFakeModel() {
  const store = new Map();
  let nextId = 1;

  function query(filter) {
    const matches = () =>
      [...store.values()].filter((doc) =>
        Object.entries(filter).every(([key, value]) => String(doc[key]) === String(value))
      );
    const promise = Promise.resolve(matches());
    promise.sort = (sortSpec) => {
      const [field, dir] = Object.entries(sortSpec)[0];
      return Promise.resolve(matches().sort((a, b) => (dir === 1 ? a[field] - b[field] : b[field] - a[field])));
    };
    return promise;
  }

  class FakeDoc {
    constructor(data) {
      Object.assign(this, { _id: String(nextId++), ...data });
      store.set(this._id, this);
    }
    async save() {
      return this;
    }
  }

  return {
    store,
    create: (data) => new FakeDoc(data),
    find: (filter = {}) => query(filter),
    findById: (id) => Promise.resolve(store.get(String(id)) || null),
  };
}

const fakeAccounts = makeFakeModel();
const fakeTransactions = makeFakeModel();

vi.mock("../models/Account.js", () => ({ default: fakeAccounts }));
vi.mock("../models/Transaction.js", () => ({ default: fakeTransactions }));

const { applyTransactionEffects, getNetWorth, getNetWorthHistory, polarity } = await import("./ledger.js");

beforeEach(() => {
  fakeAccounts.store.clear();
  fakeTransactions.store.clear();
});

describe("polarity", () => {
  it("asset accounts move with the money: incoming is positive", () => {
    expect(polarity({ kind: "ASSET" }, true)).toBe(1);
    expect(polarity({ kind: "ASSET" }, false)).toBe(-1);
  });

  it("liability accounts move opposite: incoming means you owe more (negative-of-outflow logic)", () => {
    expect(polarity({ kind: "LIABILITY" }, true)).toBe(-1);
    expect(polarity({ kind: "LIABILITY" }, false)).toBe(1);
  });
});

describe("applyTransactionEffects — income", () => {
  it("crediting an asset account raises its balance and net worth", async () => {
    const bank = fakeAccounts.create({ user: "u1", kind: "ASSET", balance: 0, archived: false });
    const tx = fakeTransactions.create({ type: "INCOME", amount: 200000, toAccount: bank._id });

    await applyTransactionEffects(tx);

    expect(bank.balance).toBe(200000);
    expect((await getNetWorth("u1")).netWorth).toBe(200000);
  });
});

describe("applyTransactionEffects — expense", () => {
  it("spending from a cash account reduces both the account and net worth", async () => {
    const cash = fakeAccounts.create({ user: "u1", kind: "ASSET", balance: 5000, archived: false });
    const tx = fakeTransactions.create({ type: "EXPENSE", amount: 800, fromAccount: cash._id });

    await applyTransactionEffects(tx);

    expect(cash.balance).toBe(4200);
    expect((await getNetWorth("u1")).netWorth).toBe(4200);
  });

  it("spending on a credit card increases the liability and reduces net worth by the same amount", async () => {
    const card = fakeAccounts.create({ user: "u1", kind: "LIABILITY", balance: 0, archived: false });
    const tx = fakeTransactions.create({ type: "EXPENSE", amount: 1500, fromAccount: card._id });

    await applyTransactionEffects(tx);

    expect(card.balance).toBe(1500); // owes more
    expect((await getNetWorth("u1")).netWorth).toBe(-1500); // worth down by the same amount
  });
});

describe("applyTransactionEffects — transfer (the core udhar / investment / committee case)", () => {
  it("lending money moves it from cash to a receivable without changing net worth", async () => {
    const cash = fakeAccounts.create({ user: "u1", kind: "ASSET", balance: 10000, archived: false });
    const receivable = fakeAccounts.create({ user: "u1", kind: "ASSET", balance: 0, archived: false });
    const before = (await getNetWorth("u1")).netWorth;

    const tx = fakeTransactions.create({ type: "TRANSFER", amount: 2000, fromAccount: cash._id, toAccount: receivable._id });
    await applyTransactionEffects(tx);

    expect(cash.balance).toBe(8000);
    expect(receivable.balance).toBe(2000);
    expect((await getNetWorth("u1")).netWorth).toBe(before); // unchanged
  });

  it("someone using your card who will repay you: card debt and their receivable move together, net worth unchanged", async () => {
    const card = fakeAccounts.create({ user: "u1", kind: "LIABILITY", balance: 0, archived: false });
    const receivable = fakeAccounts.create({ user: "u1", kind: "ASSET", balance: 0, archived: false });
    const before = (await getNetWorth("u1")).netWorth;

    const tx = fakeTransactions.create({ type: "TRANSFER", amount: 1500, fromAccount: card._id, toAccount: receivable._id });
    await applyTransactionEffects(tx);

    expect(card.balance).toBe(1500); // bank still bills you
    expect(receivable.balance).toBe(1500); // they owe you the same amount
    expect((await getNetWorth("u1")).netWorth).toBe(before); // net effect: zero
  });

  it("taking a loan raises cash and the payable together, net worth unchanged", async () => {
    const cash = fakeAccounts.create({ user: "u1", kind: "ASSET", balance: 0, archived: false });
    const payable = fakeAccounts.create({ user: "u1", kind: "LIABILITY", balance: 0, archived: false });

    const tx = fakeTransactions.create({ type: "TRANSFER", amount: 5000, fromAccount: payable._id, toAccount: cash._id });
    await applyTransactionEffects(tx);

    expect(cash.balance).toBe(5000);
    expect(payable.balance).toBe(5000);
    expect((await getNetWorth("u1")).netWorth).toBe(0);
  });

  it("repaying a debt reduces cash and what's owed together, net worth unchanged", async () => {
    const cash = fakeAccounts.create({ user: "u1", kind: "ASSET", balance: 5000, archived: false });
    const payable = fakeAccounts.create({ user: "u1", kind: "LIABILITY", balance: 5000, archived: false });

    const tx = fakeTransactions.create({ type: "TRANSFER", amount: 500, fromAccount: cash._id, toAccount: payable._id });
    await applyTransactionEffects(tx);

    expect(cash.balance).toBe(4500);
    expect(payable.balance).toBe(4500);
    expect((await getNetWorth("u1")).netWorth).toBe(0);
  });
});

describe("applyTransactionEffects — reverse (deleting a transaction)", () => {
  it("reversing an expense restores the account exactly", async () => {
    const cash = fakeAccounts.create({ user: "u1", kind: "ASSET", balance: 5000, archived: false });
    const tx = fakeTransactions.create({ type: "EXPENSE", amount: 800, fromAccount: cash._id });

    await applyTransactionEffects(tx);
    expect(cash.balance).toBe(4200);

    await applyTransactionEffects(tx, { reverse: true });
    expect(cash.balance).toBe(5000);
  });

  it("reversing a card-on-behalf-of-someone transfer restores both sides", async () => {
    const card = fakeAccounts.create({ user: "u1", kind: "LIABILITY", balance: 0, archived: false });
    const receivable = fakeAccounts.create({ user: "u1", kind: "ASSET", balance: 0, archived: false });
    const tx = fakeTransactions.create({ type: "TRANSFER", amount: 1500, fromAccount: card._id, toAccount: receivable._id });

    await applyTransactionEffects(tx);
    await applyTransactionEffects(tx, { reverse: true });

    expect(card.balance).toBe(0);
    expect(receivable.balance).toBe(0);
  });
});

describe("getNetWorthHistory", () => {
  it("only counts transactions dated on or before each month boundary", async () => {
    const bank = fakeAccounts.create({ user: "u1", kind: "ASSET", balance: 0, archived: false });
    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 10);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 5);

    fakeTransactions.create({ user: "u1", type: "INCOME", amount: 100000, toAccount: bank._id, date: twoMonthsAgo });
    fakeTransactions.create({ user: "u1", type: "INCOME", amount: 50000, toAccount: bank._id, date: thisMonth });

    const history = await getNetWorthHistory("u1", 3);

    expect(history[0].netWorth).toBe(0); // 3 months ago: neither transaction had happened yet
    expect(history.at(-1).netWorth).toBe(150000); // today: both counted
  });
});
