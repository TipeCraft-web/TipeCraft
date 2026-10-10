---
name: prepare-artifact-template
description: Prepare an artifact to be saved to the user's Replit workspace as a reusable template. Use ONLY when the user explicitly asks to prepare/save an artifact as a template (e.g. "save this as a template", "prep this to save to my Replit workspace", "package this artifact as a template") — never proactively. Makes the artifact self-contained so it survives being packaged as one standalone tarball with no dependencies on other artifacts or shared pnpm workspace libraries.
---

# Prepare artifact template

Saving an artifact as a Replit workspace template packages **only that artifact's own
directory** (`artifacts/<slug>/`) into a single standalone tarball. Anything the
artifact reaches for outside that directory — shared `@workspace/*` libraries,
`catalog:` version pins, a shared base tsconfig, sibling artifacts, assets in
another folder — is **silently dropped** from the package. The save still
succeeds, but the resulting template is broken or incomplete.

This skill makes an artifact self-contained so the packaged template works on its
own. Run it before calling `saveArtifactAsTemplate`.

## When to use

Only when the user **explicitly asks** to prepare or save an artifact as a
template. Do not run this proactively — vendoring deps and rewriting config is
invasive, so never do it just because an artifact happens to have pnpm workspace
dependencies.

- The user asks to save an artifact as a template, or "to my Replit workspace".
- The user asks to package a design system or other artifact as a reusable donor.

This skill readies the artifact before the agent starts the save. Follow the
`artifact-templates` skill for the callback interface and outcome handling.

## Make the artifact self-contained

Work inside the artifact's own directory (`artifacts/<slug>/`). The goal: no
reference escapes that directory.

### 1. Vendor `workspace:` dependencies into the artifact

For every `workspace:` dependency in the artifact's `package.json` (the
`@workspace/*` packages):

1. Copy the library's source into `artifacts/<slug>/dependencies/<pkg-name>/`.
   Copy only the source the artifact actually imports (and its transitive
   `@workspace/*` deps — vendor those the same way). Do not copy `node_modules`,
   `dist`, or other build output.
2. Read the dependency's `package.json` `exports` **and** `imports` maps, then
   search the artifact for the public import specifiers it actually uses. Copy
   every referenced export target and its source dependency closure. Preserve the
   internal targets required by `#...` imports from the vendored source. Do not
   assume a public subpath maps to the same path under `src/`: for example,
   `./client` may export `./src/runtime/client.ts`, and `./types` may export
   `./src/contracts/types.ts`.
3. Add exact TypeScript path aliases for those public imports so they keep working
   unchanged. In the artifact's `tsconfig.json`, a pnpm workspace library might need
   mappings like:

   ```jsonc
   "compilerOptions": {
     "baseUrl": ".",
     "paths": {
       "@workspace/<pkg-name>": ["./dependencies/<pkg-name>/src/index.ts"],
       "@workspace/<pkg-name>/client": ["./dependencies/<pkg-name>/src/runtime/client.ts"],
       "@workspace/<pkg-name>/types": ["./dependencies/<pkg-name>/src/contracts/types.ts"]
     }
   }
   ```

   Add a wildcard alias only when the dependency's export map proves the same
   wildcard mapping. Keep a sanitized `package.json` with the vendored source when
   its `exports` or `imports` map participates in source resolution; preserve both
   maps and replace any `workspace:` or `catalog:` values in that copy.
4. Add matching aliases for the same public specifiers in the bundler so runtime
   resolution agrees with TypeScript:
   - **Vite** (react-vite, slides, design-system): add exact entries to
     `resolve.alias` in `vite.config.ts`, ordered before any package-root alias and
     pointing at each real vendored export target.
   - **Expo/Metro**: use `resolver.extraNodeModules` only to map the bare package
     name to the vendored package directory. When public subpaths do not map to
     matching physical files, use a custom `resolver.resolveRequest` with exact
     specifier-to-target mappings; `extraNodeModules` cannot alias individual
     subpaths to files. Metro cannot resolve outside the artifact root, so the
     vendored copy under `dependencies/` is required, not optional.
5. Remove the `workspace:` entry from the artifact's `package.json`. Move the
   vendored library's own third-party dependencies into the artifact's
   `package.json` `dependencies` with **concrete versions** (not `catalog:`,
   not `workspace:`).

### 2. Replace `catalog:` pins with concrete versions

`catalog:` versions resolve through the root `pnpm-workspace.yaml`, which is not
in the package. Replace every `catalog:` entry in the artifact's `package.json`
with the concrete version the pnpm workspace resolves it to.

### 3. Make `tsconfig.json` standalone

If the artifact's `tsconfig.json` extends a **pnpm-workspace-relative** base
(`"extends": "../../tsconfig.base.json"` or similar path that escapes the
artifact), remove the `extends` and inline the compiler options it needs. Drop
project `references` that point at libs outside the artifact. Leave a base that
resolves from an installed dependency (e.g. `"extends": "expo/tsconfig.base"`)
alone — it resolves through `node_modules` after `pnpm install`.

### 4. Pull in escaping imports and assets

- Rewrite or vendor any relative import that reaches outside the artifact
  (`../<sibling-artifact>/...`, `../../lib/...`). Artifacts must never depend on
  each other; a template must not either.
- Copy any asset referenced from outside the artifact directory (logos, fonts,
  images) into the artifact and repoint the references.

## Packaging constraints to respect

The snapshot that builds the template tarball:

- Captures only `artifacts/<slug>/` — nothing above it.
- Drops files named `SKILL.md` and `.replit`, and skips `node_modules`, `dist`,
  `build`, `.next`, `.git`, `.local`, `.replit-artifact`, and secret files. Do
  not put content the template needs in those.
- Caps at 3,500 files / 50 MiB per file / 150 MiB total. Vendor source only —
  never `node_modules` or build output — to stay under the caps.

## Verify before saving

1. `pnpm install` in the artifact, then run its build and dev workflow; confirm
   the app still works end-to-end (not just that it compiles).
2. Confirm nothing escapes the artifact directory: search the artifact for
   remaining `workspace:` and `catalog:` strings, and for imports starting with
   `../` that leave the directory. There should be none.
3. For every vendored pnpm workspace package, compare the artifact's actual import
   specifiers with that package's original `exports` map, preserve any `imports`
   targets used by its source, and confirm TypeScript and the bundler resolve each
   import to the copied target file.
4. Return to the `artifact-templates` skill and call `saveArtifactAsTemplate`.
