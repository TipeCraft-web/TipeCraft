---
name: stock-analyzer
description: Analyze stocks with fundamental analysis, technical indicators, and PDF reports.
---

TODO: The following callbacks referenced by this skill are not implemented in pkg/agent yet: generateFrontend.

# Stock & Investment Analyzer

Analyze stocks, companies, and investment opportunities using financial market data. Provide company profiles, technical analysis, fundamental analysis, and portfolio insights.

Primary deliverable: A professional PDF research report. The Excel model and interactive web app are optional extras -- only build them if the user explicitly requests them.

## When to Use

- User wants to analyze a specific stock or company
- User asks about financial metrics, earnings, or valuations
- User wants to compare investment options
- User needs portfolio analysis or allocation advice
- User asks about market trends or sector performance

## When NOT to Use

- Tax-specific questions (use tax-reviewer skill)
- Personal budgeting (use budget-planner skill)
- Insurance coverage (use insurance-optimizer skill)

## Reference Files

These files sit next to this SKILL.md (in `.local/secondary_skills/stock-analyzer/references/`). Read each one at the step named here:

- [references/investor-profile.md](references/investor-profile.md): when the user opts in to profiling, or when you need the default assumptions after they skip it.
- [references/report-modules.md](references/report-modules.md): before writing or running any script under `reports/` (shared modules, new-ticker workflow, data validation and peer data rules).
- [references/pdf-report.md](references/pdf-report.md): before generating charts or writing the PDF script (chart example, report structure, fpdf2 code, encoding, layout fixes, styling).
- [references/dcf-excel-model.md](references/dcf-excel-model.md): before building the DCF Excel model (required sheets, formula rules, formatting).

## IMPORTANT: Disclaimer & Compliance

All output from this skill is strictly informational. It does not constitute investment advice, a recommendation or solicitation to buy or sell any security, or a substitute for professional financial counsel.

Every report, PDF, Excel model, or web dashboard produced by this skill must:

- State clearly on the cover page (or first visible section): "This report is for informational purposes only and does not constitute investment advice. It is not a recommendation to buy, sell, or hold any security."
- Include a full disclaimer on the final page (see "Limitations & Disclaimer" section below for the required text).
- Never use imperative language that implies a directive -- say "may outperform" or "could be worth investigating," not "you should buy" or "add this to your portfolio."
- Always recommend consulting a licensed financial advisor before making any investment decision.

This applies to all outputs regardless of whether an investor profile has been collected.

## Optional Investor Profile

Before starting any analysis, offer the user the option to share their investment profile. This step is entirely optional -- if the user declines or wants to skip it, proceed immediately with a general-purpose analysis using the default assumptions.

How to offer it: At the start of the analysis, ask something like: "I can tailor this analysis to your investment style if you'd like to answer a few quick questions. Otherwise, I'll provide a general market perspective. Which do you prefer?"

If the user opts in, ask all 5 profiling dimensions (risk tolerance, time horizon, current allocation, income needs, experience level) and apply the profile to the report. If they skip, use the neutral defaults and do not assume anything about their personal situation. The questions, options, defaults, and report adjustments are in [references/investor-profile.md](references/investor-profile.md).

When profile data is NOT available, omit the Investor Profile box, omit the Suggested Allocation section, and present all picks without suitability tags. The core analysis remains identical.

## Data Sources (Use These -- Don't Guess)

Python libs (run directly, no API key):

```python
import yfinance as yf
t = yf.Ticker("AAPL")
t.info                   # P/E, market cap, beta, 52w range, margins
t.financials             # income statement (4yr)
t.balance_sheet          # debt, cash, equity
t.cashflow               # FCF, capex
t.history(period="1y")   # OHLCV for technicals
t.institutional_holders  # 13F ownership
```

Sector screening: Use yfinance sector ETFs (XLE, XLK, XLF, XLV, XLI, XLP, XLU, XLRE, XLB, XLC, XLY) for reliable sector-level data. These are more stable than third-party screener libraries. For individual stock screening, pull yfinance data for each ticker directly.

