---
name: legal-contract
description: Draft, review, or explain legal documents — NDAs, contracts, privacy policies, and more.
---

# Legal Contract Assistant

Full-stack legal platform with three core capabilities: (1) draft and review any type of legal document — NDAs, service agreements, LOIs, purchase agreements, privacy policies, terms of service, and more; (2) manage documents on a dashboard with owner-scoped access; (3) run interactive due diligence rooms for M&A transactions with file uploads, status tracking, comments, participant access control, and activity logging.

## IMPORTANT DISCLAIMER: This provides general information and templates only. It does NOT constitute legal advice. Always consult a qualified attorney for legal matters

## Platform Capabilities

This skill powers a full legal platform with three major capability areas. When the user arrives, guide them to the right capability based on their need:

### 1. Document Drafting & Review

Generate any type of legal document from templates and review existing contracts for red flags.

#### What users can do

- Draft NDAs, service agreements, freelancer contracts, LOIs, term sheets, asset/stock purchase agreements, operating agreements, board resolutions, leases, privacy policies, terms of service — or any other legal document type
- Review contracts they've received and get a plain-language analysis with flagged risks
- Generate multi-document packages for transactions (e.g., LOI + NDA for an acquisition)
- Export documents as PDF and DOCX for signing and redlining

#### How it works

