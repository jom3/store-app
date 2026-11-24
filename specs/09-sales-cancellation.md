# SPEC 09 — Sale cancellation

> **Status:** Draft
> **Depends on:** SPEC 07
> **Date:** 2026-11-24
> **Objective:** Cancel a sale with a written reason, restore stock and preserve the record.

## Scope

**In:**

- `POST /api/sales/:id/cancel` with a mandatory reason.
- Seller rule: own sales, same calendar day. Owner and admin: any sale, any day.
- Atomic stock restoration for every line.
- Cancelled sales stay visible to owner and admin.
- Cancel action and reason dialog in the frontend.

**Out of scope (future specs):**

- Editing or replacing a sale. `idea.md` allows cancellation only.
- Partial cancellation of individual lines.
- Reversing a cancellation.

## Data model

`database/migrations/005_sale_cancellation.sql`:

```sql
ALTER TABLE sales
  ADD COLUMN cancelled_at timestamptz,
  ADD COLUMN cancelled_by integer REFERENCES users(id),
  ADD COLUMN cancellation_reason text;

ALTER TABLE sales
  ADD CONSTRAINT sales_cancellation_consistent CHECK (
    (status = 'cancelled') = (
      cancelled_at IS NOT NULL
      AND cancelled_by IS NOT NULL
      AND cancellation_reason IS NOT NULL
    )
  );
```

## Implementation plan

1. Add `005_sale_cancellation.sql` and verify existing sales still satisfy the constraint. Commit.
2. Add `cancelSale({ saleId, userId, role, reason })` in the sales service: transaction, lock the sale with `FOR UPDATE`, validate status and permission, lock the involved products `ORDER BY id`, increment stock and write the cancellation fields. Commit.
3. Implement `POST /api/sales/:id/cancel`: `reason` trimmed and non-empty (400 `REASON_REQUIRED`), already cancelled returns 409 `ALREADY_CANCELLED`, seller on another seller's or another day's sale returns 403 `FORBIDDEN`. Commit.
4. Compare days with `(created_at AT TIME ZONE settings.timezone)::date = (now() AT TIME ZONE settings.timezone)::date`. Commit.
5. Add integration tests: stock restored, double cancellation, missing reason, seller same-day allowed, seller other-day rejected, owner any-day allowed. Commit.
6. Add the cancel button and reason dialog to the sale detail screen; hide it for cancelled sales and for sellers outside the rule. Show the "CANCELADA" badge and the stored reason. Commit.

## Acceptance criteria

- [ ] Cancelling a sale returns the stock of every line to its previous value.
- [ ] The sale keeps its row, number and items, with `status = 'cancelled'`, reason, user and timestamp.
- [ ] Cancelling without a reason returns 400 `REASON_REQUIRED` and changes nothing.
- [ ] Cancelling twice returns 409 `ALREADY_CANCELLED` and restores stock only once.
- [ ] A seller can cancel their own sale from today; the API accepts it.
- [ ] A seller cancelling another seller's sale returns 403.
- [ ] A seller cancelling their own sale from yesterday returns 403.
- [ ] `owner` and `admin` can cancel any sale at any time.
- [ ] Cancelling and stock restoration commit or roll back together.
- [ ] `warehouse_manager` receives 403 on the cancel endpoint.

## Decisions

- **Yes:** store the reason, user and timestamp on the sale. `idea.md` F-07 requires the audit trail.
- **Yes:** restore stock inside the same transaction with row locks. Prevents overselling during concurrent cancellations.
- **Yes:** calendar day in `settings.timezone`. "Mismo día" is a local business day, not UTC.
- **No:** soft-delete flag instead of `status`. `status` already models the sale lifecycle from SPEC 07.
- **No:** partial line cancellation. Not required and complicates stock math.

## Risks

| Risk | Mitigation |
| --- | --- |
| Concurrent cancel and sale of the same product | Both lock product rows `ORDER BY id`, so stock updates serialize and never go negative. |

## What is not in this spec

- Report totals excluding cancelled sales (SPEC 10).
- Reopening a cancelled sale.
- Refunds or payment reversals.
