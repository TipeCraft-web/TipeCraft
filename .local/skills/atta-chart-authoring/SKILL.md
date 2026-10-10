---
name: atta-chart-authoring
description: Use this skill to visualize data — trends, comparisons, composition, distributions, relationships, flows, uncertainty, or any other quantitative pattern. Load before creating any chart.
---

# Atta chart authoring

For a standalone chart, you author exactly two files — baked chart data and
an option-builder function.
The system validates them and assembles the final `.chart.html` document with
an immutable Atta runtime. Never write standalone chart HTML yourself, except for the
unavailable-assembly fallback below.

For charts inside an Agent-authored HTML report, load `html-report-authoring`
and `references/report-embedding.md` instead of the standalone delivery step.
You still author and validate each data/builder pair, but embed them in the
report's own HTML. All chart-selection and option rules below still apply.

Atta is a custom ECharts fork with an optimizer. Author a standard, minimal
ECharts option; the optimizer handles layout, spacing, margins, dark/light
themes, and label colors. It auto-hides overlapping labels. Do not set
backgroundColor, spacing, margins, or splitlines, or force crowded labels.

## Workflow

Plan mode does not permit chart file creation. In Plan mode, do not author
chart files or call `presentAsset` with `chartSource`. Give a concise text
summary or a table with at most 10 rows, and offer to create the visualization
in Build mode.

1. **Inspect the data you already hold.** Start from a JavaScript value
   produced by earlier steps — never re-fetch inside the chart. Verify row
   count, keys/columns and inferred types, sample rows, null/missing cells,
   ranges (min/max/sum), and whether a share column already sums to 100.
   Compute the exact figures you will visualize; never guess a value.
2. **Choose the form**, then **read only the applicable references** below.
   Follow the relevant recipes exactly; do not load every reference by default.
3. **Author the two source files** using the contract below. The builder stays
   executable source: function-valued options (formatters, labelLayout) must
   never be serialized through JSON.
4. **Deliver** via
   `await presentAsset({ filePath: ".local/outputs/<name>.chart.html", title, description, chartSource: { builderPath: ".local/outputs/<name>.chart.js", dataPath: ".local/outputs/<name>.chart.json" } })`.
   Set `title` to the `text` of the builder's first title item.
   The system validates the builder against the data and writes the
   `.chart.html` document itself. Always deliver a chart: a defensible
   imperfect chart beats no submission. Never leave the builder empty.
   If the callback says Atta assembly is unavailable in the sandbox, create a
   self-contained static `.html` visualization or SVG. Use a normal `.html` or
   `.svg` path, not `.chart.html`, and present it without `chartSource`.
   Do not load external scripts or chart runtimes in this fallback.

## Conditional references

Paths are relative to this skill's directory. Read every reference that
applies to the chosen chart; these are recipes, not additional chart types.

| When the chart calls for… | Read |
| --- | --- |
| Embedding charts in a single-file HTML report rather than presenting standalone chart cards | `references/report-embedding.md` |
| An extreme, turning point, named threshold, or highlighted time window using markPoint / markLine / markArea | `references/annotations.md` |
| A grid / matrix / heatmap | `references/heatmap.md` |
| Stacked or diverging bars/columns, stacked areas, waterfall, or a column + line dual-axis combo | `references/advanced-cartesian.md` |
| Pie/donut, funnel, radar, treemap, or Sankey | `references/non-cartesian.md` |
| Split/paired/pyramid bars | `references/split-bar.md` |
| Forecasts, intervals, uncertainty, regression, or smoothed metrics | `references/confidence-band.md` |

## Choosing the form

Match the form to the data's job; never substitute an easier chart.

