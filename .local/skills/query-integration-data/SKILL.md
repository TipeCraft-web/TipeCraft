---
name: query-integration-data
description: Query and modify data in any connected integration (Linear, GitHub, HubSpot, Slack, Google services, etc.) or connected data warehouse (Databricks, Snowflake, BigQuery). Use listConnections() in the codeExecution sandbox to get a connection, then call its API via getClient() or proxyFetch(). Supports read operations (queries, counts, exports) and write operations (create, update, delete).
---

# Query Integration Data Skill

Connect to any Replit-supported integration to read or write data -- query issues, create tickets, send messages, update contacts, manage files, etc. This also includes querying supported data warehouse integrations like Databricks, Snowflake, and BigQuery.

All code runs inline in the `codeExecution` sandbox -- no script files needed.

## When to Use

Use this skill when the user asks you a **question in chat** that requires data from external services to answer, or when they need to perform data operations without building a visual interface.

- **Answer questions**: Query data to respond to user questions in the conversation (e.g., "How many issues were created this week?")
- **Fetch and export data**: Export data to CSV/JSON for later use or analysis
- **Write operations**: Create, update, delete, or modify data in a service
- **Ad-hoc queries**: One-time data lookups or investigations
- **Automate tasks**: Perform multi-step operations across the API

**Key point:** Use this skill when the output is an answer or data file, NOT when building a dashboard or visualization interface.

## When NOT to Use

- **The user wants to create a dashboard, visualization, or analytics interface** - use the `data-visualization` skill (it handles data fetching internally)
- **The user asks to "build", "create", or "make" a dashboard/app with data** - use the `data-visualization` skill
- The user only needs to add an integration (use the `integrations` skill)
- Production database operations (use the database pane directly)
- Asks to check deployment or server logs (use the `deployment` skill)

## File Structure

```text
.agents/
-- outputs/         # Generated artifacts (CSV, JSON, etc.)
```

Code runs inline in the `codeExecution` sandbox -- no script files are needed.

## Workflow

```text
1. RESOLVE    -- searchIntegrations({ query: [...] }) for the integration's handle and status
   -- status ready              -- EXECUTE -- OUTPUT
   -- status connect or loading -- CONNECT (via `integrations` skill) -- EXECUTE -- OUTPUT
2. EXECUTE    -- read its skill file, then listConnections(connectorName) inside "use impure", then call the API via getClient() or proxyFetch()
```

- **RESOLVE**: `searchIntegrations({ query })` returns each integration's `handle` and `status`; `searchIntegrations({ connected: true })` lists what already has a connection. The status is the source of truth for whether a connection needs setup -- `listConnections().length` is not (see "Deciding whether setup is needed" below).
- **CONNECT** (when status is not `ready`): follow the `integrations` skill. The row's `note` says what to do; with no note, propose it with `ProposeIntegration` and its handle.
- **RECOVER** (a call to a connected integration is rejected because of its credential: a 401 or 403, an expired, revoked or invalid token, or a missing permission): call `getIntegrationReauthorizationContext` with its handle and decide as the `integrations` skill describes. A reconnect card shows only when it reports `canReconnect: true`; otherwise the user reconnects it or updates its key on the Integrations page. Rate limits, bad requests, and missing resources aren't credential failures.
- **EXECUTE**: Before the first call, read the integration's skill file (`.local/integration_skills/<handle>/SKILL.md`, or the parts you need with `searchIntegrationSkills`): it names the connector and carries the provider's notes and the workspace's instructions. Call `listConnections(connectorName)` inside a `"use impure"` function, then make the API call in the same `codeExecution` block via `getClient()` or `proxyFetch()`.
- **OUTPUT**: Return the answer or confirmation to the user.

## Deciding whether setup is needed

Use the `status` RESOLVE reported, NOT `listConnections`, to decide whether a connection needs to be set up:

- `ready` -- connected to this Repl, ready to use. Go to EXECUTE.
- `loading` -- an MCP row whose functions are still being listed; the provider's `api` row, when it has one, works now.
- `connect` -- not callable yet. Follow the row's note, or propose it via the `integrations` skill.

Do **not** branch on `listConnections(connectorName).length === 0` for this decision. `listConnections` exists to hand credentials to your sandbox code, and it drops any connection whose credentials are withheld (e.g. credential-blocked account contexts) -- so it can return an empty array even when a connection genuinely exists. That makes it an unreliable presence check and would push you into a needless re-connect prompt. The status from `searchIntegrations` does not have that blind spot.

## Getting Connection Credentials

