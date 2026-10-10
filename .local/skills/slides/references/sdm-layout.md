# SDM layout: deterministic 1920x1080 authoring

Use this reference for every new SDM deck, especially when you cannot open
the app or take screenshots. The validator is the visual backstop: it estimates
text wrapping, rejects overflowing authored text, catches text-to-text
collisions, and checks canvas bounds.

## Coordinate contract

- Canvas is exactly `1920x1080`.
- Use `x=80..1840`, `y=80..1000` as the recommended safe rectangle for
  ordinary content. Intentional edge text such as footers and page numbers may
  use the margins, and full-bleed images or decorative shapes may extend beyond
  it.
- Frames use canvas units. Text and stroke sizes use PowerPoint points, and
  `1pt = 2` canvas units (`SDM_POINT_TO_UNIT`).
- Conversion from legacy viewport layouts: `1vw = 19.2` canvas units,
  `1vh = 10.8` canvas units, and `Nvw` text is approximately `N * 9.6pt`.
- Array order is back-to-front paint order. Put a background shape first and its
  separate text element afterward. Shape/text overlap is intentional;
  text/text overlap is almost always a bug.

## Point-size system

Take the `sizePt` bands per role and the `lineHeight` floors from
`<sdm_typography>` in `./sdm-building.md`.

Every paragraph must establish `font`, `sizePt`, and `color`, either through
paragraph `defaultRunStyle` or explicitly on each non-empty run. Prefer
`defaultRunStyle` so run fields contain only intentional overrides. Empty
paragraphs keep their insertion formatting in that paragraph-local default.
Defaults never carry `action`:
hyperlinks are content-anchored and disappear when their text is deleted.
Set `lineHeight` on each paragraph: use at least `1.05` for display text and
`1.2` for body text.

The validator uses 18pt when `sizePt` is omitted; explicit smaller sizes reduce
estimated text dimensions. Do not use undersized text to satisfy validation:
keep runs within the `<sdm_typography>` bands in `./sdm-building.md` and fix the
geometry or copy instead.
When a run omits `sizePt`, the validator and renderer resolve the paragraph
default before falling back to 18pt.

## Lists: keep formatting paragraph-local

Use one text element for a list and put each item in its own paragraph. The
minimal list item is `bullet` plus `runs`; add `level` for nesting and put
shared typography in each paragraph's `defaultRunStyle`. Omit `bullet` for
plain text. `level` is independent from `bullet`: it may indent a plain
paragraph, and a paragraph at any level may use a character or numbered
marker.

For uniformly spaced lists, repeat `lineHeight` and `spaceAfterPt` on every
item, including the final item. Enter copies the current paragraph's formatting.
Omitted `spaceAfterPt` becomes zero on the next item. Allow room for trailing
spacing in the text frame instead of removing it from the final item.
Use explicit `spaceAfterPt: 0` only when zero spacing is intentional.

```yaml
paragraphs:
  - runs:
      - text: First point
    bullet:
      kind: character
      character: "•"
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
      - text: Nested point
    level: 1
    bullet:
      kind: character
      character: "•"
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

Omit `indentPt` and `hangingIndentPt` unless the design needs custom
geometry. Indentation then advances by 36pt per `level`: a plain paragraph
gets `level * 36`pt, and a marked paragraph adds a 24pt marker gutter
(`indentPt = level * 36 + 24`, `hangingIndentPt = 24`). To change one item's
nesting, change only its `level` (0-8). When a paragraph carries an explicit
`indentPt`, also add `(newLevel - oldLevel) * 36` to it; change nothing else.

The marker inherits the item's text styling: `markerStyle` overrides the
first run's overrides, which override `defaultRunStyle`. Set `markerStyle`
only when the marker must differ from the text (for example an accent-colored
bullet). A paragraph with `bullet` renders its marker even when `runs: []`.
An empty numbered item consumes a number. For a blank spacer, omit `bullet`;
empty plain paragraphs neither advance nor reset numbering.

For numbered lists, repeat the numbered `bullet` on every item and put
`startAt` (1-32767) only on the sequence head. `style` is a numeral family
(`arabic`, `alphaUc`, `alphaLc`, `romanUc`, `romanLc`) plus a suffix
(`Period`, `ParenR`, `ParenBoth`, `Plain`): `romanLcParenR` renders `iv)`,
`alphaUcPeriod` renders `C.`. Unrecognized families render arabic digits with
the matching suffix.

## Text-capacity budget

Budget display text with the same glyph classes as the validator:

| Key | Glyph class | em multiplier |
| --- | --- | --- |
| `whitespace` | Spaces and other whitespace | `0.33` |
| `narrow` | i, l, I, period, comma, apostrophe, backtick, colon, semicolon, pipe, ! | `0.30` |
| `wide` | `M W @ # % &` | `0.90` |
| `cjk` | Code points at or above `U+2E80` | `1.00` |
| `capitalOrDigit` | `A-Z 0-9` | `0.62` |
| `other` | Lowercase and all other glyphs | `0.55` |

