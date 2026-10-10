---
name: artifacts
description: "Use when creating or updating the artifact.toml for artifacts such as websites, web apps, mobile apps, slide decks, pitch decks, videos, and data visualizations."
---



# Artifacts Skill

## What Is an Artifact?

An **artifact** is a runnable project the agent creates -- the primary unit of output. Each artifact is a workspace package at `artifacts/<slug>/`. `createArtifact()` runs the bootstrap flow, scaffolds files, writes `artifact.toml`, and allocates service ports. Dependency installation runs in the background and may still be going when the call returns.

When the user asks to "build a website" or "create an app", call `createArtifact()` once, then continue implementation. The workspace includes a shared backend service; new web artifacts are primarily frontend packages and must treat `previewPath` as a required URL prefix for all app routes and API calls.

## When to Use

Use this skill when:

- Creating a new web application, video, or slide deck
- Creating an OpenSCAD model viewer
- Bootstrapping any new project in the monorepo

## New Artifact vs. Existing Artifact

Add to an existing artifact when the work is a feature, page, or component of that artifact's product and shares the same domain, branding, and purpose. Create a **new** artifact when the work is for a different product or domain, has different branding or purpose, or the user used standalone language like "make a web app" or "create a component." Do not reuse an existing artifact just because it's convenient.

**Not everything needs an artifact.** If the output is a file asset (script, document, image, CSV, config file, etc.), create the file directly and tell the user where it is. Artifacts are for runnable projects with a preview.

**Slide creation defaults to a slides artifact, not a file asset.** Requests for slides, decks, pitch decks, presentations, or PowerPoints mean a `slides` artifact, even for a one-off deck. Read the `slides` skill and follow its build flow; do not substitute a standalone PPTX/PDF or HTML file. Do not ask whether the user wants an artifact or a file. If they also want a PPTX/PDF download, export the slides artifact. Only generate a standalone file instead when the user explicitly asks for file-only output, such as "just give me a .pptx, no artifact." Exporting an existing deck or converting it to another standalone file format does not require a new artifact. Importing or converting a file into editable Replit slides still requires a slides artifact; follow the `slides` skill's import flow in the project.


For web apps, if ambiguous, ask: "Should I create this as a new standalone web app, or add it to [existing artifact name]?"

## When NOT to call `createArtifact`

- The artifact has already been created (do not call `createArtifact` twice for the same `slug`)

## Build Approach

Choose your approach based on artifact type:

- **Creative / canvas artifacts** -- no backend, no OpenAPI, no codegen:
  - **mockup-sandbox** (design mockups, UI prototypes, variant comparisons): Read the `mockup-sandbox` skill. Uses its own Vite dev server and canvas iframes. Delegate design work to a DESIGN subagent. No artifact is needed if the mockup sandbox is present.
  - **openscad** (parametric 3D CAD models — mechanical or printable parts defined by dimensions and boolean primitives, e.g. enclosures, brackets, fixtures, organizers, and functional curved parts like handles, grips, and fairings): Create an OpenSCAD artifact and follow the `openscad` skill. Edit `src/model.scad`; the artifact renders it to `public/model.stl` with the OpenSCAD binary and previews the STL in a Three.js viewer. Do NOT use openscad for realistic or sculptural shapes (vehicles, characters, animals, figurines, product replicas) — constructive solid geometry models those poorly; for a visual 3D mesh use `media-generation`'s `generate3DModel` (textured `.glb`), or an image/web artifact when a flat render or app is wanted.
  - **slides** (slide decks, presentations): Read the `slides` skill BEFORE creating the artifact -- for a new deck it asks the user's missing direction first (deck length, visual style, content outline) and says when to create the artifact. Do not call `createArtifact` for a new deck until that skill's pre-generation flow is settled. No subagent needed. Use `media-generation` for images.
  - **video-js** (short animated videos, up to ~2 minutes max; most are 30-60s): Create a video artifact, then read the `video-js` skill it installs and follow it yourself: it resolves the missing ratio and style, then you script, source assets, build the scenes, and verify. Do not delegate the video to a DESIGN subagent. This is for animated content from code, not a video editor. Size runtime to the content; long videos are unreliable to export.
