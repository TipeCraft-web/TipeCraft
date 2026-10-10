---
name: split-bar-chart
description: Guidance for split-bar panels that compare different metrics, survey distributions, or opposing pyramid pairs across shared categories.
---

# Split Bar Chart Skill

## When to Use

Split bar charts give **each series its own value-axis panel**. Use them when the series should be read as separate distributions rather than compared bar-to-bar on one axis:

- **Survey responses**: Multiple frequency options (Never, Sometimes, Often, Always)
- **Likert scales**: Strongly Disagree to Strongly Agree (5 categories)
- **Different metrics side by side**: e.g. headcount, revenue, and margin per team
- **Demographics**: Male vs Female population (use pyramid layout for this specific case)
- **Regional response distributions**: West vs Central vs East as separate panels

Series that share one metric and one value axis (2023 vs 2024, Q1 vs Q2, budget vs actual) belong in a **grouped bar**, not a split bar — see the parent skill's eligibility rules.

**Key insight**: Split bar charts can have **2, 3, 4, 5 or more** series. When you have exactly 2 series, see the "Pyramid vs Regular Split Bar" section to decide which layout to use.

## Critical Requirements

### 1. Enable Split Bar Mode (REQUIRED)

You MUST set `chartType: 'split-bar'` at the top level of the option object. This tells our custom ECharts optimizer to render the chart in split bar mode.

```javascript
const option = {
  chartType: 'split-bar', // REQUIRED - enables split bar rendering
  // ... rest of config
};
```

### 2. Only Horizontal Orientation Supported

Split bar charts **ONLY support horizontal orientation** (categories on y-axis, values on x-axis). Do NOT attempt vertical split bar charts.

### 3. Multiple X-Axes Required

Define **one x-axis for each series**. You can have 2, 3, 4, 5 or more x-axes depending on how many metrics you're comparing:

**Example with 3 x-axes (3 regions):**

```javascript
xAxis: [
  {
    type: 'value',
    name: 'West',
    // ... rest of config
  },
  {
    type: 'value',
    name: 'Central',
    // ... rest of config
  },
  {
    type: 'value',
    name: 'East',
    // ... rest of config
  },
];
```

**Example with 5 x-axes (survey frequency):**

```javascript
xAxis: [
  { type: 'value', name: "I don't use it" },
  { type: 'value', name: 'Occasionally' },
  { type: 'value', name: 'A few times a week' },
  { type: 'value', name: 'Once a day' },
  { type: 'value', name: 'Multiple times a day' },
];
```

### 4. Series with xAxisIndex Assignment

Each series must specify which x-axis it belongs to via `xAxisIndex`. The number of series should match the number of x-axes:

```javascript
series: [
  {
    name: 'West',
    type: 'bar',
    xAxisIndex: 0, // First x-axis
    data: [172, 148, 101, 154, 164, 72, 152, 159, 83, 97, 172],
    // ... styling
  },
  {
    name: 'Central',
    type: 'bar',
    xAxisIndex: 1, // Second x-axis
    data: [90, 90, 90, 90, 105, 180, 181, 179, 171, 134, 105],
    // ... styling
  },
  {
    name: 'East',
    type: 'bar',
    xAxisIndex: 2, // Third x-axis
    data: [90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90],
    // ... styling
  },
];
```

## Color Guidelines

Use colors from the standard palette. Pick **distinct colors** for each series.

### No Legend or VisualMap Needed

Split bar charts are **self-documenting** - each x-axis displays its own name label above the bars, so there's no need for a separate legend or visualMap. Do NOT add `legend` or `visualMap` to split bar chart configurations.

### Axis names

- **Pane (x-axis) names have no arrow**: `West`, `Male`, `Agree` — not `West →`.
- **The shared y-axis keeps the up arrow**: `↑ Product`, `↑ Age`, `↑ Region`.

### Y-Axis (Categorical)

Configure the shared categorical y-axis:

```javascript
yAxis: {
  type: 'category',
  name: '↑ Product',
  data: categories,
  // ... rest of config
}
```

## Pyramid vs Regular Split Bar (IMPORTANT)

When you have exactly 2 series, you must decide: **pyramid layout or regular split bar?**

### Use PYRAMID (`inverse: true`) when metrics are OPPOSITES

Pyramids emphasize divergence from a center. Only use when the two metrics are **conceptually opposite or mirror each other**:

- **Male vs Female** - demographic opposites
- **Agree vs Disagree** - sentiment opposites
- **Imports vs Exports** - directional flow opposites
- **Inflows vs Outflows** - money/resource flow opposites
- **Supply vs Demand** - economic opposites
- **Left vs Right** - political/directional opposites

### Use REGULAR split bar (NO `inverse`) when the pair is PARALLEL

If the two series are parallel rather than opposing, do NOT use the pyramid layout. But first check eligibility: parallel pairs that share one metric (Q1 vs Q2, 2023 vs 2024, Product A vs Product B, Budget vs Actual) belong in a **grouped bar** per the parent skill. Reach regular split-bar panels only when the pair is two DIFFERENT metrics that each need their own scale:

- **Revenue vs Headcount** - different units, separate panels
- **Score vs Response count** - a rating next to its sample size

**Rule of thumb**: Pyramids create a visual metaphor of divergence - only use `inverse: true` when the two series are conceptual opposites. Parallel same-metric pairs are grouped bars; parallel different-metric pairs are regular split bars.

## Pyramid Chart Configuration

Pyramid charts are split bar charts with exactly 2 series where bars extend in **opposite directions** from the center. This is achieved by setting `inverse: true` on the first x-axis.

### Key Difference for Pyramids

The first x-axis must have `inverse: true` so its bars extend leftward (toward the center), while the second series extends rightward:

```javascript
xAxis: [
  {
    type: 'value',
    name: 'Male',
    inverse: true, // CRITICAL - makes bars extend LEFT
    min: 0,
    max: maxValue,
    // ...
  },
  {
    type: 'value',
    name: 'Female',
    nameLocation: 'start',
    nameTextStyle: { color: '#44986D' },
    // No inverse - bars extend RIGHT (default)
    min: 0,
    max: maxValue,
    // ...
  },
];
```

### Pyramid-Specific Tips

1. **Always use `inverse: true` on the first x-axis** - This makes the bars extend in opposite directions
2. **Use the same max value for both axes** - Essential for fair visual comparison
3. **Two series only** - Pyramids are specifically for comparing two opposing groups

## Common Mistakes to Avoid

1. **Forgetting `chartType: 'split-bar'`** - Without this, the optimizer won't render it as a split bar
2. **Using vertical orientation** - Only horizontal is supported
3. **Missing `xAxisIndex`** - Each series must specify which x-axis it belongs to
4. **Mismatched axis/series count** - Number of x-axes MUST match number of series
5. **Thinking it's only for 2 series** - Split bars work great with 3, 4, 5+ series too!
6. **Forgetting `inverse: true` for pyramids** - For pyramid charts, the first x-axis MUST have `inverse: true`
7. **Using pyramid for non-opposite metrics** - Don't use `inverse: true` for time comparisons (Q1 vs Q2), product comparisons, or any parallel metrics. Pyramids are ONLY for conceptually opposite pairs like Male/Female, Agree/Disagree, Imports/Exports
8. **Adding legend or visualMap** - Split bar charts are self-documenting (each x-axis has its own label). Do NOT add `legend` or `visualMap` - they are unnecessary and add clutter

## Remember

All standard chart guidelines still apply:

- Use proper formatters for labels (JavaScript, not Python)
- Follow the color palette
- Include title with main title and footer
- Never hard-code data values - always calculate from dataframes/SQL
