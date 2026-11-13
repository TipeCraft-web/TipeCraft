---
name: real-estate-analyzer
description: Evaluate properties, investment returns, mortgage affordability, and rent vs. buy decisions.
---

# Real Estate Analyzer

Analyze properties, neighborhoods, and real estate investment opportunities for home buyers and investors. Evaluate listings, estimate fair value, assess neighborhoods, model investment returns, compute mortgage affordability, compare renting vs. buying, analyze HOAs, model exit scenarios, and assess market conditions.

## When to Use

- User wants to evaluate a property listing for purchase
- User asks about neighborhood quality, schools, or safety
- User wants to compare properties or neighborhoods
- User needs help estimating if a home is fairly priced
- User wants to analyze a property as an investment (rental yield, appreciation)
- User asks about mortgage affordability, monthly payments, or how much house they can afford
- User wants to understand PITI breakdown, DTI ratios, or down payment scenarios
- User asks "should I rent or buy?" or wants to compare owning vs. renting
- User asks about selling a property, net proceeds, or when to sell ("how much will I net if I sell?")
- User has HOA-related questions (fees too high, special assessments, reserve fund status)
- User asks about house flipping, BRRRR strategy, or fix-and-flip analysis
- User asks about housing market timing ("is it a good time to buy?", "is the market going up or down?")
- User asks about closing costs, what they need to close, or total cash required to buy
- User asks about flood zones, insurance costs, or whether a property needs flood insurance

## When NOT to Use

- Legal review of purchase agreements (use legal-contract skill)

## Methodology

Work through the steps in order. Step 0 and Step 8 are complete here; each other step has a focused reference with the sources, formulas, and required tables. Read a step's reference when you reach that step.

### Step 0: Verify Listing Status & Asking Price (CRITICAL — Do This First)

Before any analysis, confirm the property's listing status and asking price. **Never assume a property is off-market.** Never run financial analysis based solely on an algorithm-generated estimate when an actual asking price may exist.

#### Verification procedure

1. **Attempt to fetch the listing URL** provided by the user using `webFetch`. Try with `renderJs: true` first, then without.
2. **If the listing page fails to render** (common with Zillow, Redfin, Realtor.com which block scraping), search for the property across multiple sources:
   - `webSearch` the full address + "price" + "listing"
   - Try Redfin, Zillow, Realtor.com, and local MLS aggregators
3. **If search results conflict or are ambiguous** about whether the property is active, pending, sold, or off-market — **ask the user to confirm**:
   - "I'm having trouble pulling the listing details. Can you confirm: Is this property currently listed for sale? If so, what's the asking price?"
4. **If the user provided a listing URL**, treat the property as actively listed unless you have strong evidence otherwise. Listing URLs from Zillow, Redfin, or Realtor.com imply the user is looking at an active listing.

#### What to confirm before proceeding

- Listing status: Active, Pending, Contingent, Sold, or Off-Market
- Asking price (if active)
- Basic details: beds, baths, sqft, year built, HOA (if applicable)

**If web scraping fails for all sources**, ask the user directly:

> "I wasn't able to pull the listing details automatically. Could you share the key details from the listing page? I need: asking price, beds/baths, square footage, year built, and HOA fees (if any)."

#### Pricing hierarchy — which price to use for analysis

1. **Asking price** — always use the actual listing price when available. This is what the seller is asking and what a buyer will negotiate against.
2. **Pending/contract price** — if under contract, note this and use the last known asking price.
3. **Estimated value** — only use algorithm estimates (Zestimate, Redfin Estimate) when the property is genuinely off-market with no asking price. Always label estimates clearly as estimates, not asking prices.

**Throughout the entire report**, clearly distinguish between asking price and estimated value. Label every price reference with its source: "Asking: $629,000" vs. "Redfin Estimate: $661,000". Never present an estimate as if it were a listing price.

### Step 1: Property Assessment

Gather basic details, reconstruct the full price history (original list, every reduction, delist/relist, previous sale), check condition indicators and red flags, and run the HOA deep dive for every condo, townhouse, and HOA community. Read [references/property-assessment.md](references/property-assessment.md) when gathering listing details, and always before analyzing any property with an HOA.

### Step 2: Valuation Analysis

Pull sold comps, compare the asking price to comp-derived fair value side-by-side, and compute PITI and affordability rather than estimating. Read [references/valuation-and-neighborhood.md](references/valuation-and-neighborhood.md) when pulling comps or computing monthly payments, DTI, or closing costs.

