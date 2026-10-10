---
name: confidence-band
description: Guidance for creating confidence bands, uncertainty regions, and forecast intervals in ECharts. Use when showing uncertainty around trend lines, forecasts, regression fits, or rolling averages.
---

# Confidence Band Skill

## When to Use

Confidence bands visualize **uncertainty** around a central estimate:

- **Forecasts**: Future projections with expanding uncertainty
- **Regression CI**: Uncertainty of the fitted regression line
- **Prediction intervals**: Range for individual new predictions
- **Rolling average CI**: Uncertainty around smoothed metrics
- **Model uncertainty**: Any statistical estimate with error bounds

## Decision Tree

### Step 1: What Shape?

| Use Case | Shape | Why |
|----------|-------|-----|
| Time-series forecast | Expands into future | Uncertainty grows with time |
| Regression line CI | Bow-tie (narrow at x̄) | Most certain near data center |
| Prediction interval | Wide, constant-ish | Individual point variance dominates |
| Rolling average CI | Constant width | Fixed window, stable variance |

### Step 2: What Technique?

| X-Axis Type | Technique | Why |
|-------------|-----------|-----|
| Category or Time | **Stacking trick** | Native ECharts, better integration |
| Value | **Custom polygon** | Stacking breaks with value axes |

## Critical Requirements

### Technique A: Stacking Trick (Category/Time Axes)

Create TWO invisible line series that stack:

1. **Lower bound series**: `lineStyle.opacity: 0`, `areaStyle.opacity: 0`
2. **Band height series**: `lineStyle.opacity: 0`, `areaStyle.opacity: 0.2`, stacked on lower

```javascript
// Lower bound (invisible base)
{
  name: 'Lower Bound',
  type: 'line',
  data: lowerBoundData,
  stack: 'confidence',
  lineStyle: { opacity: 0 },
  areaStyle: { opacity: 0 },
  symbol: 'none'
},
// Band height (visible fill)
{
  name: 'Confidence Band',
  type: 'line',
  data: bandHeightData, // upperBound - lowerBound
  stack: 'confidence',
  lineStyle: { opacity: 0 },
  areaStyle: {
    opacity: 0.2,
    color: '#61A9BD'
  },
  // IMPORTANT: Set itemStyle.color for legend - areaStyle color won't propagate
  itemStyle: {
    color: '#61A9BD'  // Must match areaStyle.color
  },
  symbol: 'none'
}
```

**Key points:**
- `bandHeightData[i] = upperBound[i] - lowerBound[i]`
- Same `stack` value for both series
- For temporal data, use a time x-axis and `[timestamp, value]` points on the
  same sorted timeline in both series. Keep the timestamp in gap points.
- Use `'-'` (not null) for gaps in historical data
- `itemStyle.color` required - must be set explicitly
- **Legend**: Since symbols are hidden, populate `legend.data` with `icon: 'square'` for visible band series:

```javascript
legend: {
  data: [
    { name: 'Confidence Band', icon: 'square' },
    // ... other series names
  ]
}
```

### Technique B: Custom Polygon (Value Axes)

Draw a polygon using `renderItem`:

```javascript
function (data) {
  const lineColor = '#3C7686';
  const bandColor = '#61A9BD';
  const lineData = data.map((row) => [row.x, row.estimate]);
  const bandData = data.map((row) => [row.x, row.lower, row.upper]);
  const bandPolygon = bandData
    .map((row) => [row[0], row[1]])
    .concat(bandData.map((row) => [row[0], row[2]]));

  return {
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'line',
        name: 'Estimate',
        data: lineData,
        showSymbol: false,
        lineStyle: { color: lineColor }
      },
      {
        type: 'custom',
        name: 'Confidence Band',
        data: bandData,
        encode: { x: 0, y: [1, 2] },
        // IMPORTANT: Set itemStyle.color for legend - renderItem color won't propagate
        itemStyle: {
          color: bandColor // Must match the fill color in renderItem
        },
        renderItem: function(params, api) {
          // CRITICAL: Prevent duplicate rendering
          if (params.context.rendered) return;
          params.context.rendered = true;

          // Build polygon points
          const points = [];

          // Lower bound left-to-right
          for (let i = 0; i < bandPolygon.length / 2; i++) {
            const point = bandPolygon[i];
            points.push(api.coord([point[0], point[1]]));
          }

          // Upper bound right-to-left
          for (let i = bandPolygon.length - 1; i >= bandPolygon.length / 2; i--) {
            const point = bandPolygon[i];
            points.push(api.coord([point[0], point[1]]));
          }

          return {
            type: 'polygon',
            shape: { points },
            style: {
              fill: bandColor,
              opacity: 0.2,
              stroke: null
            },
            z2: 0
          };
        },
        z: 1
      }
    ]
  };
}
```

