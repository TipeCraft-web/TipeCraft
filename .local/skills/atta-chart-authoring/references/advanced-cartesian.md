# Advanced Cartesian charts

Read for stacked or diverging bars/columns, stacked areas, waterfalls, and
column + line dual-axis combinations. Keep the requested bar/column
orientation; long labels do not justify flipping these forms.

## Stacked bars, columns, and areas

- One series PER PART, each named for the legend and sharing the SAME `stack`
  string. The most important part sits on the baseline (first series).
- Use category axes for entities and a time x-axis for temporal columns.
  Stacked time series need explicit `[timestamp, value]` points on the same
  sorted timeline in every series. Use `[timestamp, null]` for missing
  observations; do not omit timestamps.
- In time-column stacks, string timestamps need an explicit timezone (`Z` or
  an offset). Prefer `2026-01-01T00:00:00Z` or numeric epoch milliseconds, not
  bare dates like `2026-01-01`. `useUTC: true` controls display formatting;
  it does not make timezone-less inputs unambiguous.
- When shares sum to 100% at every position, normalize in the builder and
  label the axis "%" (100% variant). Never add a "Total" series.
- Stacked areas use the same recipe with `type: 'line'` and `areaStyle: {}`
  per series, `type: 'time'` on x, and a zero baseline.
- A single series with `stack` is already classified as STACKED. Mixed stack
  names hard-fail. Never give a stacked series
  `itemStyle.color: 'transparent'`: that is reserved for waterfalls and
  reroutes classification.

## Waterfall

- Build a stacked bar pair: an invisible base series with
  `itemStyle: { color: 'transparent' }` and cumulative offsets beneath the
  visible changes, making each bar float from the running total.
- Include start/end total bars anchored at zero; never resort the steps.
- Name the invisible series `"placeholder"` and set
  `legend: { show: false }`; the placeholder must NEVER appear in a legend.
- All series share one `stack`. Color visible bar data individually through
  `itemStyle.color`: one palette hue for gains, another for losses, grey for
  start/end totals. Red/green only for financial data. One series-level color
  would incorrectly make every change bar identical.

## Diverging (signed) bars

Keep values signed in `series.data` so bars extend both ways. Encode sign
with one palette pair (e.g. blue/orange; red/green only for finance).
No legend is needed when the sign encoding is self-evident.

## Dual-axis combo

- `comboDualAxis` is columns (or stacked columns) for magnitude plus a LINE
  for the rate/secondary measure on the RIGHT y-axis. Two lines is not a combo;
  horizontal bars + line is unsupported.
- When a combo contains bars, BOTH y-axes start at zero.
- Stacked columns use monochromatic colors from ONE palette family, darkest
  first, and a different color for the line.
- A single-family progression needing more than three steps may interpolate
  BETWEEN that family's dark/primary/light palette hexes. Stretch the family,
  never mix families.
