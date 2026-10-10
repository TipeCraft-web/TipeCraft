---
name: html-report-authoring
description: Turn data already supplied or queried into a single-file HTML report with narrative and interactive Atta charts. Use for downloadable analytical reports, not runnable dashboard applications.
---

# HTML report authoring

Author the report's HTML, CSS, and narrative yourself. There is no report
template or required card grid. Deliver one `.html` file containing all data,
styles, and chart builders. Its only required external resource is the exact
Atta CDN runtime returned by `validateChart`. The report is a snapshot, not
an offline file or a live dashboard.

For a standalone chart, use `atta-chart-authoring` directly. For a runnable
analytics app with a backend or live data, use the applicable app-building
skill. Do not create an app scaffold, server, or artifact for this file report.
In Plan mode, describe the approach without authoring files.

## Workflow

1. Start with data already supplied or queried. Confirm the question,
   audience, source, and covered period, then inspect that data.
   If required data or definitions are missing, identify what is missing
   before authoring. This skill does not select connections or fetch data.
   Never invent facts; label synthetic examples explicitly.
2. Decide which findings need charts and which need text or tables. Lead with
   the answer, then put evidence beside the claim it supports. Include a
   summary, navigation, or recommendations only when they help this report.
3. Load `atta-chart-authoring` and its `references/report-embedding.md`.
   Follow the chart-selection rules and read only the other references that
   apply. Write each chart's data and builder as intermediate source files.
   Validate every pair with `validateChart` before embedding it.
4. Read `references/layout.md` when composing the page. Choose a coherent
   visual direction for this audience rather than copying a fixed layout.
   Report CSS controls the page; Atta controls chart internals.
5. Capture the source files as UTF-8 strings and compare their SHA-256 hashes
   with the `sourceHashes` returned by `validateChart`.
   Revalidate if either file changed.
   Embed those captured data and builder strings, without another file read.
   Give each builder a unique binding as shown in the Atta embedding reference.
   Load one pinned CDN runtime with its returned integrity hash and render
   each chart into a separate container. Do not reference the intermediate
   workspace files from the delivered HTML. Any data or builder edit requires
   another validation call.
6. Measure the complete HTML file before delivery. Its UTF-8 size must not
   exceed 5 MiB (5,242,880 bytes), including inline data, styles, and scripts.
   Use `Buffer.byteLength(html, "utf8")` when composing the file in Node.js.
   If it is too large, remove redundant content or aggregate data at a grain
   that still answers the question. Never silently truncate data.
   Disclose any filtering or aggregation and revalidate changed charts.
   If the requested detail cannot fit, explain the limit and ask which
   scope to reduce.
7. Check the document source against the delivery checklist, then present
   the report once with `presentAsset`. Do not present intermediate charts
   unless the user also requested them separately.

```js
await presentAsset({
  filePath: ".local/outputs/revenue-report.html",
  title: "Revenue report",
  description: "Revenue trends and composition for the selected period."
});
```

Use a normal `.html` filename, not `.chart.html`, and omit `chartSource`.
Do not use `presentArtifact`, or tell the user to deploy or run the report.

## Evidence and delivery checklist

- Headlines and prose agree with the actual chart data. Distinguish observed
  associations from demonstrated causes, and findings from recommendations.
- Sources, covered dates, timezone where relevant, units, denominators,
  filters, and material missingness are stated. Do not hide sampling or
  substitute an easier chart that changes the question.
- All data is inline. Opening the report makes no data queries and needs no
  backend, login, workspace paths, or local server. Never embed credentials,
  signed private URLs, or access tokens.
- Every chart passed `validateChart`, and the report uses its returned CDN
  URL and integrity hash. Fix validation errors rather than bypassing them
  with another library or runtime. If validation or that CDN bundle is
  unavailable, explain the blocker.
- Escape data and untrusted narrative for their HTML context. Keep narrative
  and source notes readable even when a chart cannot initialize.
- Chart validation does not inspect the complete report layout or certify
  its conclusions. Do not claim browser, mobile, or visual testing unless it
  was actually performed. Browser testing is not a required step in this flow.