### `listConnections(connectorName)` -- call only when you need the credentials

`listConnections` is a credential-fetch call, not a status check. Call it **only** inside a `"use impure"` function when RESOLVE reported the connection as `ready` **and** you are about to use the credentials in the same `codeExecution` block. Do not call it to test whether a connection exists, to "check" status, or speculatively before you actually need to hit the API -- that decision belongs to RESOLVE. The credentials stay inside the sandbox and never enter the model context.

`listConnections` is injected **only** into the `"use impure"` sandbox, never the durable (top-level) scope. If you call it at the top level you get `ReferenceError: listConnections is not defined`. That means you called it **outside** `"use impure"` -- it does **not** mean the API is missing, and it is **never** a reason to `import("@replit/connectors-sdk")` or hunt for tokens/env vars. Wrap the call in a `"use impure"` function (as below) and retry.

`listConnections`, `getClient`, and `proxyFetch` are the **only** integration calls that go inside `"use impure"`. `searchIntegrations`, `searchIntegrationSkills`, and `addIntegration` are durable callbacks: calling one inside the impure function fails the whole block with `"use impure" functions cannot call durable callbacks directly`. Resolve the handle in the durable scope first, then pass the connector slug into the impure function as an argument -- an impure function cannot read a variable declared outside it either.

Fetch the credentials and use them in the same block -- never as a standalone "is it connected?" probe:

For a worked example, read [Connection and output examples](references/connection-examples.md).

Each connection object has:

- `id`, `connectorConfigId`, `status`, `displayName`, `metadata`, `environment`
- `hasClient` -- `true` when this connector has a built-in SDK client, i.e. when `getClient()` is usable
- `getClient()` -- returns an initialized SDK client; **throws** when `hasClient` is `false`
- `proxyFetch(path, init?)` -- `fetch`-like call to the connector's API through the Replit connector proxy; the credential is injected server-side

**Prefer, in order:** `getClient()` (only when `hasClient`) -> `proxyFetch()`. Never read credentials out of the connection -- the proxy injects them server-side.

Check `hasClient` first rather than calling `getClient()` to find out -- only a few connectors ship an SDK client, and on the rest `getClient()` throws:

```javascript
const conn = conns[0];
if (conn.hasClient) {
  const client = await conn.getClient();
  // ... use the SDK client
} else if (conn.proxyFetch) {
  const res = await conn.proxyFetch('/path/relative/to/api/base');
  // ... use the response
}
```

`hasClient` only means an SDK client exists for this connector; building it can still fail (e.g. an expired credential).

### `conn.proxyFetch(path, init?)` -- call the API without touching credentials

`proxyFetch` sends the request through the Replit connector proxy, which forwards it to the connector's API base URL with this connection's credential injected server-side. Your code never sees the token:

For a worked example, read [Connection and output examples](references/connection-examples.md).

- `path` is **relative to the connection's configured API base URL** (starting with `/`), including any query string. It is not the full URL from the provider's docs -- if the API base already ends in a version/root prefix (e.g. `https://tenant.example/rest/api/1.0`), do **not** repeat that prefix: use `/projects`, not `/rest/api/1.0/projects`. Do not pass a full URL and do not set auth headers -- the proxy adds the credential.
- `init` supports `method`, `headers`, and `body` (string).
- If `conn.proxyFetch` is not a function (container on an older pid2), fall back to `conn.settings` -- deprecated, being removed.

### Resolving the connector slug

`listConnections(connectorName)` is keyed on the **exact connector slug** (e.g. `google-sheet`, `linear`, `stripe`; call `listConnections('linear')` for Linear), filtered server-side. The slug is lowercase and often hyphenated, and it is **not** the `displayName` from `searchIntegrations` (`Google Sheets`) nor a reliable lowercasing of it. Passing the wrong slug returns `[]` -- the same shape as "no connection" -- so resolve the slug before concluding anything from an empty result:

- The integration's skill file names it: `connectorName` in the frontmatter of `.local/integration_skills/<handle>/SKILL.md`. Use it verbatim -- do not guess it by lowercasing the `displayName`.

If `listConnections` returns `[]`, work through these in order before giving up:

1. **Wrong slug** -- the most common cause. Confirm the slug against the skill file and retry with the correct value.
2. **Withheld credentials** -- only after the slug is confirmed correct and RESOLVE reported the integration as `ready`. A persistent empty result then means the credentials are being withheld for this context (e.g. a credential-blocked account) rather than missing. Surface that to the user instead of looping back into a connect proposal.

### Browse the Documentation