Note on finvizfinance: This library frequently breaks due to website changes. Avoid relying on it. Use yfinance sector ETFs and direct ticker lookups instead.

Primary filings: Start from the EDGAR filing index: webFetch("<https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={ticker}&type=10-K>"). This returns a list of filings -- find the most recent 10-K and webFetch its "Documents" link to reach the actual filing. Read Item 1A (Risk Factors) and Item 7 (MD&A) -- this is where management admits problems.

Insider activity: webFetch("<http://openinsider.com/screener?s={ticker}>") -- look for cluster buys (multiple execs buying same week) and P-code open-market purchases (insider paid cash at market price -- strongest signal). Ignore option exercises (M-code) and 10b5-1 scheduled sales.

Short interest: webSearch "{ticker} short interest fintel" -- >20% of float = crowded short, squeeze risk either direction.

### Data Source Fallbacks

yfinance occasionally returns empty data, tickers change, or rate limits kick in. Use this fallback hierarchy:

1. Primary: yfinance -- try up to 2 retries with a short delay
2. Fallback: Web search for the specific metric (e.g., webSearch("[ticker] market cap 2026"))
3. Last resort: Flag the metric as "data unavailable" -- never fabricate numbers

## Research First -- Mandatory Before Any Output

Never show financials, tables, or a report to the user without thoroughly researching first. Before generating the PDF, you must:

- Load the deep-research skill for comprehensive web research. This is not optional -- every stock analysis must use deep research to gather real data before producing any deliverable.
- Pull actual financials from yfinance AND cross-reference with SEC EDGAR filings (10-K, 10-Q). Do not rely on a single source.
- Search for every company mentioned -- if the user's request involves multiple companies or peers, pull financials on ALL of them, not just the primary ticker.
- Bias towards tables and numbers from actual public filings. Every financial figure in the report must be traceable to a real source (SEC filing, earnings release, or yfinance data pull). Do not estimate or round when real numbers are available.
- If you cannot verify a financial figure from at least one real source, flag it explicitly as unverified. Never present guessed or hallucinated numbers as fact.

### Scoping Deep Research

- For a single-stock analysis, launch 2-3 parallel research agents: one for fundamentals/financials, one for industry/competitive landscape, one for recent news/catalysts.
- For a multi-sector or thematic analysis, launch 4-6 parallel research agents organized by theme (e.g., macro environment, sector rotation, geopolitics, specific sector deep-dives). More than 6 agents rarely adds value and wastes time.

## Methodology

### Step 1: Pull the Data (Python)

Run yfinance to get fundamentals + 1yr price history. Compute 50/200 SMA, RSI(14), and current price vs 52w high. Takes 10 lines of pandas.

### Step 2: Fundamental Analysis

Valuation (compare to sector median, not S&P):

- P/E -- meaningless alone; flag if >2x sector median
- PEG -- <1.0 = growth at reasonable price; >2.0 = priced for perfection
- EV/EBITDA -- better than P/E for capital-intensive or leveraged cos
- P/S -- only metric for unprofitable growth; >20x = needs hypergrowth to justify
- FCF yield (FCF/market cap) -- >5% = genuinely cheap; negative = burning cash

Quality red lines (practitioner heuristics):

- Revenue growing but FCF shrinking -> earnings quality problem, dig into receivables
- Debt/EBITDA >4x -> one bad year from covenant breach
- Gross margin compressing 3+ quarters -> losing pricing power
- Stock-based comp >15% of revenue -> dilution machine (common in SaaS)
- Goodwill >50% of assets -> acquisition-heavy, writedown risk

### Step 3: Technical Context (Not Prediction)

Compute in pandas -- don't just describe:

- Price vs 50/200 SMA: below both = downtrend, don't catch knives
- Golden cross (50 crosses above 200) = trend confirmation, not entry signal
- RSI(14): >70 overbought / <30 oversold -- only useful at extremes + divergence
- Volume: moves on 2x+ avg volume are real; low-volume moves fade
- % off 52w high: >30% drawdown in an uptrending market = something broke

### Step 4: The Retail Edge -- Signals Institutions Ignore

