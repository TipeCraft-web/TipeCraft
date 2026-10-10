# Present-mode motion

Motion is optional and off by default. Add it only when the user asks for animation or when a restrained entrance sequence genuinely improves the deck. When in doubt, ship the deck static.

Author motion per slide in the document's `extensions` map. It plays only in the workspace Present surface and the deployed viewer. Editing, the workspace preview, thumbnails, `/allslides`, and exports always render the document exactly as authored, so motion never changes screenshots, PPTX output, or the static layout that layout validation measures. `validate-slides` does check the motion block itself with the `motion-*` codes -- see Validation below.

## Contract

```yaml
format: replit.sdm
version: 1
size: { width: 1920, height: 1080 }
background:
  kind: solid
  color: { kind: rgb, value: "#0E1525" }
theme:
  colors:
    text: "#F5F9FC"
    accent: "#7B61FF"
  fonts:
    display: Inter
elements:
  - id: title
    type: text
    frame: { x: 120, y: 96, width: 1200, height: 140 }
    body:
      paragraphs:
        - runs:
            - text: Ship the demo
              font: { kind: token, token: display }
              sizePt: 44
              weight: 700
              color: { kind: token, token: text }
  - id: titleAccent
    type: shape
    frame: { x: 120, y: 260, width: 300, height: 8 }
    geometry: { kind: preset, preset: rect }
    fill:
      kind: solid
      color: { kind: token, token: accent }
  - id: draftTag
    type: text
    frame: { x: 120, y: 930, width: 400, height: 60 }
    body:
      paragraphs:
        - runs:
            - text: Internal draft
              sizePt: 20
              color: { kind: token, token: accent }
  - id: orb
    type: shape
    frame: { x: 1560, y: 120, width: 200, height: 200 }
    geometry: { kind: preset, preset: ellipse }
    fill:
      kind: solid
      color: { kind: token, token: accent }
      opacity: 0.4
extensions:
  replit.motion:
    version: 1
    entrance:
      - { target: title, preset: fade-in, step: 0 }
      - { target: titleAccent, preset: wipe-in, direction: from-left, step: 0, delayMs: 120 }
      - { target: orb, preset: zoom-in, step: 1 }
    exit:
      - { target: draftTag, preset: fade-out, step: 2 }
    loops:
      - { target: orb, preset: float, periodMs: 5000 }
```

- The document is the final pose. An entrance travels to the authored frame, a loop oscillates around it, and an exit leaves from it and stays hidden until the slide replays. Never author "start" poses into element frames.
- Entrance presets: `appear`, `fade-in`, `fly-in`, `float-in`, `wipe-in`, `zoom-in`, `blur-in`. Exit presets: `disappear`, `fade-out`, `fly-out`, `float-out`, `wipe-out`, `zoom-out`. Loop presets: `pulse`, `float`, `spin`. There is no other animation channel: no CSS, no keyframes, no scripts.
- `direction` applies only to directional presets: `from-left|from-right|from-top|from-bottom` on `fly-in`/`wipe-in`, the `to-*` forms on `fly-out`/`wipe-out`, and `up|down` on `float-in`/`float-out`. Other presets reject a direction.
- `step` sequences the slide: step 0 plays on slide entry, and each later step starts when the previous step finishes. Same-step entries play together; offset them with `delayMs` (80-150ms staggers read well). Keep steps contiguous from 0.
- Every preset has tuned duration and easing defaults, so omit `durationMs` and `easing` unless the design needs them. Explicit durations belong in 200-700ms. Easing tokens: `standard`, `decelerate`, `accelerate`, `spring`, `linear`. A document-level `defaults: { durationMs, easing }` block overrides the preset defaults for entrance and exit effects. Loops take only `periodMs`; each loop preset's easing is fixed.

## Taste rules

- Budget per slide: at most 3 steps, at most 6 animated elements, at most one loop. A title plus one content group is usually enough.
- Exits run on a timer, not on a click. Use them only for transient or decorative content -- never remove text the audience needs to read.
- Prefer `fade-in`, `float-in`, and `wipe-in` for content. Save `fly-in`, `zoom-in`, `blur-in`, and `spring` easing for one accent moment per deck.
- Loops are ambient decoration for at most one accent element. Never loop text.

## Validation

Run `validate-slides` after motion edits. `motion-*` errors (unparseable block, unknown preset, invalid direction, orphan target) must be fixed. `motion-*` warnings do not fail the run, but read them: out-of-range durations, delays, and periods clamp at playback, and non-contiguous steps renumber. An exit at or before its target's entrance is never repaired -- the sequence plays in the authored order, which is usually wrong, so fix the steps.