Apply the rows top to bottom; the first matching class wins.

Use these equations before writing a frame:

```text
lineHeightUnits = 2 * sizePt * lineHeight
glyphWidthUnits = glyphEmMultiplier * sizePt * 2
textWidthUnits = sum(glyphWidthUnits) + glyphCount * letterSpacingPt * 2
safeLines = floor(availableHeight / lineHeightUnits * 0.85)
```

`availableWidth` and `availableHeight` exclude text insets (`insetsPt * 2`).
The 85% factor leaves room for mixed weights and font-metric differences.
Example: 24pt body copy at 1.2 line height needs about 58 canvas units per
line, so a 300-unit-high frame safely holds four lines, not five.

Real fonts run a few percent wide of the class table, so the validator charges
every measured width a 7% render-safety margin. Your hand-computed widths are
floors: a frame sized to the exact result has no room to render.

At 76pt with no insets or letter spacing, `$980M` measures
`(0.55 + 0.62 + 0.62 + 0.62 + 0.90) * 76 * 2 = 503.12` units, ~539 with the
margin, so it fails a 480-wide frame. `$3.4B` measures
`(0.55 + 0.62 + 0.30 + 0.62 + 0.62) * 76 * 2 = 411.92` units, ~441 with the
margin, and fits with room. For stat and ALL-CAPS strings, budget per glyph,
never per average character.

Validator minimums are floors, not targets. When a message says `widen to
≥539` or `increase the height to ≥371`, land comfortably above the number.
For wrapping, multi-line body copy, keep one spare body line of height; a body
frame that barely passes reopens the loop on the next copy tweak.

`letterSpacingPt` is charged per glyph, spaces included. Tracked headings
overflow much earlier than their untracked glyph widths suggest.

Text always renders at its authored `sizePt`; resizing a frame never changes
font size, and text is never shrunk to its frame. Overflow is visible by
default: text that needs more room spills past the frame edge on the slide and
in exports, and in the workspace editor a text box's frame grows to fit what
the user types. The exceptions are a body with `overflow: "clip"`, which is cut
at its frame, and table cells, which always clip at the cell. Fix overflow by
growing the frame, shortening the copy, choosing an intentional smaller size,
or splitting the slide.

## Validator issue codes

`validate-slides` reports SDM issues as
`<filepath> [<code>] (<elementIds>): <message>`. Table-cell owners use 0-based
ids like `tbl:r0c0` (row 0, declared cell 0 of table `tbl`). The `c` suffix is
the index in that row's `cells` array, not the occupied grid column after spans.
Manifest schema errors are uncoded and name the missing, invalid, or unknown
field plus its repair. When one code, element-id set, and diagnostic message
repeat in multiple slides, the final rollup says to fix every copy in one
batched edit.
Treat every code as a build error:

| Code | Meaning | Fix |
| --- | --- | --- |
| Manifest field (uncoded) | A required manifest field is missing, invalid, blank, or unknown | Follow the field-specific remediation; for a new deck, positions equal the entries' 1-based array order |
| Duplicate ID (uncoded) | Two manifest entries share an `id` | Give each entry and document one stable unique id |
| Duplicate position (uncoded) | Two manifest entries share a position | Renumber the positions to one contiguous `1..N` sequence |
| Position gap (uncoded) | The sorted positions skip a number | Renumber the positions to one contiguous `1..N` sequence |
| `invalid-id` | SDM slide ID contains characters the flat loader cannot resolve | Use only letters, numbers, underscores, and hyphens |
| `manifest-path` | SDM entry's `filepath` is not `src/data/slides/<id>.sdm.yaml` | Rename the file/entry to the exact convention |
| `missing-file` | Manifest references a document that does not exist | Create the file or remove the entry |
| `parse-yaml` | File is not valid YAML | Fix the syntax error at the reported line |
| `unquoted-color` | The document has a `: #...` value; YAML read it as a comment and the value became null | Quote the scalar: `value: "#0F172A"` |
| `schema-invalid` | Document violates the frozen schema, or has duplicate element ids / references to missing assets | Follow the document path in the message |
| `asset-file` | A relative asset `src` has no matching file under `public/` | Add the file at the reported path or fix `src` |
| `theme-token` | A color/font token is absent from this document's theme | Define it in `theme.colors` / `theme.fonts`, or use an inline rgb/family |
| `theme-drift` | A document that uses theme tokens has a different `theme` from the other tokenized documents | Copy one identical theme block into every document that uses theme tokens |
| `unsupported-version` | Document `version` is newer than this tooling | Do not edit the file by hand; regenerate it |
| `canvas-size` | Root `size` is not 1920x1080 | Set `size` to `{ width: 1920, height: 1080 }` |
| `table-span` | A cell's `colSpan`/`rowSpan` exceeds the grid or crosses an occupied cell | Reduce the overlapping spans or add columns/rows |
| `text-overflow` | Text exceeds width, height, or both; the message reports required vs available units and a maximum fitting `sizePt` when safe | Grow only the reported failing axis, landing above the stated minimum — it is a floor, not a target |
| `text-out-of-bounds` | Rendered lines leave the canvas or a clipping group; the message reports each direction and overshoot | Move the frame back by at least the reported overshoot |
| `text-overlap` | Two elements' rendered lines intersect; the message names both ids and the overlap rectangle | Separate one frame horizontally or vertically by the reported amount |
| `list-spacing` | Trailing list items omit `spaceAfterPt` used by preceding matching items | Set the reported spacing on each item, including the final item. Use explicit `0` only for intentional zero spacing |
| `widget-module` | A widget references a module missing from `src/widgets/` | Add the file or fix the `module` path |
| `orphan-file` | A slide document file has no manifest entry | Add the entry or delete the file |

