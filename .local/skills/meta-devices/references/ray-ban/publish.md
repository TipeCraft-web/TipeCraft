# Publish a Meta Ray-Ban Display Glasses Web App

A short gate to run **immediately before the app goes live**.

> **The one critical job: the MRBD dev simulator must not ship.** Its preview folder is
> present during development ([app creation](create-app.md), Step 6), so at publish time
> there is almost always something to exclude. It wraps the app in a sidebar, a background photo,
> a bezel, and a `mix-blend-mode: screen` composite — on real glasses that's a broken
> app, plus JS and images the user pays for on a slow link and a small battery.

## Step 1 — Remove the simulator

Keep the required `**/mrbd-simulator/**` entry in `.replitignore`. It is the guard
that prevents ordinary Replit Publish builds from uploading simulator files.

```bash
grep -rn "mrbd-simulator" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.local --exclude=.replitignore
```

The exclusions skip the installed skill files and the expected deployment guard.
Neither is part of the app output.

Resolve every hit:

| What you find | Do this |
|---|---|
| `mrbd-simulator/` folder in `public/` / `static/` / next to `index.html` | Exclude it from the deploy |
| An app source file that loads `mrbd-simulator.js` | Remove it. The simulator runs only from its standalone preview page |
| A stray `mrbd_settings_v1` read/write | Remove it — that's the simulator's `localStorage` key |

Nothing else changes. The simulator never touched the app's own code, so no app
behavior depends on it.

## Step 2 — Verify it's gone from what ships

Check the **built output**, not just the source.

```bash
grep -rn "mrbd-simulator" <deploy-dir>/     # or: npm run build && grep -rn "mrbd-simulator" dist/
```

No matches. Then load the production build: no sidebar, no background photo, no bezel —
just the app on a black page. That black page is correct; on the glasses it's transparent.
Confirm both the built HTML and the HTML returned by the production URL contain
`<meta name="replit:meta-device" content="ray-ban-display">`. A source-file check
alone is not sufficient.

## Step 3 — Re-check the bare app

The simulator was the only thing making the preview look like glasses. Without it:

- [ ] Background `#000000`; every UI surface that must be seen uses a dark gray, never `#000000`
- [ ] D-pad only — arrows move focus with wrap-around, Enter activates, Escape backs, focus ring visible
- [ ] Renders at 600 × 600, no overflow; viewport, `mrbd-web-app-capable`, and `replit:meta-device` meta tags present
- [ ] `favicon.png` ships and is referenced; no console errors on load
- [ ] Within the performance budget — see [performance](performance.md). Re-measure rather than
      reusing pre-publish numbers: removing the simulator drops JS and a full-size photo
- [ ] No dev-only bundles, source maps, or debug logging in the build

Ship when Step 2 returns nothing and Step 3 passes. If the user keeps developing after
publishing, keep the simulator folder in development source but exclude it from deployments.

## Related references

- [App creation](create-app.md) — builds the app and adds the standalone preview
- [Simulator](simulator.md) — the standalone simulator preview
- [Performance](performance.md) — the full performance budget
- [UI](ui.md) — the display rules behind the Step 3 checks
