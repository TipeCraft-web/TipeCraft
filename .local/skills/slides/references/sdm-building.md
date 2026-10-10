# Slides -- Building SDM Decks

This reference applies to Slides 2.0 (`slideFormat: "sdm"`); Legacy slides (`slideFormat: "legacy"`) uses `./legacy-building.md` and `./legacy-visual-qa.md` instead. Build-time reference for SDM slide decks: the artifact contract, the `sizePt` scale and built-in font registry, the format-specific constraints, present-mode motion, and the SDM document contract. The communication, research, creative-direction, and quality guidance for SDM decks lives in `./sdm-principles.md`; follow both (`./design-principles.md` is the Legacy slides counterpart and does not apply here). Before writing slide files, read any reference that is missing from context. A redirect does not contain the build contract.

The creation flow -- PPTX import, exporting, and the pre-generation questions for new decks -- lives in the `slides` skill (`../SKILL.md`). When the visual-theme answer is `Professional` (raw value `auto-professional`), also read `./professional.md` before planning; a subject that merely sounds corporate does not select it.

<context>
A slides artifact uses a React runtime, but each authored slide is a YAML document at `src/data/slides/<id>.sdm.yaml`, rendered at its `/slideN` route by the scaffold's SDM runtime. Declare every new SDM manifest entry as `kind: "sdm"` and point it at the matching document. For existing decks, preserve each entry's format. Do not create per-slide TSX wrappers for SDM documents.

The workspace editor identifies SDM content by stable slide and element IDs. Author against the strict SDM schema and the 1920×1080 coordinate system in `./sdm-layout.md`; do not edit the scaffold's React runtime to implement slide content. JSX, Tailwind, viewport-unit, and DOM-to-source instructions belong to Legacy slides (`./legacy-building.md`) and never override this SDM contract.

The slide manifest at `src/data/slides-manifest.json` drives thumbnails, titles, ordering, descriptions, and speaker notes. Every entry requires a non-blank `id`, `filepath`, `title`, and `description`, plus an integer `position`; use `kind: "sdm"` for SDM documents and initialize `speakerNotes` to `""` unless the user explicitly requests notes. For a new deck, write entries in array order with contiguous 1-based positions (`position: 1` through `N`). When editing, positions are authoritative and array order may legitimately differ after a user reorder; never rewrite a valid existing manifest merely to make its array order match its positions. Re-read the manifest before edits because the workspace may update it. To duplicate an SDM slide, copy its document to a new stable ID and filepath, update the document's internal IDs as needed, and add a new manifest entry; never point two entries at one document. Run `pnpm run --filter @workspace/<slug> validate-slides` after every batch of manifest or document changes.

Visiting `/` renders the presentation viewer, `/slideN` renders one slide for workspace preview, and `/allslides` renders the export surface. Do not modify `App.tsx`, `slideLoader.ts`, or the routing/runtime scaffold: they implement the shared thumbnail/PDF/PPTX contract, and hand edits can make exports time out with `NO_SLIDES_FOUND`. Static assets live under `public/`; download sourced images into `public/images/` and reference them through each document's `assets` map, and copy any `attached_assets/` file you want on a slide into `public/` first (see the Assets rules in `./sdm-design.md`).

Slides use the exact 1920×1080 SDM coordinate system. Size and position content in document coordinates, use theme tokens consistently, and keep every element within the canvas. Before declaring the deck done, run validation and follow `./sdm-visual-qa.md`.
</context>

## IMPORTANT: Preserve user edits

Users can reorder, duplicate, delete, and edit slides or notes outside chat, through the UI, direct file edits, or other tools. These changes update `src/data/slides-manifest.json` or SDM slide documents.

Before editing, re-read the manifest and relevant `filepath`. Resolve "slide N" by its current 1-based `position`, not a filename, ID, array index, or remembered order. Make only the requested changes; preserve everything else, including deletions.

Differences from your last output are not bugs to fix or revert. Investigate or change the viewer/editor only when the user explicitly reports a problem, such as a missing slide or being unable to edit.

**SDM design mechanics:**

