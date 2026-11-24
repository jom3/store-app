# SPEC 07 — Sales registration

> **Status:** Draft
> **Depends on:** SPEC 05
> **Date:** 2026-11-24
> **Objective:** Register cash sales atomically, deduct stock and assign a correlative sale number.

## Scope

**In:**

- `POST /api/sales`, `GET /api/sales/:id`.
- Multi-line sales with unit quantities and prices read from the database.
- Gap-free correlative `sale_number` from a locked counter row.
- Atomic stock decrement with row locks.
- Snapshot of product name, code, quantity and unit price per line.
- `/ventas` page: product search, cart, totals, confirm.

**Out of scope (future specs):**

- Receipt rendering and printing (SPEC 08).
- Cancellation (SPEC 09).
- Non-cash payments, change calculation, decimals, discounts, taxes.
- Offline mode or held carts.

## Data model

`database/migrations/003_sales.sql`:

```sql
CREATE TABLE counters (
  name text PRIMARY KEY,
  value integer NOT NULL
);
INSERT INTO counters (name, value) VALUES ('sale_number', 0);

CREATE TABLE sales (
  id serial PRIMARY KEY,
  sale_number integer NOT NULL UNIQUE,
  seller_id integer NOT NULL REFERENCES users(id),
  total numeric(12,2) NOT NULL CHECK (total > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sale_items (
  id serial PRIMARY KEY,
  sale_id integer NOT NULL REFERENCES sales(id),
  product_id integer NOT NULL REFERENCES products(id),
  product_name text NOT NULL,
  product_code text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price > 0),
  subtotal numeric(12,2) NOT NULL CHECK (subtotal > 0)
);

CREATE INDEX sale_items_sale_id_idx ON sale_items (sale_id);
CREATE INDEX sales_created_at_idx ON sales (created_at);
```

Request body for `POST /api/sales`:

```json
{ "items": [{ "productId": 3, "quantity": 2 }] }
```

## Implementation plan

1. Add `003_sales.sql` and verify the migration applies cleanly. Commit.
2. Add `backend/src/domain/money.js` with `toCents`, `fromCents` and `formatMoney`; all totals are computed in integer cents. Commit.
3. Add `backend/src/sales/sales.service.js`: `createSale({ items, sellerId })` opens a transaction, locks products with `SELECT ... FOR UPDATE ORDER BY id`, validates, computes totals, obtains `sale_number`, inserts the sale and items, decrements stock and commits. Commit.
4. Implement `POST /api/sales` for `seller` and `admin` with error mapping: `EMPTY_SALE` and `INVALID_QUANTITY` (400), `DUPLICATE_PRODUCT`, `PRODUCT_INACTIVE`, `INSUFFICIENT_STOCK` (409). Commit.
5. Implement `GET /api/sales/:id` returning the sale with items; accessible to the seller of that sale, `owner` and `admin`. Commit.
6. Add integration tests: happy path, empty sale, over-stock, inactive product, duplicate product and the last-unit race with two parallel requests. Commit.
7. Build `/ventas`: product search by name or code, add-to-cart with quantity, editable quantities, total, confirm; show the API message on conflicts and refresh stock. Commit.

## Acceptance criteria

- [ ] Confirming a sale with 2 units of product A and 3 of product B decrements each stock by exactly those amounts.
- [ ] An empty `items` array returns 400 `EMPTY_SALE` and changes nothing.
- [ ] A quantity of `0`, negative or above stock returns 400/409 and leaves sale and stock untouched.
- [ ] An inactive product returns 409 `PRODUCT_INACTIVE`.
- [ ] With one unit in stock, two simultaneous sales produce exactly one 201 and one 409 `INSUFFICIENT_STOCK`.
- [ ] The client cannot set prices: `unit_price` always equals `products.price` at sale time.
- [ ] Two sales in a row get sale numbers N+1 and N+2 with no gaps.
- [ ] Changing a product price afterwards leaves the existing `sale_items` rows unchanged.
- [ ] Two lines for the same product return 409 `DUPLICATE_PRODUCT`.
- [ ] `owner` and `warehouse_manager` receive 403 on `POST /api/sales`.

## Decisions

- **Yes:** locked counter row, not a PostgreSQL sequence. Sequences leak numbers on rollback; `idea.md` asks for a correlative.
- **Yes:** `SELECT ... FOR UPDATE ORDER BY id`. Fixes the last-unit race and avoids deadlocks between concurrent sales.
- **Yes:** server-side price lookup. The client never sends prices or totals.
- **Yes:** snapshot `product_name` and `product_code`. Receipts of past sales must not change after a product rename.
- **No:** merging duplicate lines. Rejecting surfaces frontend bugs that would silently misreport stock.
- **No:** float arithmetic. Integer cents avoid rounding drift in totals.

## Risks

| Risk | Mitigation |
| --- | --- |
| Counter row becomes a serialization point | It is held only for the insert step; a single supermarket till does not need more throughput. |
| Large carts produce long transactions | Cap `items` at 100 lines per sale. |

## What is not in this spec

- Receipt and printing (SPEC 08).
- Cancelling a sale (SPEC 09).
- Reports (SPEC 10).
