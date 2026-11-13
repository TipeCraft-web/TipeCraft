---
name: invoice-generator
description: Generate professional invoices as HTML pages or React apps with PDF export.
---

# Invoice Generator

Build invoices as standalone HTML pages (preferred for simplicity) or React web artifacts. They auto-scale to fit the page and export to PDF via the browser's native print dialog. The web page is the single source of truth — the PDF is a print of it.

> **NixOS note:** Puppeteer / headless Chromium fails on this platform due to missing system libraries (`libglib-2.0.so.0`). Use `window.print()` (browser print dialog → Save as PDF) instead. The approach below is designed for that reality.

## Supporting references

Read these from `.local/secondary_skills/invoice-generator/references/` when the step applies:

- `layout-and-print.md` — read before writing the invoice markup and CSS, for either approach. It has the two-layer page/auto-scale structure with its `scaleToFit` code, the section layout, and the print styles.
- `url-param-template.md` — read when building Approach A (one HTML template driven by URL query parameters). It has the parameter table, parsing boilerplate, shareable-URL bar, and Stripe payment-link pattern.
- `jurisdictions-and-payment-terms.md` — read once you know where the seller is based, before filling in tax lines, the invoice number, or payment terms. It has the EU/US/other required fields, the numbering scheme, and the payment terms glossary.

## Before You Start Building — Gather Information First

**Do NOT start building the invoice until you have enough information to populate real line items and details.** An invoice with placeholder data is useless.

### If the user provides complete invoice details

Go ahead and start building immediately. You have what you need.

### If the user asks to "make me an invoice" without providing details

You MUST ask clarifying questions before writing any code. Ask about:

1. **Seller info** — Business name, address, email, phone, logo (if any), VAT/tax ID (if applicable)
2. **Client info** — Client/company name, address, contact email, VAT number (if B2B in EU)
3. **Line items** — Description of each service/product, quantity, rate/price per unit
4. **Payment terms** — Net 30, due on receipt, etc. + preferred payment method (bank transfer, Stripe, PayPal, etc.)
5. **Invoice number** — Do they have an existing numbering scheme, or should you start one?
6. **Dates** — Invoice date, service/delivery date (if different), due date
7. **Tax** — What tax rate applies? (Sales tax, VAT, ITBIS, none?) This depends on jurisdiction.
8. **Where is the seller based?** — Determines required legal fields, page size (US = Letter, everyone else = A4), and tax handling
9. **Billing contact email** — Always ask explicitly. Do NOT invent a placeholder like `billing@company.com` — the user must confirm the real email address.
10. **Production domain** — Always ask what domain the app is deployed to. Do NOT use the Replit dev domain or a made-up domain on the invoice itself.

### How to ask

Start with the essentials:

> "To create your invoice, I need a few details:
>
> 1. Your business name and address (the seller)
> 2. Who you're billing — client name and address
> 3. What you're billing for — list each item/service with the quantity and price
> 4. Payment terms — when is it due, and how should they pay?
> 5. What email should clients contact for billing questions?
> 6. What domain is your app deployed to (for the website shown on the invoice)?"

Then follow up for tax details, numbering, branding, etc. based on what they share.

### If the invoice feels incomplete

If the user gives vague descriptions like "consulting work," push for specifics: *"Can you break that down into specific deliverables? e.g., 'Website redesign — 3 revision rounds' at $5,000. Specific line items look more professional and reduce client pushback."*

## Flag Guesses and Inferred Details

If you had to guess or infer any details — tax rates, payment terms, invoice numbers, dates — you MUST tell the user what you assumed. After presenting the first draft, explicitly list anything you weren't sure about. For example:

> "A few things I assumed — let me know if any need adjusting:
>
> - I used invoice number INV-2026-0001 — do you have an existing numbering scheme?
> - I set the tax rate to 0% since you didn't mention taxes — should I add sales tax or VAT?
> - I set payment terms to Net 30 with a due date of April 13 — is that right?"

Do NOT silently present fabricated details as fact. Getting invoice details wrong can cause real payment and legal issues.