- Put palette and font tokens in each SDM document's `theme`; `index.css` does not style SDM elements. Registry fonts (see the font table in `<sdm_typography>`) load automatically; load any other web font through `index.html`.
- Follow `./sdm-design.md` for the deck's motif system, deck constants, frame recipes, and SDM-specific craft guidance. Accents follow its motif system: declare 1-2 recurring motifs for the deck and give every decorative element a job.
- Card treatments are a `roundRect` with a tinted `surface` fill, `insetsPt` of 12-16 on each side, and at most a restrained stroke -- see the card recipe in `./sdm-design.md`.
- Charts and diagrams past a small labeled flow are widget modules under `src/widgets/` -- see `## Chart and diagram widgets` in `<sdm_documents>`.

<sdm_typography>
**Hierarchy (SDM `sizePt`):** hero 48-68pt, slide headline 30-44pt, subheading 22-30pt, body 19-24pt, caption 14.4-17pt, hero statistic 76-112pt. Use `lineHeight >= 1.05` for display and `>= 1.2` for body.

**Built-in font registry (no loading needed).** The SDM runtime automatically loads every family below, so each one renders in the deck, in thumbnails, and in the workspace font dropdown without an `index.html` link. Selected PowerPoint classics use hosted metric-compatible fallbacks; the remaining classics use ordered system and generic fallback stacks. Use registry names exactly as written.

Custom fonts are supported. For a Google Font outside this table, add its stylesheet `<link>` to `index.html`. Put the family in each document's `theme.fonts` to surface it as a named theme option in the editor font dropdown.

| Font | Tier | Style |
| --- | --- | --- |
| Aptos | classic | sans |
| Aptos Display | classic | sans |
| Arial | classic | sans |
| Book Antiqua | classic | serif |
| Calibri | classic | sans |
| Cambria | classic | serif |
| Century Gothic | classic | sans |
| Comic Sans MS | classic | script |
| Courier New | classic | mono |
| Garamond | classic | serif |
| Georgia | classic | serif |
| Helvetica | classic | sans |
| Impact | classic | display |
| Segoe UI | classic | sans |
| Tahoma | classic | sans |
| Times New Roman | classic | serif |
| Trebuchet MS | classic | sans |
| Verdana | classic | sans |
| Anton | google | display |
| Archivo | google | sans |
| Bebas Neue | google | display |
| Caveat | google | script |
| DM Mono | google | mono |
| DM Sans | google | sans |
| EB Garamond | google | serif |
| Fraunces | google | serif |
| Inter | google | sans |
| Instrument Serif | google | serif |
| JetBrains Mono | google | mono |
| Lato | google | sans |
| Libre Baskerville | google | serif |
| Libre Franklin | google | sans |
| Lora | google | serif |
| Manrope | google | sans |
| Merriweather | google | serif |
| Montserrat | google | sans |
| Nunito | google | sans |
| Open Sans | google | sans |
| Outfit | google | sans |
| Playfair Display | google | serif |
| Plus Jakarta Sans | google | sans |
| Poppins | google | sans |
| Raleway | google | sans |
| Roboto | google | sans |
| Source Serif 4 | google | serif |
| Space Grotesk | google | sans |
| Work Sans | google | sans |
</sdm_typography>

<quality_checks>
After the deck builds and `validate-slides` passes, **read `./sdm-visual-qa.md` and walk every step before declaring the deck done.**
</quality_checks>

<implementation_checklist>
1. Establish the communication plan and creative direction (`<communication>` and `<direction>` in `./sdm-principles.md`): audience, delivery context, title register, then palette, fonts, imagery, layout rhythm, motifs. Write it out before authoring.
2. Plan assets -- inventory user-attached files and plan supplemental images.
3. Define the document theme and asset catalog used across the deck.

Before the write step, confirm:
- Every hex color is quoted.
- Manifest positions are contiguous `1..N`.
- Text frames stay inside `1920x1080`.
- Display/stat text uses the per-glyph budget in `./sdm-layout.md`.
- Multi-line body frames keep at least one spare body line of height.
- Body copy stays at 19pt or larger.

