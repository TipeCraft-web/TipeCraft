---
name: integrations
description: Search and manage Replit integrations including connectors and connections. Use for authentication, databases, payments, and third-party API integrations.
---

# Integrations Skill

Integrations give first-class access to third-party (and some first-party) services. When an integration exists, the user can "connect" their account (Google, Linear, GitHub, Stripe, etc.) to Replit, which gives you, the Replit Agent, new capabilities: view their Google Sheets, read their Linear issues, set up and access payment systems, and more. Follow the steps outlined here to make these connections.

**Before asking the user for any API key, secret, or credential, check the `## Integrations` view below for a Replit integration.** Replit integrations handle OAuth and secrets securely, and many common services (Google Sheets, Linear, Stripe, GitHub, OpenAI, etc.) are already supported. Asking the user for credentials when an integration exists adds a lot of unnecessary friction. Users typically do not know about the integration system, so proactively suggest it when — and only when — it is relevant.

Integrations include catalog connectors, configured connectors, and established connections.



## When to Use

Use this skill when:

- User needs authentication (login, signup, OAuth)
- User needs database connections (PostgreSQL, MongoDB, etc.)
- User needs payment processing (Stripe, etc.)
- User needs third-party API integrations (OpenAI, Notion, GitHub, Linear, etc.)

## When NOT to Use

For legal business registration, company formation, or incorporation, read the `business-formation` skill. This is not payment integration and does not require the `monetization` shortlist.

For any request involving payments, billing, checkout, subscriptions, paywalls, ecommerce, or monetization, read the `monetization` skill before searching for or proposing integrations. The `monetization` skill is the source of truth for provider selection and which providers may appear in a shortlist. Do not build a payment-provider shortlist from generic `searchIntegrations` results or add other payment connectors that happen to match a broad search.

Do not use this skill for web search (use the web-search skill if available), searching files within the project, media generation (use the media-generation skill, including image generation APIs), or fetching data to answer a user's question (use the query-integration-data skill).

---

## Integration handles

Every integration has a handle such as `gmail_workspace_05906b20_api`. Pass it exactly as returned wherever a call takes an integration. `searchIntegrations` returns each integration's handle with a `status`:

- `ready`: connected here and callable now.
- `loading`: connected, with its MCP functions still being listed. `addIntegration` with its handle waits for them.
- `connect`: not callable yet.
  - With a `note`, the note says why and what to do. Do what it says when the integration is needed.
  - With no note, nobody has connected it here. Say what connecting gives the user, then call `ProposeIntegration` with the handle. Setup happens inline; there is no need to send the user to Settings.

A row's `route` says how it is called. Route `api` is the provider's REST API, called from code (see "Calling an API integration" below). Route `mcp` is called with the MCP functions its skill file names; a `custom-mcp` connection is reached only this way, and application code cannot call an MCP server, so app-code work uses the `api` row.

When integrations change during the session, an "Installed integrations changed." update lists the changed rows by handle; it is newer than the `## Integrations` view.

## Each integration's skill file

A connected integration's skill file is `.local/integration_skills/<handle>/SKILL.md`: what it is, how it is called, its permissions, the provider's notes, and the workspace's instructions, which win over the provider's notes. Its frontmatter names the connector (`connectorName`). Before the first call to an integration, read the parts that matter with `searchIntegrationSkills`, or read the file whole.

## Choosing a Provider

- **Prefer what the user already has.** When more than one provider could serve a capability (email, calendar, files, CRM, enrichment), pick a `ready` one first, then one whose note says how to attach it, then a new one. Name the connected one and say why it does not fit before proposing a different provider for the same capability.
- **A mention is not a connection.** The user naming a provider, or picking one from a menu (a mention whose id starts with `replit://connector/`), does not mean it is connected. Resolve it with `searchIntegrations` and act on its status.
- **Pick providers out loud.** When a task implies a capability the user did not name (an enrichment source, an email sender, an SMS gateway), say which provider you intend to use and why before proposing or using it.
- **Providers with both routes.** When nothing of the provider is connected yet, propose its `mcp` row for chat-style work and its `api` row for application code. When one route is already connected, keep using it, and propose the other only when the task needs it, saying why.
- If the user names a service that `searchIntegrations` cannot find, tell them it is not available on Replit yet and agree on an alternative before building.

## Available Functions

All callbacks run in CodeExecution and return silently; `console.log` what you need to read. `ProposeIntegration` is a model tool, called outside CodeExecution.