- **Full-stack artifacts** (react-vite, data-visualization, expo): Follow the OpenAPI-first workflow below.
  - If a `react-vite` artifact is frontend-only and doesn't need a backend, skip the OpenAPI spec and codegen -- go straight to building the frontend after `createArtifact()`, still using a design subagent.
  - **Expo apps: skip the OpenAPI workflow by default.** Most mobile apps don't need a backend on the first build. Use AsyncStorage for persistence. Do NOT use the database, write an OpenAPI spec, or create backend routes unless the user explicitly asks for server-side features. After `createArtifact()`, go straight to the Expo skill's `<first_build>` sequence.

**Full-stack artifacts -- OpenAPI-first workflow:**

Get async work running as early as possible so it can proceed in the background while you build.

1. **Create the artifact** -- call `createArtifact()`. It will guide you to the artifact's skill for build instructions.
2. **Write the OpenAPI spec** in `lib/api-spec/openapi.yaml` -- the single source of truth for all API contracts. It's on the critical path: the spec gates codegen, which gates the frontend. Include both core CRUD and safe wow endpoints -- lightweight read-only endpoints that make the app feel polished (dashboard summaries, recent activity, grouped counts, domain aggregates). The artifact's skill has details on what to plan.
3. **Run codegen** (`pnpm run --filter @workspace/api-spec codegen`) -- generates React Query hooks and Zod schemas. Do NOT read the generated files; they are large and will fill your context.
4. **Launch the frontend build immediately after codegen** -- the artifact's skill tells you how (e.g., async design subagent for react-vite and data-visualization). Do NOT do any other work between codegen and launching the frontend build.
5. **Build the backend while the frontend runs** -- use the pre-configured database, write the schema, build route handlers, and seed data. The frontend is the bottleneck. **Exception: Expo apps should NOT use this workflow unless the user explicitly requested a backend. Use AsyncStorage instead.**

**Key principles:**

- Do NOT touch the pre-configured database or write DB schema before launching the frontend build. DB work doesn't gate the frontend -- OpenAPI does.
- **Expo reminder: do not use the database for Expo apps in the first build.** Use AsyncStorage. This is the most common mistake.
- No need to test or code review the first build.
- Trust generated frontend and subagent output as-is. Do not verify it.
- Batch independent operations within the same artifact into parallel tool calls. Do NOT try to build two artifacts simultaneously -- build one at a time.
- Do not waste time reading files you don't need. All important files have been opened for you.
- Do not read the artifact's skill before creating the artifact or the skill will be read twice. Creating an artifact automatically loads the relevant skill instructions into your context. **Exception: `slides`** -- read the `slides` skill first; it runs the pre-generation questions and says when to create the artifact.

## Creating an Artifact

`createArtifact()` is a single callback call that handles bootstrap + registration. It expects a fresh slug -- if `artifacts/<slug>/` already exists, the call fails instead of reusing partial files.

```javascript
const result = await createArtifact({
    artifactType: "<artifactType>",
    slug: "<slug>",
    previewPath: "/",
    title: "My Project",
    description: "<short paragraph: what the app is, what it does, and who it is for>"
});
```

## Available Callbacks

### createArtifact({ artifactType, slug, previewPath, title, description })

Bootstrap and register a new artifact in one call. Default for all new artifacts; requires an unused `slug`.

**Parameters:**

<!-- BEGIN_ARTIFACT_LIST -->
- `artifactType` (str, required): The artifact type identifier. Use one of:

  - `"expo"` (mobile app)


  - `"design-system"` (Design system: tokens (DTCG), an initial shadcn component scaffold, and a living style guide preview)


  - `"openscad"` (parametric 3D CAD models: mechanical/printable parts, enclosures, fixtures, handles/grips — not realistic or sculptural shapes like vehicles, characters, or figurines (use generate3DModel for those))


  - `"react-vite"` (React + Vite web app)


  - `"slides"` (presentation slide deck scaffold)


  - `"video-js"` (Replit Animation app)

<!-- END_ARTIFACT_LIST -->
- `slug` (str, required): A short, kebab-case slug (e.g., `"my-website"`, `"q1-pitch-deck"`, `"budget-tracker"`). Used in two places:
  - Workspace package name: `@workspace/<slug>`
  - Artifact directory: `artifacts/<slug>/`
