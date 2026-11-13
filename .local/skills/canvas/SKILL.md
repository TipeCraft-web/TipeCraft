---
name: canvas
description: "Create, read, and manipulate canvas shapes: live UI previews via mockup-sandbox iframes, static shapes, text, notes, images, and videos. Read this skill before any canvas operation, including reading board state, placing shapes, or managing iframe lifecycle."
---

# Canvas Skill

## Place building iframes before building

When a request produces **new visual content** (landing pages, card variants, dashboard mockups), first place placeholders, before writing code or setting up servers:

1. Call `applyCanvasActions` with `create-auto`, `state: "building"`, stable IDs, and names for every planned iframe. No URL is needed.
2. Call `getCanvasState` first only if exact coordinates or placement relative to existing content are needed.
3. Then set up the mockup sandbox, write code, and start servers.
4. As each element is ready, update its existing frame to `"live"` with the real URL and the required design suggestions below.

This immediate feedback rule does not apply to read-only requests, modifications to existing shapes, or non-iframe work such as text labels.

## Surface and callbacks

The canvas is an infinite board for live iframes, artifact frames, and static geo/text/note/image/video shapes. To view frames full-size, users click the preview button above the frame. Tell users to "open the Preview tab and toggle on the canvas" using the button below the workspace-level preview window; there is no Canvas tab. Artifact frames cannot be deleted or freely resized (they maintain their snap-back ratio).

All three callbacks are pre-registered, async, and called directly with `await` in `codeExecution`:

- `getCanvasState({ focusArea? })`: board state near the viewport or an optional `{x, y, w, h}` region.
- `applyCanvasActions({ actions })`: ordered atomic batch of create, create-auto, update, delete, move, resize, reorder, align, or distribute actions. Results include per-action generated `shapeId` values.
- `focusCanvasShapes({ shapeIds, animateMs?, padding? })`: pan/zoom to shapes, subject to the viewport rule below; `animateMs: 500` gives a smooth transition.

Use **camelCase** (`shapeIds`, `animateMs`, `focusArea`, `shapeId`, `componentName`), not snake_case: wrong casing causes validation failures. Read [API schemas](references/api-schema.md) before constructing an action whose full fields, enums, or required keys are not shown here.

Rendered component previews require **both** this skill and **mockup-sandbox**: that skill owns isolated Vite setup, source paths, and preview URLs; this one owns placement, lifecycle, and layout. Never use the main app URL as an isolated component preview.

Coordinates use top-left origin `(0,0)`, positive x right and y down, in canvas units.

## Read the board

`getCanvasState()` returns:

- `focusedShapes`: full nearby shape detail. Geo/text/note shapes include color, fill, and text; iframes include `url`, `componentName`, `componentPath`, and `state`; images include `src`, `altText`, and local `.canvas/assets/` `filepath` where applicable; videos include `src` and `altText`.
- `blurryShapes`: positions/basic information farther away. Iframes include `componentName`/`state`, images `src`/`filepath`, videos `src`.
- `peripheralClusters`: aggregate counts of distant groups, not per-shape records.
- `summary`: text overview.
- `viewport`: visible `{x, y, w, h}`.

```javascript
const state = await getCanvasState();
console.log(state.summary);
console.log(JSON.stringify(state.focusedShapes, null, 2));
const region = await getCanvasState({ focusArea: { x: 0, y: 0, w: 2000, h: 1500 } });
```

Search both focused and blurry shapes for an anchor. Large-board overflow may exist only in clusters, so re-query with `focusArea` if missing. Do not assume a shape is absent because it was outside the initial viewport.

## Create and update frames

Prefer `create-auto` for new iframes needing automatic placement. It avoids existing shapes and places the batch together. Use explicit coordinates only when required, after reading the board.

```javascript
await applyCanvasActions({ actions: [{
  type: "create-auto",
  shapeIds: ["app-preview"],
  names: ["App Preview"],
  shape: { type: "iframe", w: 1280, h: 720, state: "building" }
}] });
```

Create each `shapeId` only once; duplicate creation fails. Use `update` for all later changes:

- Create takes `shape: { type: "iframe", ... }`.
- Update takes `updates: { shapeType: "iframe", ... }`. `shapeType`, **not** `type`, is required inside updates; do not copy create payload keys into an update.
- `"building"`: component/server not ready; URL optional, native building indicator shown.
- `"modifying"`: set **before** editing an existing component's backing file.
- `"live"`: content ready; resolved HTTPS URL required.
- `componentPath` and `componentName`: title-bar metadata labels (source path and display name), not URL routing.
- `componentProps`: extra properties merged into shape props.

**Every design/mockup frame must attach three `suggestedActions` in the same update that makes it live.** This applies to the first frame, every fan-out variant, every later live transition, and frames spawned by suggestions. Never defer the suggestions until later. Running-app/artifact embeds that are not design frames are exempt.

Before authoring suggestions, read [Suggestion authoring](references/suggestions.md). Each card has hidden `content: { kind: "prompt", prompt }`, a required one-sentence `label` ≤60 characters describing the concrete change (not a title/category or full execution prompt), an optional nonempty freeform `category`, and a short authored `id` for accept/dedup/telemetry. Omit `suggestedActions` entirely when unused; never send `null`. The API allows up to three; live design frames require all three.