| Data's job / request | Form |
| --- | --- |
| One metric across categories at a point in time | Plain columns by default; horizontal bars for ranking, long labels, or many categories |
| Several series of ONE metric on a shared value axis (budget vs actual, 2023 vs 2024 sales) | Grouped bars/columns, never split-bar |
| Parts of a whole at one moment: "share", "breakdown", "mix", "proportion", "% of total" | Pie/donut with few parts (≤5); treemap for many categories (8+) or hierarchy |
| Composition evolving over time | Stacked area or stacked columns, not separate lines that lose the whole |
| A few entities profiled across several dimensions | Radar, not grouped bars per dimension |
| One value for every pair of two categorical dimensions ("by X and Y", region × month, hour × weekday) | Heatmap; if the analysis pivots to a 2-D table, do not unroll it into lines or grouped bars |
| Sequential stages with drop-off (leads → qualified → closed) | Funnel, never for parts-of-a-whole |
| Relationship between two measures | Scatter with uniform sizes; bubble only for a real third variable encoded as size |
| Running total with signed steps (P&L, cash flow, bridges) | Waterfall, with start/end totals as anchor bars |
| Single metric over time framed as volume, accumulation, or an explicit area request | Line with `areaStyle: {}`; the fill is mandatory |
| Values that hold steady then jump (rates, policy levels, tariffs, tiers) | Line with `step: 'end'`; required for level-change requests |
| Flow from sources to targets (contributions, transfers, allocations) | Sankey, not heatmap |

- Split-bar is for separate value-axis panels: different metrics side by side,
  survey/Likert response-option distributions, or an opposing pair as a pyramid.
  A single metric is plain bar/column; several series of one metric are grouped;
  composition is pie and many-part/hierarchical breakdown is treemap.
- Forecasts, regressions, and model estimates should show uncertainty when
  defensible bounds exist in the data or can be calculated from a valid
  statistical model. Never invent bounds. Without a defensible interval, plot
  the point estimate and state that uncertainty is unavailable. Bands are a
  technique beside a line/scatter series, also for rolling averages and
  smoothed metrics; follow the confidence-band reference.
- Plot only what serves the request. Do not add averages, totals, trends,
  projections, or extra comparisons that were not asked for. If a series is
  not named in the headline or request, cut it.

## Source and data contract

`<name>.chart.json` contains baked, plain JSON, for example:

```json
[{"name": "Alpha", "value": 10}, {"name": "Beta", "value": 14}]
```

`<name>.chart.js` is ONE JavaScript function from that data to a standard
ECharts option. The whole file is the function: no imports, surrounding
statements, or trailing call.

```js
function buildOption(data) {
  // return a standard ECharts option; function-valued formatters allowed
  return { /* ... */ };
}
```

Write both from CodeExecution (`"use impure"`) so notebook data flows into JSON
without retyping values. PID2 resolves and verifies an immutable runtime,
validates the builder with it, and embeds that same runtime in the result.
The builder runs identically with parsed data as its only argument in the
validator and browser. It must be self-contained: no external requests,
`fetch`, DOM access, or globals beyond that argument; the document runs in a
cross-origin sandbox.

- Bake RAW, unrounded values. Rounding, abbreviation, and units belong in
  display-time formatter functions.
- Series data determines geometry: negative bars need negative data values;
  formatters change text, never visuals. Backend data is immutable: copy with
  `[...data]` before sorting or reversing.
- No `undefined`, `NaN`, or `Infinity` in JSON — use `null`.
- Category axes take explicit `data` arrays. Time axes take
  `[timestamp, value]` series points, not `xAxis.data`; use numeric epoch
  milliseconds or ISO strings. Convert year/quarter labels to concrete dates.

## Validator and renderer constraints

Violations reject the chart; nothing renders. Chart-specific references
contain additional structural constraints and exceptions.

- Only these optimizer forms are supported: singleBar, groupedBar, stackedBar,
  singleLine, multiLine, singleArea, stackedArea, scatter, bubble, pie, donut,
  heatmap, radar, treemap, sankey, funnel, comboDualAxis, and the split-bar
  technique. Mekko, boxplot, and small multiples are NOT supported — use the
  nearest supported form.
- Every series needs a standard `type`. No `graphic` components. A custom
  `renderItem` series is allowed ONLY for the confidence-band technique, as an
  auxiliary `custom` series beside a line or scatter, never a replacement
  for a standard chart type.