- `previewPath` (str, required): The URL prefix where the artifact is served. **Use `"/<slug>/"` (e.g., `"/my-website/"`, `"/budget-tracker/"`) for consistency.** However, **one artifact should always be at `"/"`** -- if nothing is at the root, the dev URL (e.g. `my-app.replit.app`) shows a blank page. Prefer placing web apps (`react-vite`, `data-visualization`) at the root over mobile, video, or slides artifacts. Every artifact in the workspace must use unique service paths.
- `title` (str, required): A short, human-readable title (e.g., `"Recipe Finder"`, `"Q1 Pitch Deck"`). Displayed to the user.
- `description` (str, required): A short paragraph describing what the artifact is, what it does, and who or what it is for.
- `slideFormat` (required for slides): Pass `"sdm"` -- Slides 2.0 is the only version for new decks; follow the `slides` skill before creating a deck. Omit this parameter for other artifact types.

**Returns:** Dict with:

- `success` (bool): Whether the operation succeeded
- `artifactId` (str): The stable artifact ID
- `ports` (dict[str, int]): Map of service names to their assigned local ports
- `workflows` (dict[str, str]): Map of service names to their exact managed workflow names (e.g. `"artifacts/<slug>: web"`). Use one of these values as the `name` input to the direct `WorkflowsRestart` tool -- do not hand-construct or guess the workflow name. See "Services and Workflows" below. `WorkflowsRestart` is a direct tool, not a callback you can `await` inside this script.

**Example:**

```javascript
const result = await createArtifact({
    artifactType: "react-vite",
    slug: "my-website",
    previewPath: "/",
    title: "Recipe Finder",
    description: "A recipe search web app that finds recipes matching the ingredients the user already has on hand. Supports filtering by dietary restrictions and cook time, and lets the user save favorite recipes for later."
});
// result.workflows.web holds the exact managed workflow name, e.g.
// "artifacts/my-website: web". To (re)start the service later, call the
// direct WorkflowsRestart tool with that value as its `name` input -- it is
// not an awaitable callback in this CodeExecution block.
```

### listArtifacts()

List all artifacts currently registered in the workspace. Use this to check what artifacts already exist before creating new ones, or to look up artifact IDs when you need to reference an artifact you did not just create.

**Parameters:** None

**Returns:** Dict with:

- `artifacts` (list): Each entry contains:
  - `artifactId` (str): The stable artifact ID
  - `kind` (str | null): How the artifact is presented (preview kind, e.g., `"web"`, `"slides"`, `"video"`)
  - `title` (str | null): The human-readable title
  - `artifactDir` (str): The folder where the artifact lives

**Example:**

```javascript
const { artifacts } = await listArtifacts();
```

### verifyAndReplaceArtifactToml({ tempFilePath, artifactTomlPath })

Replace an existing `artifact.toml` through a validated temp file. Do not edit `artifact.toml` directly.

**Parameters:**

- `tempFilePath` (str, required): Absolute path to the temporary TOML file you wrote and edited.
- `artifactTomlPath` (str, required): Absolute path to the real `artifact.toml` file to replace. Must point to a real `.replit-artifact/artifact.toml` inside the repl.

**Flow:**

1. Read the current `artifact.toml`, then write a sibling temp file such as `/absolute/path/to/artifacts/my-app/.replit-artifact/artifact.edit.toml`.
2. Make all edits against the temp file. The temp file must contain the full final TOML, not a partial patch.
3. Call `verifyAndReplaceArtifactToml()` with absolute paths. If validation fails, the temp file is left in place so you can inspect and fix it.

**When to use:** changing artifact metadata such as `title` or `previewPath`; changing service definitions, paths, commands, ports, rewrites, or env blocks; or making multiple coordinated TOML edits at once.

**Do not:** edit `artifact.toml` in place, call this with paths outside `.replit-artifact/artifact.toml`, or use it to change immutable fields such as `id`, `kind`, `version`, `integratedSkills`, or `pageMetadata`.

**Returns:** Dict with:

- `success` (bool): Whether the replacement succeeded

**Example:**

```javascript
await verifyAndReplaceArtifactToml({
    tempFilePath: "/absolute/path/to/artifacts/my-website/.replit-artifact/artifact.edit.toml",
    artifactTomlPath: "/absolute/path/to/artifacts/my-website/.replit-artifact/artifact.toml"
});
```

### presentArtifact({ artifactId, shapeIds? })

