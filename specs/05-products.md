# SPEC 05 — Product catalog

> **Status:** Draft
> **Depends on:** SPEC 03
> **Date:** 2026-11-24
> **Objective:** Manage the product catalog so sellers sell only active, priced products.

## Scope

**In:**

- `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PATCH /api/products/:id`.
- Name, code, price and active flag; stock read-only here after creation.
- Initial stock recorded as a stock entry.
- `/productos` page with search, create, edit and deactivate.

**Out of scope (future specs):**

- Registering later stock entries and corrections (SPEC 06).
- Deleting products: never allowed.
- Categories, suppliers, barcodes, product images.
- Sales (SPEC 07).

## Why

Product creation needs `stock_entries` so the initial stock keeps the same traceability as every later entry. The table is created here; SPEC 06 adds its endpoints and correction flow.

## Data model

`database/migrations/002_products.sql`:

```sql
CREATE TABLE products (
  id serial PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL,
  price numeric(12,2) NOT NULL CHECK (price > 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX products_code_lower_idx ON products (lower(code));

CREATE TABLE stock_entries (
  id serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  note text,
  created_by integer NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  correction_quantity integer CHECK (correction_quantity > 0),
  correction_reason text,
  corrected_by integer REFERENCES users(id),
  corrected_at timestamptz,
  CHECK (
    (correction_quantity IS NULL) = (correction_reason IS NULL)
    AND (correction_quantity IS NULL) = (corrected_by IS NULL)
    AND (correction_quantity IS NULL) = (corrected_at IS NULL)
  )
);
```

## Implementation plan

1. Add `002_products.sql` and verify `npm run migrate` applies it once. Commit.
2. Add `backend/src/products/products.service.js` with create, update, list and get-by-id, plus validation (`name` and `code` required, `price > 0`, `initialStock >= 0`). Commit.
3. Implement `GET /api/products?search=&includeInactive=`: case-insensitive match on name or code, ordered by name; sellers always receive active products only. Commit.
4. Implement `GET /api/products/:id`; inactive products return 404 for `seller`. Commit.
5. Implement `POST /api/products` for `admin`, `owner` and `warehouse_manager` in one transaction: insert the product, insert the initial `stock_entries` row when `initialStock > 0`, update `products.stock`. Duplicate code returns 409 `PRODUCT_CODE_TAKEN`. Commit.
6. Implement `PATCH /api/products/:id` for the same roles: `name`, `code`, `price`, `isActive`. Stock cannot be changed here (400 `STOCK_NOT_EDITABLE`). Commit.
7. Add integration tests for duplicate codes, role rejection, initial stock entry and price validation. Commit.
8. Build `/productos`: searchable table, create/edit form, active toggle. Commit.

## Acceptance criteria

- [ ] Creating a product with code `A-1` and then `a-1` returns 409 `PRODUCT_CODE_TAKEN`.
- [ ] Creating a product with `initialStock: 10` leaves `stock = 10` and one `stock_entries` row of 10 units by that user.
- [ ] Creating a product with price `0` or negative returns 400.
- [ ] `PATCH` with a `stock` field returns 400 `STOCK_NOT_EDITABLE`.
- [ ] A `seller` receives 403 on `POST` and `PATCH`.
- [ ] Sellers do not see inactive products in list results.
- [ ] Deactivating a product keeps its row with `is_active = false`.
- [ ] Editing the price changes only `products.price`; no `sale_items` row changes.
- [ ] `updated_at` changes on every successful `PATCH`.

## Decisions

- **Yes:** stock only changes through stock entries. Gives every unit a responsible user and date.
- **No:** editing `stock` directly from the product form. Would erase traceability.
- **Yes:** case-insensitive unique code. Matches how staff type codes at the counter.
- **Yes:** deactivate instead of delete. `idea.md` F-03 requires history preservation.
- **No:** categories. Explicitly out of scope in `idea.md` §6.

## Risks

| Risk | Mitigation |
| --- | --- |
| Seller search becomes slow with many products | Index on `lower(name)` and `lower(code)`; paginate list results at 100 rows. |

## What is not in this spec

- Stock entry and correction endpoints (SPEC 06).
- Selling, discounts or taxes.
