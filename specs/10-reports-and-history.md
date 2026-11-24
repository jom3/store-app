# SPEC 10 — Reports and seller history

> **Status:** Draft
> **Depends on:** SPEC 07, SPEC 09
> **Date:** 2026-11-24
> **Objective:** Report sales by seller, day, week and month, and let each seller see only their own history.

## Scope

**In:**

- `GET /api/reports/sales` with date range, `groupBy` and optional `sellerId`.
- `GET /api/sales/mine` for the seller's own history.
- Timezone-aware grouping; ISO weeks starting Monday.
- Cancelled sales excluded from totals but listed with status.
- `/reportes` page for owner and admin; `/historial` page for sellers.

**Out of scope (future specs):**

- Best-sellers, low-stock, profit or margin reports (`idea.md` §6).
- CSV/Excel export, scheduled reports.
- Charts beyond simple totals per group.

## Data model

No new tables. Reads `sales`, `sale_items`, `users` and `settings`.

Response for `GET /api/reports/sales?from=2026-11-01&to=2026-11-24&groupBy=day`:

```js
{
  from: '2026-11-01',
  to: '2026-11-24',
  groupBy: 'day',
  saleCount: 42,
  total: 1250000.00,
  groups: [{ key: '2026-11-24', label: '24/11/2026', saleCount: 7, total: 210000.00 }],
  sales: [{
    id: 42, saleNumber: '000042', createdAt: '...', seller: 'vendedor1',
    status: 'active', total: 210000.00,
    items: [{ name: 'Arroz', quantity: 2, unitPrice: 5000.00, subtotal: 10000.00 }]
  }]
}
```

## Implementation plan

1. Add `backend/src/reports/reports.service.js` with a date-range validator and SQL that filters `created_at` between the local start of `from` and the local end of `to`. Commit.
2. Implement totals and groups in SQL with `date_trunc('day' | 'week' | 'month', created_at AT TIME ZONE $tz)`, `week` by ISO, excluding `status = 'cancelled'` from totals and groups. Commit.
3. Add the optional `sellerId` filter and `groupBy=seller` using the seller username. Commit.
4. Implement `GET /api/reports/sales` for `admin` and `owner`, returning the shape above with each sale's items; cap `sales` at 500 rows and return `truncated: true` when capped. Commit.
5. Implement `GET /api/sales/mine` for `seller`: own sales only, both statuses, totals excluding cancelled, newest first. Commit.
6. Add integration tests: totals match, cancelled excluded, empty range returns zeros, warehouse 403, seller isolation, week starts Monday, disabled seller's sales still reported. Commit.
7. Build `/reportes`: date range, `groupBy` selector, seller filter, summary cards, grouped table with expandable sale detail, and a `truncated` notice. Commit.
8. Build `/historial`: seller's own sales with status badge, receipt link and cancel action. Commit.

## Acceptance criteria

- [ ] The report total equals the sum of the totals of active sales in the range.
- [ ] A cancelled sale is absent from `total`, `saleCount` and every group, but the sale still appears in `sales` with `status: 'cancelled'`.
- [ ] A range with no sales returns 200 with `total: 0`, `saleCount: 0` and empty `groups`.
- [ ] `groupBy=week` groups Monday to Sunday.
- [ ] Dates are interpreted in `settings.timezone`, not UTC.
- [ ] `warehouse_manager` and `seller` receive 403 on `/api/reports/sales`.
- [ ] A seller calling `/api/sales/mine` sees only their own sales.
- [ ] Sales of a disabled seller still appear in owner and admin reports.
- [ ] Filtering by `sellerId` narrows totals to that seller.
- [ ] More than 500 matching sales returns `truncated: true`.

## Decisions

- **Yes:** group in SQL with `AT TIME ZONE`. Avoids off-by-one-day errors at midnight.
- **Yes:** include cancelled sales in `sales` but not in totals. `idea.md` F-07 and F-08 require exactly that.
- **Yes:** seller history via a dedicated `/api/sales/mine`. Prevent guessing other sellers' ids.
- **No:** frontend-side aggregation. Large histories would be transferred and recomputed.
- **No:** CSV export. Not requested in `idea.md` and adds file-handling surface.

## Risks

| Risk | Mitigation |
| --- | --- |
| Wide date ranges returning thousands of rows | 500-row cap with `truncated: true`, plus indexes on `sales.created_at` and `sale_items.sale_id`. |
| Timezone setting changed mid-year distorts old reports | Store timestamps as `timestamptz` and document that grouping follows the current setting. |

## What is not in this spec

- Best-seller and low-stock reports (`idea.md` §6).
- Revenue targets, taxes or profit.
- Export to file formats.
