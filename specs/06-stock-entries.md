# SPEC 06 — Stock entries and corrections

> **Status:** Draft
> **Depends on:** SPEC 05
> **Date:** 2026-11-24
> **Objective:** Let warehouse staff register incoming stock and correct a mistaken entry with a written reason.

## Scope

**In:**

- `POST /api/products/:id/stock-entries`, `GET /api/products/:id/stock-entries`, `PATCH /api/stock-entries/:id`.
- Stock increment and correction delta applied atomically.
- One correction per entry, with reason, user and timestamp.
- `/stock` page: product picker, entry form, history and correction dialog.

**Out of scope (future specs):**

- Deleting or reversing entries.
- Corrections of sales or cancellations (SPEC 09).
- Supplier, invoice or purchase-order data.

## Data model

No new tables. Uses `stock_entries` from SPEC 05.

- Effective quantity of an entry: `correction_quantity ?? quantity`.
- A correction sets `correction_quantity`, `correction_reason`, `corrected_by`, `corrected_at`.
- Stock adjustment: `delta = newQuantity - effectiveQuantityBefore`.

## Implementation plan

1. Add `backend/src/stock/stock.service.js` with `registerEntry(productId, quantity, userId)` and validation for integers greater than zero. Commit.
2. Implement `POST /api/products/:id/stock-entries` for `admin`, `owner` and `warehouse_manager` in one transaction: `SELECT ... FOR UPDATE` the product, insert the entry, increment `products.stock`. Commit.
3. Implement `GET /api/products/:id/stock-entries` with the same roles, newest first, including `createdBy` username and correction fields. Commit.
4. Implement `PATCH /api/stock-entries/:id`: require `quantity > 0` and a non-empty trimmed `reason`; reject an entry already corrected with 409 `ENTRY_ALREADY_CORRECTED`; lock the product, apply the delta and reject a result below zero with 409 `STOCK_WOULD_BE_NEGATIVE`. Commit.
5. Add integration tests for increment, invalid quantities, missing reason, delta math and the negative-stock guard. Commit.
6. Build `/stock`: product search, entry form, history table and correction dialog that requires a reason. Commit.

## Acceptance criteria

- [ ] An entry of 20 units increases the product stock by exactly 20.
- [ ] Quantity `0`, negative or non-integer returns 400.
- [ ] A correction without a reason returns 400 `REASON_REQUIRED`.
- [ ] Correcting an entry from 20 to 15 with stock 30 leaves stock 25.
- [ ] Correcting an already corrected entry returns 409.
- [ ] A correction that would push stock below zero returns 409 and changes nothing.
- [ ] Each entry shows its user and timestamp; each correction shows reason, user and timestamp.
- [ ] `seller` receives 403 on all three endpoints.
- [ ] The entry and the `products.stock` update commit or roll back together.

## Decisions

- **Yes:** one correction per entry. Keeps the audit trail readable; a second fix is a new entry.
- **No:** append-only correction history table. Not required by `idea.md` F-04.
- **Yes:** reject corrections that would make stock negative. `products.stock` has `CHECK (stock >= 0)` and sold units must not disappear.
- **Yes:** atomic delta under a row lock. Matches the sale path in SPEC 07 and avoids lost updates.

## Risks

| Risk | Mitigation |
| --- | --- |
| Two managers correct the same entry concurrently | `FOR UPDATE` on the entry plus the `ENTRY_ALREADY_CORRECTED` check inside the transaction. |

## What is not in this spec

- Sale cancellations restoring stock (SPEC 09).
- Stock reports or low-stock alerts (`idea.md` §6).