- `visualMap` is only (and always) for heatmaps and must be continuous, never
  piecewise. `visualMap` and `legend` must NEVER coexist; even
  `legend: { show: false }` counts. Other forms use separate series and a
  legend for categorical color coding, not visualMap.
- On Cartesian charts, declare BOTH axis `type` strings explicitly. Never
  wrap xAxis/yAxis in arrays for a single-axis chart or write `inverse: false`
  (omit it; false is misread as inverted).
- Orientation is determined only by the axis types: columns have category/time
  x + value y; horizontal bars have category y + value x. Swap axis types to
  change orientation; data shape and label lengths cannot do it.
- Bubble is `type: 'scatter'` with a `symbolSize` function of the third
  variable, never `type: 'bubble'`. Numeric scatter/bubble axes are value/log,
  never category; temporal x is time, y remains value/log.

## Common chart mechanics

- For a plain single metric, ≤10 categories with names ≤12 characters and no
  ranking request means VERTICAL columns. Horizontal bars require long labels,
  many categories, or a ranking. Discrete totals over time default to columns.
- Stacked, diverging, and grouped forms KEEP the requested orientation:
  "column" keeps entity/time on x; "bar" keeps categories on y even with short
  names. For long column labels, rotate or truncate instead of flipping.
- Ranked categorical y-axes render bottom-to-top: reverse the data OR set
  `yAxis: { inverse: true }`, never both, so #1 appears at the top.
- Use `type: 'time'` for temporal line, area, column, and scatter x-axes,
  including months, quarters, and years. Preserve elapsed-time spacing; do not
  use category axes just to change labels. Heatmaps are the exception: both
  dimensions are category axes.
- Prefer automatic date labels. If context is insufficient, use native
  templates such as `'{MMM} {d}'`, `'{MMM} {yyyy}'`, or `'{HH}:{mm}'`.
  Numeric automatic labels may be days of the month, not point indices.
  Custom date formatters must handle numeric epoch milliseconds even when the
  input data uses ISO strings.
- Bars, columns, areas (single/stacked), and step lines start at zero:
  truncating magnitude-encoding ink distorts it. In a dual-axis combo with
  bars, BOTH y-axes start at zero. Plain-line and scatter axes scale to the
  data (`scale: true`); for scatter/bubble absolute-magnitude comparisons where
  zero is meaningful, use `scale: false` on that axis.
- Lines use `showSymbol: false` unless sparse (<10 points).
- Annotate only the request's extreme, threshold, or window, otherwise no
  markers. Read the annotations reference before adding any marker.

## Layout, titles, and legends

- Title is exactly TWO OBJECTS, in sentence case. The first holds an insight
  headline and supporting subtext; the second is the footer:
  ```javascript
  title: [
    { text: "Brazil pulls ahead in coffee exports", subtext: "Annual export volume by origin" },
    { text: "2015–2024 shipments, grouped by country; incomplete 2024 months excluded" }
  ]
  ```
  Never use bare strings. Write text for the chart at hand.
- The footer names the covered period and applied transformations (filters,
  grouping, units). Disclose sampling, truncation, or filtering in the builder
  ("top 20 of 143 shown", "incomplete months excluded"); never silently sample.
- Legends are required for 2+ series or color-coded data, especially grouped
  bars/columns. Omit for one series; use `legend: { show: false }` to force-hide.
  Heatmaps must omit the key entirely. Honor the form-specific reference and
  the highlight/endLabel exceptions below.
- Bar/column data items with a `name` field get legend entries (pie-style).
- Let the renderer manage label density. ONLY when one label is the explicit
  ask (stacked total, combo line value, named endpoint), set
  `hideAllLabelsOnOverlap: false` at that ONE series' ROOT, beside
  `label: { show: true, formatter }`, never inside label or on every series.

## Color