**Key points:**
- The builder's `data` argument contains rows shaped as `{ x, estimate, lower, upper }`
- Include the standard estimate line beside the custom band
- Define the fill color inside the builder; do not depend on outer variables
- Derive `bandPolygon` from `data` inside the builder
- Give the custom series every `[x, lower, upper]` row and set `encode: { x: 0, y: [1, 2] }` so ECharts calculates both value-axis extents
- `params.context.rendered` guard prevents duplicate draws
- Build polygon: lower points forward, upper points backward
- `z: 1` and `z2: 0` - band behind data points
- `itemStyle.color` required - Legend cannot extract color from renderItem, must be set explicitly


### Multiple Bands

For multiple series with bands, use unique identifiers:

**Stacking trick:**
```javascript
// Series A band
stack: 'confidence-A'

// Series B band
stack: 'confidence-B'
```

**Custom polygon:**
```javascript
// Series A
if (params.context.renderedA) return;
params.context.renderedA = true;

// Series B
if (params.context.renderedB) return;
params.context.renderedB = true;
```

## Styling Guidelines

| Element | Recommendation |
|---------|----------------|
| Fill opacity | 0.15 - 0.25 (subtle) |
| Fill color | Match or complement the line color |
| Stroke | `null` - no visible boundary lines |
| z-index | Band behind line and points (`z: 1`) |

### Complete Forecast Chart Pattern

A proper forecast chart requires multiple visual elements working together:

| Element | Style | Purpose |
|---------|-------|---------|
| Historical line | **Solid**, thick (3px), **no symbols** | Shows actual data |
| Forecast line | **Dotted**, thick (3px) | Distinguishes prediction from actual |
| Forecast start marker | **Square symbol** at transition point | Clear visual break |
| Vertical divider | Solid line at forecast start | Separates historical/forecast |
| Confidence band | Solid fill (0.2 opacity) | Shows uncertainty range |

#### Forecast Start Marker

The transition point between historical and forecast data needs a clear visual indicator. Use a square symbol on the forecast series that only appears at the first data point. Set `symbol: 'rect'` and make `symbolSize` a function that checks `params.dataIndex` - return the marker size (e.g., 12) when the index matches `forecastStartIndex`, and 0 for all other points. This creates a single square marker at the exact transition point without cluttering the rest of the line.

```javascript
symbol: 'rect',
symbolSize: function(value, params) {
  return params.dataIndex === forecastStartIndex ? 12 : 0;
}
```

The builder receives rows shaped as
`{ period, actual, forecast, lower, upper }`. Future rows use `null` for
`actual`; historical rows use `null` for the three forecast fields. The
transition row carries both the last actual value and the first forecast.
`period` contains an ISO date string or epoch milliseconds. Supply rows in
chronological order; every series uses that same timeline.

