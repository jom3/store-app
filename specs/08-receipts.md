# SPEC 08 — Receipt printing

> **Status:** Draft
> **Depends on:** SPEC 07
> **Date:** 2026-11-24
> **Objective:** Show, print and reprint a sale receipt, marking every reprint as a copy.

## Scope

**In:**

- `GET /api/sales/:id/receipt` returning the printable payload.
- `POST /api/sales/:id/print-events` recording that a print was requested.
- `/ventas/:id/comprobante` printable view with `window.print()`.
- "COPIA" marker on any print after the first.

**Out of scope (future specs):**

- Thermal printer or ESC/POS integration.
- PDF storage and email delivery.
- Invoices and fiscal data (`idea.md` §6).

## Data model

`database/migrations/004_sale_prints.sql`:

```sql
CREATE TABLE sale_prints (
  id serial PRIMARY KEY,
  sale_id integer NOT NULL REFERENCES sales(id),
  printed_by integer NOT NULL REFERENCES users(id),
  printed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sale_prints_sale_id_idx ON sale_prints (sale_id);
```

Receipt payload:

```js
{
  businessName: 'Supermercado Ejemplo',
  saleNumber: '000042',
  createdAt: '2026-11-24T13:05:00.000Z',
  seller: 'vendedor1',
  status: 'active',
  items: [{ name, code, quantity, unitPrice, subtotal }],
  total: 125000,
  isCopy: false
}
```

## Implementation plan

1. Add `004_sale_prints.sql`. Commit.
2. Implement `GET /api/sales/:id/receipt`: allow the seller of that sale, `owner` and `admin`; build the payload from `sales`, `sale_items` and `settings`; set `isCopy` when at least one `sale_prints` row exists. Commit.
3. Implement `POST /api/sales/:id/print-events`: same access rule, insert the row and return `{ printCount }`. Commit.
4. Add integration tests for payload fields, `isCopy` flipping after the first print, foreign seller 403 and cancelled sale status. Commit.
5. Build `/ventas/:id/comprobante`: receipt layout, "Imprimir" button calling `window.print()`, then posting the print event; "Reimprimir (copia)" button when `isCopy` is true. Commit.
6. Add print styles in `receipt.component.scss`: `@page { size: 80mm auto; margin: 4mm }` and hide the shell navigation and buttons. Commit.

## Acceptance criteria

- [ ] The receipt shows business name, zero-padded sale number, date and time, seller, each line with quantity, unit price and subtotal, and the total.
- [ ] The receipt contains no change amount, no invoice wording and no customer data.
- [ ] The first print posts one `sale_prints` row; opening the receipt again shows "COPIA".
- [ ] A second print adds another row and still shows "COPIA".
- [ ] A different `seller` receives 403; `owner` and `admin` can open any receipt.
- [ ] `window.print()` failing or the user cancelling the dialog leaves the sale and stock untouched.
- [ ] A cancelled sale's receipt shows an "ANULADA" marker.
- [ ] Printing hides the navigation and action buttons.

## Decisions

- **Yes:** browser print. It needs no hardware integration and covers `idea.md` F-06.
- **No:** backend PDF generation. Adds a dependency without a requirement behind it.
- **Yes:** record prints so "COPIA" is derivable. `idea.md` marks reprints, and a stored count survives reloads.
- **No:** storing a printed flag on `sales`. Keeps print auditing separate from the sale record.
- **Yes:** `product_name` snapshot from SPEC 07 on the receipt. Past receipts must not follow later renames.

## Risks

| Risk | Mitigation |
| --- | --- |
| `window.print()` blocks and the print event is posted after a slow dialog | Post the event in the `finally` block; it only affects the copy label. |
| Users print the same receipt twice by accident | Each print is a new `sale_prints` row; visible copy marker. |

## What is not in this spec

- Thermal printers and paper formats other than 80 mm.
- Sending receipts by email or WhatsApp.
- Cancelling a sale (SPEC 09).
