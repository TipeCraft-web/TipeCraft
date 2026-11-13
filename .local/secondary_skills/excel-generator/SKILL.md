---
name: excel-generator
description: Create Excel spreadsheets with formulas, charts, pivot summaries, and financial models.
---

# Excel & Spreadsheet Generator

Create .xlsx files, Google Sheets, and PDF exports with formulas, formatting, charts, data validation, pivot summaries, and financial models.

## Library Selection

| Need | Use | Install |
| --- | --- | --- |
| Create new .xlsx from scratch, fast, large files | xlsxwriter | `pip install xlsxwriter` |
| Read/modify existing .xlsx, or round-trip edits | openpyxl | `pip install openpyxl` |
| Read legacy .xls (Excel 97-2003) | xlrd | `pip install xlrd` |
| Dump a DataFrame quickly | `df.to_excel()` | uses openpyxl/xlsxwriter as engine |
| Generate Google Sheets | gspread + google-auth | `pip install gspread google-auth` |
| Export to PDF | LibreOffice CLI | system dependency (see PDF section) |

Key gotchas:

- Neither openpyxl nor xlsxwriter can read .xls — only .xlsx. Use xlrd for .xls.
- xlsxwriter is write-only — it cannot open an existing file. Use openpyxl to edit.
- openpyxl uses ~50x the file size in RAM. For 100K+ rows, use xlsxwriter or `openpyxl.Workbook(write_only=True)`.
- Formulas are stored as strings — Python does not evaluate them. Excel computes on open. openpyxl reading a formula cell gives you `=SUM(A1:A10)`, not the result (unless you use `data_only=True`, which reads the last cached value).

## Specialized recipes

Read the matching file before building that part of the workbook:

| When the task involves | Read |
| --- | --- |
| Creating a Google Sheet, or uploading .xlsx to Google Drive | `references/google-sheets.md` |
| PDF export, page setup, headers/footers, or print areas | `references/pdf-export.md` |
| A 3-statement, DCF, LBO, comps, or merger (M&A) model | `financial-models.md` |
| Pivot-table-style summaries (pandas or SUMIFS) | `references/pivot-summaries.md` |
| Formulas that reference other workbooks, or a suite of linked workbooks | `references/multi-workbook-linking.md` |
| What-if / sensitivity grids (one-way or two-way data tables) | `references/sensitivity-tables.md` |
| More than 100K rows, or reading very large files | `references/large-datasets.md` |

## Core Recipe — openpyxl

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.formatting.rule import ColorScaleRule, DataBarRule
from openpyxl.worksheet.datavalidation import DataValidation

wb = Workbook()
ws = wb.active
ws.title = "Sales"

headers = ["Product", "Units", "Price", "Revenue"]
ws.append(headers)
rows = [("Widget", 120, 9.99), ("Gadget", 80, 14.50), ("Gizmo", 200, 4.25)]
for r in rows:
    ws.append(r)

for row in range(2, len(rows) + 2):
    ws[f"D{row}"] = f"=B{row}*C{row}"
ws[f"D{len(rows)+2}"] = f"=SUM(D2:D{len(rows)+1})"

header_fill = PatternFill(start_color="2F5496", fill_type="solid")
for cell in ws[1]:
    cell.font = Font(bold=True, color="FFFFFF")
    cell.fill = header_fill
    cell.alignment = Alignment(horizontal="center")
    cell.border = Border(bottom=Side(border_style="medium"))

for row in ws.iter_rows(min_row=2, min_col=3, max_col=4):
    for cell in row:
        cell.number_format = '"$"#,##0.00'

for col in ws.columns:
    max_len = max(len(str(c.value or "")) for c in col)
    ws.column_dimensions[get_column_letter(col[0].column)].width = max_len + 3

ws.freeze_panes = "A2"

tab = Table(displayName="SalesTable", ref=f"A1:D{len(rows)+1}")
tab.tableStyleInfo = TableStyleInfo(name="TableStyleMedium9", showRowStripes=True)
ws.add_table(tab)

ws.conditional_formatting.add(f"D2:D{len(rows)+1}",
    DataBarRule(start_type="min", end_type="max", color="638EC6"))

dv = DataValidation(type="list", formula1='"Active,Paused,Archived"', allow_blank=True)
ws.add_data_validation(dv)
dv.add("E2:E100")

wb.save("output.xlsx")
```

## Charts (openpyxl)

```python
from openpyxl.chart import BarChart, LineChart, PieChart, Reference

chart = BarChart()
chart.title = "Revenue by Product"
chart.y_axis.title = "Revenue ($)"
data = Reference(ws, min_col=4, min_row=1, max_row=4)
cats = Reference(ws, min_col=1, min_row=2, max_row=4)
chart.add_data(data, titles_from_data=True)
chart.set_categories(cats)
ws.add_chart(chart, "F2")
```

Chart gotchas:

- `Reference` uses 1-indexed rows/cols (not 0-indexed).
- `titles_from_data=True` consumes the first row of the data range as the series label — include the header row in data but NOT in cats.
- Supported: BarChart, LineChart, PieChart, ScatterChart, AreaChart, DoughnutChart, RadarChart. 3D variants exist but render inconsistently.
- Charts reference cells — if you later insert rows above, the chart range does NOT auto-adjust.

## xlsxwriter (faster, write-only, richer formatting)

```python
import xlsxwriter

