# SDM design language: composing 1920x1080 slides

Use this reference when you plan a deck's visual direction and while you
author every document. `./sdm-layout.md` owns coordinates, capacity math, and
validator codes; this file owns how the deck should look. It gives the
`<direction>` step in `./sdm-principles.md` the tools SDM actually has.

## Design with what exists

SDM has no shadows, no blur, no radial gradients, no textures, and no
filters. Depth and polish come from:

- Type-scale contrast: a 64pt headline over 22pt body does more than any
  effect could.
- Linear gradients (document `background` or shape fills) and per-stop
  `opacity`.
- Tinted panels: a solid fill at 0.06-0.25 opacity over the background, or a
  distinct `surface` color.
- Image `crop`, `fit: cover`, and full-bleed placement.
- Scrims: a solid or gradient shape painted between an image and its text.
- Oversized typographic elements (a giant numeral or word) at 0.05-0.12
  opacity as a background layer.
- Whitespace held by a real grid.

Never simulate a missing effect. No stacked gray rectangles as "shadows", no
faint ellipses as "glows", no noisy shape piles as "texture". If an idea
needs blur or a shadow to work, pick a different idea.

## Motif system

Decoration is unlimited when it is systematic and banned when it is random.

- In your planning text, declare 1-2 recurring motifs for the deck. A motif
  is a repeatable treatment: an accent-bar family, an image frame treatment,
  an edge-bled color block, a thin rule under titles, an oversized index
  numeral, a cropped ellipse that bleeds off one edge.
- Repeat each motif with variation: keep its color role and geometry family
  fixed; vary scale and position with the layout.
- Every decorative element must do a job you can name:
  - **Frame content.** Framing images is encouraged: an offset `roundRect`
    behind a photo, a tinted panel that extends past an image edge, a corner
    block that overlaps it, a duotone color field under a cutout.
  - **Divide or structure**: rules, bars, and blocks that separate regions or
    carry the grid.
  - **Anchor**: a shape that holds a stat, label, or headline (an accent bar
    over a title, a numeral block beside a step).
  - **Bleed**: a shape cropped by the canvas edge that shapes the
    composition.
- A shape with no motif and no job is a floater. Floaters read as rendering
  artifacts: never drop a small circle, ring, or dot into open space or onto
  a photo as filler. Clean whitespace beats a random shape.
- Text over any image gets a scrim between image and text in paint order.

## Shapes frame; widgets and images depict

Everything above stays encouraged -- panels, scrims, accent bars, edge
bleeds, image frames, and oversized numerals give the deck its texture and
life -- and a small labeled structure (three to five boxes joined by arrow
presets or a `line` connector, sitting on the grid) is still shape work.
The line is depiction: a shape assembly is never the picture itself.

- Quantitative data (a trend, comparison, or share of total) gets a real
  chart: a recharts widget under `src/widgets/` -- the authoring contract
  is `## Chart and diagram widgets` in `./sdm-building.md`. Never eyeball bar
  lengths or pie wedges out of shapes; the geometry lies about the data.
  Tabular numbers go in a `table` element, and a single hero number is
  the big-stat recipe, not a chart.
- A diagram past that small labeled flow (architecture, multi-step flow,
  org chart) is widget work too: hand-placed shape grids drift out of
  alignment and read as clip art.
- Pictorial content -- photography, scenes, product and mood imagery,
  textured artwork, cutout subjects -- comes from generated or searched
  images, never a shape collage. The reverse holds as well: never
  generate an image of a chart or a labeled diagram; text inside
  generated images is unreliable.

Never simulate, same as the effects rule above: a chart, a diagram, or a
picture gets the tool that actually draws it.

## Deck constants

Decide these once in planning and reuse them in every document:

- **Theme**: one `theme` block, byte-identical in every document
  (`validate-slides` reports divergence as `theme-drift`). Use role-named
  tokens: `background`, `foreground`, and `accent` at minimum; add `surface`
  (panels, cards) and `muted` (secondary text) when the deck uses them.
  Inline `rgb` values are for one-off gradient stops only -- text,
  backgrounds, fills, and strokes go through tokens.
