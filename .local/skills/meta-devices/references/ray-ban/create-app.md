# Create a Web App for Meta Ray-Ban Display Glasses

This reference does not apply to Meta Quest, WebXR, or React Native.

Meta Ray-Ban Display glasses render standard web apps in an on-lens WebView.
This workflow scaffolds a complete, working app that respects the glasses' display
physics, input model, and performance budget.

**Any web stack works.** Plain HTML/CSS/JS, or a framework/bundler setup
(React, Vue, Svelte, Next.js, …), in JavaScript or TypeScript — pick whatever
fits the app and your workflow. The glasses don't care about your toolchain; they
care about the **rendered output and runtime behavior**. What's non-negotiable
(the "Constraints" section below) is the *result*: it must render at 600×600,
obey the additive-display color rules, be fully D-pad navigable, carry the MRBD
meta tag, and stay within the performance budget. The code in this reference is a
**framework-agnostic reference implementation** of those behaviors — read it as
the pattern to reproduce, and port it to your chosen stack (e.g. the focus/nav
engine becomes a hook or store in React; the theme becomes your styling layer).

The glasses have **no touchscreen, mouse, or keyboard**. Input arrives as a
**D-pad**: the user moves focus between elements (temple swipe or Neural Band
gesture) and selects with a pinch/tap. Everything below exists to make that work.

---

## Non-negotiable constraints

These come from the glasses hardware. Generated UI that ignores them fails on device.

### Display

- **Viewport is fixed at 600 × 600** with `overflow: hidden`. All content fits inside.
- **Additive waveguide display**: light *adds* to the real world.
  - `#000000` emits no light → **fully transparent**. Use it for the page
    background (`body`, `html`) so the real world shows through.
  - `#000000` must **never** be used on UI surfaces that need to be seen (cards,
    headers, nav, buttons). Those use dark grays (`#0a0a0f`–`#1a1a2e`) so they
    read as opaque on the see-through canvas.
- **Colors**: white `#ffffff` = brightest/most visible. Prefer light text and UI
  on the transparent black canvas. Keep body-text contrast ≥ 4.5:1.
- **Safe margin**: keep interactive elements ≥ 8dp from the screen edge (edges
  get clipped by focus/rubberband animations).
- **Typography**: min 14dp for interactive text; headings 22–28dp. System font
  stack only — no external font downloads.
- **Focus is the cursor.** Every interactive element shows a visible focus state
  (cyan glow). There is no free-roaming pointer — focus jumps element to element.
- Keep navigation shallow: ≤ 3 steps to reach any action.

### Performance (mobile-grade CPU/GPU, slow link, limited battery)

The glasses start apps over a slow mobile connection and render on a weak GPU, so
performance is a first-class constraint — not a cleanup step. Budget:

- **Startup ≤ ~3s to interactive**, **initial payload under ~500KB** (compressed),
  **< 10 requests** on load.
- Keep the **shipped bundle small**. This is a budget, not a ban on any framework:
  use React/Vue/Svelte/etc. if it fits, but avoid heavy runtime deps and
  tree-shake/minify for production.
- **Show meaningful UI immediately** — never block first render on a network call.
- No continuous `setInterval` / `requestAnimationFrame` loops while idle. Start
  work on demand; stop it when the screen isn't visible.
- **Cap animation at ~30fps** and animate **`transform`/`opacity` only** (GPU
  compositor) — never layout/paint properties. Keep animations subtle (150–300ms).
  Prefer CSS transitions over JS animation.
- Icons: Unicode symbols or small inline PNGs. **No** external icon fonts or SVG
  icon libraries that require a network download. No external font downloads.

For an existing app, or to go deeper on optimization, read
[performance](performance.md).

### Required `<head>` tags

```html
<meta name="viewport" content="width=600, height=600, initial-scale=1.0, user-scalable=no">
<!-- Brief, app-specific summary of what the app does -->
<meta name="description" content="...">
<!-- Identifies the page as a Meta Ray-Ban Display (MRBD) compatible web app. Keep content="yes" verbatim. -->
<meta name="mrbd-web-app-capable" content="yes">
<meta name="replit:meta-device" content="ray-ban-display">
```

### Input model

| Input | Effect |
|-------|--------|
| D-pad Up/Down/Left/Right | Move focus between `.focusable` elements (wraps around) |
| Enter / Tap | Activate the focused element |
| Back / Escape | Go to the previous screen |

---

## What gets generated

The essentials, in whatever form your stack produces them: the app markup/screens,
the theme/styles, the D-pad navigation + focus logic, a favicon, and a web app
manifest. A minimal **vanilla** layout looks like the tree below — adapt the file
organization to your framework's conventions (components, routes, bundler output):