Present an existing artifact to the user. Use this after creating or updating an artifact so the user can see the result in the artifact pane. For design/canvas artifacts, include the affected `shapeIds` so the frontend can focus the relevant canvas shapes.

**Parameters:**

- `artifactId` (str, required): The stable artifact ID returned by `createArtifact()` or `listArtifacts()`.
- `shapeIds` (list[str], optional): Shape IDs to focus for design/canvas artifacts.

Do not pass `kind`; the runtime resolves artifact metadata from `artifactId`.

**Returns:** Dict with:

- `artifactId` (str): The presented artifact ID
- `status` (str): `"presented"` when the artifact was presented

**Example:**

```javascript
await presentArtifact({ artifactId: result.artifactId });
```

### Unavailable artifact callbacks

The TypeScript runtime currently registers `createArtifact`, `listArtifacts`, `verifyAndReplaceArtifactToml`, and `presentArtifact` from this skill.

## Delivering the Result -- `presentArtifact` + `SuggestUserAction`

After building, present the artifact. For deployable artifacts (`react-vite`, `expo`, `data-visualization`, `openscad`), first present the artifact using CodeExecution:

```javascript
await presentArtifact({ artifactId: result.artifactId });
```

Then call `SuggestUserAction({ action: "deploy", message: "The artifact is ready to publish." })`. Do not try to suggest publishing from inside CodeExecution.

For non-deployable artifacts (`slides`, `video-js`, `mockup-sandbox`, `design-system`), present only:

```javascript
await presentArtifact({ artifactId: result.artifactId });
```

## Services and Workflows

`createArtifact()` registers managed workflows from each artifact's `.replit-artifact/artifact.toml`. **Do not call the `configureWorkflow` callback for an artifact service.** Creating a second workflow for the same app bypasses artifact-provided routing and environment configuration and can register a conflicting legacy artifact.

To start or restart an artifact service, call the direct `WorkflowsRestart` tool with its existing managed workflow's exact name:

```json
{ "name": "artifacts/<slug>: <service-name>" }
```

Examples:

- API server: `{ "name": "artifacts/api-server: API Server" }`
- Notes frontend: `{ "name": "artifacts/notes-app: web" }`

For an artifact you just created, read the exact names from the `workflows` map that `createArtifact()` returned (e.g. `result.workflows.web`) instead of guessing the service name. For an artifact you did not create this turn, form the exact name from the service name in its `artifact.toml` or from workflow log output (`listArtifacts()` returns the `artifactId` but not service or workflow names). Managed artifact workflows inject their configured `PORT`, `BASE_PATH`, and routing metadata; do not copy those values into a manually configured workflow or start artifact dev commands directly.

<!-- BEGIN_SERVICES_TABLE -->
| Artifact | Preview Kind | Service name(s) | Dev command(s) | Path | Production serve | Production build | Production run |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `expo` | `mobile` | `expo` | `pnpm --filter @workspace/__SLUG__ run dev` | `previewPath` |  | `pnpm --filter @workspace/__SLUG__ run build` | `pnpm --filter @workspace/__SLUG__ run serve` |
| `data-visualization` | `web` | `web` | `pnpm --filter @workspace/__SLUG__ run dev` | `previewPath` | `static` | `pnpm --filter @workspace/__SLUG__ run build` |  |
| `design-system` | `design-system` | `web` | `pnpm --filter @workspace/__SLUG__ run dev` | `previewPath` | -- | -- | -- |
| `mockup-sandbox` | `design` | `web` | `pnpm --filter @workspace/__SLUG__ run dev` | `previewPath` | -- | -- | -- |
| `openscad` | `web` | `web` | `pnpm --filter @workspace/__SLUG__ run dev` | `previewPath` | `static` | `pnpm --filter @workspace/__SLUG__ run build` |  |
| `react-vite` | `web` | `web` | `pnpm --filter @workspace/__SLUG__ run dev` | `previewPath` | `static` | `pnpm --filter @workspace/__SLUG__ run build` |  |
| `slides` | `slides` | `web` | `pnpm --filter @workspace/__SLUG__ run dev` | `previewPath` | `static` | `pnpm --filter @workspace/__SLUG__ run build` |  |
| `video-js` | `video` | `web` | `pnpm --filter @workspace/__SLUG__ run dev` | `previewPath` | `static` | `pnpm --filter @workspace/__SLUG__ run build` |  |
<!-- END_SERVICES_TABLE -->