4. Build every slide in `src/data/slides/<id>.sdm.yaml`. Author slide 1 first to lock in the visual system.
5. Add matching `kind: "sdm"` entries to `src/data/slides-manifest.json`.
6. Run `pnpm run --filter @workspace/<slug> validate-slides` and fix every issue. Rerun after every fix batch; the deck is not done while any error remains.
7. Read `./sdm-visual-qa.md`, inspect every slide, and fix clipping, overlap, or readability issues.
8. Present the artifact.

</implementation_checklist>

<sdm_constraints>
Format-specific constraints for SDM decks; the quality requirements every SDM deck meets are in `<quality>` in `./sdm-principles.md`.

**Interactivity:**

- Keep slide content static. No forms, hover-only content, or custom event handlers. The only animation channel is the declarative `replit.motion` block -- see `./sdm-motion.md`.
- Use schema `action` only for links and slide navigation. A `widget` is the right tool for a quantitative chart or a diagram past a small labeled flow (three to five shape-built boxes stay shape work) -- see `## Chart and diagram widgets` in `<sdm_documents>` -- and it must render static: all data visible on first paint, nothing behind a tooltip or hover.
- Everything must be visible without interaction for thumbnails and export.

**Frame containment:**

- Keep every frame within the 1920×1080 canvas unless a decorative image/shape intentionally bleeds. Keep ordinary text in `x=80..1840`, `y=80..1000`.
- Budget text capacity before writing; body text stays at 19pt or larger. Grow the frame, shorten copy, or split the slide instead of relying on automatic font shrinking.
- Treat every `validate-slides` layout diagnostic as a build error.

**Typography:**

- **Body text target: 19-24pt.** Captions and footnotes may use 14.4-17pt; never shrink body copy below 19pt to make it fit.

**SDM authoring compatibility:**

- Author slide content only in `src/data/slides/<id>.sdm.yaml`; do not add per-slide JSX files.
- Give every slide and element a stable unique ID, and preserve IDs for edits to existing content.
- Use schema-backed document elements, paints, text runs, groups, tables, and widgets instead of changing the React runtime.

**Technical:**

- Use the exact 1920×1080 document coordinate system and keep all geometry inside the canvas.
- Declare every new manifest entry as `kind: "sdm"` with a matching document filepath.
- Define document assets under the SDM root and keep their sources resolvable from `public/`; do not encode slide content in `App.tsx`, `slideLoader.ts`, or `.sdm/` runtime files.
- Run `validate-slides` after every batch of document or manifest changes.
</sdm_constraints>

<sdm_motion>
Present-mode motion (the `replit.motion` extensions block: preset entrances, exits, and loops that play only in Present and the deployed viewer) is optional and off by default. Its authoring contract, taste rules, and `motion-*` validation codes live in `./sdm-motion.md`; read that file only when the user asks for animation or a restrained entrance sequence genuinely improves the deck. Editing, thumbnails, `/allslides`, and exports always render the document as authored.
</sdm_motion>

<sdm_documents>
# SDM document contract

Author `src/data/slides/<id>.sdm.yaml` directly as YAML; never create a TSX wrapper or edit `.sdm/` runtime files. The schema is strict: unknown keys fail validation.

Author schema-valid documents directly using the contract below.
`validate-slides` is a safety net: in its default mode it repairs only
unambiguous structural mistakes before validation and prints every changed
path. Conflicting or unsupported values remain errors. Run
`validate-slides -- --check` for report-only validation with no repairs.

## YAML rules

- Quote every scalar that starts with `#` -- an unquoted `#` starts a comment and silently turns the value into null. This applies to every hex color: `value: "#1A2B3C"`.
- Quote strings YAML would otherwise coerce into another type: `"true"`, `"no"`, `"null"`, and number-like text such as `"08"` or `"1.0"`.
- Indent with 2 spaces; never use tabs.
- One document per file. Do not use `---` separators, anchors (`&`), aliases (`*`), or merge keys; visual edits rewrite the file in canonical form, so comments and custom formatting do not survive.
- Multi-line run text may use block scalars (`|-`).

## Schema essentials