```
<app-name>/
  index.html              # Screens + structure (or your framework's entry/markup)
  styles.css              # Dark theme, focus states, components (or your styling layer)
  app.js                  # D-pad navigation, focus, actions, storage (or hooks/store)
  favicon.png             # 128x128 PNG icon themed to the app
  manifest.webmanifest    # Web app manifest referencing the favicon
  mrbd-simulator/         # DEV ONLY — glasses preview simulator (Step 6; stripped at publish)
```

---

## Workflow

Steps 2–4 link to a vanilla `index.html` / `styles.css` / `app.js` reference. If you're
using a framework or TypeScript, treat these as the spec for the markup, theme, and
navigation behavior to reproduce, and organize the actual files your stack's way.

### Performance preflight — build in this order

Apply performance discipline *while* generating, not after. The order matters: a
fast, D-pad-correct shell first, polish last. This is what keeps startup and jank
in budget by default instead of needing an optimization pass later.

1. **Interactive shell first.** Get a usable 600×600 screen painting fast —
   structure, theme, and a loading state. Never block first render on a fetch.
2. **Wire D-pad + focus, and verify it.** Confirm arrow-key focus (with wrap-around),
   Enter activation, Escape back, and visible focus rings work before anything else.
3. **Defer everything non-critical.** Load data after first paint; lazy-load
   below-the-fold screens/assets; `import()` heavy modules on demand, not at boot.
4. **Keep the wire small.** < 10 requests, small payload, no external fonts/icon
   libraries, images ≤ 600px.
5. **Add visual polish last**, within budget — subtle transitions only, ~30fps cap,
   `transform`/`opacity` only, nothing looping while idle.

See [performance](performance.md) for the full budget, the bottleneck→fix table, and an
optimize loop for an existing app.

### Step 1 — Understand the request

If the user described the app, proceed. If not, ask what they want to build.
Ideas that fit the glasses well:

- **Data apps** (fetch a public API): weather, crypto/stock ticker, news reader,
  trivia, dictionary, recipes, sports scores, transit times.
- **Sensor apps** (see [sensors](sensors.md)): compass, level tool, step
  counter, head-tilt game.
- **Offline apps** (D-pad only): timer/stopwatch, pomodoro, dice roller, flashcards,
  breathing exercise, habit tracker.

### Step 2 — Generate `index.html`