1. User describes the document they need or pastes a contract for review
2. For drafting: start from open-source templates (Bonterms/Common Paper for NDAs/service agreements) or standard clause structures (for M&A documents). See [Open-Source Template Libraries](#open-source-template-libraries-use-these-first) below and [M&A / transaction documents](references/transaction-documents.md).
3. For reviews: run the red-flag checklist and playbook checks, then output using the Review Output Format in [Contract review](references/contract-review.md)
4. Store the document in the platform via the [Documents System](references/documents-system.md) (any `documentType` string — the system is type-agnostic)
5. Deliver PDF + DOCX exports using the generation pipeline in [PDF & DOCX export](references/pdf-docx-export.md)

### 2. Document Management (Dashboard)

Store, organize, and manage all legal documents with owner-scoped access.

#### What users can do (2)

- View all their documents on the dashboard with type badges and status indicators
- Open any document to view its full content
- Delete documents they no longer need (with confirmation)
- Link documents to DD rooms for transaction context

#### How it works (2)

- Documents are stored in the `documents` table with a flexible `documentType` field — supports any type, not just LOIs
- All access is owner-scoped: users only see their own documents
- See [Documents System](references/documents-system.md) for schema and API details

### 3. Due Diligence Rooms

Interactive workspaces for managing M&A due diligence checklists with file uploads, comments, and team collaboration.

#### What users can do (3)

- Create DD rooms pre-populated with 8 standard M&A categories and 57 checklist items
- Add custom categories and items beyond the standard template
- Upload files against checklist items (directly to object storage via presigned URLs)
- Download uploaded files with room-level authorization
- Track item status through the workflow: `not_started` → `uploaded` → `under_review` → `approved`/`flagged`
- Comment on items for team discussion
- Invite participants by email with role-based access (viewer, contributor, admin)
- Monitor progress via per-category and overall completion statistics
- Review a full activity feed of all room actions

#### How it works (3)

- Room creation auto-populates from the `DD_TEMPLATE` in `dd-rooms.ts`
- All routes are protected by room-level access control middleware
- Files go through a presigned URL upload flow (request URL → upload to storage → register in DB)
- See [Due Diligence Room Platform](references/due-diligence-rooms.md) for full architecture and API details

## When to Use

- User needs any type of legal document drafted — NDA, service agreement, freelancer contract, consulting agreement, partnership agreement, operating agreement, LLC agreement, board resolution, employment agreement, offer letter, non-compete, non-solicitation agreement, equity/stock option agreement, SLA, DPA, or any other contract
- User needs a Letter of Intent (LOI), term sheet, earnout agreement, or asset/stock purchase agreement
- User wants a plain-language review of a contract they received ("review this contract", "what does this clause mean", "help me understand this agreement", "is this contract fair")
- User needs to understand specific legal terms or clauses
- User wants a lease or rental agreement reviewed for red flags
- User needs multiple related transaction documents (e.g., LOI + NDA for an acquisition)
- User needs a Privacy Policy or Terms of Service for a web app or SaaS product
- User asks to "draft a contract", "write me a contract", or "create an agreement"
- User wants to manage and organize their legal documents on a dashboard
- User needs to set up or work within a due diligence room, data room, or deal room for an M&A transaction
- User wants an M&A checklist, acquisition checklist, or due diligence checklist
- User wants to upload, track, or review due diligence documents with a team

## When NOT to Use

- Complex litigation or regulatory compliance
- Employment law disputes
- International trade agreements
- Anything involving criminal law
- Situations requiring jurisdiction-specific legal analysis

## Reference Files

Read only the file the current task needs:

- [M&A / transaction documents](references/transaction-documents.md) — read before drafting an LOI, term sheet, purchase agreement, transaction-specific NDA, or any multi-document transaction package. Covers standard LOI sections, the variables to collect, transaction NDA elements, and cross-document consistency rules.
- [Privacy Policy & Terms of Service](references/privacy-and-terms.md) — read before drafting a Privacy Policy or Terms of Service for a web app or SaaS product. Covers the questions to ask first, processor disclosures, required sections, delivery as public routed pages, and the on-page disclaimer banner.
- [Contract review](references/contract-review.md) — read before reviewing or explaining any contract the user received. Covers red-flag phrases to grep for, indemnity forms, playbook checks per document type, and the required Review Output Format.
- [PDF & DOCX export](references/pdf-docx-export.md) — read before producing the deliverable files for any drafted contract. Covers the Puppeteer PDF and python-docx DOCX pipeline, legal document styling, page-aware layout that prevents blank PDF pages, and routing for multi-document packages.
- [Documents System](references/documents-system.md) — read before building or changing document storage, the dashboard, or document API endpoints. Covers the `documents` schema, design principles, endpoints, and frontend.
- [Due Diligence Room Platform](references/due-diligence-rooms.md) — read before building or changing DD rooms. Covers architecture, tables, the standard checklist template, item status workflow, access-control middleware, activity events, the file upload flow, and API endpoints.

## Open-Source Template Libraries (Use These First)

**Never draft from scratch.** Start from committee-vetted open-source agreements released under CC BY 4.0:

| Source | Documents | Style | Get it |
|--------|-----------|-------|--------|
| **Bonterms** | Mutual NDA, Cloud Terms (SaaS), SLA, DPA, PSA, AI Standard Clauses | US; "cover page + standard terms" | `github.com/Bonterms` |
| **Common Paper** | Mutual NDA, Cloud Service Agreement, DPA, Design Partner Agreement | US; standards committee of 40+ attorneys | `commonpaper.com/standards` |
| **oneNDA** | NDA (777 words), oneDPA | UK/EU; strict variable-only edits | `onenda.org` |

**Workflow:** `webFetch("https://bonterms.com/forms/mutual-nda/")` → extract the standard terms → build a cover page with the user's deal-specific variables (parties, effective date, term, governing law, jurisdiction). Don't modify the body; that's the whole point of standards.

**Note:** These libraries cover NDAs and SaaS/service agreements well, but do not include M&A documents (LOIs, term sheets, purchase agreements). For those document types, draft using the standard clause structures in [M&A / transaction documents](references/transaction-documents.md).

## Output Rules

- **Every drafted contract MUST be delivered as both a PDF and a DOCX file.** Clients need PDF for signing and DOCX for redlining — always provide both. Build the contract as a React web artifact first (source of truth for layout), then export it following [PDF & DOCX export](references/pdf-docx-export.md).
- For **reviews** (not drafting), output the review analysis directly as text using the Review Output Format in [Contract review](references/contract-review.md). Do not generate PDF/DOCX for reviews — the review is commentary, not a document.
- For web apps, deliver Privacy Policy and Terms of Service as routed pages within the app, not PDFs or DOCX files; see [Privacy Policy & Terms of Service](references/privacy-and-terms.md).

## Drafting Rules

1. **Always include the disclaimer** at the top of every output — this is not legal advice
2. Start from Bonterms/Common Paper for NDAs and service agreements; use the clause structures in [M&A / transaction documents](references/transaction-documents.md) for LOIs and purchase agreements
3. Quote exact problem text with section numbers, then give replacement language
4. Flag jurisdiction dependencies — non-compete enforceability, anti-indemnity statutes, and consumer protection vary wildly by state/country
5. When stakes are high (>$50K, equity, exclusivity, personal guarantees) → recommend attorney review explicitly
6. For multi-document transactions, ensure consistent terminology and cross-references across all documents

## Limitations

- NOT a substitute for legal advice from a licensed attorney
- Cannot account for jurisdiction-specific laws
- Cannot verify legal enforceability of any clause
- Cannot handle litigation, regulatory filings, or court documents
- Templates are starting points, not final legal documents
