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
  - **video-js** (short animated videos, up to ~2 minutes max; most are 30-60s): Read the `video-js` skill and run its platform steps (ratio inferred from the request, never asked; the style picker only when its gate is on), create the video artifact, then delegate the whole film (script, assets, scenes, controls, validation) to a DESIGN subagent exactly as that skill's first-build reference describes. You run only the callbacks around it (brand assets, workflow restart, present); write no video code yourself. This is for animated content from code, not a video editor. Size runtime to the content; long videos are unreliable to export.
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

Before changing artifact metadata, routing, services, commands, ports, rewrites, or environment blocks, read [Editing artifact TOML](references/editing-artifact-toml.md) for the full temp-file procedure and parameters. Never change immutable `id`, `kind`, `version`, `integratedSkills`, or `pageMetadata`.

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

Each `[[services]]` entry owns startup and routing, not a route-only alias. Required: `name`, `localPort` (listening port), and `development.run` (string, argument array, or `{ args, env? }`). Optional `paths` sets route prefixes. Ports/paths cannot replace `development.run`. Edit existing routing instead of starting duplicate processes.

`createArtifact()` registers managed workflows from `artifact.toml`. **Do not call `configureWorkflow` for artifact services**: duplicates bypass artifact routing/environment and can register conflicting legacy artifacts.

Start/restart with the direct `WorkflowsRestart` tool:

```json
{ "name": "artifacts/<slug>: <service-name>" }
```

- API server: `{ "name": "artifacts/api-server: API Server" }`
- Notes frontend: `{ "name": "artifacts/notes-app: web" }`

Created this turn: use `createArtifact()`'s returned `workflows` names (`result.workflows.web`). Otherwise, use `artifact.toml`'s service name or workflow logs. `listArtifacts()` returns artifact IDs, not service/workflow names; do not guess. Managed workflows inject `PORT`, `BASE_PATH`, and routing metadata; never copy them into manual workflows or run dev commands directly.

Read [Service defaults](references/services.md) when inspecting or changing an artifact's preview kind, service name, or dev/production commands. The table is a reference, not permission to bypass the managed workflows above.

The web service's URL prefix is set to whatever you pass as `previewPath`. Route handling is prefix-aware: frontend routes and API requests must include this prefix.

**Mobile:** Expo is served at its assigned port and uses `previewPath` as its registered route.

## Failure Recovery

If `createArtifact` fails, inspect the error and retry with corrected inputs. The callback requires a clean `slug` on each attempt, so remove any partial `artifacts/<slug>/` directory before reusing that slug.

- **Slug already exists** -- Choose a different `slug`, or remove the existing artifact directory before retrying
- **`DUPLICATE_PREVIEW_PATH`** -- Choose a different `previewPath`
- **Bootstrap fails** -- Fix the reported shell/setup issue, then retry with a clean slug
- **Artifact is missing `files/`** -- Migrate that artifact type to the shared bootstrap layout before using `createArtifact`

## Examples

Before building Expo UI, read the [mobile example](references/creation-examples.md#mobile-app-expo), including its design-system selection and sibling-web token sequencing rules. When creating a data-visualization dashboard, read the [dashboard example](references/creation-examples.md#dashboard-scaffold-with-charttable-defaults-data-visualization) for its preconfigured chart/table libraries and creation payload.

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