```javascript
function (data) {
  const lineColor = '#61A9BD';
  const periods = data.map((row) => row.period);
  const forecastStartIndex = data.findIndex((row) => row.forecast !== null);
  const historicalLine = data.map((row) => row.actual);
  const forecastLine = data.map((row) => row.forecast);
  const lowerBound = data.map((row) => row.lower ?? '-');
  const upperBound = data.map((row) => row.upper ?? '-');
  const bandHeight = upperBound.map((val, idx) =>
    val !== '-' && lowerBound[idx] !== '-' ? val - lowerBound[idx] : '-'
  );

  return {
    title: [
      { text: 'Forecast with uncertainty' },
      { text: 'Point estimate with a 95% confidence band' }
    ],
    xAxis: { type: 'time' },
    yAxis: { type: 'value', min: 0 },
    series: [
      // 1. Lower bound (invisible base for stacking)
      {
        name: 'Lower',
        type: 'line',
        data: lowerBound.map((value, index) => [periods[index], value]),
        smooth: true,
        lineStyle: { opacity: 0 },
        areaStyle: { opacity: 0 },
        stack: 'confidence',
        symbol: 'none',
        tooltip: { show: false }
      },
      // 2. Confidence band (solid fill)
      {
        name: '95% Confidence Band',
        type: 'line',
        data: bandHeight.map((value, index) => [periods[index], value]),
        smooth: true,
        lineStyle: { opacity: 0 },
        areaStyle: {
          opacity: 0.2,
          color: lineColor
        },
        itemStyle: {
          color: lineColor
        },
        stack: 'confidence',
        symbol: 'none'
      },
      // 3. Historical actual line (solid)
      {
        name: 'Actual',
        type: 'line',
        data: historicalLine.map((value, index) => [periods[index], value]),
        smooth: true,
        lineStyle: { width: 3, color: lineColor },
        symbol: 'none',
        z: 10
      },
      // 4. Vertical line at forecast start (no labels)
      {
        name: 'Forecast Start',
        type: 'line',
        markLine: {
          silent: true,
          symbol: 'none',
          label: { show: false },
          lineStyle: { color: '#666666', type: 'solid', width: 1 },
          data: [{ xAxis: periods[forecastStartIndex], label: { show: false } }]
        }
      },
      // 5. Forecast line (dotted with square marker at start)
      {
        name: 'Forecast',
        type: 'line',
        data: forecastLine.map((value, index) => [periods[index], value]),
        smooth: true,
        lineStyle: {
          width: 3,
          color: lineColor,
          type: 'dotted'
        },
        symbol: 'rect',
        symbolSize: function(value, params) {
          return params.dataIndex === forecastStartIndex ? 20 : 0;
        },
        itemStyle: { color: lineColor },
        z: 10
      }
    ],

    legend: {
      data: [
        'Actual',
        'Forecast',
        { name: '95% Confidence Band', icon: 'square' }
      ]
    }
  };
}
```

**Critical styling rules:**
- Historical line: `lineStyle.type` defaults to solid, `symbol: 'none'` (no data point markers)
- Forecast line: `lineStyle.type: 'dotted'`
- Square marker: `symbol: 'rect'` with conditional `symbolSize` (only on forecast series)
- Band: solid fill with subtle opacity (0.2), no visible boundary lines
- Legend: Use `icon: 'square'` for band series in `legend.data` since symbols are hidden

## Common Mistakes to Avoid

1. **Using stacking on value x-axis** - Stacking breaks, use custom polygon instead
2. **Forgetting `params.context.rendered` guard** - Causes duplicate/thick rendering
3. **Wrong polygon point order** - Must go lower-forward then upper-backward
4. **Using null instead of '-'** - Use `'-'` for gaps in stacked series
5. **Band in front of data** - Set `z: 1` to put band behind
6. **Same stack name for multiple bands** - Use unique stack names per series
7. **Hardcoding band values** - Always calculate from data dynamically
8. **Wrong CI formula for use case** - Bow-tie for regression, expanding for forecast
9. **Adding visible boundary lines** - Bands should have no visible stroke lines
10. **Using solid line for forecast** - Forecast line MUST be dotted, historical line is solid
11. **Missing forecast start marker** - Add square symbol and vertical line at the transition point
12. **Adding symbols to historical line** - Historical line must have `symbol: 'none'`, only forecast line gets the square marker
13. **Missing legend icon for band series** - Band series have no symbols, so must set `icon: 'square'` in `legend.data`
14. **Missing itemStyle.color on custom series** - Legend can't extract color from renderItem; always set `itemStyle.color` to match the polygon fill

## Remember

- Shape depends on **statistical context** (forecast vs regression vs rolling)
- Technique depends on **axis type** (category/time vs value)
- Always calculate bands from data, never hardcode
- Keep opacity subtle (0.15-0.25) for all bands
- **All bands use solid fill WITHOUT visible boundary lines**
- **Forecast charts require:**
  - Historical line: solid, **no symbols** (`symbol: 'none'`)
  - Forecast line: **dotted** with square marker at start
  - Vertical divider line at forecast start
- Guard custom renderItem to prevent duplicate rendering