**Always read the integration's skill file**, and the provider's public API reference where it points, before writing code, especially for write operations. This helps you understand:

- Required vs optional fields for creating resources
- Valid values for enums (status, priority, type, etc.)
- Relationships between resources (e.g., issues belong to projects)
- Rate limits and best practices

## Clarifying questions and API operations

Before writes, gather required fields and resolve entity, assignee, status, and project IDs: fetch valid options first, then ask when ambiguous. Read [API operation patterns](references/api-operations.md) when resolving these choices or implementing read/write/multi-step SDK calls. Keep clients and credentials inside each `"use impure"` function; return only JSON-serializable results and pass selected IDs into later calls.

## Databricks

When the user wants to connect to Databricks, use the `databricks-m2m` connector (not the plain `databricks` connector).

## Warehouse Data Exploration

When querying data warehouses (BigQuery, Snowflake, Databricks), large schemas can make serial exploration slow (7-10s per query round-trip). Use the parallel subagent pattern to explore schemas faster.

### CRITICAL: Warehouse queries are billed per byte scanned

Warehouse targets (`bigquery`, `databricks`, `snowflake`) cost real money per query -- a
careless `SELECT *` over a fact table can cost tens of dollars and a dashboard that
re-runs queries every few seconds can burn thousands of dollars per day. Before writing
any warehouse query (via `executeSql` or `executeSql({target: "bigquery"})`) follow
these rules:

- **Project exact columns** -- never `SELECT *` on wide tables.
- **Always `LIMIT`** when exploring; `LIMIT 5`--`LIMIT 100` is plenty for a sample.
- **Scope by partition / cluster** -- add `WHERE event_date >= ...` (or the table's
  clustering column) so the warehouse prunes data and you are billed for a tiny slice.
- **Prefer pre-aggregated tables** (e.g. `_daily`, `_summary`) over raw event tables.
- **Diff-only reads** for anything incremental -- `WHERE updated_at > :last_seen` and
  persist `last_seen` so subsequent queries only scan the delta.
- **Cache repeated results locally** -- if you run the same exploration query twice in
  the same session, store the first result in a variable or `.agents/outputs/*.csv`
  and reuse it instead of re-running the query.
- **Don't power a data app from this skill** -- if the user is building a dashboard,
  report, or explorer, hand off to the `data-visualization` skill so the app's API
  server can cache results (15-min TTL). The `query-integration-data` skill is for
  answering questions in chat, not for powering a live UI.

### Parallel schema discovery

Read [Warehouse schema exploration](references/warehouse-exploration.md) before exploring an unfamiliar warehouse schema. It gives the metadata queries, dialect-specific SQL, and bounded 2–4-worker procedure. Parallelize only for warehouse connections with 15+ tables when the question is not about a known table; smaller schemas use serial exploration. Sampling still follows all billing safeguards above.

## Output Guidelines

- **Simple answers** (counts, scalar values, short lists of < 20 records): Print directly with `console.log()`
- **Complex results** (tabular results): Write to `.agents/outputs/<filename>.csv` and summarize
- **Write confirmations**: Print what was created/updated/deleted with IDs
- **Errors**: Print clear error messages

For a worked example, read [Connection and output examples](references/connection-examples.md).

## Key Points

- **Decide setup via the `status` from `searchIntegrations`** (`ready` / `connect` / `loading`), not `listConnections().length`
- **Take the connector slug from the skill file's `connectorName`**, not from the display name
- **Call `listConnections(connectorName)` only inside `"use impure"` when you need the credentials** -- it is a credential fetch for the EXECUTE step, never a status check or probe
- **Use the `integrations` skill** whenever status is not `ready`
- **All code runs in the `codeExecution` sandbox** -- no script files needed
- **Use `console.log()`** to see output -- functions execute silently without it (but never log credentials)
- **Prefer `conn.getClient()` when `conn.hasClient`** over importing an SDK — it returns an initialized client with no `await import` and no raw token handling. Otherwise use `conn.proxyFetch()`.
- **Use `conn.proxyFetch(path, init)`** when there is no SDK client — the proxy injects the credential server-side, so your code never handles a token.
- **State persists** across `codeExecution` calls -- reuse `conns`, clients, and extracted credentials instead of re-fetching (unless expired).
- **Read the integration's skill file** to understand the API before coding
- **Ask clarifying questions** before write operations that need specific IDs or values
- **Fetch options first** when the user references something by name (users, projects, etc.)
- **Don't cache clients** -- access tokens expire; re-create clients from `listConnections` when needed
- **Write large outputs to `.agents/outputs/`** as CSV or JSON