- Insider cluster buys (OpenInsider): 3+ insiders open-market buying within 2 weeks is the single highest-conviction public signal. Research shows insider buys outperform; sells mean nothing (taxes/divorces/yachts).
- Buying the dip: insider P-code purchase after >10% drop = management disagrees with the market
- Short squeeze setup: short interest >20% + days-to-cover >5 + any positive catalyst
- Unusual options: webSearch "{ticker} unusual options activity" -- large OTM call sweeps before earnings sometimes leak info

### Step 5: Comparative Table

Build a pandas DataFrame with peers side-by-side: P/E, PEG, rev growth, gross margin, FCF yield, debt/EBITDA. The outlier in either direction is your thesis. Pull yfinance data for every peer company -- do not leave cells blank or use estimates when real data is available. Every company in the comparison must have actual financials pulled and verified.

### Step 6: Web Research -- Find Existing Analyst Reports and News

Use web search aggressively via the deep-research skill. Before writing the report, gather real external research to cite:

- webSearch("[ticker] analyst report 2026")
- webSearch("[ticker] earnings analysis site:seekingalpha.com")
- webSearch("[ticker] bull case bear case site:seekingalpha.com OR site:fool.com")
- webSearch("[company] investor presentation 2026 filetype:pdf")
- webSearch("[ticker] price target consensus")
- webSearch("[ticker] industry outlook [sector]")
- webSearch("[company] competitive landscape")
- webSearch("[ticker] short interest thesis")

Source hierarchy (cite all of these in the report):

| Source | What you get | How to cite |
| --- | --- | --- |
| SEC EDGAR (10-K, 10-Q, 8-K) | Primary financials, risk factors, MD&A | "Source: [Company] 10-K FY2025, Item 7" |
| Earnings call transcripts | Management commentary, guidance | "Source: Q4 2025 Earnings Call, CEO remarks" |
| Sell-side research (via SeekingAlpha, TipRanks) | Price targets, consensus estimates | "Source: TipRanks consensus, 12 analysts" |
| Industry reports | TAM, growth rates, competitive dynamics | "Source: [Firm] [Industry] Report, [Date]" |
| Company investor presentations | Management's own bull case, KPIs | "Source: [Company] Investor Day 2025" |
| News (Reuters, Bloomberg, CNBC) | Catalysts, M&A, regulatory | "Source: Reuters, [Date]" |

Use webFetch to pull actual content from SeekingAlpha articles, earnings transcripts, and investor presentations. Extract specific data points, quotes, and estimates to cite in the report.

## Project Architecture -- Reusable Modules

The reports/ directory contains shared modules that all ticker-specific scripts import from: `report_base.py` (ResearchReport PDF class and sanitize_text), `chart_utils.py` (chart functions), `excel_base.py` (Excel styling helpers), `data_utils.py` (data pulling and validation), and `generate_report.py` (the single entry point CLI). Never duplicate the ResearchReport class, chart functions, or Excel styling helpers -- always import from these modules. Always call validate_data() after pulling data, and never hardcode peer metrics. Read [references/report-modules.md](references/report-modules.md) for each module's functions, the workflow for adding a new ticker, and the data validation and peer data rules.

## Build Order -- PDF Report + DCF Excel Model (Built in Parallel)

Both the PDF research report and the DCF Excel model are primary deliverables. Build them in parallel from the same research data.

### Step 1: Generate charts (Python + matplotlib)

Generate all charts first -- these will be embedded in the PDF. Save as PNG at 150+ DPI to reports/charts/. Generate at least 4 charts: price history with SMAs, revenue/margin trends, peer valuation comparison, and one more relevant to the thesis. A worked matplotlib example is in [references/pdf-report.md](references/pdf-report.md).

### Step 2: Generate the PDF research report (PRIMARY DELIVERABLE #1)

Write a Python generation script (reports/generate_pdf.py) using fpdf2 to produce a polished, multi-page equity research PDF. Do not output a markdown summary as a substitute. Do not skip the PDF.