- **Grid**: one margin (96, 120, or 144 units), one content-top line, and a
  small set of recognizable header styles. Whenever a header style repeats,
  reuse its exact title frame and `sizePt`. Variation can come from switching
  deliberately between those styles and from the content below.
- **Type roles**: one `sizePt` each for body, caption, and stat from the
  bands in `<sdm_typography>` (`./sdm-building.md`); do not drift those sizes
  slide to slide.
  Titles are sized per header style, not deck-wide: a content title (slide
  headline band, 30-44pt), a hero or statement title (48-68pt), and a
  section title (48-64pt) are distinct styles that may differ from each
  other, while every slide using the same style shares its one `sizePt`.

## Designed, not templated

Use these as taste checks, not as a recipe. Keep the deck's palette, type,
grid, and motifs coherent, then adapt each composition to its content. When
the Professional theme is selected, `./professional.md` adds the situational
guidance that shapes these choices.

- **Clear type roles.** Make headlines, body, and labels or accents distinct
  through scale, weight, case, tracking, and spacing -- not extra font
  families. Prefer a sans body and use serif selectively rather than across
  every role. Large or oversized titles are welcome when the title is the
  visual idea -- give those slides the hero or statement title style. On
  routine content slides, keep titles from crowding or competing with the
  image, stat, chart, or body; not every slide needs title-slide scale.
- **Visual substance, when it helps.** Avoid slides that are just text plus a
  couple of rules. Look for a content-bearing visual layer: photography,
  framed imagery, a panel or scrim, useful arrows, a photo pair or trio, a
  chart or table, an oversized number, or an intentional edge bleed.
  Typography-only slides and open whitespace can still be the strongest
  choice; never add decoration only to satisfy this guidance.
- **Spacing with hierarchy.** Keep ordinary content away from the edges and
  use tighter gaps within a group than between groups. Avoid giving every
  gap the same value or repeating full-width bands and cards until the slide
  reads as stripes.
- **Consistent anchors, varied compositions.** Reuse the exact placement when
  a header style repeats, while allowing other header positions and layout
  families elsewhere in the deck. Choose split, grid, stat, photo, table,
  chart, or flow layouts to fit the content, and avoid pouring a long run of
  slides into the same shell.
- **Photography when the subject calls for it.** Prefer photos over generic
  vector art when depicting a real product, person, place, or mood. Logos use
  original sourced files, including SVGs, never agent-drawn substitutes.
  Icons and illustrations remain useful for diagrams or an intentionally
  graphic art direction. Keep imagery related through crop, color, or
  framing only where the source-asset protections in `./sdm-principles.md`
  allow it.

## Typography

The `sizePt` bands, weight rules, and font-selection rules live in
`<sdm_typography>` in `./sdm-building.md`. SDM specifics:

- Prefer families from the built-in registry table -- they load everywhere
  with zero setup. A family outside the registry needs a Google Fonts css2
  `<link>` in `index.html` covering every weight any document uses; without
  it the browser silently substitutes a default font.
- `letterSpacingPt`: -0.5 to -1.5 on display text 48pt and up; +0.5 to +2 on
  short ALL-CAPS labels 17pt and under; 0 for body. Tracked text overflows
  earlier -- see the capacity budget in `./sdm-layout.md`.
- Pairing seeds by mood (all registry families; seeds, not defaults -- vary
  across decks): corporate Archivo + Lato; editorial Playfair Display + Work
  Sans; tech Space Grotesk + Manrope; data Archivo + JetBrains Mono for
  figures; warm Lora + Nunito; bold Anton or Bebas Neue + Libre Franklin;
  luxury EB Garamond + Montserrat.

## Frame recipes

Starting geometry for the five workhorse compositions, using margin 120.
Recipes are skeletons: keep the proportions, then move the knobs so decks do
not repeat each other. The cover recipe is the worked example in
`<sdm_documents>` (`./sdm-building.md`).

**Split (image + content)**

| Element | Frame | Notes |
| --- | --- | --- |
| image | x 960, y 0, w 960, h 1080 | `fit: cover`; scrim if text overlaps |
| title | x 120, y 160, w 720, h 160 | 36-44pt, weight 700 |
| body | x 120, y 360, w 680, h 480 | 20-24pt, one idea per paragraph |

