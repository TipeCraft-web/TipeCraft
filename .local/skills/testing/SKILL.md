---
name: testing
description: Run automated UI tests against your application using a Playwright-based testing subagent. Do not use it unless the user explicitly asked for browser testing, or this work materially changed sign-in, payments or checkout, or data the user could lose in a way a screenshot, `curl`, or the logs cannot confirm. Finishing a feature or a task is not a reason to test. Each run drives a real browser for several minutes.
---

# Testing Skill

A `subagent` with `config: { $kind: "testing" }` is a Playwright-based tester that drives your app in a real browser, watches browser and backend logs, and returns screenshot evidence plus technical diagnostics. It can catch bugs that `curl` and unit tests miss. If needed, it can restart workflows with arbitrary environment variable overrides for testing.



Each tester is a persistent conversation partner: it keeps history, seeded data, and (usually) browser state and logged-in sessions, so `sendFollowup` can build on earlier work. The browser may have died or restarted since the last message, so treat open pages and sessions as best-effort -- a follow-up that depends on them should say what to do if that state is gone (e.g. "if you're no longer logged in, log in again as test@example.com first").

Every tester has a name you choose; run one at a time with distinct names (see Named Testers).

See the delegation skill for the subagent callback in general.


## Cost and Cadence

**Default to no tester.** Launch one only when the user explicitly asked for browser testing or end-to-end verification, or when this work materially changed sign-in, payments or checkout, or data the user could lose, and a screenshot, `curl`, or the logs cannot confirm it. Finishing a feature, a task, or a plan step never earns a run by itself. A change to a page behind sign-in outside those flows does not earn one either; if your screenshot cannot reach it, say plainly in your final message that the signed-in UI was not verified.

- **One pass at most**: when a change qualifies, run a single tester over its changed flows and cover related flows with `sendFollowup` to that tester. Never start a second tester for the same unit of work.
- **Trust cheap checks after a fix**: when a run surfaces issues, fix them and confirm with a screenshot, `curl`, or the workflow logs. Only if the fix was risky or the failure subtle, `sendFollowup` to the existing tester for just the fixed flow.
- **A passing run stays valid** until you change the code it exercised.


## When to Use


- The user explicitly asked for browser testing or end-to-end verification
- This work materially changed sign-in, payments or checkout, or data the user could lose, and cheaper checks cannot confirm it


Not for:

- Unit testing code logic -- use standard test frameworks. Reserve the tester for e2e validation; reserve unit tests for regressions and backend logic.
- Work a screenshot, `curl`, or logs can confirm
- Re-testing unchanged flows or confident fixes, or checking each edit or plan step

- When the application is not running or accessible
- Load testing or performance testing

## Testing subagents

`subagent({ name, task, config: { $kind: "testing" } })` is an async CodeExecution callback: await the returned future when you need the verdict first, or fire it and keep working. Continue an existing tester with `sendFollowup({ name, message })`.

**Parameters:**

- `name` (str, required): Alphanumeric and `-` only (e.g. "checkout"). Creates a fresh tester under this name. Use the returned `name` for follow-ups (a collision auto-renames).
- `task` (str, required): A test plan, or a question. Put all relevant detail here, but be concise.
- `config.$kind` (required): `"testing"`.

A follow-up to a tester that no longer exists (never created, or recycled at capacity) errors; start a fresh `subagent` instead.

**Returns:** a job that, when awaited, resolves to:

- `name`: Canonical name of the tester that handled the request; pass it to `sendFollowup` to continue the session.
- `verdict` (well-formed runs only): One of "success", "failure" (a bug blocks the request), "unable" (blocked by something that is not an app bug), or "general" (an answer to a question, or other requested information). A malformed run omits `verdict` and `screenshots`, resolving with just `name` + `text`.
- `text`: Detailed test report and observations
- `screenshots` (well-formed runs only): List of `{ id, description }` entries the tester cited as evidence. Descriptions usually carry enough signal on their own; when you need to see the pixels (visual bugs, layout issues), pass an id to `viewImage` -- e.g. `await viewImage({ id: screenshot.id })`, or `await Promise.all(testRun.screenshots.map((s) => viewImage({ id: s.id })))` to view several at once.
... kind, jobId, status, ...

Unlike a regular subagent, which returns only `text`, this one also provides `screenshots` and `verdict`.

For worked invocation and plan examples, read [Test plan examples](references/test-plan-examples.md) when drafting a login, shopping, API-seeded, or TODO flow, or a session-dependent follow-up.

## Writing Test Plans

A good plan comes from knowing the app: the relevant frontend and backend code, how to reach the feature, and the UI elements (selectors, labels) and API endpoints involved. If you just implemented the feature, use that context immediately. If a run stalls on missing context, send the missing detail as a follow-up rather than starting over; if still stuck after a few rounds, stop and ask the user.

