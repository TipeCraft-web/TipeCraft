---
name: programmatic-seo
description: Build SEO-optimized pages at scale using templates and data.
---

# Programmatic SEO

Build SEO-optimized pages at scale using templates and data. Create page generators that target keyword patterns and produce unique, valuable content for each variation.

## When to Use

- User wants to create many SEO-driven pages from a template (e.g., "[product] vs [competitor]", "[service] in [city]")
- User mentions programmatic SEO, template pages, directory pages, location pages, or comparison pages at scale
- User wants to build an "alternatives to X" page set, integrations directory, or glossary
- User has a data set they want to turn into individual landing pages

## When NOT to Use

- Auditing existing SEO issues (use seo-auditor skill)
- Writing a single blog post or landing page (use content-machine skill)
- One-off competitive analysis (use competitive-analysis skill)

## Reference Files

Read only the file the current step needs:

- [Information gain and playbooks](references/information-gain-and-playbooks.md) — read when choosing a playbook or URL pattern, or when judging whether a page set has enough information gain to publish. Covers the information gain test, scaled content abuse, and proven playbooks with traffic numbers.
- [AI content policy](references/ai-content-policy.md) — read before using AI to draft, expand, translate, or mass-generate page content, or when the user asks for "SEO content" or many articles. Covers what Google detects, the AI role boundary, and the pre-publish checklist for AI-assisted content.
- [Page generator](references/page-generator.md) — read at Step 6, before writing routes or templates. Covers SSG/ISR/SSR choice, the Express SSR pattern for SPAs, cache headers, Next.js and Astro, sitemaps, SSR assets, header/footer and logo matching, and breadcrumb layout.
- [Technical SEO](references/technical-seo.md) — read when adding schema markup, planning freshness and regeneration, managing crawl budget for large or faceted page sets, or tuning Core Web Vitals.
- [Internationalization](references/internationalization.md) — read before adding locale variants, translations, or hreflang.
- [Monitoring](references/monitoring.md) — read when writing the validation plan or reviewing a page set after launch. Covers Search Console signals, the 8-week decision framework, and when to kill a playbook.
- [Common mistakes](references/common-mistakes.md) — read when reviewing a plan or implementation before launch, or diagnosing why pages are not indexed or ranking.

## Core Principles

1. **Information gain is everything** — Every page must contain information the user cannot find on existing top-10 results. Proper H1s, keyword density, and clean structure are baseline hygiene, not a ranking advantage. Pages that "look like SEO" but add no new information are what Google's spam systems now target.
2. **Unique value per page** — Every page must provide value specific to that page, not just swapped variables in a template. If you removed the entity name, would two pages be indistinguishable? If yes, don't publish.
3. **Proprietary data wins** — Hierarchy: proprietary > product-derived > user-generated > licensed > public (weakest). The strongest pSEO pages contain data no one else has — original tests, first-party metrics, real user reviews, proprietary calculations.
4. **Subfolders, not subdomains** — `yoursite.com/templates/resume/` not `templates.yoursite.com/resume/`
5. **Match search intent precisely** — Pages must match the intent behind the query, not just contain the keywords. This means choosing the right page type (blog post vs. comparison table vs. tool vs. directory listing), answering the actual question, and structuring content the way users expect for that query type.
6. **Quality over quantity** — 100 great pages beat 10,000 thin ones. Scale without information gain is just industrialized noise. Google has more content than it needs — your pages must earn their place by being genuinely better than what already ranks.
7. **Topical authority compounds** — A site that demonstrates deep expertise in a specific topic earns trust signals that lift all pages in that topic cluster. Scattered, shallow coverage across unrelated topics builds no authority.

## ⚠️ CRITICAL: Check the App's Rendering Strategy First

**Before writing a single line of code**, determine whether the existing application is a Single Page Application (SPA).

**SPAs (React, Vue, Angular, Svelte) are invisible to Googlebot.** Googlebot fetches raw HTML and does not execute client-side JavaScript. A React component that renders `<h1>Currency Converter</h1>` only works in a browser — Googlebot sees an empty `<div id="root"></div>`.

```text
Is the app a SPA (React/Vue/Angular)?
│
├── YES → SEO pages MUST be server-rendered (SSR)
│   Options:
│   A. Express/Fastify route returning a complete HTML string ← simplest for existing SPAs
│   B. Migrate to Next.js/Nuxt/SvelteKit with SSR support
│   C. Add a static site generator (Astro) alongside the SPA for SEO pages only
│
└── NO (already Next.js, Nuxt, etc.) → Use the framework's built-in SSR/SSG/ISR patterns (see Step 6)
```

**The SPA trap:** The most common pSEO mistake is adding routes to a React Router / Wouter / Vue Router app and assuming they will be indexed. They will not. Always verify by `curl`-ing the URL and checking if the content is present in the raw HTML response:

```bash
curl -s https://yoursite.com/your-seo-page | grep "target keyword"
# If empty or only returns <div id="root"></div> → not crawlable
```