Why fpdf2, not jsPDF: Python is already required for yfinance and matplotlib. fpdf2 installs instantly (pip install fpdf2), runs reliably, and handles image embedding natively. jsPDF (Node) has heavy dependencies, frequent install timeouts in constrained environments, and is designed for browser-side generation -- not server-side report building.

The PDF should look like a sell-side initiation note from Goldman, Morgan Stanley, or JP Morgan; invest the most effort here. Follow the page-by-page report structure, fpdf2 sample code, and styling in [references/pdf-report.md](references/pdf-report.md). Two rules that break the PDF if skipped: apply sanitize_text() to every string before passing it to pdf.cell(), pdf.multi_cell(), or pdf.write() (fpdf2 is latin-1 only), and embed charts at w=160 with x=15, not w=190.

Present the PDF to the user in chat immediately after generating it.

### Step 3: Build the DCF Excel Model (PRIMARY DELIVERABLE #2 -- built in parallel with the PDF)

Always build the DCF Excel model alongside the PDF report. Do not wait for user request -- this is a standard deliverable for every stock analysis.

Use openpyxl in Python to generate reports/{TICKER}_DCF_Model.xlsx with five sheets: DCF Model, Sensitivity Analysis, Scenario Analysis, Comparable Companies, and Financial Summary. Every calculated cell MUST use an Excel formula, not a pre-computed Python value, so users can change assumptions and see results update. Read [references/dcf-excel-model.md](references/dcf-excel-model.md) for each sheet's contents, formula examples, the WACC-change test, and formatting standards.

Present the Excel model to the user in chat alongside the PDF.

### Step 4 (OPTIONAL): Build the web app

Only build if the user requests an interactive dashboard or web view. When building the web app:

- Design it as a native web dashboard -- responsive, interactive charts (Recharts), scrollable sections. Do NOT make it a literal PDF replica with fixed-size page containers.
- Hardcode data in a centralized data file (src/data/report-data.ts) -- no backend API needed for static analysis.
- Use the react-vite skill and generateFrontend() for scaffolding.

## Best Practices

- Timestamp everything -- state data pull date; yfinance prices are ~15min delayed
- Sector-relative only -- a 30 P/E is cheap in software, expensive in utilities
- Label facts vs thesis -- "FCF yield is 6%" (fact) vs "undervalued" (opinion)
- Bear case required -- every analysis must include: what kills this trade?
- Position sizing reality -- no single stock >5% for most retail portfolios; if conviction demands 20%, the conviction is the problem

## Limitations & Disclaimer

Include the following disclaimer text (or substantially similar language) on the final page of every PDF report and at the bottom of every web dashboard:

IMPORTANT DISCLAIMER: This report is produced for informational and educational purposes only. It does not constitute investment advice, a recommendation, or a solicitation to buy, sell, or hold any security or financial instrument. The information contained herein is based on publicly available data sources that may be incomplete, delayed, or inaccurate. No representation or warranty, express or implied, is made as to the accuracy, completeness, or reliability of the information provided.

Any opinions, estimates, or projections expressed are those of an automated analysis system and do not reflect the views of any licensed financial institution, registered investment advisor, or broker-dealer. Past performance is not indicative of future results. All investments carry risk, including the potential loss of principal.

Before making any investment decision, you should consult with a qualified, licensed financial advisor who can assess your individual circumstances, risk tolerance, and financial goals. The authors and publishers of this report accept no liability for any loss or damage arising from reliance on the information contained herein.

Technical limitations:

- yfinance scrapes Yahoo Finance -- occasionally breaks, data may lag filings by days or weeks
- Cannot access Bloomberg, FactSet, Refinitiv, or real-time Level 2 market data
- Cannot execute trades, manage portfolios, or provide personalized financial planning
- Data is delayed (typically 15-20 minutes for prices; financials may lag quarterly filings)
- All equities can decline to zero; sector and thematic analysis reflects a point-in-time snapshot that may not reflect rapid market changes

## Closing Prompt

After presenting the PDF report and DCF Excel model to the user, always end the reply with:

"Let me know if you'd like me to build an interactive web page for these findings as well."