Each screen is a `<div class="screen">` with a unique `id`; extra screens start
with the `hidden` class. Every interactive element gets `class="focusable"` (and
`tabindex="0"` if it isn't a `<button>`), plus `data-action="..."`. Back buttons
use `data-action="back"` and the `&#8592;` arrow.

Read the [markup reference](markup.md) for this step.
Use that example for the behavior described above, including when adapting it to another stack.

### Step 3 — Generate `styles.css`

This theme is the display guidelines expressed as CSS. Use it as the foundation;
add app-specific styles on top. Note `--bg-primary: #000000` (transparent) for the
page and dark grays for surfaces.

Read the [theme reference](theme.md) for this step.
Use that example for the behavior described above, including when adapting it to another stack.

### Step 4 — Generate `app.js`

This is the app framework: it collects screens, drives D-pad focus with wrap-around,
dispatches `data-action` clicks, persists state to `localStorage`, and provides
toast / loading / error helpers. Customize the four marked sections per app.

Read the [navigation reference](navigation.md) for this step.
Use that example for the behavior described above, including when adapting it to another stack.

### Step 5 — Generate the favicon

Create a `favicon.png` themed to the app using the bundled pure-Python script at
`.local/skills/meta-devices/files/ray-ban/favicon-generator.py`
(stdlib only, no dependencies).

**Constraints:** PNG only (no SVG), larger than 52×52 (default 128×128), referenced
from both `index.html` (`<link rel="icon">`) and the manifest — both are already
wired in the [markup reference](markup.md).

1. Design a small concept for the app (weather → sun/cloud; music → note; sports →
   ball + letter glyph). Pick colors that contrast on a dark background.
2. Build a JSON spec using the script's primitives: `background` (solid/gradient),
   optional rounded `plate`, and `layers` of `circle` / `ring` / `rrect` / `polygon`
   / `points` / `glyph`. See the script header for the full schema.
3. Render into the app directory:

```bash
python3 .local/skills/meta-devices/files/ray-ban/favicon-generator.py --spec - --out <app-name>/favicon.png <<'EOF'
{
  "size": 128,
  "background": {"type": "gradient", "from": "#1C1E21", "to": "#0A0B0C"},
  "plate": {"color": "#FF6B35", "radius": 28, "inset": 8},
  "layers": [
    {"type": "ring", "cx": 64, "cy": 64, "r": 38, "width": 4, "color": "#1C1E21"},
    {"type": "glyph", "char": "B", "cx": 64, "cy": 64, "scale": 7, "color": "#1C1E21"}
  ]
}
EOF
```

4. Write `manifest.webmanifest` next to `index.html`:

```json
{
  "name": "<App Name>",
  "short_name": "<App Name>",
  "icons": [{ "src": "favicon.png", "sizes": "128x128", "type": "image/png" }],
  "background_color": "#000000",
  "theme_color": "#000000",
  "display": "standalone"
}
```

### Step 6 — Add the dev simulator (always, while building)

**Always provide the MRBD dev simulator when you create or edit a glasses web app.**
The developer has no glasses in front of them — without the simulator the browser
preview shows a plain 600×600 web page, which hides every additive-display problem
(invisible `#000000` surfaces, washed-out text, wrong contrast). Adding it is part
of generating the app, not an optional extra the user has to ask for.

Copy `.local/skills/meta-devices/files/ray-ban/simulator/` into
the app's static/public directory as `mrbd-simulator/`. Then open the standalone
preview page:

```text
/mrbd-simulator/preview.html?app=/
```

If the app URL contains a query string or fragment, URL-encode it in the `app`
parameter. The preview page loads the app once inside a real 600×600 iframe. Do
not add the simulator script to the app itself.

Add this pattern to the project root `.replitignore` file. Preserve any existing
patterns in that file:

```gitignore
**/mrbd-simulator/**
```

Replit Publish applies `.replitignore` before the build, so the simulator cannot
enter the deployment through `public/`, `static/`, or generated output. For a
non-Replit deployment, add the same pattern to that platform's deployment ignore
configuration.

Two rules, and they are not in tension:

- **While developing / previewing — always available.** Don't remove it between edits,
  and don't wait to be asked. Open the preview URL while editing the app.
- **On publish / deploy — never shipped.** Exclude the `mrbd-simulator/` folder before
  the app goes live. Run
  the [publish workflow](publish.md) at publish time; it owns this check.

See [the simulator workflow](simulator.md) for sidebar controls, backgrounds,
and details.

### Step 7 — Verify

- [ ] Viewport is `width=600, height=600`; content fits, `overflow: hidden`
- [ ] `<head>` has an app-specific `<meta name="description">`, `<meta name="mrbd-web-app-capable" content="yes">`, and `<meta name="replit:meta-device" content="ray-ban-display">`
- [ ] Page background is `#000000`; UI surfaces use dark grays (visible, not transparent)
- [ ] Every screen is `.screen` with a unique `id`; extra screens start `hidden`
- [ ] Every interactive element has `.focusable` (and `tabindex="0"` if not a button) and a `data-action`
- [ ] D-pad moves focus with wrap-around; focus ring (cyan glow) is visible
- [ ] Enter activates the focused element; Escape goes back
- [ ] Scrollable lists use `overflow-y: auto` with `max-height`; focused items scroll into view
- [ ] Loading and error states handled; app renders before any network call
- [ ] No continuous animations/timers while idle; animation capped at ~30fps (transform/opacity only)
- [ ] Within budget: startup ≤ ~3s, < 10 requests, small payload, non-critical assets deferred
- [ ] `favicon.png` (> 52×52 PNG, not SVG) exists and is referenced from HTML + manifest
- [ ] MRBD preview URL renders the app once in the glasses' additive style
- [ ] The app source does not load `mrbd-simulator.js`
- [ ] `.replitignore` excludes `**/mrbd-simulator/**`

---

## Extend the app

- [UI](ui.md) — display rules for any screen or component
- [Storage](storage.md) — persist settings, cache, and app state
- [Sensors](sensors.md) — motion, orientation/compass, and GPS location
- [Performance](performance.md) — check and optimize startup, payload, and jank
- [Simulator](simulator.md) — preview the app in the glasses' rendering style
- [Publish](publish.md) — strip the simulator before the app ships

## Troubleshooting

| Issue | Check |
|-------|-------|
| Nothing renders on device | Browser console for JS errors; viewport meta present |
| Focus ring not visible | `.focusable` class on the element |
| D-pad not moving focus | `moveFocus()` finds `.focusable` in the current screen |
| Enter not activating | `data-action` set; element has `.focusable` |
| Back not working | `data-action="back"` or Escape handler |
| UI surface invisible | Surface uses a dark gray, not `#000000` |
| Data not persisting | `saveData()` called after state changes |