- Root required: `format: replit.sdm`, `version: 1`, `size: { width: 1920, height: 1080 }`, `background`, and `elements`. Optional: `theme`, `assets`.
- Full schema: `src/.sdm/sdm.schema.yaml`, a YAML Schema describing the document shape. Use this summary first. If `validate-slides` reports an unfamiliar error or the valid shape of a needed field is unclear, read the full schema before guessing.
- Omit optional keys when you want their default: all-zero `insetsPt`, `weight: 400`, `opacity: 1`, and asset `mimeType` / `width` / `height`.
- Declare typography in each paragraph's `defaultRunStyle` so runs carry only `text` and intentional overrides.
- Discriminators: elements use `type`; colors, fonts, paints, geometry, bullets, and actions use `kind`. Never put `kind` on an element.
- Element IDs must start with a letter and contain only letters, numbers, `_`, `-`.
- Every element needs `id`, `type`, and `frame: {x,y,width,height}`. Type-specific required fields:
  - `text`: `body`
  - `shape`: `geometry`, `fill`; optional `body`, `stroke`
  - `image`: `assetId`, `fit: "cover" | "contain" | "fill"`
  - `group`: `coordinateSpace`, `children`
  - `table`: `columns: [{width}]`, `rows: [{cells: [{body}]}]`
  - `widget`: `widget: {module: "./widgets/Name.tsx"}`
- Draw every solid divider, rule, or accent bar as a thin rectangle `shape`
  (4-12 units thick, like `titleAccent` below) — rectangles are fully
  editable in the slide editor. Do not author `line` elements for them. The
  schema's `line` type (`points` with 2+ `{x,y}`, plus `stroke`) exists only
  for arrowheads, dashed rules, and multi-segment connectors; when one is
  genuinely needed, give it a `frame` that hugs its `points`.
- Color: `{ kind: rgb, value: "#1A2B3C" }` (exactly 6 hex digits, always quoted) or `{ kind: token, token: accent }`.
- Font: `{ kind: family, family: Aptos }` or `{ kind: token, token: display }`.
- Paint: `{ kind: none }`, solid `{ kind: solid, color, opacity? }`, gradient `{ kind: linearGradient, angleDeg, stops: [{ offset: 0..1, color, opacity? }, ...] }`, or image `{ kind: image, assetId, fit, opacity? }`.
- Shape corners: `rect` and `roundRect` presets take an optional `cornerRadius` in canvas units. `roundRect` rounds at 20 when it is omitted; other presets ignore the field. A radius of at least half the shorter frame side renders a pill.
- Text body: `{ paragraphs, verticalAlign?, overflow?, insetsPt? }`. Each paragraph has `runs` plus paragraph-local `defaultRunStyle`, `markerStyle`, `align`, `level`, `bullet`, `lineHeight`, `spaceBeforePt`, `spaceAfterPt`, `indentPt`, and `hangingIndentPt`. `bullet` is either `{ kind: character, character }` (1-8 characters, no line breaks) or `{ kind: number, style?, startAt? }` with `startAt` 1-32767; omit it for a plain paragraph. Number `style` is a numeral family (`arabic`, `alphaUc`, `alphaLc`, `romanUc`, `romanLc`) plus a suffix (`Period`, `ParenR`, `ParenBoth`, `Plain`); unrecognized families render arabic digits with the matching suffix. `level` is independent of `bullet` and defaults to `0`. Without explicit geometry, each level adds 36pt of indentation; a marker adds a 24pt hanging indent, so default marker indentation is `level * 36 + 24`pt. `defaultRunStyle` and `markerStyle` accept the run formatting fields (`font`, `sizePt`, `weight`, `italic`, `underline`, `strike`, `color`, `highlight`, `letterSpacingPt`) but never `text` or `action`. Each run has `text`, optional overrides, and optional `action`; run fields override `defaultRunStyle`, and the marker uses `markerStyle` over the first run's overrides over `defaultRunStyle`. Put font size on styles as `sizePt`, never `fontSize`. Text is never shrunk to fit its frame, and `overflow` defaults to `visible`, so text that needs more room spills past the frame; the exceptions are `overflow: clip`, which cuts the body at its frame, and table cells, which always clip at the cell. Resize frames or choose font sizes explicitly when text does not fit.
- Define every token used by a document in that document's `theme.colors` / `theme.fonts`. Keep the same theme object across documents that use theme tokens; `validate-slides` reports a tokenized document whose theme differs as `theme-drift`. Literal-only PPTX imports keep their source theme metadata without this authoring-time check.
- `assets` is a map keyed by asset ID, never a list: `assets: { hero: { src: images/hero.jpg } }`. An image element's `assetId` must match one of those keys.
- Relative asset `src` values resolve under `public/`: `src: images/hero.jpg` requires `public/images/hero.jpg`. Do not use `import.meta.env`, imports, or `@assets` inside slide documents.

