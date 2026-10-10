# Annotations: markPoint, markLine, markArea

Read when the request centers on an extreme, turning point, threshold, target,
or named time window. Annotate the story, decorate nothing:

- Extreme, record, or turning point → markPoint.
- Named threshold, target, or reference level → markLine.
- Time window or era (downturn, policy period, before/after an event) → markArea.
- Otherwise NO markers; do not add an average line or annotation "to enhance"
  a chart whose story is elsewhere.
- At most ONE marker per chart, only when the request itself names the
  extreme, threshold, or window; when in doubt, none. A requested markArea is
  the answer, not optional decoration: draw the shaded period.

## markPoint

- Only `symbol: 'arrow'` is allowed; `symbolRotate` is REQUIRED:
  0 up, 180 down, 90 left, 270 right.
- Labels need a `position` (e.g. `'top'`) to render; keep them short.
- Set `label: { show: false }` on the series when using markPoint.

## markLine

- Symbol must be `'none'` or `['none', 'none']`.
- On LINE and SCATTER charts, use short labels INSIDE the plot at
  `position: 'insideEndTop'`, never `'start'` or an outside position such as
  `'end'`. Axes can sit on any side; outside labels collide with axis text.
- On bars and columns, do NOT add markLines. Show a threshold by highlighting
  bars that clear it and stating its value in the subtext.
- Sole bar/column exception: the request explicitly demands a visible
  threshold line and the data is categorical (no line-chart form available).
  Then hide the markLine label with `label: { show: false }` and state the
  value in the subtext.