### Step 3: Neighborhood Analysis

Check schools, crime trends, walkability, FEMA flood zones, market velocity, and future development, naming the source for each. The same reference, [references/valuation-and-neighborhood.md](references/valuation-and-neighborhood.md), lists the exact sources; read it when researching the neighborhood.

### Step 4: Investment Analysis — Run the Numbers

**All investment calculations must use the asking price (or confirmed purchase price), not algorithm estimates.** Apply the 1%, 50%, and 70% quick filters, then underwrite NOI, cap rate, cash-on-cash, and DSCR. Read [references/investment-and-sensitivity.md](references/investment-and-sensitivity.md) when analyzing a property as a rental, flip, or BRRRR deal.

### Step 5: Sensitivity Analysis & Breakeven Returns

Always include sensitivity analysis in every property report: a three-scenario comparison (Base, Stressed, Worst), breakeven rent, price, mortgage rate, and appreciation, a rent vs. purchase price matrix with the asking price as one of the columns, and a key takeaway. Read [references/investment-and-sensitivity.md](references/investment-and-sensitivity.md) before building these tables.

### Step 6: Own vs. Rent Comparison

Always include an own-vs-rent comparison when the user might live in the property: monthly cost side-by-side, equity build vs. renting and investing the difference, and the breakeven timeline. Read [references/own-vs-rent-and-exit.md](references/own-vs-rent-and-exit.md) before building the comparison.

### Step 7: Exit Scenario Modeling

Always include exit scenarios in every property report: net proceeds at 3, 5, 7, and 10 years at multiple appreciation rates, the breakeven hold period, and early-exit risk when that period exceeds 5 years. Read [references/own-vs-rent-and-exit.md](references/own-vs-rent-and-exit.md) before modeling exits.

### Step 8: Due Diligence Checklist

Before making an offer:

- [ ] Pre-approval letter from lender
- [ ] Professional home inspection ($300-500)
- [ ] Pest/termite inspection
- [ ] Title search for liens or encumbrances
- [ ] Survey (if boundaries unclear)
- [ ] Flood zone check (FEMA maps)
- [ ] Environmental concerns (radon, lead paint for pre-1978 homes)
- [ ] HOA review (financials, rules, pending assessments)
- [ ] Property tax history and assessment

### Step 9: Multi-Property Comparison (when analyzing 2+ properties)

When the user asks to evaluate multiple properties, or a single property gets a clear "Pass" verdict, build a side-by-side comparison with a ranking, or offer to compare alternatives. Read [references/multi-property-comparison.md](references/multi-property-comparison.md) when analyzing 2+ properties or after a "Pass" verdict.

## Output Format

Always present key findings and recommendations as a plaintext summary in chat, even when also generating files. The user should be able to understand the results without opening any files.

Every report — whether chat summary, PDF, or web app — must include all sections below. Every report must clearly state the asking price (or note it as off-market) and label all price references with their source throughout.

```text
# Property Analysis: [Address]

## Summary
- Listing Status: [Active / Pending / Off-Market]
- Asking Price: $XXX,XXX (or "Off-Market — Estimated Value: $XXX,XXX")
- Estimated Fair Value: $XXX,XXX — [Over/Under/Fair priced by X%]
- Recommendation: [Strong Buy / Buy / Hold / Pass]

## Property Details
[Key facts table — always include asking price prominently]
[Full price history: original list, reductions, delist/relist, previous sale]

## Valuation
[Comps analysis, asking price vs. comp-derived value, price per sqft comparison]

## HOA Analysis (condos/townhouses)
[Fee breakdown, what's covered, fee history, reserve status, special assessments, rental restrictions]

## Neighborhood
[Schools, safety, livability scores]

## Financial Analysis
[Monthly payment breakdown based on ASKING PRICE, investment returns if applicable]

## Own vs. Rent Comparison
[Monthly cost side-by-side, equity build vs. opportunity cost, breakeven timeline]

## Sensitivity Analysis & Breakeven Returns
[Three-scenario comparison table]
[Breakeven thresholds: rent, purchase price, mortgage rate, appreciation]
[Sensitivity matrix: rent vs. purchase price cash flow grid — anchored to asking price]
[Key takeaway summarizing what the numbers reveal]

## Exit Scenarios
[Net proceeds at 3, 5, 7, 10 year horizons at multiple appreciation rates]
[Breakeven hold period, early exit risk assessment]

## Risks & Concerns
[Red flags, upcoming expenses, market risks]

## Due Diligence Checklist
[Pre-offer verification items]

## Multi-Property Comparison (when 2+ properties analyzed)
[Side-by-side table, ranking, and narrative]

## Verdict
[2-3 sentence recommendation informed by all analysis sections]
[Include own-vs-rent key line and exit scenario context]
```

