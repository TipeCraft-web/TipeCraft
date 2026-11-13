---
name: file-converter
description: Convert, merge, split, and compress files across formats — documents, images, audio, and more.
---

# File Converter

Convert between data, document, image, audio formats, and ZIP archives. One-liners for each conversion pair.

## Tool Map

| Domain | Tool | Install |
|---|---|---|
| CSV/JSON/Excel/Parquet | `pandas` | `pip install pandas openpyxl pyarrow` |
| YAML | `pyyaml` | `pip install pyyaml` |
| XML ↔ dict | `xmltodict` | `pip install xmltodict` |
| Any doc format ↔ any | **pandoc** (CLI) | `apt install pandoc` or `pip install pypandoc_binary` |
| Markdown → HTML | `markdown` | `pip install markdown` |
| HTML → Markdown | `markdownify` | `pip install markdownify` |
| .docx read/write | `python-docx` | `pip install python-docx` |
| PDF → text/tables | `pdfplumber` | `pip install pdfplumber` |
| PDF → images | `pdf2image` | `pip install pdf2image` + `apt install poppler-utils` |
| PDF manipulation | `pypdf` | `pip install pypdf` |
| Images | `Pillow` | `pip install Pillow` |
| SVG → PNG | `cairosvg` | `pip install cairosvg` |
| HEIC → JPG | `pillow-heif` | `pip install pillow-heif` |
| Audio formats | `pydub` | `pip install pydub` + `apt install ffmpeg` |
| EPUB ↔ other | **pandoc** or `ebooklib` | `pip install ebooklib` |
| HTML → PDF | `weasyprint` | `pip install weasyprint` |
| GIF creation | `Pillow` or `imageio` | `pip install imageio[ffmpeg]` |
| PDF → SVG | `pdf2image` + `potrace` or `pymupdf` | `pip install pymupdf` |
| ZIP archives | `zipfile` (stdlib) | built-in, no install needed |

## File Input Handling

When a user wants to convert a file that can't be attached directly in the chat (e.g., `.heic`, `.flac`, `.epub`, `.psd`, `.m4a`, `.wma`, `.parquet`), ask them to upload it to the project's file system. Uploaded files typically appear in `attached_assets/` or the project root. Always check both locations. If the file isn't found, ask the user where they saved it.

Common unsupported-in-chat but convertible formats: `.heic`, `.avif`, `.webp`, `.flac`, `.ogg`, `.m4a`, `.wma`, `.aiff`, `.epub`, `.parquet`, `.psd`, `.svg`, `.zip`

## Format References

Before converting outside the data formats below, read the reference for that format family. Each has the one-liners and the gotchas that break conversions.

- [references/documents.md](references/documents.md): read for Markdown, DOCX, HTML, or EPUB conversions (pandoc and pure Python) and for HTML → PDF.
- [references/pdf.md](references/pdf.md): read when extracting text, tables, or images from a PDF, merging, splitting, or rotating PDFs, or converting PDF → SVG.
- [references/images.md](references/images.md): read for PNG, JPG, WebP, AVIF, HEIC, or SVG image conversions and for creating, splitting, or resizing GIFs.
- [references/audio.md](references/audio.md): read for MP3, WAV, FLAC, OGG, M4A, WMA, or AIFF conversions and for trimming, merging, or changing the volume of audio.
- [references/zip.md](references/zip.md): read when creating, extracting, listing, or password-protecting ZIP archives.

## Data Formats

```python
import pandas as pd, json, yaml, xmltodict

# --- CSV ↔ JSON ---
pd.read_csv("in.csv").to_json("out.json", orient="records", indent=2)
pd.read_json("in.json").to_csv("out.csv", index=False)

# --- CSV → Excel / Excel → CSV ---
pd.read_csv("in.csv").to_excel("out.xlsx", index=False, engine="openpyxl")
pd.read_excel("in.xlsx", sheet_name="Sheet1").to_csv("out.csv", index=False)
# All sheets: pd.read_excel("in.xlsx", sheet_name=None) → dict of DataFrames

# --- CSV → Parquet (columnar, compressed) ---
pd.read_csv("in.csv").to_parquet("out.parquet", engine="pyarrow", compression="snappy")

# --- YAML ↔ JSON ---
data = yaml.safe_load(open("in.yaml"))  # ALWAYS safe_load, never load()
json.dump(data, open("out.json", "w"), indent=2)
yaml.safe_dump(json.load(open("in.json")), open("out.yaml", "w"), sort_keys=False)

# --- XML ↔ JSON ---
data = xmltodict.parse(open("in.xml").read())
json.dump(data, open("out.json", "w"), indent=2)
open("out.xml", "w").write(xmltodict.unparse(data, pretty=True))

# --- JSONL (one JSON object per line) ---
pd.read_json("in.jsonl", lines=True).to_csv("out.csv", index=False)
```

**Encoding gotchas:**

- `pd.read_csv("f.csv", encoding="utf-8-sig")` strips the BOM that Excel inserts
- Auto-detect: `import chardet; enc = chardet.detect(open("f.csv","rb").read())["encoding"]`
- CSV delimiter sniffing: `pd.read_csv("f.csv", sep=None, engine="python")`

**Nested JSON → flat CSV:**

```python
pd.json_normalize(data, sep=".").to_csv("out.csv", index=False)  # {"a":{"b":1}} → column "a.b"
```

## Validation

Always verify output:

```python
# Row count parity
assert len(pd.read_csv("out.csv")) == len(pd.read_json("in.json"))

# JSON well-formed
json.load(open("out.json"))

# Image opens
Image.open("out.jpg").verify()
```
