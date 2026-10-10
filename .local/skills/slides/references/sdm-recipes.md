# SDM element recipes

Validated `elements:` fragments for common slide chrome. Read this file when
you want one of these shapes ready-made; otherwise author from the schema in
`./sdm-building.md` with the geometry rules in `./sdm-layout.md` and the
design language in `./sdm-design.md`.

These YAML fences are `elements:` array fragments, not complete slide
documents. Paste their entries under a document's `elements:` key. They depend
on the standard `accent` / `foreground` color tokens and `display` / `body`
font tokens shown above.

Reuse each recipe's schema shape and minimum dimensions, but adapt its placement
and styling to the deck rather than repeating the layout verbatim. After
changing copy, recalculate display-text width with the per-glyph budget in
`./sdm-layout.md`; new text can outgrow geometry that validates for the example.

**Footer and page-number chrome**

```yaml
- id: footerRule
  type: shape
  frame: { x: 120, y: 968, width: 1680, height: 4 }
  geometry: { kind: preset, preset: rect }
  fill: { kind: solid, color: { kind: token, token: accent } }
- id: footerLabel
  type: text
  frame: { x: 120, y: 986, width: 600, height: 42 }
  body:
    paragraphs:
      - runs: [{ text: Quarterly review }]
        defaultRunStyle:
          font: { kind: token, token: body }
          sizePt: 15
          color: { kind: token, token: foreground }
        lineHeight: 1.1
- id: pageNumber
  type: text
  frame: { x: 1700, y: 986, width: 100, height: 42 }
  body:
    paragraphs:
      - runs: [{ text: "03" }]
        defaultRunStyle:
          font: { kind: token, token: body }
          sizePt: 15
          color: { kind: token, token: foreground }
        align: right
        lineHeight: 1.1
```

**Kicker header motif**

```yaml
- id: kickerBar
  type: shape
  frame: { x: 120, y: 96, width: 56, height: 8 }
  geometry: { kind: preset, preset: rect }
  fill: { kind: solid, color: { kind: token, token: accent } }
- id: kicker
  type: text
  frame: { x: 120, y: 124, width: 500, height: 44 }
  body:
    paragraphs:
      - runs: [{ text: MARKET CONTEXT }]
        defaultRunStyle:
          font: { kind: token, token: body }
          sizePt: 15
          weight: 700
          letterSpacingPt: 1
          color: { kind: token, token: accent }
        lineHeight: 1.1
- id: slideTitle
  type: text
  frame: { x: 120, y: 184, width: 1400, height: 120 }
  body:
    paragraphs:
      - runs: [{ text: Demand is moving upstream }]
        defaultRunStyle:
          font: { kind: token, token: display }
          sizePt: 38
          weight: 700
          color: { kind: token, token: foreground }
        lineHeight: 1.1
```

**Three-column stat row with wide-glyph-safe frames**

```yaml
- id: statOne
  type: text
  frame: { x: 120, y: 300, width: 480, height: 170 }
  body:
    paragraphs:
      - runs: [{ text: $980M }]
        defaultRunStyle:
          font: { kind: token, token: display }
          sizePt: 64
          weight: 800
          color: { kind: token, token: accent }
        lineHeight: 1.05
- id: statOneLabel
  type: text
  frame: { x: 120, y: 500, width: 480, height: 70 }
  body:
    paragraphs:
      - runs: [{ text: Addressable revenue }]
        defaultRunStyle:
          font: { kind: token, token: body }
          sizePt: 19
          color: { kind: token, token: foreground }
        lineHeight: 1.2
- id: statTwo
  type: text
  frame: { x: 720, y: 300, width: 480, height: 170 }
  body:
    paragraphs:
      - runs: [{ text: 89% }]
        defaultRunStyle:
          font: { kind: token, token: display }
          sizePt: 64
          weight: 800
          color: { kind: token, token: accent }
        lineHeight: 1.05
- id: statTwoLabel
  type: text
  frame: { x: 720, y: 500, width: 480, height: 70 }
  body:
    paragraphs:
      - runs: [{ text: Customer retention }]
        defaultRunStyle:
          font: { kind: token, token: body }
          sizePt: 19
          color: { kind: token, token: foreground }
        lineHeight: 1.2
- id: statThree
  type: text
  frame: { x: 1320, y: 300, width: 480, height: 170 }
  body:
    paragraphs:
      - runs: [{ text: 24/7 }]
        defaultRunStyle:
          font: { kind: token, token: display }
          sizePt: 64
          weight: 800
          color: { kind: token, token: accent }
        lineHeight: 1.05
- id: statThreeLabel
  type: text
  frame: { x: 1320, y: 500, width: 480, height: 70 }
  body:
    paragraphs:
      - runs: [{ text: Global coverage }]
        defaultRunStyle:
          font: { kind: token, token: body }
          sizePt: 19
          color: { kind: token, token: foreground }
        lineHeight: 1.2
```

**Multi-run emphasis paragraph**

```yaml
- id: emphasis
  type: text
  frame: { x: 120, y: 300, width: 1200, height: 180 }
  body:
    paragraphs:
      - runs:
          - text: "Revenue "
          - text: grew 42%
            weight: 800
            color: { kind: token, token: accent }
          - text: " while cost stayed flat."
        defaultRunStyle:
          font: { kind: token, token: body }
          sizePt: 30
          color: { kind: token, token: foreground }
        lineHeight: 1.2
```

**Section divider**

```yaml
- id: sectionBlock
  type: shape
  frame: { x: 1520, y: 0, width: 400, height: 1080 }
  geometry: { kind: preset, preset: rect }
  fill: { kind: solid, color: { kind: token, token: accent } }
- id: sectionIndex
  type: text
  frame: { x: 120, y: 300, width: 400, height: 50 }
  body:
    paragraphs:
      - runs: [{ text: "02 / GROWTH" }]
        defaultRunStyle:
          font: { kind: token, token: body }
          sizePt: 16
          weight: 700
          letterSpacingPt: 1
          color: { kind: token, token: accent }
        lineHeight: 1.1
- id: sectionTitle
  type: text
  frame: { x: 120, y: 380, width: 1280, height: 240 }
  body:
    paragraphs:
      - runs: [{ text: Market expansion }]
        defaultRunStyle:
          font: { kind: token, token: display }
          sizePt: 64
          weight: 800
          color: { kind: token, token: foreground }
        lineHeight: 1.05
```

