---
name: reading-uploaded-files
description: Use when the user attached or uploaded a file (usually in attached_assets/) and you have not read its content yet. This skill is a router — it gives the right first command for each file type (PDF, CSV, spreadsheet, JSON, image, archive, logs) so you read the right amount the right way instead of dumping a huge or binary file into context. Do NOT use it when the file content is already visible in your context.
---

# Reading Uploaded Files

When a user attaches a file, it is saved to `attached_assets/<filename>` in the workspace and you get its path, not its content. You must go read it. The wrong first move wastes a turn or floods your context:

- Reading a 100 MB CSV in full buries the rows you need.
- Extracting text from a scanned PDF returns nothing, and looks like a failed attempt.
- Extracting a ZIP over the workspace can overwrite project files.

This skill gives the right first move per file type, and tells you when to hand off to a deeper skill.

## What you already have

- **Images** (`.jpg`, `.png`, `.gif`, `.webp`): the first 5 attached images per message are injected into your context as vision input. You can already see those — do not read them from disk to describe them. Images past the first 5 arrive path-only: call `read_file` on the path and you get the image as vision input, not text. Use shell/Python tools only for programmatic work (resize, OCR, pixel data).
- **PDF / DOC / DOCX**: `read_file` extracts the text layer for you (inside the platform — poppler for PDF, antiword for DOC, mammoth for DOCX). Start there. Go to Python tools only when text extraction is not enough (scans, figures, layout, very large documents).
- **Preinstalled shell tools** on every repl: `jq`, `unzip`, `zip`, `tar`, `file`, `curl`, ripgrep, and coreutils (`stat`, `head`, `wc`, `od`). Prefer these — they need no install step.

## General protocol

1. **Dispatch on the extension** using the table below.
2. **Check the size before reading**: `stat -c '%s' attached_assets/<file>` (and `file <path>` when the extension is missing or suspect).
3. **Size tiers** (one rule, used everywhere):
   - Under ~20 KB: read the whole file.
   - 20 KB – 5 MB: sample first (`head`, `nrows=5`, first pages), then read targeted sections.
   - Over 5 MB: never read in full. Stat, sample, then extract only what answers the question.
4. **Read just enough to answer the question.** "How many rows?" needs `wc -l`, not a full pandas load.
5. **Hand off to the dedicated skill** when the table names one. They cover editing, creating, and visual work that this skill does not.
6. **Lead your reply with the answer**, not the plumbing. Say "This is a 3-page invoice; the total on page 2 is $1,845", not "Let me examine the PDF".

Python, `pandas`, and `openpyxl` are not guaranteed — the repl may not even have a Python toolchain. Never use `apt-get`, `brew`, or `yum`: they are disabled stubs inside a repl and always fail. Install the Python module and system dependencies through the packager (see the `package-management` skill — system packages use nixpkgs names, not apt names); after that, plain `pip install pandas openpyxl` works.

## Dispatch table

| Extension | First move | Dedicated skill |
|---|---|---|
| `.pdf`, `.docx`, `.doc` | `read_file` (built-in text extraction) | `pdf-processing` for scans, visuals, oversize |
| `.xlsx`, `.xlsm` | openpyxl preview (below) | `excel-generator` for creating/formulas |
| `.xls`, `.ods` | pandas with `xlrd` / `odf` engine (below) | — |
| `.csv`, `.tsv` | pandas with `nrows` (below) | — |
| `.json`, `.jsonl` | `jq` for structure first (below) | — |
| `.jpg`, `.png`, `.gif`, `.webp` | Already vision input; disk only for processing | — |
| `.zip`, `.tar`, `.tar.gz` | List contents; never auto-extract (below) | `file-converter` for conversions |
| `.gz` (single file) | `zcat <file>` piped into `head -50` | — |
| `.pptx` | Hand off — it has the PPTX import pipeline | `slides` |
| `.epub`, `.rtf`, `.odt` | Hand off — no converter is preinstalled | `file-converter` |
| `.txt`, `.md`, `.log`, code | size check, then `read_file` or grep (below) | — |
| Unknown | `file <path>`, then decide (below) | — |

