# Heatmaps

Use for one value over every pair of two categorical dimensions: region ×
month, product × segment, hour × weekday. If the analysis pivots to a 2-D
table, build the heatmap, not one line per category or unrolled grouped bars.
Flow from sources to targets is a Sankey, not a heatmap.

## Required structure

- First series is `type: 'heatmap'`.
- BOTH axes are `type: 'category'` with explicit `data` arrays, even when a
  dimension is temporal.
- Series data is `[colIndex, rowIndex, value]` triples: x first, not Python's
  `[row, col]` ordering.
- Include a single continuous `visualMap` OBJECT, never an array or piecewise
  map, with `min`, `max`, `dimension: 2`, `text: ['High', 'Low']`, and
  `inRange.color` as an ARRAY of palette hexes.
- The `legend` key must be ABSENT. Even `legend: { show: false }` hard-fails
  against visualMap.
- For a natural row order (hours, months, ranked entities), set
  `yAxis: { inverse: true }` so the first row appears at the top.

## Color ramps

Use sequential ramps for magnitudes; use a diverging ramp with a white
midpoint centered on zero for signed measures or deviations.

Sequential:

- Cyan: `#eef1f2 #cbdfe5 #a7cdd7 #84bbca #61a9bd`
- Green: `#ecf2ee #c1dcce #97c5ad #6dae8d #44986d`
- Blue: `#eff1f3 #bdd1df #8ab1cc #5891b9 #2672a6`
- Red: `#F8F0F0 #F1CBC8 #EA9F9B #E3726F #CE5C5A`
- Pink: `#F6D6EF #F2BAE6 #DD83C9 #A3488F #691C65`
- Purple: `#f1f0f2 #d9cee7 #c1abdc #a989d1 #9267c6`

Diverging:

- Blue/orange: `#2672A6 #FFFFFF #E99F2E`
- Cyan/red: `#61A9BD #FFFFFF #CE5C5A`
- Green/purple: `#44986D #FFFFFF #9267C6`
- Green/red (financial sign only): `#44986D #FFFFFF #CE5C5A`
- Cyan/yellow: `#61A9BD #FFFFFF #CED14E`
