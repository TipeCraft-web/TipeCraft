# Non-Cartesian chart recipes

Read the section for the chosen form: pie/donut, funnel, radar, treemap, or
Sankey. Use the main skill's form-selection rules before choosing a recipe.

## Pie and donut

- Few parts of a whole at one moment → pie, unless a donut is requested.
- Exactly ONE `type: 'pie'` series; data items are `{ name, value }` objects.
- Classification uses ONLY `Array.isArray(series[0].radius)`. Pie uses a scalar
  such as `radius: '60%'` or omits it. NEVER use an array for a pie:
  `['0%', '70%']` still classifies as a donut.
- A donut requires a two-element radius array (e.g. `['35%', '60%']`).
  The hole is pure style; never add center text.
- Labels ALWAYS name the category WITH its value (or value + percent), e.g.
  `"Product A: 25%"`, never a bare percentage.
- Never put visualMap on a pie/donut; it hard-fails.

## Funnel

- Use for sequential stages with drop-off, never parts-of-a-whole.
- The ONLY allowed label key is
  `label: { _numberFormatter: function(value) { ... } }`, never `formatter`.
  Return just the abbreviated value string (K/M/B); the optimizer composes
  the value/percentage/name layout. Do not apply the ordinary series-label
  recipe to funnel labels.
- Colors reinforce the flow: ONE family, dark → primary → light down the
  stages as SOLID colors. For more than three steps, interpolation BETWEEN
  that family's palette hexes is allowed; never mix families in that
  single-family progression.
- Alternative continuous look: a `{top, bottom}` linear gradient per stage,
  with each stage's bottom hex EQUAL to the next stage's top hex
  (e.g. cyan → green, `#61A9BD` → `#44986D`).
- Never default to palette rotation; multi-hue stages break the flow cue.

## Radar

Use for comparing a few entities across several dimensions. Build legends
from multiple series with colors at the SERIES level, not in data items.

## Treemap

- Use for many-part composition (8+ categories) or nesting/hierarchy ("within",
  "subcategories", "grouped under"). Bars cannot show hierarchy; a pie with
  10+ slices is unreadable.
- `type: 'treemap'` is the FIRST and ONLY series. No legend.
- Do NOT color tiles: the renderer auto-colors and discards series-level
  colors; hand-set hexes fight it.
- For grouped/nested data, supply a `levels` array with 2+ entries or parent
  group headers will not render; otherwise keep data FLAT.

## Sankey

Use for FLOW from sources to targets (contributions, transfers, allocations
between stages), not a categorical grid. Set `nodeAlign: 'left'`. Never color
individual links: leave colors to the renderer, or color nodes only with
`lineStyle: { color: 'source' }`.
