# ShopLedger

## Stack
- Node.js CommonJS app; Express 4 (`^4.17.1`) with `body-parser` (`^1.19.0`).
- Static browser UI in `public/`; application data is stored in `data/db.json`.

## Module map
- `routes/customers.js` — list customer/settlement data and record Khata settlements.
- `routes/orders.js` — list/get orders, place orders, and cancel orders.
- `routes/products.js` — list/filter products and list active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalize, validate, calculate, and list coupons.
- `lib/dates.js` — current date, normalized date keys, and fiscal year.
- `lib/inventory.js` — product lookup, sellable stock, stock checks/updates, and summary.
- `lib/invoice.js` — calculate invoice figures and render printable invoice HTML.
- `lib/ledger.js` — customer balances, Khata charges/reversals, and settlements.
- `lib/orders.js` — add, find, cancel, and filter orders.
- `lib/pricing.js` — subtotal, discount delegation, and order totals with line GST.
- `lib/reports.js` — dashboard summary and invoice-to-order GST reconciliation.
- `lib/store.js` — synchronously read/write `data/db.json` and append audit entries.
- `lib/tax.js` — resolve GST rates from item data/HSN config and split CGST/SGST.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