## Content Authenticity — Don't Hallucinate Business Data

When building programmatic SEO for **the user's own company**, you will not have access to their internal data (customer stories, case studies, testimonials, product metrics, pricing, team bios, etc.). **Do not fabricate this information.**

Before generating any company-specific content, ask the user for:

- Customer names, logos, or testimonials they want featured
- Case study data (metrics, outcomes, quotes)
- Product-specific details (features, pricing tiers, integrations list)
- Any proprietary data that should populate template variables

If the user hasn't provided this data, default to safe content patterns:

- Industry research and statistics (sourced via `webSearch`)
- General descriptions of the problem/solution category
- Feature explanations based on what's publicly visible on their site (use `webFetch` on their domain)
- Placeholder blocks clearly marked `[INSERT: customer testimonial]` or `[INSERT: case study metrics]`
- Comparison data pulled from public sources (G2, Capterra reviews via `webSearch`)

**Never generate:** fake customer quotes, fabricated ROI numbers, invented case studies, made-up testimonials, or fictional company metrics. These damage trust and can create legal liability.

For **generic/research topics** (e.g., "[city] cost of living", "[tool A] vs [tool B]", glossary terms), use `webSearch` to gather real data and cite sources.

## ⚠️ Strategic Judgment — What AI Cannot Do For You

**This is the most important section in this skill.** AI excels at scaling execution — drafting content, structuring pages, generating variations. But it cannot make the strategic decisions that determine whether a pSEO campaign succeeds or fails. These decisions must come from the user (or a human SEO strategist), and the agent must actively prompt for them rather than making assumptions.

### Decisions that require human judgment

Before building anything, the user must answer (or the agent must ask):

1. **Is this keyword worth a page at all?** Not every keyword with search volume deserves a page. If the top 10 results are dominated by high-authority brands and the user's site has no topical authority, building 500 pages won't help.
2. **What page type matches the query intent?** The same topic might need a blog post, a comparison table, an interactive tool, a directory listing, or a data profile. Getting the page type wrong means the page will never rank, regardless of content quality. For example:
   - "best CRM for real estate" → listicle/comparison (not a product page)
   - "HubSpot vs Salesforce" → head-to-head comparison (not a blog post)
   - "what is a CRM" → educational/glossary (not a product page)
   - "CRM pricing" → pricing table with real numbers (not a blog post about pricing)
3. **What information gain does this page offer over the current top 10?** If the answer is "nothing — we're just rewriting what's already there with AI," do not build the page. Specifically ask: do we have original data, unique analysis, proprietary metrics, real case studies, or first-hand experience that the current results lack?
4. **Does the user's site have topical authority in this area?** A brand-new domain publishing 200 glossary pages on a topic it has no track record in will be ignored. Topical authority is built through depth (many related, high-quality pages), external trust signals (backlinks from relevant sites), and user engagement over time.
5. **What is the commercial intent and conversion path?** Pages that attract traffic but have no clear next step for the user waste crawl budget and dilute site quality. Every pSEO page should have a purpose beyond "get impressions."

### What the agent should do

- **Always ask the user** what unique data, experience, or perspective they can bring to the topic before generating content. If they say "just write something about X," push back and explain that pages without information gain will not rank.
- **Never assume scale equals strategy.** If the user asks for "500 SEO articles," the correct response is to first validate whether 500 pages is the right number, whether the topics have demand, and whether the user has enough unique data to make each page valuable.
- **Recommend starting small.** Build 10-20 high-quality pages first, validate they get indexed and earn impressions, then scale what works. This is the opposite of the "blast 500 pages and hope" approach.
- **Be explicit about what AI is doing vs. what requires human input.** AI writes the page. The human decides whether the page should exist.

### The "SEO cosplay" trap

A page can have perfect H1 tags, clean H2/H3 hierarchy, optimized meta descriptions, proper schema markup, good keyword density, and fast load times — and still rank nowhere. These are table stakes, not differentiators. Google's ranking systems evaluate whether a page genuinely satisfies the user's query better than alternatives. Structure without substance is what practitioners call "SEO cosplay" — it looks like SEO but doesn't perform.

**The agent must not conflate technical SEO hygiene with content quality.** Both are necessary. Neither is sufficient alone.

## Implementation

### Step 1: Keyword Pattern Research

- Identify the repeating structure and variables
- Count how many unique combinations exist
- Validate demand: aggregate search volume, distribution (head vs. long tail), trend direction

### Step 2: Data Requirements

- What data populates each page?
- Is it first-party, scraped, licensed, or public?
- How is it updated and maintained?

Pick the playbook only after confirming the data genuinely changes between pages; see [Information gain and playbooks](references/information-gain-and-playbooks.md).

### Step 3: Template Design

Page structure:

- H1 with target keyword
- Unique intro (not just variables swapped — conditional content based on data)
- Data-driven sections with original insights/analysis per page
- Related pages / internal links
- CTAs appropriate to intent

Ensuring uniqueness — critical to avoid thin content penalties:

