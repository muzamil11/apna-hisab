# Apna Hisab

Personal finance web app — accounts, income/expense/transfers, udhar ledger, budgets, investments, committee, reports. See the product plan artifact for the full design.

## Setup

```bash
npm install --workspaces
cp server/.env.example server/.env   # fill in MONGO_URI and JWT_SECRET
```

## Run

```bash
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:5173
```

## Create a login (no signup flow — admin creates users)

```bash
npm run seed:user --workspace server -- <username> <password> <displayName>
```

## Core model

Every transaction is one of three types:

- **Income** — money enters from outside (salary, rent received). Net worth goes up.
- **Expense** — money leaves the system (food, shopping, bills). Net worth goes down. Source can be a cash/bank account (asset) or a credit card (liability) — either way net worth drops by the same amount.
- **Transfer** — money moves between two of your own accounts (cash → investment, cash → committee, cash → someone's udhar, udhar repayment → cash, loan taken → cash). Net worth stays the same; only category and per-account tracking change.

This is what makes "gave someone money" vs "spent money" vs "invested money" behave correctly without the user ever touching accounting concepts — they just pick Income / Expense / Transfer and where it went.
