# Meta Ray-Ban Display Web App Simulator (MRBD)

A tiny, **dev-only** drop-in that makes any web app render as if it were running on the
Meta Ray-Ban Display glasses — additive (waveguide) rendering, a 600×600 display, and a
settings sidebar — **without a Chrome extension** and **without touching your app's code**.

Works in any modern browser (Safari, Edge, Firefox, Chrome).

## What it does

- **Additive rendering** — the app is composited onto a blurred background with
  `mix-blend-mode: screen`, so black UI pixels read as transparent (see-through
  waveguide) and bright pixels glow, just like the real display.
- **Sidebar** with:
  - **Background** — Dark, plus any images in `backgrounds/` (see below).
  - **App Brightness** — dims the whole app (`brightness()` filter).
  - **Background Blur** — 0–40px blur on the environment.
  - **Show Display Frame** — the rounded 600×600 bezel.
  - **Shortcuts** — a D-pad legend; click a key to dispatch the real
    Arrow / Enter / Escape keyboard event to your app.

Not included by design: recording, QA, perf scoring, try-on-glasses, animated
backgrounds, uploads, webcam.

## How to use

1. Copy the `mrbd-simulator/` folder into your app's **static / public** directory
   (for Vite/CRA that's `public/`, so it is served at `/mrbd-simulator/...`).
2. Open the standalone preview page and pass the app URL:

   ```text
   /mrbd-simulator/preview.html?app=/
   ```

The preview loads the app once inside a real 600×600 iframe. It does not inject
code into the app or start a hidden second copy.

## Adding new image backgrounds

Background images live in `backgrounds/` and are listed in `backgrounds/manifest.json`:

```json
[]
```

No images are bundled. To add one locally:

1. Drop the image file into `backgrounds/` (e.g. `golden-gate.jpg`).
2. Add its filename to the array in `backgrounds/manifest.json`.
3. Refresh — it appears as a new swatch. The label is derived from the filename
   (`golden-gate.jpg` → "Golden Gate"). For a custom label use an object entry:
   `{ "file": "golden-gate.jpg", "label": "GG Bridge" }`.

> Why the manifest? A browser can't list a directory's contents, so a static script has
> no way to discover files on its own — the manifest is the source of truth. If it's
> missing or empty, the simulator uses Dark.

## Enabling / disabling

Open the preview URL to use the simulator. Open the app URL directly to use the app
without the simulator. Do not ship the `mrbd-simulator/` folder to production.

## Notes

- Settings persist in `localStorage` (`mrbd_settings_v1`).
- Best viewed in a window at least `sidebar (344px) + 600px` wide (944px). Smaller windows clip
  the display on the right/bottom rather than hiding it under the sidebar.
- Apps meant for the glasses should use dark/black backgrounds — that's what makes the
  additive blend look correct (as this app already does).
- Background discovery uses `fetch()` for the manifest, so serve the app over `http(s)`.
  Over `file://` some browsers block the fetch; the simulator then uses Dark.
