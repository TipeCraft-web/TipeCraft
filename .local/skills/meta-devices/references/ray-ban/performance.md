# Performance for Meta Ray-Ban Display Glasses Web Apps

Glasses web apps run on a small, battery-constrained device over a slow mobile
link, with D-pad-only input and a 600×600 display. An app that feels fine on a
laptop can be slow to start and janky on the glasses. This reference is the
performance discipline to apply — **both while generating an app (so it's fast by
default) and as an optimize pass on an existing one.**

Pair it with [app creation](create-app.md) and the
[simulator](simulator.md).

## What "fast" means here — the budget

| Aspect | Target |
|--------|--------|
| Startup to interactive | ≤ ~3s over a slow mobile connection |
| Initial payload | small — under ~500KB (compressed) is a good bar |
| Requests on load | < 10 |
| Animation | cap at ~30fps; animate `transform`/`opacity` only; no continuous loops while idle |
| DOM size | lean — avoid thousands of nodes; virtualize long lists |
| Memory | modest; free assets you're done with |
| Input | fully drivable by D-pad (Arrow keys + Enter + Escape) — never require touch/pointer |

## What you can trust off-device (important)

You will usually not have the physical glasses. Be honest about which signals hold
up when you measure or reason on a normal computer:

- **Startup and payload are predictable off-device.** They're governed by network
  and CPU cost, so optimize them with confidence.
- **Animation smoothness (jank) is hard to judge off-device.** GPU/render-bound
  stutter often does *not* show up in a desktop browser, so any off-device jank
  estimate is a **low-confidence hint** — confirm it on real glasses. Never fail an
  app on an off-device jank number alone.
- Because of that, **weight your judgment toward startup and payload**, and treat
  jank as a nudge — but still apply the cheap, always-correct jank fixes below
  (cap 30fps, animate transform/opacity, keep per-frame work small).

## The loop

```
generate (or start from an existing app)
  → measure or review against the budget
  → apply the top fixes (highest impact first)
  → re-check
  → repeat until it's within budget or the remaining items are consciously declined
```

When generating a new app, apply the budget and the playbooks below **up front** so
the first version is already fast — don't ship it slow and optimize later.

## Bottleneck → fix

Diagnose against the budget, then apply the matching fix (highest impact first):

| Symptom | Fix |
|---------|-----|
| **App fails to load** | Resolve the 404/blocked request; verify the deployed URL serves the app shell and every referenced asset. |
| **Heavy payload** (well over ~500KB) | Code-split and lazy-load non-critical JS; tree-shake unused code; enable brotli/gzip; drop heavy deps; defer below-the-fold assets. |
| **Too many requests** (approaching/over ~10) | Bundle JS/CSS, inline critical CSS, sprite/atlas small images, set long-lived cache headers. |
| **Large / many images** | Serve images at ≤ 600px in WebP/AVIF, compress hard, sprite small ones, lazy-load off-screen. |
| **Preloaded audio/video** | Load media on demand (after first interaction), compress bitrates, stream rather than preload. |
| **Slow startup** | Paint a lightweight shell/skeleton immediately, then stream the rest; prioritize above-the-fold, defer the rest. |
| **Jank / dropped frames** | Cap animation to ~30fps; batch DOM reads then writes (avoid layout thrash); animate only `transform`/`opacity`. |
| **Long main-thread tasks** | Chunk heavy work with `requestIdleCallback` or `setTimeout(0)` (not promises or `queueMicrotask`, which run before the browser can paint or handle input); move parsing/physics/AI to a Web Worker; avoid big synchronous `JSON.parse`/DOM builds during interaction. |
| **Heavy DOM** (thousands of nodes) | Virtualize long lists, simplify markup, remove off-screen nodes, prefer canvas for dense/animated content. |
| **High memory** | Free unused textures/assets, reuse buffers, pool objects to cut GC pauses, avoid retaining large offscreen canvases. |
| **No D-pad path** | Handle Arrow keys + Enter + Escape; make interactive elements focusable and navigable by focus order; never require pointer/tap/gestures. |

## Startup playbook — get interactive fast, then stream the rest

- Paint a minimal app shell/skeleton first and make it interactive **before** loading heavy modules.
- Code-split by route/screen; `import()` non-critical components on first interaction or in `requestIdleCallback` — not at boot.
- Lazy-load below-the-fold / off-screen assets (`loading="lazy"`, `IntersectionObserver`); preload **only** the critical path.
- Defer heavy dependencies (game engine, physics, 3D models, audio, non-critical fonts) until after first paint or on demand.
- Inline critical CSS; `async`/`defer` scripts; compress (brotli/gzip); tree-shake and drop unused deps; serve images ≤ 600px in WebP/AVIF.
- Precache the shell in a service worker with long-lived cache headers so repeat launches are near-instant.

## Steady frame-rate playbook — smooth motion without jank

- Throttle the render loop to ~33ms (≈30fps); don't render faster than the display can show — extra frames are just dropped.
- Keep per-frame main-thread work well under the frame budget; move physics/AI/pathfinding/parsing to a Web Worker.
- Animate only GPU-composited properties (`transform`/`opacity`); never animate layout/paint properties (`top`/`left`/`width`/`height`/`box-shadow`/`filter`).
- Batch DOM reads then writes to avoid layout thrash; use `will-change` only on layers that are actively animating.
- For canvas/WebGL: cut draw calls and overdraw, use sprite atlases, cull off-screen, minimize state changes, reuse buffers/textures.
- Use a fixed-timestep update loop decoupled from render (interpolate); precompute/cache expensive results.
- Avoid per-frame allocations (pool objects) to prevent GC hitches; pre-decode images before heavy scenes.
- Degrade gracefully — reduce particle counts, effects, or internal resolution to hold a steady rate rather than dropping frames.

## Optional: a prompt for the developer's AI agent

If you're handing the fixes to another coding agent, a prompt like this works:

> Optimize this web app for Meta Ray-Ban Display glasses (600×600 display, D-pad-only
> input — no touch, a slow mobile connection, and a limited CPU/GPU). Apply, highest
> impact first: [list the specific fixes from the table above that this app needs].
> Then follow the startup and steady-frame-rate playbooks: paint an interactive shell
> first and defer everything non-critical; keep payload and requests small; cap
> animation at ~30fps and animate only transform/opacity. Verify that over a slow
> link the app paints a usable shell fast and that interaction stays smooth.

## Verify

- [ ] App paints a usable shell fast; nothing blocks first render on a network call
- [ ] Initial payload and request count are within budget
- [ ] Non-critical JS/assets are deferred or lazy-loaded
- [ ] No continuous animation/timers while idle; animation capped at ~30fps, transform/opacity only
- [ ] Fully operable by D-pad (Arrow keys + Enter + Escape)
- [ ] Animation-heavy apps flagged for on-device confirmation (off-device jank is a hint only)

## Related references

- [App creation](create-app.md) — scaffold a glasses app with this budget
- [Simulator](simulator.md) — preview the app in the glasses' rendering style
- [UI](ui.md) — display rules that complement this budget
- [Sensors](sensors.md) — re-check this budget after adding sensor features