## Two Approaches: Choose Based on Use Case

### Approach A — Standalone HTML (preferred for SaaS/subscription templates)

**Use when:** The same invoice template will be sent to many different clients (e.g., a subscription SaaS billing its users). Client-specific data (name, email, invoice number, dates, amount) is passed via URL query parameters. One file serves all clients.

- The template lives in the main app's `public/` folder, served as a static asset: `client/public/invoice-template.html` → served at `/invoice-template.html`
- All client-specific fields are read from `URLSearchParams` at runtime
- Seller info, domain, and billing email are hardcoded (they never change)
- Client pastes the parameterized link into any browser → prints to PDF

Build it with `references/url-param-template.md`.

### Approach B — React Component (preferred for one-off custom invoices)

**Use when:** Building a one-off invoice for a specific client with complex line items, custom branding per client, or when integrated into an app's billing flow.

```text
artifacts/<client>-invoice/
  client/src/pages/Invoice.tsx   # Invoice data + component with auto-scale
  client/src/index.css           # Print-ready styles (A4 or Letter)
```

Both approaches use the fixed-height page with an auto-scaling inner wrapper from `references/layout-and-print.md`, so content never runs past the page boundary.

## Page Length Rules

- **Most invoices should fit on one page.** The auto-scale handles this for typical invoices (up to ~15 line items).
- **It's OK to go multi-page** if the invoice has many line items. Don't shrink text to an unreadable size just to force everything onto one page.
- **If going multi-page**: repeat the table header (Description | Qty | Rate | Amount) on each page, and put the totals section on the final page.
- **Always put payment instructions and totals on the last page** so the client sees how much they owe and how to pay without hunting.

## Brand Domain and Contact Email

- **Never invent placeholder domains** like `yourcompany.com` or `nido.app` — always ask the user what their real production domain is.
- **Never invent billing emails** — always ask explicitly. The billing email and the app domain are often different (e.g., website: `nido.com.do`, billing email: `billing@nido.com`).
- **Hardcode seller info directly** in the script — do not make it a URL param. The seller never changes between invoices.
- **Do not use `window.location.hostname`** as the brand domain — the dev/Replit URL is not the brand domain.

```javascript
// ── Hardcode seller info — never use window.location or placeholders ──
const appDomain = 'nido.com.do'; // confirmed with user
const billingEmail = 'billing@nido.com'; // confirmed with user
```

## Tax and Jurisdiction

Always ask which country the seller operates in before assuming a tax regime. EU invoices have legally mandatory fields (including the seller's VAT number and reverse-charge notation for cross-border B2B); the US has no federal invoice law. If tax is exempt, show a labeled exempt tax line at `$0.00` rather than omitting it. Use `references/jurisdictions-and-payment-terms.md` for the full field lists, numbering scheme, and payment terms.

## Best Practices

1. **Show the due date as an actual date** — "Due: April 13, 2026" not just "Net 30" (clients miscount)
2. **Specific line items** — "NiDO Plan Pro — Monthly Subscription" not "Subscription"
3. **Payment instructions on the invoice itself** — Stripe link, bank details, or payment link
4. **Always ask for billing email and production domain** — never invent placeholders
5. **Right-align all numbers** — amounts, quantities, rates, totals
6. **Bold the total due** — it should be the most visually prominent number on the page
7. **Highlight missing required fields in amber** — if `client` param is missing, color the field `#D97706` as a visual warning to the sender
8. **Auto-fill dates dynamically** — invoice date defaults to today, due date to today + 30 days, service period to next calendar month. Only override if the user passes explicit date params.
9. **Dates: use noon (`T12:00:00`) when parsing ISO dates** — avoids timezone off-by-one errors where `2026-04-01` renders as March 31

## Limitations

- Cannot send invoices, process payments, or track payment status
- Tax calculation is flat-rate per invoice — doesn't handle mixed VAT rates per line or US multi-state nexus
- Not a substitute for accounting software; no ledger integration
- Puppeteer / headless Chrome does not work on NixOS — use `window.print()` (browser print → Save as PDF) instead