Example live transition for a **non-design app embed** (for a design frame, add the three authored cards to `updates` in this same call):

```javascript
await applyCanvasActions({ actions: [{
  type: "update",
  shapeId: "app-preview",
  updates: {
    shapeType: "iframe",
    state: "live",
    url: "https://<resolved-domain>.replit.dev",
    componentName: "App Preview"
  }
}] });
```

### Exploration must preserve its source

A clicked suggestion or request to explore a variant/follow-up creates a **new frame and new component file** beside the source. Leave the source frame's URL, `componentName`, `componentPath`, and contents untouched. Copy the source file and edit the copy; in-place changes also race parallel agents reading it.

Suggestion prompts must explicitly request a NEW frame/variant, and refinements must say to copy into a new component file without modifying existing files. A suggestion arrives as an ordinary message with frame selection context, not a special branch marker.

Only an explicit request to modify *that* frame (such as "make this card blue") authorizes in-place content updates; "what else could this be?" is exploration.

### Reserved building frames

A `"building"` iframe you did **not** create this turn is a reserved system slot, e.g. from a clicked suggestion. Update it if it is for your current work, otherwise leave it alone. Never delete it as stray/leftover cleanup. Only remove unfilled placeholders you created earlier this same turn.

## Images and layout

Read [Images and layout recipes](references/images-and-layout.md) before creating an image or manually aligning/distributing shapes. It includes external/local image payloads, row/column examples, and annotation without moving an anchor.

Local images must be copied to `.canvas/assets/`, then served from the resolved domain on port `5904`; external image URLs can be used directly. Include `altText`.

For layout:

- `create-auto` is the default for automatically placed iframe groups; do not chain hand-calculated gutters across 3+ placeholders.
- `align` requires 2+ shapes and moves **every** supplied shape (there is no fixed anchor). `distribute` requires 3+.
- For a row/column of non-iframe items, place approximately, align one axis and distribute the other in the same batch. For a pair, align only.
- Only align existing user content when the user explicitly asks to line it up. To put something beside an existing shape without moving it, read the anchor and create at `x: anchor.x + anchor.w + gap, y: anchor.y` (or the analogous vertical formula). Keep the anchor's x/y term.
- `left`/`top` snap to minimum x/y; `right`/`bottom` to maximum right/bottom edge; center-horizontal/vertical use mean centers.
- Do not follow alignment/distribution with `move` on those shapes in the same batch: that undoes it. To translate a laid-out group rigidly, read positions and apply the same delta to each with `move`; re-aligning recomputes layout rather than translating it.

## URLs and viewport

- Iframe URLs must use `https`; `http` and `about:blank` are rejected.
- Resolve the actual domain with `echo $REPLIT_DOMAINS` before constructing a URL. Never pass a literal unresolved template string.
- **Non-mockup servers only:** no port suffix routes to the main app on 5000; other servers use `:<port>`.
- Mockup component URLs and paths come from the mockup-sandbox skill, not those generic port rules. Do not embed the main app URL for component previews.
- External sites may block embedding with `X-Frame-Options: DENY` or CSP; Replit dev URLs can be embedded.

**Do not auto-focus.** `focusCanvasShapes` moves the user's viewport; call it only when asked to see the work. Exception: mockup-sandbox allows focusing just-placed placeholders when the board was entirely empty; follow that skill's precise emptiness check. Do not separately focus after presenting.

## Present every result

After the final canvas action, look up the mockup sandbox's artifact ID with `listArtifacts()` and call `presentArtifact` with **all created or modified shape IDs**. This is how the user navigates to the work; never skip it or ask whether they want to see it.

```javascript
const { artifacts } = await listArtifacts();
const mockupArtifact = artifacts.find(a => a.artifactDir === "artifacts/mockup-sandbox");
await presentArtifact({ artifactId: mockupArtifact.artifactId, shapeIds: ["app-preview"] });
```

Batch related changes, label iframes with source path and display name, and use `focusArea` for detail on large boards.

## Error codes

- `SHAPE_NOT_FOUND`: nonexistent ID.
- `UNSUPPORTED_SHAPE_TYPE`: invalid type.
- `INVALID_PROPS`: invalid properties, such as a non-HTTPS iframe URL.
- `VALIDATION_FAILED`: duplicate shape ID.
- `INSUFFICIENT_SHAPES`: too few shapes for alignment/distribution.

## Iframe sizing

Fit the content: small cards/forms should not float in huge frames, and full pages need a proper viewport. Center small components with `flex items-center justify-center min-h-screen`.

| Content | Width × height |
| --- | --- |
| Card/form, example snug frame | 400 × 500 |
| Desktop full-page mockup, scrollable | 1280 × 900 |
| Full page, screenshot-style review | 1280 × 2400 |
| Multi-page desktop app | 1280 × 800 |
| Mobile app/comparison | 390 × 844 |
| Tablet comparison | 768 × 1024 |
| Desktop comparison | 1280 × 720 |

For responsive comparisons of the same component, place frames approximately, align tops, and distribute horizontally as in the layout reference.