Rotated (`rotationDeg`) and flipped (`flipH`/`flipV`) text is exempt from the
bounds and overlap checks — the line model cannot represent those transforms —
but frame-overflow validation still applies. Do not use rotation or flips to
silence a collision; the deck will still render overlapped.

## Placement rules

Apply these as you write each document. `validate-slides` measures the finished
geometry, so do not build a per-element coordinate worksheet or compare every
pair of frames by hand before writing -- that arithmetic is the validator's job:

- Keep text frames inside the canvas (`x >= 0`, `y >= 0`, `x + width <= 1920`,
  `y + height <= 1080`), and ordinary text inside the safe rectangle. Reserve
  the margins for intentional footers or page numbers.
- Size each text frame from the capacity budget above instead of guessing. Give
  wrapping, multi-line body copy room for one more body line.
- Paint back-to-front: background, image, and shape elements first, text after.
- Leave at least 32 units between independent text regions; prefer 48-80.
- Align related elements on a shared edge or center line -- a label under a
  shape shares that shape's center x, and a row of items shares one y.
- Choose one layout pattern per slide (hero, split, grid, timeline) rather than
  improvising element positions one at a time.

Then run `pnpm run --filter @workspace/<slug> validate-slides` once after the
parallel write and treat every diagnostic as a build error. Apply a fix to a
repeated pattern on every slide that contains it in one parallel edit before
rerunning. If the same code remains on the same element after a fix, stop
patching: re-read the named reference section, recompute, and edit once. Before
a third repair attempt, re-plan instead of blindly patching; validate again
after the re-planned edit and do not finish until it passes. Add `-- --check`
for a report with no file writes. Conflicting or unknown values are never
guessed; fix the reported path yourself. If any slide document or the manifest
changed after the last run, run `validate-slides` again — never present the
deck, take screenshots, or end the turn with errors outstanding.

## Renderer-safe authoring subset

For the no-browser path, prefer text, images including percent crop, lines
including dash/cap/arrowheads, paint and gradient-stop opacity, and simple
tables. Renderer-safe shape presets are `rect`, `roundRect`, `ellipse`,
`triangle`, `rtTriangle`, `diamond`, `parallelogram`, `trapezoid`, `chevron`,
`homePlate`, `rightArrow`, `leftArrow`, `upArrow`, `downArrow`,
`leftRightArrow`, `pentagon`, `hexagon`, `octagon`, `plus`, and `star5`.
`rect` and `roundRect` take an optional `cornerRadius` in canvas units;
`roundRect` rounds at 20 without one, and other presets ignore the field.
`chevron` supports an optional `adjustments.depth` from 0 to 0.5. Unknown
preset names render as rectangles; use `geometry.kind: "path"` when the shape
needs different geometry. Avoid rotated or flipped text and deeply nested
groups — the validator cannot check transformed text, and export fidelity for
those features is not yet proven. Widgets do export — PPTX rasterizes the
rendered SVG, PDF keeps it vector — but the validator cannot see inside one,
so you own a widget's internal layout and legibility; follow
`## Chart and diagram widgets` in `./sdm-building.md`.

Text bodies render unclipped by default (table cells are the exception and
always clip at the cell), so omit `overflow` and reserve `overflow: "clip"`
for a body that must stay inside a fixed frame. Keep the
authored font size intentional and size the frame so `validate-slides` reports
no `text-overflow`; spilled lines are what the audience sees.