## PDF / DOCX

`read_file` on the path gives you extracted text (input up to 50 MB). Two failure modes, and both dispatch to a dedicated skill — do not retry `read_file` blind, and do not hand-roll extraction:

- **Refused as too large**: when the converted text exceeds ~25k tokens, `read_file` refuses and cannot page a converted document. For a PDF, use `pdf-processing`'s PyMuPDF setup and extract text page by page (`page.get_text()`). For `.doc`/`.docx`, convert to text/markdown with the `file-converter` skill and read the output in slices.
- **Empty or garbled text**: the PDF is likely a scan with no text layer, and text extraction can never work. `pdf-processing` renders pages as images so you can read them visually — rendering page 1 also settles whether it is a scan.

Also use `pdf-processing` whenever the question is about figures, charts, layout, or slide design — the text layer cannot answer those.

## Spreadsheets (XLSX / XLS / ODS)

```python
from openpyxl import load_workbook
wb = load_workbook("attached_assets/data.xlsx", read_only=True)
print("Sheets:", wb.sheetnames)
for row in wb.active.iter_rows(max_row=5, values_only=True):
    print(row)
```

`read_only=True` matters: without it the whole workbook loads into memory. Do not trust `ws.max_row` in read-only mode — non-Excel writers often omit the dimension record; iterate or use pandas for a row count.

- `.xlsm`: same as `.xlsx` (openpyxl handles it).
- Legacy `.xls`: openpyxl rejects it — `pd.read_excel(path, engine="xlrd", nrows=5)`.
- `.ods`: `pd.read_excel(path, engine="odf", nrows=5)`.

## CSV / TSV

Do not `head` blindly — a quoted cell can span lines and one row can be enormous. Shape first:

```python
import pandas as pd
df = pd.read_csv("attached_assets/data.csv", nrows=5)
print(df)
print(df.dtypes)
```

Approximate row count without loading: `wc -l` (over-counts when quoted fields contain newlines). Full `read_csv` only after you know the shape and the size tier allows it. TSV: add `sep="\t"`.

## JSON / JSONL

Structure first, content second:

```bash
jq 'type' attached_assets/data.json
jq 'if type == "array" then length elif type == "object" then keys else . end' attached_assets/data.json
```

Then drill into the part the user asked about. For JSONL, work line by line — `head -3 <file> | jq .` and `wc -l` — never `jq` the whole file.

## Archives (ZIP / TAR)

List first. Extract only what you need, never blindly into the workspace root — an archive can overwrite project files, contain `../` paths, or be huge.

```bash
unzip -l attached_assets/bundle.zip
tar -tf attached_assets/bundle.tar        # auto-detects .gz/.bz2/.xz — no -z needed
```

- One file from inside: `unzip -p attached_assets/bundle.zip path/inside/file.txt`.
- Full extraction (user asked, e.g. "here is my old project"): extract into a fresh directory (`unzip attached_assets/bundle.zip -d /tmp/uploaded_project`), inspect the tree, then move only what belongs into the workspace. Never extract over existing project files without confirming.

## Plain text / code / logs

Size check first (`stat -c '%s'`), then apply the size tiers. For anything over the small tier, orient with `head -100` and `tail -100`, and grep for what the user asked about instead of reading everything. For logs, the user almost always cares about the end: `tail -200 attached_assets/app.log`.

## Unknown extension

```bash
file attached_assets/mystery.bin
od -A x -t x1z attached_assets/mystery.bin | head -5
```

`file` identifies most things; the hex head shows magic bytes (`od` is preinstalled; `xxd` is not). If `file` says "data" and you do not recognize the magic bytes, ask the user what the file is instead of guessing.