Knobs: image side (left or right), image width 760-1080, text alignment,
motif placement (accent bar over title, frame behind image).

**3-up grid (cards)** -- complete document; also the panel recipe (tinted
`surface` fill + `insetsPt`, no fake shadows):

```yaml
format: replit.sdm
version: 1
size:
  width: 1920
  height: 1080
background:
  kind: solid
  color:
    kind: token
    token: background
theme:
  colors:
    background: "#F5F2EA"
    surface: "#FDFCF9"
    foreground: "#20242B"
    muted: "#6B7280"
    accent: "#C75B39"
  fonts:
    display: Archivo
    body: Lato
elements:
  - id: titleAccent
    type: shape
    frame:
      x: 120
      y: 96
      width: 56
      height: 8
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
      y: 128
      width: 1200
      height: 120
    body:
      paragraphs:
        - runs:
            - text: Platform highlights
          defaultRunStyle:
            font:
              kind: token
              token: display
            sizePt: 38
            weight: 700
            color:
              kind: token
              token: foreground
          lineHeight: 1.1
  - id: cardOne
    type: shape
    frame:
      x: 120
      y: 320
      width: 533
      height: 520
    geometry:
      kind: preset
      preset: roundRect
      cornerRadius: 16
    fill:
      kind: solid
      color:
        kind: token
        token: surface
    body:
      insetsPt:
        top: 16
        right: 16
        bottom: 16
        left: 16
      paragraphs:
        - runs:
            - text: Fast setup
          defaultRunStyle:
            font:
              kind: token
              token: display
            sizePt: 24
            weight: 700
            color:
              kind: token
              token: foreground
          lineHeight: 1.2
          spaceAfterPt: 10
        - runs:
            - text: Live in minutes with defaults that hold up.
          defaultRunStyle:
            font:
              kind: token
              token: body
            sizePt: 19
            color:
              kind: token
              token: muted
          lineHeight: 1.3
  - id: cardTwo
    type: shape
    frame:
      x: 693
      y: 320
      width: 533
      height: 520
    geometry:
      kind: preset
      preset: roundRect
      cornerRadius: 16
    fill:
      kind: solid
      color:
        kind: token
        token: surface
    body:
      insetsPt:
        top: 16
        right: 16
        bottom: 16
        left: 16
      paragraphs:
        - runs:
            - text: One source of truth
          defaultRunStyle:
            font:
              kind: token
              token: display
            sizePt: 24
            weight: 700
            color:
              kind: token
              token: foreground
          lineHeight: 1.2
          spaceAfterPt: 10
        - runs:
            - text: Every team reads from the same data.
          defaultRunStyle:
            font:
              kind: token
              token: body
            sizePt: 19
            color:
              kind: token
              token: muted
          lineHeight: 1.3
  - id: cardThree
    type: shape
    frame:
      x: 1266
      y: 320
      width: 533
      height: 520
    geometry:
      kind: preset
      preset: roundRect
      cornerRadius: 16
    fill:
      kind: solid
      color:
        kind: token
        token: surface
    body:
      insetsPt:
        top: 16
        right: 16
        bottom: 16
        left: 16
      paragraphs:
        - runs:
            - text: Built-in review
          defaultRunStyle:
            font:
              kind: token
              token: display
            sizePt: 24
            weight: 700
            color:
              kind: token
              token: foreground
          lineHeight: 1.2
          spaceAfterPt: 10
        - runs:
            - text: Changes ship with an audit trail.
          defaultRunStyle:
            font:
              kind: token
              token: body
            sizePt: 19
            color:
              kind: token
              token: muted
          lineHeight: 1.3
```

Knobs: 2-4 columns, card fill (surface fill vs stroke-only), a numeral or
icon slot above each label, card height, gap width. This document's palette
and fonts are placeholders -- bring the deck's own theme.

**Big stat**

| Element | Frame | Notes |
| --- | --- | --- |
| stat | x 120, y 340, w 1100, h 280 | 84-112pt, weight 800, accent or foreground |
| context | x 120, y 660, w 900, h 200 | 22-24pt, muted |
| motif | edge or behind stat | e.g. oversized numeral at 0.05-0.12 opacity |

Knobs: alignment (left or centered), one stat vs a 2-3 stat row, motif
choice.

