---
name: replit-admin-api
description: Call the Replit Admin API (api.replit.com/v1). Use when building or changing Enterprise administration, directories, projects and deployments, usage and cost analytics, budget controls, or audit-log exports.
---

# Replit Admin API

Base URL `https://api.replit.com/v1`. Auth: `Authorization: Bearer <key>` — keep the key in an environment variable (e.g. `REPLIT_API_KEY`), never in code. To get a key, the user goes to **Replit account Settings → Developer tab**; API keys there are only available to **account admins**, so a non-admin must ask an admin of their Enterprise account to generate one. All operations are scoped to the key's Account. Full contract: fetch `https://api.replit.com/openapi.json` — consult it when designing any request, response type, or error path.

## Endpoints

| Method and path | Scope | Purpose and key parameters |
|-----------------|-------|----------------------------|
| `GET /workspaces` | `read:*` | Account workspace directory. Filter with `search`. |
| `GET /workspaces/{workspaceId}` | `read:*` | One Account-owned workspace. |
| `GET /members` | `read:*` | Account member directory. Filter with `workspaceId`, `role`, and `search`. |
| `GET /groups` | `read:*` | Workspace groups. Filter with `workspaceId`. |
| `GET /groups/{groupId}/users` | `read:*` | Active users in one group. Missing, hidden, deleted, and cross-Account groups return `404`. |
| `GET /usage` | `read:*` | Cost and usage. `groupBy` is `member`, `project`, `workspace`, `conversations`, or `timeseries`; `granularity=day` is valid only with `timeseries`. Filter with `workspaceId`, `groupId`, `userId`, `projectId`, range parameters, and repeated `type` values. |
| `GET /projects` | `read:*` | Account projects. Filter with `workspaceId`, `search`, and `hasDeployment`; deployment state is eventually consistent. |
| `GET /deployments` | `read:*` | Deployments in a required `workspaceId`. Filter with `projectId` and `status`. |
| `GET /deployments/{deploymentId}` | `read:*` | One deployment owned by an Account workspace. Missing and inaccessible deployments return the same `404`. |
| `GET /budgets` | `read:*` | Account spending controls and Workspace, group, and member Agent limits. Filter with `workspaceId` and `type`. |
| `POST /budgets` | `write:budgets` | Set, replace, or clear one budget or limit. It is desired-state and repeating an identical request is idempotent. Validate the request against the OpenAPI `budget-update` schema. |
| `GET /audit-logs` | `audit-logs:read` | Complete retained `project.message_sent` prompt events, not a general export of every Account audit-event family. Query an `occurredAfter`/`occurredBefore` window of at most 24 hours, with optional exact `messageRef`, `limit`, and `cursor`. |

## Universal client contract

- Fetch `https://api.replit.com/openapi.json` before implementing an operation. Use its schemas, enums, scopes, and error codes rather than guessing from examples in this skill.
- Treat cursors as opaque. Reuse a cursor only with the Account and request parameters that produced it, and stop from the response's pagination fields. Standard list endpoints default to 50 and allow at most 100 records; `/usage` paginates `groups[]` with `data.pagination.nextCursor`; audit-log pages default to 25 complete events.
- Branch on `error.code`, not human-readable messages. Record `X-Request-Id` for support and diagnostics. A resource `404` can intentionally hide whether an object is missing or inaccessible; never infer cross-Account existence from it.
- Keep the API key and all calls in a backend. Never expose the key to a browser, generated client bundle, logs, telemetry, or error responses.

## The rate budget

Treat the response headers as the sole source of current capacity; do not hard-code quota values. Coordinate every Admin API request your backend makes for the same Account through one scheduler, including work from multiple processes or replicas. Assume other traffic may consume capacity between responses.

Every Public API HTTP response includes the most constrained applicable window: `X-RateLimit-Limit` is that window's capacity, `X-RateLimit-Remaining` is its remaining requests after the current request, and `X-RateLimit-Reset` is its Unix timestamp in **seconds**. A `429` also includes `Retry-After` in **seconds**.

### Required client behavior

- Route **every** Admin API request through one Account-scoped scheduler. When multiple processes or replicas can call the API, coordinate them through shared state; a per-process queue or fixed concurrency limit is not sufficient. Give interactive work priority over background refreshes.
- After every response, including errors, update the scheduler from the rate-limit headers. If remaining is zero, stop dispatching until reset. Otherwise pace below `remaining / max(reset - now, 1)` requests/second and preserve headroom for other callers; never launch enough parallel work to spend the reported remainder at once.
- On `429`, pause the Account scheduler. Wait for `max(Retry-After * 1000, X-RateLimit-Reset * 1000 - Date.now())` plus bounded random jitter, then retry through the same scheduler with a bounded attempt count. Do not let individual requests run independent retry loops.
- Retry only idempotent operations. `GET` requests are safe; retry `POST /budgets` only with the identical desired-state body. Apply the same pacing and concurrency controls to reads and writes.
- Coalesce duplicate reads, cache results, cap pagination and fan-out, and keep polling behind the scheduler. Treat a `429` as failed backpressure, not normal control flow. Log `X-Request-Id`, route, status, limit, remaining, reset, and retry delay for diagnosis—never the API key.
- Keep high-fan-out `/usage` work in a bounded low-concurrency lane and adapt it from the headers returned by each response.
- Coordinate directory pagination with the same Account scheduler. Do not treat directory endpoints as unbounded.
- Per-entity daily series require one `/usage` call each, so build them progressively: low-priority background fetches, partial responses carrying `isComplete` and a pending count, and client polling until complete.