wb = xlsxwriter.Workbook("report.xlsx")
ws = wb.add_worksheet("Data")
header_fmt = wb.add_format({"bold": True, "bg_color": "#2F5496", "font_color": "white", "border": 1})
money_fmt = wb.add_format({"num_format": "$#,##0.00"})

ws.write_row(0, 0, ["Product", "Units", "Price", "Revenue"], header_fmt)
data = [("Widget", 120, 9.99), ("Gadget", 80, 14.50)]
for i, (p, u, pr) in enumerate(data, start=1):
    ws.write(i, 0, p)
    ws.write(i, 1, u)
    ws.write(i, 2, pr, money_fmt)
    ws.write_formula(i, 3, f"=B{i+1}*C{i+1}", money_fmt)

ws.autofit()
ws.freeze_panes(1, 0)
wb.close()
```

## pandas Shortcut (multi-sheet with formatting)

```python
import pandas as pd

with pd.ExcelWriter("out.xlsx", engine="xlsxwriter") as writer:
    df.to_excel(writer, sheet_name="Data", index=False)
    summary.to_excel(writer, sheet_name="Summary", index=False)
    wb, ws = writer.book, writer.sheets["Data"]
    ws.set_column("A:A", 20)
    ws.autofilter(0, 0, len(df), len(df.columns) - 1)
```

## Financial Model Conventions

See `financial-models.md` for complete recipes covering:

- 3-Statement Model — Income Statement, Balance Sheet, Cash Flow linked together
- DCF (Discounted Cash Flow) — FCF projections, discount factors, terminal value, equity bridge
- LBO (Leveraged Buyout) — Sources & Uses, debt schedule, cash sweep, MOIC/IRR
- Comparable Company Analysis — Comp table with multiples, summary stats, implied valuation
- Merger Model (M&A) — Accretion/dilution analysis, pro forma EPS

Common patterns across all financial models:

- Yellow-highlighted cells (#FFF2CC) = user inputs; everything else is formulas
- Use `freeze_panes` on row 1 (headers) and column A (labels)
- Currency format: `'"$"#,##0.0'` for millions, `'"$"#,##0.00'` for precise
- Multiple format: `'0.0x'` for EV/EBITDA, leverage ratios
- Totals use double-bottom border (`"bottom": 6` in xlsxwriter)
- Use named ranges or cell references to the Assumptions sheet for all inputs — never hardcode values in formula sheets
- Always add a `section_fmt` for visual grouping (bold, light blue background, top+bottom border)

## Common Formula Patterns

| Need | Formula |
| --- | --- |
| Running total | `=SUM($B$2:B2)` (drag down) |
| Lookup (modern) | `=XLOOKUP(A2, Data!A:A, Data!C:C, "Not found")` |
| Lookup (compat) | `=VLOOKUP(A2, Data!A:C, 3, FALSE)` |
| Conditional sum | `=SUMIFS(C:C, A:A, "Widget", B:B, ">100")` |
| Count matching | `=COUNTIFS(A:A, "Active")` |
| Percent of total | `=B2/SUM($B$2:$B$100)` |
| Safe division | `=IFERROR(A2/B2, 0)` |

Gotcha: When writing formulas from Python, use US-English function names and comma separators regardless of the user's locale. Excel translates on open.

## Number Format Codes

| Format | Code |
| --- | --- |
| Currency | `"$"#,##0.00` |
| Thousands | `#,##0` |
| Percent | `0.0%` |
| Date | `yyyy-mm-dd` |
| Negative in red | `#,##0;[Red]-#,##0` |
| Multiple (e.g. 2.5x) | `0.0x` |
| Millions shorthand | `#,##0.0,,"M"` |
| Accounting (neg in parens) | `"$"#,##0.00_);[Red]("$"#,##0.00)` |

## Data Gathering — Use Web Search When Relevant

Before building the spreadsheet, determine whether the data requires external research. If the user asks for a report, analysis, or dataset about a public company, industry, market, or any publicly available information, use webSearch and webFetch to gather real data first.

Examples that require web search:

- "Build me a financial model for Tesla" -> search for Tesla's latest 10-K/10-Q, revenue, margins, guidance
- "Create a comp table for SaaS companies" -> search for revenue, ARR, multiples, headcount
- "Make a spreadsheet comparing EV manufacturers" -> search for production numbers, market cap, deliveries
- "Summarize Apple's last 5 quarters" -> search for quarterly earnings data

Do not fabricate numbers. If you cannot find a specific data point, leave the cell blank or mark it as "N/A -- not found" rather than guessing. Always cite the source (e.g., "Source: Tesla 10-K FY2025") in a notes row or sheet.

## Output

Always present key findings and recommendations as a plaintext summary in chat, even when also generating files. The user should be able to understand the results without opening any files.

## Limitations

- Cannot write VBA macros (.xlsm requires `keep_vba=True` in openpyxl to preserve existing macros, not create them)
- Formulas are not computed by Python -- open in Excel/LibreOffice to see results
- openpyxl auto-width is an approximation (no font metrics); xlsxwriter's `autofit()` is better
- Google Sheets import may drop some conditional formatting and chart styles
- Cannot create native Excel PivotTables -- use formula-based or pandas-based summaries instead
- Cannot create native Excel Data Tables (What-If) -- use formula grids as equivalent
- Cross-workbook references show `#REF!` until linked files are opened in Excel
- Excel row limit is 1,048,576 per sheet -- split larger datasets across sheets
