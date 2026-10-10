# Report layout

These are composition principles, not a page template. Choose the structure
and visual style that make this report's argument easiest to follow.

## Reading order

- Give the report a clear title and a short statement of scope. Use section
  headings that describe the finding or question, not generic numbered panels.
- Place each chart beside its interpretation, source, and important caveats.
  Keep units and periods consistent between chart titles, tables, and prose.
- Use semantic headings, paragraphs, lists, tables, and figure captions.
  A long report may need anchor navigation; a short report usually does not.
- Include recommendations only when supported and useful. Do not manufacture
  advice or a causal explanation just to fill a section.

## Typography and space

- Establish a deliberate type hierarchy and readable line lengths. Use system
  fonts or inline font assets; do not add another remote dependency.
- Use spacing and alignment to group related evidence. Cards, columns, and
  backgrounds are choices, not requirements. Avoid decorative KPI tiles that
  repeat the same number without adding context.
- Keep chart containers fluid, with explicit nonzero heights suited to their
  content. Use `previewWidthPx` and `previewHeightPx` from `validateChart`
  as starting dimensions, not a fixed report width.
  Do not scale charts with CSS transforms to make them fit.
- Collapse multi-column layouts on narrow screens. Allow text to wrap and use
  `min-width: 0` on grid/flex children. Wide data tables can have their own
  horizontal scroll area; the entire report should not require side-scrolling.

## Accessibility and themes

- Use adequate contrast and do not communicate a finding through color alone.
  Give charts an accompanying text summary; retain exact values in tooltips
  or a compact table when the reader needs them.
- Any controls must have labels, keyboard support, and visible focus states.
  Do not add filters, tabs, export buttons, or a theme switch without a reason.
- Keep page colors and chart themes consistent. Use the embedding reference's
  host-theme/OS fallback when adapting to the viewing environment. If the
  user explicitly requests a fixed light or dark design, match all charts to it.
- Do not hide narrative while JavaScript loads. A failed chart should show a
  concise message in its own section, not leave the entire report blank.