## Directories, projects, and deployments

- Cache directories and coalesce identical pages rather than refetching them for each screen or join.
- `/members` returns the Account member union and can be restricted to a Workspace. `/groups/{groupId}/users` returns active users only. Missing, hidden, deleted, and cross-Account groups intentionally share the same `404`.
- `/projects` excludes deleted, admin-hidden, personal-Workspace, and cross-Account projects. `hasDeployment` uses an eventually consistent projection, so do not treat a recent false value as definitive immediately after a deployment change.
- `/deployments` requires `workspaceId`; a supplied `projectId` must belong to that Workspace or the result is empty. Missing, hidden, deleted, personal-Workspace, and cross-Account deployment details intentionally share the same `404`.

## Usage data semantics

Omit range parameters for the current billing period, use `billingPeriod=previous` for the previous one, or provide both `startTime` (inclusive) and `endTime` (exclusive) for a custom range of at most 366 days. Recent usage can arrive late. Costs are gross usage-ledger values, not settled invoice totals, and exclude credits and discounts.

Grouped results return `groups[]`: `key` (userId/projectId/workspaceId/date, or `environmentType` for conversations), `totalCostUsd`, and `metrics[]`. For `groupBy=conversations`, the single group's key is `{ environmentType: "conversation" }`. Metrics contain public `id`, customer-facing `name`, `category`, nullable `usage` and `usageUnit`, and `costUsd`. Filter metrics with the repeatable `type` query parameter; do not use internal billing identifiers. `groupId` requires `workspaceId`, evaluates current active membership at request time, and cannot be combined with `groupBy=workspace`; totals from overlapping groups are not additive.

- Entity groups (`member`, `project`, and `workspace`) arrive **ordered by descending `totalCostUsd`**, so capped pagination keeps the top spenders. Timeseries groups arrive in ascending date order; paginate the full series before drawing conclusions from it.
- Per-entity daily series cost one `/usage` call each (`groupBy=timeseries`, `granularity=day`, plus the entity filter); there is no bulk endpoint.
- Usage pagination: pass `data.pagination.nextCursor` as `cursor` on the next request and stop when it is null. If the caller caps `maxPages`, return an incomplete result and log the truncation; never interpret missing groups as zero usage.

## Budget controls

- `GET /budgets` returns Account spending controls plus configured Workspace, group, and member Agent limits. A null Account threshold means that control is not configured; absent entity rows also mean no configured limit.
- Supplying `workspaceId` excludes Account spending controls. Combining it with `type=account_spending_controls` therefore returns an empty page; do not present that as a configured zero budget.
- `POST /budgets` is desired-state. Send a body validated against the current OpenAPI schema and retry only the identical body. Never turn a retry into an increment, toggle, or read-modify-write operation.
- A `409 budget_update_in_progress` or retryable budget `503` can include `Retry-After`. Honor it through the same bounded Account scheduler; do not spin or start an independent write retry loop.

## Audit-log exports

- Request the separate `audit-logs:read` scope only when needed. This endpoint exports only retained `project.message_sent` events containing sensitive prompt content; do not copy event bodies into application logs, traces, metrics, or error reporting, and apply the customer's access and retention controls to stored exports.
- The first request needs an inclusive `occurredAfter` and exclusive `occurredBefore` UTC window of at most 24 hours. Continuation cursors expire after one hour; keep the original window, `limit`, and `messageRef` unchanged while paging.
- `messageRef` is opaque and matches exactly. Do not parse, normalize, or derive meaning from it.
- Events are ordered by `occurredAt` and `eventId`. There is no completion watermark or guaranteed late-arrival bound: poll with overlapping windows when appropriate and deduplicate durably by `eventId`.
- Responses contain only complete events and are capped at 8 MiB uncompressed JSON. Handle `422 audit_log_content_too_large` explicitly; never silently truncate an event.

## Caching

Cache by Account, endpoint, and normalized request parameters, and coalesce concurrent misses. Every refresh, warm-up, export, and polling job still goes through the Account scheduler.

**In-memory** — suitable for one server process. Usage TTL around 10 minutes and directory TTL around 15 minutes are reasonable starting points. Stagger any startup warm-up through the scheduler; do not let every replica cold-fill simultaneously.

**Shared persistent cache** — use when multiple replicas need one cache or restarts must stay warm. Persist response payloads and fetch timestamps; for per-entity usage series, persist completed entity/date rows so interrupted builds resume only missing or stale work. Do not use cached authorization as permission to access a different Account.

- Prefer stale-while-revalidate for interactive reads. Surface partial/truncated state instead of blocking on an unbounded fill.
- Production and development caches are separate; test cold-start behavior and rate-budget recovery explicitly.

## Proven architecture

A practical architecture uses a thin backend proxy, one shared Account scheduler, endpoint-aware caches and resumable jobs, and an internal OpenAPI contract with generated typed clients. Browser requests read your backend's cached or progressive results; they never hold the Replit API key or independently fan out against the Admin API.
