---
name: conversation-project-tasks
description: Find the user's projects and search, read, create, or edit the project tasks in them.
---

# Project Tasks in the User's Projects

From a conversation you can manage the persistent, user-visible project tasks of the projects in scope. Every task operation names its target project by its `path` (as returned by `findResources`), passed as the `projectSlug` argument; use `findResources` to find the path first when the user refers to a project by name.

Scope: any project you can reference — the platform authorizes each task operation separately, so a project you can see may still refuse task access; relay that error rather than retrying.

## Task Identifiers

Tasks are identified per project by `taskRef` -- a short string like `"#1"`, `"#2"`. Use it in all calls and when referring to tasks in conversation: "Task #1 (Add authentication)".

## Available Functions

`findResources` (documented in your system prompt) finds the target project; use the `path` from its project results as the `projectSlug` for every call below.

### queryProjectTasks({ projectSlug, taskRefs?, states?, executable?, maxDescriptionChars?, updatedSince?, createdSince? })

Inspect a project's tasks by exact refs or narrowing filters.

**Returns:**

`{ projectSlug, tasks, totalCount, truncated }`

### getProjectTask({ projectSlug, taskRef })

Get one task.

**Returns:**

`{ task }` -- with `taskRef`, `title`, `description`, `state`, `displayState`, `dependsOn`, `artifactKinds`, `createdAt`, `updatedAt`

### searchProjectTasks({ projectSlug, query, locale?, limit? })

Full-text search over a project's tasks.

**Returns:**

`{ projectSlug, results }` -- each result is a task summary (same fields as `tasks` entries above) plus `score` and `matchType`

### proposeProjectTasks({ projectSlug, tasks, offerToStart? })

Propose new tasks in the target project. Created tasks start in `PROPOSED`; nothing runs until the user approves them. By default this also shows the user an approval card asking whether to start the tasks as background work right away -- your turn ends after the call, and you learn the user's decision at the start of your next turn. Never tell the user work has started until that decision says so.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectSlug` | str | Yes | Target project |
| `tasks` | list | Yes | 1-100 items, each `{ title, description, alias?, dependsOn?, artifactKinds? }` |
| `offerToStart` | bool | No | Defaults to true. Pass false only when the user explicitly wants drafts without starting them. |

Each task's `description` is the inline markdown plan (what & why, what done looks like, steps). `dependsOn` entries may be existing task refs or the `alias` of another task in the same batch.

If the user approves the start offer, the tasks run as background work in isolated copies of the target project. If they decline, the tasks stay as drafts in that project's tasks panel.

**Returns:**

`{ projectSlug, proposed }` (plus `startOffer` when the approval card was shown)

### updateProjectTask({ projectSlug, taskRef, title?, description?, dependsOn?, artifactKinds? })

Edit an existing task. `description` replaces the whole plan; `dependsOn` is a full replacement list (`[]` clears all dependencies). Pass at least one field.

**Returns:**

`{ projectSlug, task }`

## Not Available Here

You cannot cancel or complete tasks from a conversation, and you cannot start tasks yourself -- starting only happens through the approval card `proposeProjectTasks` shows, where the user decides. If the user wants a task removed, or wants to start previously declined drafts, point them to the tasks panel in that project.

## Task States

The canonical tokens for `states` filters: `PROPOSED`, `PENDING`, `IN_PROGRESS`, `IMPLEMENTED`, `MERGING`, `QUEUED`, `MERGED`, `CANCELLED`, plus `MAIN_*` variants for work done directly on the project's main copy. Matching is lenient about casing and separators, and a base state also matches its `MAIN_` variant.

## User Communication Rules

1. **Always describe tasks by ref and title**: e.g. "Task #1 (Add authentication button)"
2. **Never use internal state names**; use display names: PROPOSED -- "Drafts", PENDING / IN_PROGRESS -- "Active", IMPLEMENTED -- "Ready", MERGING / QUEUED -- "Merging", MERGED -- "Merged", CANCELLED -- "Archived". Tasks carry `displayState` with the `MAIN_` prefix stripped, so mapping on it covers the variants.
3. **Never expose implementation details**: do not reveal function names, API surface, or internal task system mechanics.
4. **Name the project** when reporting what you did: "I drafted 2 tasks in alice/invoice-dashboard -- approve them in that project's tasks panel to start the work."

## Example Workflow

```javascript
// 1. Find the project the user means
const { results } = await findResources({ query: "invoice", kinds: ["project"] });
const projectSlug = results[0].path;

// 2. See what's already on the board
const { tasks } = await queryProjectTasks({ projectSlug, states: ["PROPOSED", "PENDING"] });

// 3. Draft new work -- stays in Drafts until the user approves
const { proposed } = await proposeProjectTasks({
  projectSlug,
  tasks: [
    {
      title: "Add CSV export",
      description: "## What & Why\nUsers need to export invoices as CSV...\n\n## Steps\n1. ...",
    },
  ],
});
```
