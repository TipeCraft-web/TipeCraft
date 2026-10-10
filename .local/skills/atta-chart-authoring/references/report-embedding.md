# Embed Atta charts in an HTML report

Use these instructions for charts inside a report you author as a normal
`.html` file. For a standalone chart, call `presentAsset({ chartSource })`
and let that callback create the `.chart.html` document.

## Validate sources and pin the runtime

Write each chart's baked JSON and one self-contained builder function from
CodeExecution (`"use impure"`), following the main skill and applicable chart
references. Keep the source files in the same workspace as the report.

```js
const revenueChart = await validateChart({
  builderPath: ".local/report-sources/revenue.chart.js",
  dataPath: ".local/report-sources/revenue.chart.json"
});
```

Success returns `vizType`, optional `headline`, `previewWidthPx`,
`previewHeightPx`, `sourceHashes: { builderSha256, dataSha256 }`, and
`runtime: { url, sha256, integrity, global }`.
It validates without writing HTML or presenting a chart card.

- Fix any returned validation error and retry. If validation is unavailable,
  stop and explain the blocker; do not skip it or silently switch libraries.
- Use the `runtime.url` and `runtime.integrity` returned by `validateChart`
  verbatim. They identify the runtime used to validate your chart.
  Never resolve `latest.json`, guess a filename, load upstream ECharts
  separately, or select a different runtime version.
- Validate every chart. All results must name the same runtime URL and hash.
  If they differ, revalidate all charts and compare the results again.
- During authoring, fetch that exact HTTPS CDN URL and verify its bytes against
  the returned SHA-256. If it is unavailable or mismatched, explain the blocker.
  Do not embed a data URI or switch runtime versions as a fallback.
- Capture the builder and data files once as UTF-8 strings after validation.
  Compute each string's SHA-256 before trimming, parsing, or escaping it.
  Compare with `sourceHashes.builderSha256` and `sourceHashes.dataSha256`.
  If either differs, the files changed: revalidate and capture them again.
- Embed those same captured strings, not another read of the workspace files.
  Apply HTML-safe escaping to the captured JSON. Wrap each captured builder
  in a unique binding as described below. Do not retype values, serialize
  formatter functions through JSON, or rewrite the builder's function body.
  Missing source hashes block embedding; never skip the comparison.
  These results validate chart sources, not the surrounding report or its claims.

## Compose the document

Keep all report CSS, data, and builders inline. Load the returned runtime URL
once with `integrity` and `crossorigin="anonymous"`. Initialize charts only
after it loads. Use one uniquely identified container per chart.

Give each chart a unique builder binding, such as `buildRevenueOption` or
`buildMixOption`. Do not paste several `function buildOption(...)`
declarations into the same scope: later declarations can replace earlier ones.
An anonymous function or arrow expression also needs a binding before use.

After checking the raw source hash, remove only outer whitespace and trailing
semicolons, as validation does. Then wrap the expression in parentheses.
Do not rename the function internally or change its body.

For example, while composing the report from `capturedRevenueBuilder`:

```js
const revenueExpression =
  capturedRevenueBuilder.trim().replace(/[;\s]+$/, "");
const revenueBinding =
  `const buildRevenueOption = (\n${revenueExpression}\n);`;
```

Insert `revenueBinding` as executable source in the report's inline script
before rendering that chart. Use a different binding for every chart.
Wrapping a named function as an expression keeps its internal name local,
so multiple source files can safely use the name `buildOption`.

In the report, call `AttaChartPreview.render` with that binding.
Each call returns a promise:

```js
const revenueHandle = await AttaChartPreview.render({
  el: document.getElementById("revenue-chart"),
  data: revenueData,
  builder: buildRevenueOption,
  theme: "AttaLight"
});
```

`revenueData` is parsed from the embedded captured JSON.
`buildRevenueOption` is the unique binding created from the captured builder.
Repeat with separate data, bindings, and containers for the other charts.
The main skill's title, palette, formatter, and chart-selection rules still
apply inside each chart; do not override chart internals with report CSS.

- Give containers a fluid width and a nonzero height before rendering. Atta
  observes container resizing itself. Render hidden/tabbed charts when their
  containers become visible, rather than initializing at zero dimensions.
- Catch runtime-load and per-chart initialization errors and show a readable
  message. One failed chart must not stop unrelated sections from loading.
- Keep handles for theme updates. Call `dispose()` before removing or
  replacing a rendered chart; do not create duplicate instances on resize.
- Safely embed JSON: replace `<` with `\u003c` in the serialized JSON before
  placing it in an `application/json` script element, then parse its text.
  Escape untrusted prose for HTML or assign it with `textContent`.
- Validated builders cannot contain `</script` or `<!--`. Preserve that
  restriction in the final document; embed each function as executable source.
- No relative file dependencies, module imports, runtime data fetching, or
  credentials. The delivered report needs only its pinned Atta CDN bundle.

## Theme behavior

Unless the user requested a fixed theme, use the same preference order as a
standalone Atta chart: read `window.parent.replitPreviewColorScheme` inside a
try/catch, accept only `light` or `dark`, and otherwise use
`matchMedia("(prefers-color-scheme: dark)")`.

Map the resolved scheme to `AttaLight` or `AttaDark` and update both report CSS
and every chart handle. Listen for the window event
`replit:simple-html-preview:theme-change` and the media query's `change` event.
After an asynchronous render completes, apply the current theme again so a
theme change during initialization is not lost. Use `handle.setTheme(...)`;
do not reload the HTML or recreate charts. Legend selections may reset.

## Deliver

Present only the report `.html` through `presentAsset`, without `chartSource`.
The user can preview and download the HTML file. Do not promise whole-report
PNG export. A successful `validateChart` call checks the chart sources, not
the complete report layout. Do not claim visual testing unless you performed it.