- Use ONLY this palette, in order; primary first, secondary/tertiary only for
  high cardinality:
  Primary: #61A9BD cyan, #CED14E yellow, #44986D green, #DD83C9 pink,
  #1F74AD blue, #E98E2E orange, #9267C6 purple, #8D6C5B brown, #D8524F red,
  #979797 grey.
  Dark: #3C7686, #A3A537, #2E6B4D, #A3488F, #154C75, #AB6821, #6E45A3,
  #684736, #973130, #666666.
  Light: #8CCEDE, #EDED96, #88C3A3, #F2BAE6, #71A5D2, #FAB770, #BFA2E0,
  #AD8F80, #F59A98, #C1C1C1.
- Single color is the default for bars/columns, single-series lines, and
  scatter/bubble. Never color bars merely to distinguish categories. A plain
  single-series bar/column uses one series-level color, not per-datum colors.
- Highlight at most 1–2 bars: primary versus the same family's light variant;
  if contrast is weak, use dark versus light. Hide the legend. Muting and
  highlighting use SOLID palette hexes, not opacity/transparency.
- Red/green are reserved for financial gains/losses. Other opposites use
  blue/orange or cyan/red; never red/green outside finance or red for generic
  emphasis.
- Copy palette hexes verbatim; never invent, blend, or interpolate them. The
  single-family progression exception (funnel/stacked combo) and heatmap ramps
  are specified in their conditional references.

## Formatting and labels

- Custom formatters are regular functions, never arrows, and return strings.
  Time labels can use automatic formatting or native date templates; other
  custom labels must not use placeholder templates such as `'{b}'` or `'{c}'`.
- Series labels are mandatory: `label: { show: true, formatter: ... }`, not a
  formatter alone. Specialized references describe exceptions (e.g. funnels
  and markPoint); line endLabels replace per-point labels as described below.
- Use ONE shared formatter helper for value axes and series labels: same
  units, K/M/B abbreviation, and precision. Default to 0 decimals; max 2 when
  precision matters. Decimals otherwise only for values under 10 when needed
  ("3.2%", "$4.99"). If abbreviation collapses distinct values (1,234 and 1,456
  both becoming "1K"), add a decimal to distinguish them.
- Never mix units/formats on an axis. Ratios DISPLAY as percentages ("23%",
  not "0.23"); scale ×100 in the builder when the geometry encodes share.
- Axis names, when used, carry the real compact unit, not "Value"/"Amount":
  left y "↑ Revenue (USD B)", right y "Share (%) ↑", x "Name →".
- Always include a tooltip with a null-checked function formatter showing FULL
  detail: units and unabbreviated values. Handle array params and
  `if (!params) return '';`; for scatter/bubble use
  `Array.isArray(params.value) ? params.value[1] : params.value`.
- Dense line/area series (10+ points) label selectively through formatter
  logic (first/last/extremes), never every point.
- Scatter/bubble labels name ENTITIES, never coordinates or sizes:
  `show: true`, `position: 'top'`. When crowded, label extremes, outliers, or
  named entities and return `''` for the rest. Separate series per category
  when categories matter; color functions don't produce legend entries.
  Bubble sizes stay within a 3:1 to 5:1 ratio.
- When a line story is about the latest value, final ranking, or endpoint,
  use `endLabel: { show: true, formatter }` with the series name and final
  value when relevant. Use INSTEAD of per-point labels, never both.
  Multi-line charts with endLabels can omit the legend.

## Before delivering — verify

- Form matches the request; applicable references were read; standard series
  types and explicit axis types satisfy the structural constraints.
- No legend + visualMap together; continuous visualMap only/always on heatmaps.
- Numeric scatter/bubble axes are value/log; temporal x is time, except
  heatmaps. Inspect actual runtime date labels for clear context and
  proportional spacing of irregular observations.
- Single color unless multiple series or deliberate highlight; palette hexes;
  red/green only for finance; markers only for the request's story.
- Custom formatters are regular functions returning strings; axis/label
  formats match; tooltip is null-checked and shows full detail.
- Title is exactly `[{ text, subtext }, { text }]`, sentence case, with period
  and transformations disclosed in the footer. Legend follows the form's rules.
- Re-derive the headline's number, direction, or leader from the builder's
  ACTUAL returned data in this session, not just the raw table. Print the
  figure, compare it with the headline, and fix any disagreement.