## Complete valid manifest

The manifest stays JSON. Every entry needs a non-blank `description`, even when the title already describes the slide:

```json
[
  {
    "id": "cover",
    "position": 1,
    "kind": "sdm",
    "filepath": "src/data/slides/cover.sdm.yaml",
    "title": "Presentation title",
    "description": "Cover slide for the presentation",
    "speakerNotes": ""
  }
]
```

## Complete valid title slide

Use this as the structural starting point; change copy, palette, fonts, and
geometry. Its navy/gold palette and Aptos fonts are placeholders, not
defaults -- pick the deck's own direction per `<direction>` in `./sdm-principles.md` and
`./sdm-design.md`. Before writing this document, create
`public/images/hero.jpg` with the media-generation skill or copy a real source
image there. If no image is available, remove both the `assets.hero` entry and
the `heroImage` element instead of leaving a missing asset reference:

```yaml
format: replit.sdm
version: 1
size:
  width: 1920
  height: 1080
background:
  kind: linearGradient
  angleDeg: 135
  stops:
    - offset: 0
      color:
        kind: token
        token: background
    - offset: 1
      color:
        kind: rgb
        value: "#162033"
theme:
  colors:
    background: "#24314A"
    foreground: "#F7F4ED"
    accent: "#E9B44C"
  fonts:
    display: Aptos Display
    body: Aptos
assets:
  hero:
    src: images/hero.jpg
elements:
  - id: heroImage
    type: image
    frame:
      x: 1040
      y: 0
      width: 880
      height: 1080
    assetId: hero
    fit: cover
  - id: titleAccent
    type: shape
    frame:
      x: 120
      y: 750
      width: 160
      height: 6
    geometry:
      kind: preset
      preset: rect
    fill:
      kind: solid
      color:
        kind: token
        token: accent
  - id: title
    type: text
    frame:
      x: 120
      y: 220
      width: 880
      height: 520
    body:
      paragraphs:
        - runs:
            - text: A clear presentation title
              font:
                kind: token
                token: display
              sizePt: 56
              weight: 700
              color:
                kind: token
                token: foreground
          lineHeight: 1.05
          spaceAfterPt: 18
        - runs:
            - text: One concise supporting sentence.
              font:
                kind: token
                token: body
              sizePt: 24
              color:
                kind: token
                token: foreground
          lineHeight: 1.25
      verticalAlign: middle
```

For lists, use one text body and one paragraph per item. Default to keeping
related multiline copy in that same `text` element: use one paragraph per
intended line or item and let wrapping happen inside a paragraph. Separate
elements are still appropriate when lines are intentionally independent
visual objects with their own positioning, styling, action, or motion; do
not split merely to tune ordinary spacing or make text fit. The minimal item
is `bullet` plus `runs`, with shared typography in `defaultRunStyle`:

```yaml
paragraphs:
  - runs:
      - text: Third supporting point
    bullet:
      kind: number
      style: arabicPeriod
      startAt: 3
    defaultRunStyle:
      font:
        kind: token
        token: body
      sizePt: 22
      color:
        kind: token
        token: foreground
    lineHeight: 1.25
    spaceAfterPt: 8
  - runs:
      - text: Fourth supporting point
    bullet:
      kind: number
      style: arabicPeriod
    defaultRunStyle:
      font:
        kind: token
        token: body
      sizePt: 22
      color:
        kind: token
        token: foreground
    lineHeight: 1.25
    spaceAfterPt: 8
```