## Best Practices

1. **Verify the asking price first** — never skip Step 0. If scraping fails, ask the user. Never run an entire analysis on an algorithm estimate when the user gave you a listing URL that implies an active listing with a real asking price.
2. **Pull the full price history** — original list price, every reduction, delist/relist events, and previous sale. Price trajectory tells you more about seller motivation than the current asking price alone.
3. **Asking price is marketing** — only sold comps within 6 months matter for determining fair value, but all financial calculations must use the asking price (or negotiated price) as the basis.
4. **Clearly separate asking price from estimates** — every price reference in the report should be labeled. "Asking: $629K" and "Redfin Estimate: $661K" are different numbers with different meanings. Never conflate them.
5. **HOA is a deal-breaker you can't ignore** — for condos, the HOA deep dive is mandatory. Fee history, reserve fund status, special assessments, and rental restrictions can each independently kill a deal. A $1,277/mo HOA that's been rising 8% annually will be $1,875/mo in 5 years.
6. **Model three scenarios** — base case, stressed (10% vacancy + higher repairs), and worst case (below-market rent + 12% vacancy + inflated costs). The worst case should represent "tenant trashes it year 1" severity.
7. **Always compute breakevens** — never present investment analysis without showing exactly what rent, price, or rate would make the deal work. Breakevens turn a "pass" into actionable intelligence.
8. **Anchor the sensitivity matrix to the asking price** — the asking price must always be one of the columns. Discount scenarios show what happens if the buyer negotiates down.
9. **Always compare owning to renting** — the own-vs-rent comparison with opportunity cost modeling is essential for primary residence decisions. "Can I afford it?" is the wrong question. "Am I better off buying or renting and investing the difference?" is the right one.
10. **Model the exit before the entry** — never recommend buying without showing what happens when the buyer sells at 3, 5, 7, and 10 years. Selling costs (5-6%) wipe out years of appreciation for short holds. If the breakeven hold exceeds 5 years, flag the lock-in risk prominently.
11. **Offer comparisons, not just verdicts** — when a property is a "Pass," proactively suggest the user share alternative listings for side-by-side comparison. A rejection without alternatives is not helpful.
12. **Permit history is free alpha** — county assessor site shows pulled permits. No permits on an "updated kitchen" = unpermitted work = your liability.
13. **Price/sqft is a blunt tool** — lot size, corner lots, and basement finish skew it hard. Use for screening, not for offers.
14. **Cap rate without appreciation** — in a flat market, if cap rate < your mortgage rate, you're paying to own it.
15. **Sensitivity matrix is non-negotiable** — always include the rent vs. price grid so the user can visually identify the conditions under which the deal works.
16. **When in doubt, ask the user** — if you cannot confirm a critical data point (asking price, listing status, HOA fees), ask rather than guess. A wrong assumption cascades through the entire analysis.

## Interactive Map — Web App Visualization

After analyzing properties, **build a web app** that displays properties and relevant neighborhood data on an interactive map. Always generate the map alongside the text-based analysis — the map is a visual complement, not a replacement for the detailed evaluation. Read [references/interactive-map.md](references/interactive-map.md) before building the map for marker styling, context layers, and free geocoding.

## Limitations & Disclaimer

- **This is NOT real estate, legal, or financial advice.** Informational analysis only. Always engage a licensed realtor, real estate attorney, and professional inspector before purchasing.
- Cannot access MLS — Redfin/Zillow public data lags and misses pocket listings
- Real estate listing sites frequently block automated scraping — listing details may need to be confirmed with the user
- Cannot provide appraisals (licensed appraiser required for lending)
- Cannot physically inspect — photos hide foundation cracks, mold, and grading issues
- Market snapshot only — rates and comps move weekly
- Algorithm estimates (Zestimate, Redfin Estimate) are not appraisals and can differ significantly from actual market value or asking price
