---
name: mockup-sandbox
description: "Use for live rendered web UI on the canvas: mockups, prototypes, design variants, responsive previews, component states, themes, and social posts as editable components. Never embed the main app URL for component previews. Use mockup-extract first for existing app UI and mockup-graduate when integrating an approved mockup. Includes DESIGN subagent orchestration for variants and full pages."
---
# Mockup Sandbox Skill

`artifacts/mockup-sandbox/` is an isolated Vite frontend for live component previews on the canvas. Use it for rendered HTML/CSS/React; use the canvas skill alone for static shapes, text, or diagrams.

Read the references at the point their task applies; paths below are relative to this skill:

- [Assets and structure](references/assets-and-structure.md): before adding images, fonts, packages, or shared component folders; includes the directory map and built-in components.
- [Design variants](references/design-variants.md): before planning alternatives or any divergent exploration; also read {{skill("design-exploration")}}.
- [Orchestration](references/orchestration.md): before delegating a mockup, building multiple pages, or authoring the three required follow-up cards. Includes task templates, lifecycle examples, and suggestion rules.

## Scope and preservation

If the request is vague, clarify which component or page to prototype, then make reasonable layout, color, and content decisions.

**Extract existing app UI first.** For redesigns, improvements, or variants of UI that already exists, use {{skill("mockup-extract")}}, label the extracted baseline "Current", then duplicate and modify it. Never hand-code an approximation from memory or guessed dimensions, colors, spacing, or opacity.

**One page, one component file.** A landing page, homepage, or single-page app is one scrollable iframe, not separate hero/features/pricing/footer files or screens. Local helper components inside the file are fine. Create separate pages only when the user explicitly requests them. A vague "design a CRM/dashboard" is still one page.

**Social posts are UI, not generated images.** Build Instagram posts, tweets, LinkedIn posts, TikTok slides, stories, and ads as live React/Tailwind components. Default to only the artwork, not avatar/header, like/share controls, caption blocks, follower counts, or feed chrome unless the user explicitly asks for an in-feed mockup. Exportable assets render edge-to-edge: `h-screen w-full`, no page padding, matting, drop shadow, or wrapper decoration. Use `generateImage` only for assets *inside* the component; save them under `artifacts/mockup-sandbox/public/images/`, never the main app's `public/`. Match the platform aspect ratio.

**Exploration is non-destructive.** A clicked suggestion or request for alternatives creates a new component file and a new frame beside the source; never overwrite the source file, URL, or contents. An explicit request to change *this* frame is an in-place edit: mark it `"modifying"`, edit its file, then mark it `"live"`. Duplicate first only if the user wants the old version preserved. Switching design systems is the re-homing exception below.

**Reserved building frames are off-limits.** A `"building"` frame you did not create this turn is reserved for pending work. Fill it with an update if it belongs to your current task; otherwise leave it alone. Only delete unfilled placeholders you created this turn.



## Setup and paths

### 1. Start the preview server


The mockup sandbox is pre-installed; **do not call `createArtifact`**.


Start the server **before** creating components or placing iframes:

```javascript
await restartWorkflow({ workflowName: "artifacts/mockup-sandbox: Component Preview Server" });
```

The Vite `mockupPreviewPlugin` discovers components via `fast-glob` and file watching, writes `src/.generated/mockup-components.ts`, and rescans on relevant 404s. Tailwind/shadcn changes hot-reload. If the workflow is booting or discovery is settling, rely on iframe retries and the automatic rescan; do not ask the user to refresh the whole board.

### 2. Verify the component directory

List `artifacts/mockup-sandbox/` before creating files or delegating. The default directory is `src/components/mockups/`; pass verified full paths to subagents.

```tsx
// artifacts/mockup-sandbox/src/components/mockups/pricing-cards/Minimal.tsx
export function Minimal() {
  return <div className="min-h-screen bg-background p-8">Basic Plan — $9/mo</div>;
}
```

Each file exports one top-level preview component; named exports should match the filename. Keep small helpers inside it. Files prefixed `_` are not preview targets. `_shared/` is for intentionally shared multi-page chrome, not imports across unrelated mockup folders/pages. Each file imports its own `_group.css` for group tokens/fonts. Never edit global `src/index.css` for one group or allow parallel subagents to overwrite it.

For extracted baselines, copy the main app's `:root` and `.dark` CSS variable blocks and its font `@import`s into the extraction folder's `_group.css`; every extracted component explicitly imports `./_group.css`. Follow the mockup-extract skill's full process.

Use semantic tokens for the "Current" baseline; design variants may use colors that express their direction. Use realistic data, descriptive hypothesis names, and separate files for loading/empty/error states. Do not build variant-switching tabs/dropdowns inside components: each variant is its own canvas iframe.

### 3. Design-system entries and switching

Each design system has its own entry under `artifacts/mockup-sandbox/src/ds/<ds-slug>/`. If absent:

1. Copy `.local/skills/mockup-sandbox/templates/ds-entry` into that directory. Replace `__DS_SLUG__` in its `styles.css`; other files are slug-agnostic. Being under `src/`, it is already covered by `tsconfig.json`.
2. Add `"@workspace/<ds-slug>": "workspace:*"` to the sandbox's `devDependencies`.
3. If the design system's `src/index.css` lacks `@source "./components"`, add `@source "./components";` to its `scripts/theme-template.css` and regenerate with `pnpm --filter @workspace/<ds-slug> tokens`.
4. Run `pnpm install` from the project root and restart "artifacts/mockup-sandbox: Component Preview Server".

Put product-UI mockups in `src/ds/<ds-slug>/mockups/<ComponentName>.tsx`, importing from `@workspace/<ds-slug>/*`.