In the plan itself:

1. **Test one flow per message, one tester per unit of work**: Keep each message to at most one user journey, and cover the unit's other changed flows with follow-ups to the same tester -- do not launch a fresh tester or a separate full pass per flow
2. **Include expected outcomes**: Specify what success looks like -- "A success toast should appear with message 'Saved!'"
3. **Provide technical context**: Append relevant DB schemas, API routes, test credentials, data-testids, component details, and paths to the relevant source files -- pointing the tester at the right files up front saves it from exploring, and anything you leave out can go in a follow-up
4. **Specify test data**: Use concrete values where you know them. For values the tester must generate at runtime (e.g. unique data to avoid collisions), name them with an angle-bracket placeholder and say how to produce them, then reuse the placeholder in later steps:
   - **Generate**: "a product name from `nanoid(6)` (remember it as `<product_name>`)"
   - **Reuse**: "assert the product name is `<product_name>`"
5. **Handle authentication**: If the app requires login, include login steps first
6. **Include setup steps**: If the test needs data to exist, explain how to create it -- or build on data the same tester created in an earlier message
7. **Mention the viewport** if a specific one matters (e.g. mobile)

Batch `[Verify]` checks on the same page when no actions occur between them. If `[Browser]`, `[API]`, or `[DB]` steps occur between verifications, keep them in separate `[Verify]` blocks -- verifications should be read-only, with no side effects.

For UI testing, explicitly include interactions like hover effects, dialogs, modals, tooltips, dropdowns, and animations -- the tester sometimes needs special handling for these (e.g., being told to dismiss a dialog before clicking).

A plan can be plain prose and does not have to be complete. The tester fills small gaps from what the page shows, and when a gap decides the outcome (which account, what "correct" looks like, whether a step should fail) it returns a `general` verdict with a specific question instead of guessing. Answer with `sendFollowup` and it continues in the same session. Inviting this in the plan ("ask me if anything is unclear") is cheaper than a run that guessed wrong.



## Follow-up Messages

Follow up when the tester's earlier context helps -- it is already logged in, has the data it seeded, or has seen the pages in question -- even if the next message covers a different flow of the same work. Start a new tester, under a new name, for unrelated work where that context would only get in the way.

Follow-ups can reference earlier work without restating the plan. If they depend on an open page or logged-in session, account for the browser-state caveat above; see [Test plan examples](references/test-plan-examples.md) for a session-recovery example.

## Named Testers and Parallel Testing

Each distinct tester `name` is its own persistent tester with its own browser, history, and sessions. Use separate names for independent flows -- e.g. keep an "admin" tester logged in as an admin while a "shopper" tester exercises the storefront -- or to start a test that has nothing to do with earlier work.

At most one Playwright tester can run at a time.

All testing subagents share the same development database as you (see Test Environment below).

## Test Environment

The testing environment uses the **same development database** as you and the user. The application is not in a fresh state -- it may contain existing data from prior usage.

- **Don't assume specific counts** -- tests that assert "there are exactly 3 products" will break if other data exists
- **Don't test empty states** or rely on data you didn't create as part of the test plan
- **Generate unique values** for usernames, emails, titles, etc. using `nanoid` to avoid conflicts across test runs and with user data. When messaging the agent, do not execute `nanoid` yourself -- instruct the subagent to use it.

Other limitations:


- The testing subagent has a maximum number of steps before it needs to report results
- Some complex interactions (drag-and-drop, canvas operations) may be challenging
- If the application is not accessible or crashes, tests will report as "unable"


## Database Testing

If the application uses a database and you need to inject data, set roles, or verify DB state during tests, see `database-testing.md` for how to use `[DB]` steps in test plans.


## External Services

If the application connects to external services, be mindful of side effects. Clean up resources created during tests, and limit notifications sent to third parties. Balance thorough testing with responsible use of external services.


## Replit Auth

If the application uses Replit's OIDC auth — typically indicated by `javascript_log_in_with_replit` or `python_log_in_with_replit` in `.replit`, the presence of `replitAuth.ts` / `replit_auth.py`, `@workspace/replit-auth-web`, references to `replit.com/oidc`, or any other use of Replit's OIDC service — you *must* read `replit-auth.md` (in the same directory as this file) for how to handle programmatic login in test plans. Failing to do so when Replit Auth is part of the test flow will cause auth-related test failures and user frustration.



## Clerk Auth

If the application uses Clerk authentication (`@clerk/react`, `@clerk/clerk-react`, `@clerk/express`, or `CLERK_SECRET_KEY` env var), see `clerk-auth.md` for how to handle programmatic login in test plans.


