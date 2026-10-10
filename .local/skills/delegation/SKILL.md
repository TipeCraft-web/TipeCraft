---
name: delegation
description: Delegate work through the subagent CodeExecution callback, including background runs and follow-ups. Spawn a subagent only when the user asks for one or a skill you are following requires one; otherwise do the work yourself. Provides general guidance on subagents, reified by the specific skills that use them.
---

# Delegation Skill

Delegate work to a subagent through the `subagent` callback inside CodeExecution.
You choose a `name`; the same `subagent` call covers every kind of delegated
work via `config.$kind`.

## When to Use a Subagent

Do the work yourself. Spawn a subagent only when the user asks for one or a skill you are following requires one, such as the design subagent when building a web app or the testing subagent when the testing skill calls for it. A request for thoroughness or research is not a request to delegate.

## Available Callbacks

### subagent

`subagent({ name, task, config })` is an async CodeExecution callback. Call it from the codeExecution tool.

**Parameters:**

- `name` (required): a short handle you pick, alphanumeric and `-` only, e.g. `"auth-fix"`. A name identifies one subagent:
  - no live subagent has it: `subagent` creates one under that name;
  - a live subagent of the same kind, created in this same environment, has it: the call continues that subagent exactly as `sendFollowup` would, with `task` as its next message. Per-request context (`relevantFiles`, `relevantSkills`, an architect's `includeGitDiff` and `relevantGitCommits`) arrives in that message; the settings fixed at creation (an architect's `responsibility`, a design worker's `outputDir`, a general or explore worker's `schema`) stay as they were, and a create that asks for different ones fails;
  - a live subagent of another kind, or one created in another environment, has it: the call fails; pick another name, or use `sendFollowup`.
  A finished subagent keeps its name for a while; once it has aged out, the name is free again.
- `task` (required): the full task, question, or test plan. Put all detail here.
- `config.$kind` (required): the kind of subagent to create. This is specific to the skill that uses the subagent callback. A non-specialized subagent must use the $kind: "general".
- Other config values are specific to the skill that uses the subagent callback.
- `schema` (optional): a JSON Schema with `type: "object"` for the result you want back. Only `general` and `explore` subagents accept it. The subagent must deliver an object that conforms to it, and the result carries it as `.result` next to the prose `.text`. Use it when your code will act on the result (a verdict, a file list, findings to route); omit it for a prose report. Build it from `type`, `properties`, `required`, `items`, `enum`, `anyOf`, and descriptions, and constrain strings with `enum`, `minLength`, and `maxLength`. Rejected at spawn: `pattern`, `patternProperties`, `format`, `$ref`, type lists (use `anyOf`), object or array `enum`/`const` literals (only string, number, boolean, and null), and composition or conditional keywords (`allOf`, `oneOf`, `not`, `if`/`then`, `dependentRequired`, `propertyNames`, `contains`, `prefixItems`). The schema is fixed for the subagent's life: every later assignment (a `sendFollowup`, or a same-name create) returns `.result` under it, and a create that names a live subagent with a different schema, or with none, is rejected. Use a new name for a different result shape.

**Returns:** A job that resolves to the subagent's result: `.text` is the prose report, and `.result` is the schema-conforming object when you passed `schema`. `.result` is absent if the subagent ended without delivering a conforming object (its report is still in `.text`), so check it before dereferencing: `if (r.result) { ... } else { console.log(r.text); }`.

For example, a result your code can branch on:
```js
const check = await subagent({
  name: "auth-check",
  task: "Determine whether src/auth.ts rate-limits login attempts. Report the mechanism if so.",
  config: { $kind: "explore", relevantFiles: ["src/auth.ts"] },
  schema: {
    type: "object",
    properties: {
      rateLimited: { type: "boolean" },
      files: { type: "array", items: { type: "string" } },
    },
    required: ["rateLimited", "files"],
  },
});
if (check.result === undefined) {
  console.log(check.text); // the worker reported in prose only; decide from that
} else if (!check.result.rateLimited) {
  // delegate the fix, with check.result.files as relevantFiles
}
```

#### General Subagent

A general subagent is a generic subagent that can be used for any task. The `config` object for a general subagent can include:
- `config.relevantFiles`: workspace-relative paths the subagent reads first. Files accept 1-based line ranges, e.g. `"src/auth.ts:10-50"`.
- `config.relevantSkills`: skill paths the subagent reads first.