### searchIntegrations({ query?, connected? })

- Input: `query` is one to three phrases (a product name, a category, or a capability: `["payments", "billing"]`). `connected: true` returns only integrations that have a connection. No arguments lists every integration.
- Output: `{ integrations: [{ handle, displayName, connectorName, route, status, scope?, note?, functions?, description? }] }`.
- Use one focused phrase for a clear provider or capability, and capability phrases when the user has not named a provider.

```javascript
const { integrations } = await searchIntegrations({ query: ["Google Sheets", "spreadsheet"] });
for (const row of integrations) {
  console.log(`${row.handle}  ${row.route}  ${row.status}  ${row.note ?? ""}`);
}
```

### searchIntegrationSkills({ query, handles })

- Input: `query` is what you want to find; `handles` lists the integrations whose skill files to search.
- Output: `{ matches: [{ handle, path, startLine, endLine, text }], skipped? }`. Matches come most useful first; `skipped` names handles that have no skill file yet, with the reason.
- Optional: reading the skill file directly works too.

### addIntegration({ integrationId: handle })

- Input: the handle of a connection the user authorized elsewhere (its note says so), or of a `loading` row.
- Output: `{ attached: true, handle, displayName }`. On a `loading` row it attaches nothing and waits for the MCP functions instead.
- Call it once. The connection's skill file is written before your next step; read it there.

### getIntegrationReauthorizationContext({ integrationId: handle })

When a call to a connected integration is rejected because of its credential (a 401 or 403, an expired, revoked or invalid token, or a missing permission), call it with that integration's handle. It returns `{ credential: "oauth" | "api_key" | "other", canReconnect, savedStatus?, message?, requestedScopes? }`.

- **`canReconnect`:** `ProposeIntegration` with `intent: "reauthorize"` can show a reconnect card for it.
- **`savedStatus` and `message`:** the status last recorded for this connection. It changes when a token refresh or health check fails, not on every rejected call, so the error you just saw is newer: `healthy` can sit next to a real 401.
- **`requestedScopes`:** the scopes a reconnect asks for. The scopes it holds now are the `permissions` in its skill file, when known.

Decide with the error you saw: a reconnect replaces the token and asks for `requestedScopes`, but it cannot give the account access it does not have. To reconnect when `canReconnect` is true, call `ProposeIntegration` with `{ intent: "reauthorize", proposal: [{ integrationId: handle, reason: "..." }] }` in the same response; prose does not open the card. Otherwise, suggest the user reconnect it or update its key on the Integrations page.

After a reconnect, retry the failed call once; if it fails again, continue without it. Rate limits, bad requests, missing resources, workspace roles and billing limits come from somewhere else, so a reconnect does not fix them.

### ProposeIntegration({ intent?, proposal: [{ integrationId: handle, reason }] })

Proposes connecting an integration, by handle, with one sentence the user sees on the card. It ends the turn and waits for the user; the answer arrives as the next message. After acceptance the connection is attached: use it, with no `addIntegration` call. After decline or cancel, continue without it.

Explain what is about to happen in your reply, then call it. Propose integrations early: everything the task needs should be `ready` before the work starts. When several are missing, name them all, then propose one at a time.

## Calling an API integration from this Repl

- **Application code** uses the SDK setup in the integration's skill file: add the package it names and copy the snippet into the project. Replit injects the environment variables it reads.
- **CodeExecution** reaches a connection with `listConnections("<connectorName>")` inside a `"use impure"` function, then the connection's `proxyFetch(path, init)`, or `getClient()` when `hasClient` is true. The connector name is in the skill file's frontmatter. The `query-integration-data` skill shows the pattern.

## Databricks

When the user wants to connect to Databricks, use the `databricks-m2m` connector (not the plain `databricks` connector). The `databricks-m2m` connector provides machine-to-machine access and works in all contexts. Inside a Databricks App, prefer the `databricks` (U2M) connector when available -- see the `databricks-app` skill for details.

## Common Pitfalls

- **Not logging results:** every callback returns silently unless you `console.log()` the output.
- **Asking for API keys when an integration exists:** search first; a `ready` integration is usable now, and one with a note says how to attach it.
- **Calling `addIntegration` on an offer:** a `connect` row with no note is proposed with `ProposeIntegration`.
- **A connected integration fails at runtime:** when the failure might be the credential, call `getIntegrationReauthorizationContext` first; a reconnect card shows only when it reports `canReconnect: true`.
