# Meta Quest WebXR with IWSDK

Use this reference for Meta Quest immersive web apps. Do not use it for Meta
Ray-Ban Display glasses or a 2D Expo app.

Before you write a new feature, read [IWSDK planning](webxr-planning.md). Then
read the reference for grab, ray, UI, physics, or debugging when applicable.

## Project Setup

Use `@iwsdk/core@0.4.2` and `three@npm:super-three@0.181.0`. Use
`@iwsdk/cli@0.4.2`, `@iwsdk/reference@0.4.2`, `@iwsdk/vite-plugin-dev@0.4.2`,
and `@iwsdk/vite-plugin-uikitml@0.4.2` for development.

Configure Vite with `iwsdkDev`, UIKitML compilation from `ui/` to `public/ui/`,
host `0.0.0.0`, port 5000, and static `dist/` output. Serve the deployed app on
public HTTPS before opening it in the Meta Quest Browser.

Add this activation tag to every generated WebXR HTML document's `<head>`:

```html
<meta name="replit:meta-device" content="quest">
```

This applies to WebXR HTML, not the native Expo flow, which loads a Metro bundle
and does not generate an HTML document.

## Core Rules

- Use `World.create`, ECS queries, query subscriptions, and cleanup functions.
- Import Three.js types from `@iwsdk/core`. Do not import them from `three`.
- Use `AssetManifest` and `AssetManager`. Do not use raw GLTF or texture loaders.
- Use `createTransformEntity`. Do not use `scene.add`.
- Allocate temporary values in `init`, not inside `update`.
- Enable locomotion only when the scene has a locomotion environment or physics
  collision. Enable physics, grabbing, scene understanding, and environment
  raycast only when the app uses and configures them.
- Target 72 to 90 FPS. Keep frame work within 11 to 14 milliseconds.

## Interaction Baseline

When you remix the Meta Quest template, preserve its four interaction blocks
unless the user explicitly asks to remove one:

- Visible controller rays with hover and press feedback.
- Controller buttons, triggers, grips, and thumbsticks with a live input HUD.
- Background music with positional interaction audio.
- A directly grabbable object and a ray-distance grabbable object.

Hand grab uses pinch. Controller button mappings apply only to controllers.

## Testing

Run `npx tsc --noEmit` before runtime testing. Before you start a dev server,
use an available IWER session-status tool or run `npx iwsdk xr status`. If a
session is active, do not start a second server.

After building, confirm the exact `replit:meta-device` tag is present in the
built HTML and in the HTML returned by the running or deployed app. A source-file
check alone is not sufficient.

Use available project MCP tools or `npx iwsdk` to enter XR, test controller and
hand input, inspect the scene, and capture screenshots. Use
[the debugging reference](webxr-debug.md) when behavior needs frame-by-frame
inspection.
