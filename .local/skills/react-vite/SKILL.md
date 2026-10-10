---
name: react-vite
description: Required guidelines for web apps. Read before creating one or making any change to an existing web app — features, fixes, and edits included.
---

Use the current runtime tools and callbacks. Do not call legacy callback names from older skill ports.

Always follow these guidelines when creating or modifying a React + Vite web application:

## First builds

The complete first-build workflow — the design-subagent mandate, app classification, API-surface planning, and build ordering — is in `.local/skills/react-vite/references/first-build.md`. It is loaded automatically when the artifact is created; if you are building a react-vite app from scratch and it is not already in context, read it before writing any code.

## Architecture

- Follow modern web application patterns and best-practices.
- If the app is complex and requires functionality that can't be done in a single request, it is okay to stub out the backend and implement the frontend first.

## Backend

Use the `pnpm-workspace` skill as the source of truth for shared monorepo rules. When you touch backend code, follow the `pnpm-workspace` skill's references:

- `references/openapi.md` for contract-first OpenAPI + codegen
- `references/server.md` for `artifacts/api-server/src/routes/` conventions
- `references/db.md` for `lib/db/src/schema/` and Drizzle guidance

After each OpenAPI spec change, re-run codegen before using the updated types.

### File storage

For persistent user-uploaded or app-generated files, including images, audio, video, and documents, read and follow the `object-storage` skill before planning the API. Store file bytes in App Storage and only the returned object path and queryable metadata in PostgreSQL. Do not store file bytes or base64 payloads in PostgreSQL unless the user explicitly requires database storage.

## Frontend

- Shared frontend conventions live in `.local/skills/react-vite/references/frontend-general-rules.md`. Pass that file to design subagents via `relevantFiles`.
- For substantial new frontend surfaces, delegate to the design subagent (read the `design` skill). For first builds the design subagent is mandatory — see `references/first-build.md`.

## Frontend state invariants

A successful server response is not a completed feature: the client must send the endpoint's real input contract, consume its real output contract, and make the result visible after navigation, after reloads, and to other sessions. Before finishing any full-stack change, check every changed API caller, mutation hook, form, loading branch, and realtime consumer against these invariants, in terms of the libraries the app actually uses:

1. Requests match the endpoint's input contract: derive server-owned fields (identity, ownership, timestamps) on the server; coerce numeric and date values at the boundary; for blank optional values, omit where omission is correct but send an explicit null or empty value where omission means "leave unchanged".
2. Consumers match the endpoint's output contract: verify the actual envelope, arrays, and date-like values rather than assuming a shape.
3. Every successful mutation shows its result: update or invalidate every affected list and detail view (patch caches in place where a refetch would clobber in-progress state), reset or close the initiating form or dialog, and navigate where the flow requires. Capture values from UI that unmounts before the mutation needs them.
4. State other actors can change has a freshness path — refetch-on-mount, finite staleness, polling, or realtime updates; a writer updating its own cache refreshes no one else. Clear user-scoped state on auth changes.
5. Forms use one form context, controlled inputs wire both value and change handlers, and reopened dialogs initialize from current data, not stale open-time props.
6. Loading, empty, and partial states render safely: never dereference data before it exists or place hooks below a conditional return.
7. Realtime UI derives connection state from the live connection, recovers after drops (reconnect, re-subscribe, rehydrate), and updates the writer's own view locally instead of waiting for its own broadcast.
8. Keep the exact identifiers, routes, slugs, and enum values the request and existing integrations depend on.

Fix every mismatch this audit finds; it complements, never replaces, the testing the change otherwise requires.

## Services and routing

- Follow the service access and routing rules from the `pnpm-workspace` skill.
- **WebSocket proxy path**: If the app uses WebSockets, the WS path (e.g. `/ws`) must be listed in `artifact.toml`'s `paths` array alongside the REST API path. The proxy only forwards explicitly listed paths -- unlisted WS paths are silently dropped and the server never sees the connection.

## SEO

There is a full SEO implementation guide in `.local/skills/react-vite/references/seo.md`. Read it when building or optimizing pages for search engine visibility. At minimum, ensure every page has a unique title tag, meta description, and Open Graph tags.