The web service's URL prefix is set to whatever you pass as `previewPath`. Route handling is prefix-aware: frontend routes and API requests must include this prefix.

**Mobile:** Expo is served at its assigned port and uses `previewPath` as its registered route.

## Failure Recovery

If `createArtifact` fails, inspect the error and retry with corrected inputs. The callback requires a clean `slug` on each attempt, so remove any partial `artifacts/<slug>/` directory before reusing that slug.

- **Slug already exists** -- Choose a different `slug`, or remove the existing artifact directory before retrying
- **`DUPLICATE_PREVIEW_PATH`** -- Choose a different `previewPath`
- **Bootstrap fails** -- Fix the reported shell/setup issue, then retry with a clean slug
- **Artifact is missing `files/`** -- Migrate that artifact type to the shared bootstrap layout before using `createArtifact`

## Examples

<!-- BEGIN_EXAMPLES -->
### Mobile app (`expo`)

```javascript
const result = await createArtifact({
    artifactType: "expo",
    slug: "my-app",
    previewPath: "/",
    title: "My App",
    description: "A mobile companion app for tracking daily tasks on the go. Lets the user add and check off tasks, organize them by project, and see what is due today at a glance."
});
const expoPort = result.ports.expo;
const expoWorkflow = result.workflows.expo; // "artifacts/my-app: expo"

// Expo is scaffolded under artifacts/my-app
// and API work should be added to the shared api-server.
//
// Immediately before building Expo UI, inspect the current Artifacts state.
// Use an explicitly passed design system when present. Otherwise, default to an
// available design system. With several, prefer one consumed by the sibling,
// then one implied by the request, and ask only if still ambiguous. Follow its
// docs/AGENTS.md, docs/consuming-expo.md, and docs/migrating-expo.md; import it
// directly and delete the Expo scaffold's local theme files. Only when no design
// system exists,
// wait for the sibling web build and sync its tokens into the local theme. See
// multi-artifact-creation.md "Visual Consistency" for the full sequence.
await presentArtifact({ artifactId: result.artifactId });
```

Then call `SuggestUserAction({ action: "deploy", message: "The app is ready to publish." })` to recommend publishing the app.

### Dashboard scaffold with chart/table defaults (`data-visualization`)

```javascript
const result = await createArtifact({
    artifactType: "data-visualization",
    slug: "sales-dashboard",
    previewPath: "/sales-dashboard/",
    title: "Sales Dashboard",
    description: "An interactive dashboard visualizing monthly sales by region from the uploaded sales data. Includes trend charts, per-region breakdowns, and a sortable table of top-performing products."
});

// Recharts, PapaParse, and TanStack React Table are pre-configured
// Build the dashboard in artifacts/sales-dashboard following the
// data-visualization skill.
await presentArtifact({ artifactId: result.artifactId });
```

Then call `SuggestUserAction({ action: "deploy", message: "The dashboard is ready to publish." })` to recommend publishing the app.

Creates a data visualization dashboard with Recharts (charts), PapaParse (CSV parsing), and TanStack React Table (data tables) pre-configured.
<!-- END_EXAMPLES -->

### Multiple artifacts in one workspace

Each artifact must have a unique `slug` and `previewPath`. At least one artifact MUST use `previewPath: "/"` -- otherwise users will see a blank page at the root.

**IMPORTANT:** When building multiple artifacts, you MUST read `.local/skills/artifacts/references/multi-artifact-creation.md` BEFORE creating any artifacts. Do not skip this -- it contains critical sequencing and parallelism rules that will significantly affect build quality and speed.

## Limitations

- Each `slug` can only be used once -- calling `createArtifact` again with the same `slug` will fail
- Artifacts must use one of the artifact types listed above
- Port assignment is automatic and cannot be manually specified

## Bootstrap Constraints

<!-- BEGIN_BOOTSTRAP_CONSTRAINTS -->
### Mobile bootstrap rules (`artifact: "expo"`)

- Expo now uses the shared Express API server in the monorepo. Add backend routes in `artifacts/api-server`.
- The generated package owns its Expo dependencies; keep them in `files/package.json.template` so `pnpm install` produces a runnable app.
<!-- END_BOOTSTRAP_CONSTRAINTS -->