For example:
```js
const authFixTask = "Fix the auth bug in src/auth.ts and summarize the changed files.";
const authfixResult = await subagent({
  name: "auth-fix",
  task: authFixTask,
  config: {
    $kind: "general",
    relevantFiles: ["src/auth.ts", "src/auth.test.ts:10-50,200-250"],
    relevantSkills: [".local/skills/auth/SKILL.md"],
  },
});
console.log(authfixResult.text); // Mainly the `text` matter. Unless the skill for a particular specialized subagent indicates otherwise.
```

### sendFollowup

`sendFollowup({ name, message })` continues an
**existing** subagent, keeping its history and context instead of starting fresh.
The `name` rules above say when a `subagent` call continues rather than creates.

**Parameters:**

- `name` (required): the `name` returned by the original `subagent` call.
- `message` (required): the follow-up instruction or question. Put all detail here.

`sendFollowup` returns the same kind of job as `subagent` — await it for the
subagent's result (same `{ name, text, jobId, status }` shape, plus `.result` when the subagent was created with a `schema`) or run it in the background without awaiting it.

```js
const firstJob = subagent({
  name: "auth-fix",
  task,
  config: { $kind: "general" },
});
```

After the subagent finishes in the background, you can continue it with `sendFollowup`.
```js
// Continue the SAME subagent — do NOT call subagent() again.
const followup = await sendFollowup({
  name: "auth-fix",
  message: "For your auth.tsx changes, make sure to comment out the tests for now.",
});
console.log(followup.text);
```

## Usage Patterns

Different $kinds of subagents return different values. The `subagent` callback returns a job that, when awaited, resolves to the subagent's result.

All subagent results have the following properties:
- `name`: the subagent's canonical name — pass it to `sendFollowup` to continue this subagent
- `text`: the text of the subagent's result
- `jobId`: this run's job id — pass it to `waitForJob` / `cancelJob` only
- `status`: the status of the subagent's job

`subagent` and `sendFollowup` operate **only by `name`** — they never take a `jobId`. Job operations (`waitForJob`, `cancelJob`) operate **only by `jobId`**. Don't cross them:

```js
// WRONG — subagent/sendFollowup do not take a jobId
await subagent({ jobId: prev.jobId, task: "..." });
await sendFollowup({ jobId: prev.jobId, message: "..." });

// RIGHT — continue a subagent by name
await sendFollowup({ name: prev.name, message: "..." });

// RIGHT — job operations by jobId
await waitForJob({ jobId: prev.jobId });
await cancelJob({ jobId: prev.jobId });
```

### Synchronous Usage

```js
const authFixTask = "Fix the auth bug in src/auth.ts and summarize the changed files.";
const authfixResult = await subagent({
  name: "auth-fix",...});
console.log(authfixResult.text);
```

### Using Promise.all to Run Multiple Subagents in Parallel

```js
const [charts, auth] = await Promise.all([
  subagent({ name: "build-charts", ...}),
  subagent({ name: "add-auth-regression-tests", ... }),
]);
console.log("Build charts result:");
console.log(charts.text);
console.log("================================================");
console.log("Add auth regression tests result:");
console.log(auth.text);
// Note: Use `Promise.all` / `Promise.race` only when this turn needs the subagent results before continuing.
```

### Asynchronous Usage (Background Subagent)

```js
const buildChartsJob = subagent({ ...});
// The job runs in the background while you do independent parent-agent work.
// After that work is done, join before finalizing.
const buildChartsResult = await waitForJob({ jobId: buildChartsJob.jobId, timeout: 600 });
console.log(buildChartsResult.text);
```

Background subagents are for parallelism while the main agent has other independent work to do. Do not finish the turn with a relevant subagent job still running. When your independent work is done, use `await waitForJob({ jobId: job.jobId, timeout: 600 })` to collect the result, inspect it, and continue. A wait that runs out of time returns `null` and prints why. The subagent is not cancelled: it keeps running in the background until it finishes or you cancel it. If the subagent is no longer needed, call `cancelJob({ jobId: job.jobId })` instead of leaving it running.

## Best Practices

1. Delegate only work that can proceed independently.
2. Include the exact files, constraints, and relevant skill names in the `task`.
3. Use `Promise.all` / `Promise.race` only when this turn needs the subagent results before continuing.
4. Use background subagents only when you have independent work to do before joining them.
5. Wait for or cancel every relevant background subagent before finalizing user-facing work.
6. Verify subagent results before finalizing user-facing work.

The subagent can read and edit files, run commands, use diagnostics, and load relevant skills; the main agent remains responsible for final integration, verification, previews, and user-facing status.