Never prefix run text with `- ` or `-- ` to imitate a bullet. Omit `bullet`
for plain text; `level` still controls the 36pt indentation step when
`bullet` is absent. Omit `indentPt`, `hangingIndentPt`, and `markerStyle`
unless the design needs custom geometry or a marker that differs from the
text. To move an item's nesting, change only its `level`; when the paragraph
carries an explicit `indentPt`, also add `(newLevel - oldLevel) * 36` to it.
For numbered lists, put `startAt` only on the first paragraph of a sequence;
continuation paragraphs omit it, as the second paragraph does above. Blank
paragraphs render no marker and never change a numbered sequence.

## Chart and diagram widgets

A quantitative chart or a diagram past a small labeled flow (three to five boxes) is widget work, not shape work -- the decision rule lives in `./sdm-design.md`. Write a small React component at `src/widgets/<Name>.tsx` with a default export and reference it from a `widget` element. `recharts` is already a scaffold dependency, and `src/widgets/ImportedChart.tsx` shows the recharts wiring -- but that module exists for PPTX import fidelity, so do not copy its palette or font sizes.

```yaml
- id: revenueTitle
  type: text
  frame: { x: 120, y: 128, width: 1200, height: 120 }
  body:
    paragraphs:
      - runs:
          - text: Revenue by quarter
        defaultRunStyle:
          font: { kind: token, token: display }
          sizePt: 38
          weight: 700
          color: { kind: token, token: foreground }
        lineHeight: 1.1
- id: revenueChart
  type: widget
  frame: { x: 120, y: 320, width: 1680, height: 620 }
  widget:
    module: ./widgets/RevenueChart.tsx
    sizing: fill
    props:
      series:
        - name: Revenue
          categories: [Q1, Q2, Q3, Q4]
          values: [4.2, 5.1, 6.4, 8]
      accent: "#E9B44C"
      foreground: "#F7F4ED"
      fontFamily: Aptos
```

Widget rules:

- `module` must match `./widgets/<Name>.tsx` and the file must exist: a missing module is the `widget-module` validator error, and the runtime renders red fallback text that would export literally. Use `sizing: fill` so the component fills its frame -- recharts' `ResponsiveContainer` needs it.
- Widgets never see `theme` tokens. Pass the deck's colors and font family through `props` (JSON values only) and read them in the component; a hardcoded palette clashes with the deck.
- Inside the slide stage 1 CSS pixel is 1 canvas unit, so `1pt = 2px`. Recharts' 12px defaults render at an illegible 6pt: set explicit sizes of 28-34px (14-17pt) on axis ticks, legends, and data labels, and scale strokes and margins to the 1920x1080 canvas the same way.
- Render static: `isAnimationActive={false}` on every series, all data visible on first paint, nothing that exists only in a tooltip or hover state. Thumbnails, `/allslides`, PPTX, and PDF are all snapshots.
- Keep the slide title, takeaway, and callouts as SDM text elements outside the widget. `validate-slides` only verifies the module file exists -- it never renders the component -- and the visual editor cannot edit widget content, so you own its internal layout and legibility; the QA pass screenshots every widget slide to prove it rendered (`./sdm-visual-qa.md`).
- Exports keep widgets: PPTX rasterizes the rendered SVG into a picture (not an editable PowerPoint chart); PDF keeps it vector.

Before writing, apply the placement rules in `./sdm-layout.md`. Then run `validate-slides` once after the parallel write. A fix to a repeated pattern must be applied to every slide containing it in one parallel edit before rerunning. If the same code remains on the same element after a fix, stop patching: re-read the named reference section, recompute the value, and edit once. Before a third repair attempt, re-plan instead of blindly patching; validate again after the re-planned edit and do not finish until it passes. If an error is unclear, read `src/.sdm/sdm.schema.yaml`; never inspect `src/.sdm/core/schema.ts`. If any slide document or the manifest changed after the last `validate-slides` run, run it again — never present the deck, take screenshots, or end the turn with errors outstanding.
</sdm_documents>