- Conditional content blocks that vary based on data attributes
- Calculated or derived data (not just raw display)
- Editorial commentary unique to each entity
- User-generated content where possible

### Step 4: Internal Linking Architecture

Hub and spoke model:

- Hub: Main category page (e.g., "/integrations/")
- Spokes: Individual programmatic pages (e.g., "/integrations/slack-asana/")
- Cross-links between related spokes

Every page must be reachable from the main site. **Update the main app's footer and navigation to include links to SEO hub pages** — SEO pages that aren't linked from the main site are orphan pages that Google may never discover or trust.

Include XML sitemap and breadcrumbs with structured data.

### Step 5: Indexation Strategy

- Prioritize high-volume patterns for initial crawling
- Noindex very thin variations rather than publishing them
- Manage crawl budget (separate sitemaps by page type)
- Monitor indexation rate in Search Console

### Step 6: Build the Page Generator

Before writing routes or templates, read [Page generator](references/page-generator.md). It covers choosing SSG, ISR, or SSR by page count and data freshness; the three-layer Express SSR pattern for SPAs (create the shared HTML shell first); cache headers per page type; Next.js App Router and Astro patterns; sharded sitemaps; and SSR asset, branding, logo, and breadcrumb pitfalls. For schema markup, freshness, crawl budget, and Core Web Vitals, read [Technical SEO](references/technical-seo.md); for multilingual pages, read [Internationalization](references/internationalization.md).

## Quality Checks

### Pre-Strategy (before writing any code)

- [ ] User has identified unique data source that varies meaningfully per page
- [ ] Page type matches query intent (blog vs. comparison vs. tool vs. directory)
- [ ] Information gain validated: each page offers something the current top 10 results don't have
- [ ] Competitive viability assessed: user's site has (or is building) topical authority in this area
- [ ] Starting with a small batch (10-20 pages) before scaling to hundreds
- [ ] Human has made the strategic decisions; AI is handling execution only

### Pre-Launch (technical and content)

- [ ] `curl` the URL and verify target keywords appear in raw HTML (not rendered by JS)
- [ ] Each page provides unique value beyond variable substitution — if you removed the entity name, pages would NOT be indistinguishable
- [ ] Information gain test passed: 5 random pages each contain data/insights not in the current top 10 results
- [ ] Answers search intent for the target keyword with the correct page type
- [ ] Unique titles and meta descriptions per page
- [ ] Proper heading structure (one H1, logical H2/H3 hierarchy)
- [ ] Correct schema markup with no validation errors (test at schema.org/validator)
- [ ] Page speed acceptable — LCP <2.5s, CLS <0.1, no render-blocking resources
- [ ] Images have explicit `width` and `height` attributes
- [ ] Connected to site architecture (footer/nav links to hub pages; hub links to spokes)
- [ ] Breadcrumbs render correctly and are not obscured
- [ ] Logo and branding match the main application exactly
- [ ] In XML sitemap and crawlable (no `noindex` accidentally set)
- [ ] 404s return proper status codes (no pages for invalid slugs)
- [ ] Cache headers set appropriately per page type (live data: no-cache; static: max-age=86400)
- [ ] Faceted/filtered URLs blocked via `robots.txt` or marked `noindex`
- [ ] Multilingual pages: hreflang tags present, bidirectional, with `x-default`
- [ ] AI-assisted content: each page's output meaningfully differs from every other page
- [ ] `dateModified` in schema tied to actual data change, not deploy date

### Post-Launch Monitoring

Track (per playbook URL prefix in Search Console): indexation rate, impressions, average position, CTR

8-week review: assess which page sets are indexed and gaining impressions, which are stuck, which are excluded. Apply the decision framework in [Monitoring](references/monitoring.md).

Watch for: "Crawled, not indexed" count rising (thin content), crawl budget errors, manual actions, ranking drops after content updates.

## Output Format

Deliver strategy validation first, then implementation. **Do not skip straight to building pages.**

1. **Strategic validation** (before any code):
   - What unique data does the user have that varies per page?
   - What page type matches the query intent?
   - What information gain does each page offer over current top 10 results?
   - Does the user's site have topical authority in this area?
   - Recommended initial batch size (start small, validate, then scale)
2. **Rendering audit**: Confirm whether the app is a SPA and what SSR approach to use
3. **Strategy**: Opportunity analysis, chosen playbook(s), keyword patterns, data sources, page count estimate
4. **Shared infrastructure**: `ssrShared.ts` (or equivalent) HTML shell before any individual pages
5. **Template**: URL structure, title/meta templates, content outline, schema markup
6. **Implementation**: Working server-rendered pages that return full HTML to `curl`
7. **Integration**: Footer/nav updates in the main app linking to the new hub pages
8. **Validation plan**: How to verify pages are indexed, earning impressions, and when to scale or kill the campaign

## Limitations

- Cannot access Search Console data to monitor indexation
- Cannot check existing backlink profiles
- Data quality depends on the source — always validate before publishing
- Cannot guarantee rankings — SEO involves many factors beyond on-page optimization