Applying a different design system is **not** just restyling in place: wire the target entry, rebuild there, then repoint **every** frame referencing the old component (including responsive siblings) to its new URL and `componentPath`. Delete the old file only when no frame references it. Restart for a new entry; an existing entry discovers the file through `import.meta.glob`. If already under the target entry, use ordinary in-place editing.

### 4. Place and build

Read `getCanvasState()` before placement; use unoccupied space. Immediately place `"building"` iframes with stable shape IDs, descriptive `componentName`, and expected dimensions. No URL is needed until live.

Use the canvas skill's layout recipes. Arrange variants and responsive comparisons horizontally with ~50px gutters. For 3+ frames, place approximately then `align` top + `distribute` horizontally in the same batch; do not hand-compute every gutter. For two frames align the shared edge and set the gap on create; `distribute` needs 3+, `align` needs 2+. Before final presentation, clean up any row/column of 3+ frames you placed. Do not add labels above each iframe; its title bar already names it. Multi-page direction grids use row/column headers as described in the orchestration reference.

Only if `focusedShapes`, `blurryShapes`, **and** `peripheralClusters` were all empty before placement, call `focusCanvasShapes` on the new placeholder IDs in the same execution. The summary count alone misses off-screen content. Otherwise do not auto-focus; present the artifact at the end.

Resolve `REPLIT_DOMAINS` before constructing the iframe URL; no literal unresolved template strings or port number:

- Default: `https://${REPLIT_DOMAINS}/__mockup/preview/{folder}/{ComponentName}`
- Design system: `https://${REPLIT_DOMAINS}/__mockup/src/ds/<ds-slug>/#/{ComponentName}`

Never embed the main app URL for an isolated preview. `componentPath` is the actual source file; `componentName` is the display name.

## Build and delegate

Small single components and in-place modifications can be direct builds. Full-page mockups use one DESIGN subagent (one component file) unless the user asks otherwise. Two or more design alternatives use DESIGN fan-out; the parent sets up the server, brief, placeholders, and layout, and each subagent builds its direction. Extract/graduate engineering work uses GENERAL if parallelizing, not DESIGN.

Before variants, read [Design variants](references/design-variants.md) and the design-exploration skill. Before delegation, read [Orchestration](references/orchestration.md) for the appropriate direct, variants, multi-page, or multi-direction task pattern.

Pass each worker the verified target file/export, shape ID, resolved preview URL, functional requirements, shared imports if applicable, and a brief mood/direction. Allow creative freedom; do not prescribe exact colors, fonts, spacing, CSS classes, layout, or references to other variants. Multi-page shared chrome is the exception. Pass design-system entry/component/URL conventions when applicable.

Explicitly pass image and social-post constraints. Images belong in `artifacts/mockup-sandbox/public/images/` and are referenced as `/__mockup/images/filename.jpg`; `generateImage.outputPath` needs that full sandbox prefix. Never URL-reference `src/assets/`; those files require Vite imports instead. Tell workers not to edit `index.css`.

Workers update their own placeholders to live progressively and screenshot the preview before reporting. The parent checks logs, fixes errors, and restarts the workflow **once after all workers finish**, not per worker.

## Lifecycle, verification, and delivery

- New component: `"building"` → build → `"live"`, then screenshot to confirm it renders.
- Explicit in-place edit: `"modifying"` → edit → `"live"`.
- **Every live design frame needs three `suggestedActions` in the same update that sets `"live"`**, including fan-out variants and frames spawned by clicked suggestions. Ideally author them on the building frame too. Read [Orchestration — Suggested next steps](references/orchestration.md#suggested-next-steps-required-when-marking-a-design-frame-live) before authoring them; it preserves the current variation/trajectory rules.
- Suggestions need short authored IDs, user-facing one-sentence labels ≤60 characters, optional categories, and hidden `{kind: "prompt", prompt}` content that explicitly requests a **new** frame/component copy, never an in-place overwrite.
- Updates use `updates: { shapeType: "iframe", ... }`; creation uses `shape: { type: "iframe", ... }`. Set the resolved URL and source metadata when marking live.
- Always check system logs for iframe errors and fix them before proceeding. Broken previews can overlay errors across the canvas. For a blank preview, check `Failed to resolve import`, confirm files are in the sandbox's `src/` (not the main app), ensure a function component export exists, and restart after `vite.config.ts` or `package.json` changes.

Always present all affected shapes after final canvas work; do not ask whether the user wants to see them:

```javascript
const { artifacts } = await listArtifacts();
const mockupArtifact = artifacts.find(a => a.artifactDir === "artifacts/mockup-sandbox");
await presentArtifact({ artifactId: mockupArtifact.artifactId, shapeIds: ["shape-id-1", "shape-id-2"] });
```

Never share dev domain URLs in chat; use them only in tool calls and iframe tasks. Do not suggest deploying the mockup sandbox. If asked to publish, first integrate/graduate into a real app artifact using {{skill("mockup-graduate")}}.

## Iframe sizing guide

Fit content rather than leaving small components in huge frames. Cards/forms use snug dimensions (e.g. 500×450) and `flex items-center justify-center min-h-screen`; page sections omit `min-h-screen` and use content height.

| Content | Width × height |
| --- | --- |
| Landing page, scrollable desktop | 1280 × 900 |
| Landing page, full screenshot-style view | 1280 × 2400 |
| Multi-page app, desktop | 1280 × 800 |
| Multi-page app/mobile comparison | 390 × 844 |
| Tablet comparison | 768 × 1024 |
| Desktop comparison | 1280 × 720 |

Social/export assets use the exact platform aspect ratio: square 1:1 (e.g. 1080×1080), portrait 4:5 (620×775 or 1080×1350), story 9:16 (1080×1920). Render edge-to-edge.