**Section divider**

| Element | Frame | Notes |
| --- | --- | --- |
| index label | x 120, y 300, w 400, h 60 | 14-17pt ALL CAPS, tracked +1 to +2 |
| section title | x 120, y 380, w 1400, h 240 | 48-64pt, weight 700-800 |
| motif | edge-bled block or bar | strongest motif moment in the deck |

Knobs: background treatment (solid accent, gradient, or edge-bled block),
alignment, whether the deck's motif carries the slide.

## Element recipes

`./sdm-recipes.md` holds validated `elements:` fragments for footer and
page-number chrome, a kicker header, a three-column stat row, a multi-run
emphasis paragraph, and a section divider. Read it when you want one of those
shapes ready-made; each fragment shows the compact schema shape and minimum
dimensions, and its placement and styling adapt to the deck.

## Deriving the theme from a design system or brand tokens

When the workspace has a design-system artifact, the user attached brand
CSS, a sibling app defines tokens, or `extractBranding` returned results,
the deck's `theme` derives from those tokens. CSS and Tailwind never style
SDM elements, so translate values into the theme block -- never import them.

| Source token | Deck theme target |
| --- | --- |
| `background` (tokens.json color role, `--background`, site background) | `theme.colors.background` |
| `card` / `secondary` / `--card` | `theme.colors.surface` |
| `foreground` / `--foreground` / body text color | `theme.colors.foreground` |
| `mutedForeground` / `--muted-foreground` | `theme.colors.muted` |
| `primary` (brand color) / `--primary` | `theme.colors.accent` |
| `chart1`..`chart5` | table/widget data colors |
| sans/serif/mono families (`--font-sans`, brand typography) | `theme.fonts.display` / `theme.fonts.body` |
| radius token | `cornerRadius` on card/panel shapes |
| shadow tokens | drop them -- see "Design with what exists" |

Rules:

- A design-system artifact's `tokens.json` (or `src/generated/tokens.tsx`)
  is the source of truth; a sibling app's `index.css` `:root` custom
  properties or Tailwind `@theme` block work the same way.
- Pick ONE mode -- the `light` or `dark` token set -- for the whole deck
  from the supplied or verified source. Do not invent a missing mode.
- Convert opaque colors to `#RRGGBB` without changing hue, saturation, or
  brightness; resolve HSL or channel triplets first. Reuse the exact values
  in widget props.
- **Transparency:** SDM theme tokens accept only opaque `#RRGGBB`. Never
  drop or composite alpha to fit the schema. Use a verified opaque token
  for the same role; otherwise disclose the limitation and request an
  approved opaque alternative if that role is required.
- Fill only missing roles; label added neutral/data colors as design choices,
  not brand colors. Fix contrast through layout or source-approved pairings,
  not altered brand values.
- Check each font family against the registry table; families outside it
  need the `index.html` link described in Typography above.

## Assets

Every referenced file must live under `public/`, normally `public/images/`.
Copy files from `attached_assets/` there, sanitizing SVGs first as below.
Document `assets` paths are relative to `public/` (`src: images/hero.jpg`);
SDM has no `@assets` alias or import syntax.

- **Raster logos and uploaded rasters:** copy the original file byte-for-byte.
- **All sourced or uploaded SVGs:** before publishing under `public/`, use an
  SVG sanitizer to create a static copy without scripts, event handlers,
  `foreignObject`, or external references. Preserve paths, colors, proportions,
  and transparency. Verify unchanged appearance in a static, network-disabled
  preview; never open or serve the untrusted original. Keep uploaded originals
  outside `public/` and record the derivative and sanitization in planning.
  If faithful sanitization fails, disclose it and omit the asset or request a
  safe original.
- **Logos and uploaded visuals:** use an image element with `fit: contain`,
  no crop, and proportional scaling. Keep the full asset visible with its
  colors and transparency unchanged: no opacity, tints, masks, filters, or
  obscuring overlays. Place text beside it or on a separate panel, not on a scrim
  over it. Only an explicit user request permits a visual edit; keep the original.
- **Logo contrast:** use a verified original light/dark variant or change the
  surrounding panel; never recolor or invert the mark. Keep generated imagery
  separate from the logo and never recreate the mark within it.

