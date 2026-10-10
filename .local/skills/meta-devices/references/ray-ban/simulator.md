# Preview with the Meta Ray-Ban Display Dev Simulator

The **MRBD simulator** is a standalone dev preview that frames a same-origin web app
so it looks like it's running on Meta Ray-Ban Display glasses:

- **Additive (waveguide) rendering** — the app is composited onto a blurred
  environment with `mix-blend-mode: screen`, so black UI pixels read as transparent
  (see-through) and bright pixels glow, exactly like the real display.
- **600×600 display** with an optional rounded bezel.
- **Settings sidebar** — pick a background (Dark or an image), dim **App Brightness**,
  adjust **Background Blur**, toggle the **Display Frame**, and a **Shortcuts** D-pad
  legend whose keys dispatch real Arrow / Enter / Escape events to the app.

It is **not** a Chrome extension and it **never executes in your app document**.
The app loads once inside a real 600×600 iframe. Works in any modern browser.

> **Always use it in dev, never ship it to production.** Without it the preview is
> a plain web page that hides additive-display problems. Exclude the simulator
> folder from the production build (see [publish](publish.md)).

## Assets

Everything the simulator needs is in
`.local/skills/meta-devices/files/ray-ban/simulator/`:

```
files/mrbd-simulator/
  preview.html               # standalone preview entry point
  mrbd-simulator.js          # the entire simulator (self-contained, no dependencies)
  backgrounds/
    manifest.json            # empty by default; add optional local image filenames
```

`preview.html` loads the simulator shell. The app loads once in a 600×600 iframe;
the `backgrounds/` folder is data the shell loads at runtime.

## When to use

- **Every time a glasses web app is created or edited** — [app creation](create-app.md)
  Step 6 adds it as part of generating the app; use the preview URL while iterating.
- The user wants to **see how their glasses web app looks** without physical glasses.
- Setting up a **dev/preview experience** — including pointing the **preview panel**
  of a vibe-coding platform (Replit, Lovable, v0, etc.) at the simulator URL so it
  renders in the glasses' additive style.
- Pairs with [app creation](create-app.md) — build the app, then preview it here.

---

## How to preview

### Step 1 — Copy the folder into the app's static/public directory

Serve the folder so `preview.html` is reachable at a stable URL. The script
resolves `backgrounds/` **relative to its own URL**, so keep the folder intact.

| Stack | Copy `mrbd-simulator/` to | Served at |
|-------|---------------------------|-----------|
| Plain HTML/static | next to `index.html` | `./mrbd-simulator/…` or `/mrbd-simulator/…` |
| Vite / CRA | `public/` | `/mrbd-simulator/…` |
| SvelteKit | `static/` | `/mrbd-simulator/…` |
| Next.js | `public/` | `/mrbd-simulator/…` |
| Angular | `src/assets/` (or `public/`) | `/assets/mrbd-simulator/…` |

Immediately add the simulator to the project root `.replitignore`. Preserve any
existing patterns:

```bash
if ! grep -qxF '**/mrbd-simulator/**' .replitignore 2>/dev/null; then
  if [ -s .replitignore ] && [ "$(tail -c 1 .replitignore | wc -l)" -eq 0 ]; then
    printf '\n' >> .replitignore
  fi
  printf '%s\n' '**/mrbd-simulator/**' >> .replitignore
fi
```

Replit Publish applies this exclusion without another agent turn. For a non-Replit
deployment, add the same pattern to that platform's deployment ignore configuration.

### Step 2 — Open the standalone preview

Pass the app URL through the preview page's `app` query parameter:

```text
/mrbd-simulator/preview.html?app=/
```

For Angular's assets path, use `/assets/mrbd-simulator/preview.html?app=/`. If the
app URL contains a query string or fragment, URL-encode it. The app and preview
must have the same origin so shortcut keys can reach the app document.

Do not add `mrbd-simulator.js` to the app HTML or application code. The standalone
page prevents duplicate app initialization, requests, timers, and subscriptions.

### Step 3 — Reload the preview

The preview shows the sidebar on the left and the 600×600 app centered on a blurred
environment. Settings persist in `localStorage` (`mrbd_settings_v1`).

---

## Using a vibe-coding preview panel

Point the preview panel at `/mrbd-simulator/preview.html?app=/` instead of the bare
app URL. This changes only the preview location and leaves the app document
untouched. The `mrbd-simulator/` folder is dev-only and must not reach production.

---

## Sidebar controls

| Control | Effect |
|---------|--------|
| Background | `Dark`, or any image from `backgrounds/manifest.json` |
| App Brightness | 0–100% dim of the whole app (`brightness()` filter) |
| Background Blur | 0–40px blur on the environment |
| Show Display Frame | The rounded 600×600 bezel on/off |
| Shortcuts | Click ↑ ↓ ← → / return / esc to dispatch real key events to the app |

## Adding background images

No background images are bundled. The browser can't list a directory, so
**`backgrounds/manifest.json` is the source of truth**. To add one locally:

1. Drop the image into `mrbd-simulator/backgrounds/` (e.g. `golden-gate.jpg`).
2. Add its filename to the array in `manifest.json`:
   ```json
   ["golden-gate.jpg"]
   ```
3. Refresh — it appears as a swatch. The label is derived from the filename
   (`golden-gate.jpg` → "Golden Gate"). For a custom label, use an object entry:
   `{ "file": "golden-gate.jpg", "label": "GG Bridge" }`.

If the manifest is empty, missing, or unreadable, the simulator uses Dark.

## Notes & gotchas

- **Serve over http(s).** Backgrounds load via `fetch()` of the manifest; over
  `file://` some browsers block it and the simulator uses Dark.
- **Do not activate the simulator shell.** Keep `replit:meta-device` on the app
  HTML only. Tagging `preview.html` makes Replit's device QR open the dev-only
  simulator wrapper on the glasses instead of the app.
- **Window width.** Best viewed at ≥ 944px wide (344px sidebar + 600px display).
  Narrower windows clip the display on the right/bottom rather than hiding it.
- **Use dark UI.** The additive blend only looks right when the app uses a black/dark
  background — which glasses web apps should already do (`#000000` = transparent).
  Apps from [app creation](create-app.md) are already themed correctly.
- **Shortcuts vs. focus.** Key buttons `preventDefault` on mousedown so the app keeps
  focus and D-pad navigation keeps working when you click them.

## Verify

- [ ] `mrbd-simulator/` folder is served (`preview.html`, script, and backgrounds reachable)
- [ ] Preview URL includes the same-origin app in its `app` query parameter
- [ ] App initializes once inside the 600×600 iframe
- [ ] App renders as a 600×600 display on a blurred background with additive glow
- [ ] Sidebar controls work (background, brightness, blur, frame)
- [ ] Shortcut keys drive the app's D-pad navigation
- [ ] Production deploy does **not** include the simulator script or `mrbd-simulator/` folder

## Related references

- [App creation](create-app.md) — scaffold the glasses web app this previews
- [Publish](publish.md) — exclude this simulator before shipping
- [UI](ui.md) — display rules for screens/components you add
- [Sensors](sensors.md) — add sensor features, then preview changes here
