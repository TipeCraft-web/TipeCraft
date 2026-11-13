---
name: project-tasks
description: Create and manage persistent project tasks visible to the user.
---

# Project Tasks

Manage persistent, user-visible project tasks that the main agent or a task agent can execute. Only task agents run in isolated environments. Use these to track high-level deliverables and milestones that the user cares about.

## Project Tasks vs Internal Task List

| Aspect | Project Tasks | Internal Task List |
|--------|--------------|-------------------|
| Purpose | User-visible deliverables | Agent's own work breakdown |
| Persistence | Persistent across sessions (PID2) | Current session only |
| Visibility | Shown to the user | Internal to the agent |
| Granularity | High-level milestones | Detailed implementation steps |

## When to Use

- Tracking user-requested features or deliverables
- Breaking a project into visible milestones
- Communicating progress to the user
- Managing tasks that persist across sessions

## When NOT to Use

- Internal agent work breakdown (use the internal task list)
- Temporary implementation steps
- Sub-tasks that only matter to the agent

## Task Identifiers

Tasks are identified by `taskRef` -- a short string like `"#1"`, `"#2"`, `"#3"`. Use it in all API calls and when referring to tasks in conversation: "Task #1 (Add authentication)".

## Choose the Workflow

- **Planning or managing the task queue:** before checking for duplicates, proposing or surfacing tasks, writing plans, or managing dependencies, read [Planning project tasks](references/planning.md). It covers `searchProjectTasks`, `queryProjectTasks`, `surfaceProjectTasks`, and `bulkCreateProjectTasks`, with plan format and approval rules.
- **Executing an assigned task:** before resuming completed work or completing the assignment, read [Executing project tasks](references/execution.md). It covers `markTaskInProgress`, `markTaskComplete`, and completion failure handling. Do not load planning guidance merely to execute an existing plan.
- Choose by the current workflow, not agent type: planning permissions still follow the rules above. Read both references only when the work actually crosses workflows.

## Shared Functions

Call these functions with an object argument. A returned `task` contains `taskRef`, `title`, `description`, `state`, `displayState`, `dependsOn`, `artifactKinds`, `createdAt`, and `updatedAt`.

### getProjectTask({ taskRef })

Read one full task by its required string ref, for example `await getProjectTask({ taskRef: "#1" })`. Returns `{ task }`.

### updateProjectTask({ taskRef, title?, description?, filePath?, dependsOn?, artifactKinds? })

Edit only `PROPOSED` tasks. Accepted tasks can no longer be edited, including their dependencies. You can create new tasks. Returns `{ task }`; only provided fields change. `taskRef` is required. Optional fields:

- `title`: new title string.
- `description`: inline description string, when there is no plan file. Mutually exclusive with `filePath`.
- `filePath`: path under `.local/tasks/`; its content becomes the description. Editing a plan file alone does NOT update the task: call `updateProjectTask` with its path to persist changes.
- `dependsOn`: full array of dependency refs, replacing the existing list.
- `artifactKinds`: updated artifact kind tags; pass `[]` to clear stale tags when the task no longer produces an artifact.

## Task States

When filtering by state (`states` on `queryProjectTasks`), values are matched leniently: casing and `-`/space separators are normalized, so `"in-progress"`, `"In Progress"`, and `"IN_PROGRESS"` are equivalent. The canonical tokens are: `PROPOSED`, `PENDING`, `IN_PROGRESS`, `IMPLEMENTED`, `MERGING`, `QUEUED`, `MERGED`, `CANCELLED`, plus the main-Repl variants `MAIN_PENDING`, `MAIN_IN_PROGRESS`, `MAIN_IMPLEMENTED`. Filtering by a base state also matches its main-Repl variant (e.g. `IN_PROGRESS` matches both `IN_PROGRESS` and `MAIN_IN_PROGRESS`); pass the explicit `MAIN_` token to match only the main-Repl variant.

| State | Description |
|-------|-------------|
| `PROPOSED` | Suggested but not yet accepted by the user. No implementation exists. |
| `PENDING` | Accepted, waiting to start. No implementation exists. |
| `IN_PROGRESS` | Being worked on by a task agent in a separate Repl. Changes are not visible in this Repl. |
| `IMPLEMENTED` | Work is done in a separate Repl, ready for merge. Changes are not visible in this Repl -- do not search the codebase for them. |
| `MERGING` | Currently being merged. Do not duplicate. |
| `QUEUED` | Queued for merge. |
| `MERGED` | Finished and merged. Changes are now visible in this Repl. |
| `CANCELLED` | Abandoned. |
| `MAIN_PENDING` / `MAIN_IN_PROGRESS` / `MAIN_IMPLEMENTED` | Same as the corresponding state above, but for work done directly on the main Repl rather than in a separate task-agent Repl. |

Drift blocking is a `blockedBy` reason, not a filterable state -- do not pass it to `state`/`states`. A drift-blocked task is surfaced with `blockedBy: "DRIFT"` (the task's `state` stays whatever it was). It means the task is blocked because an upstream task diverged from its plan and needs replanning.

## User Communication Rules

Follow these rules strictly when discussing tasks with the user:

1. **Always describe tasks by ref and title**: e.g. "Task #1 (Add authentication button)"
2. **Never use internal state names**: use these display names instead:
   - PROPOSED -- "Drafts"
   - PENDING -- "Active"
   - IN_PROGRESS -- "Active"
   - IMPLEMENTED -- "Ready"
   - MERGING -- "Merging"
   - QUEUED -- "Merging"
   - MERGED -- "Merged"
   - CANCELLED -- "Archived"
   - The `MAIN_*` variants use the same display name as their base state (e.g. `MAIN_IN_PROGRESS` -- "Active", `MAIN_IMPLEMENTED` -- "Ready"). Tasks also carry a `displayState` field with the `MAIN_` prefix stripped, so mapping on `displayState` covers them automatically.
   - A `blockedBy: "DRIFT"` task -- "Affected by another task that changed"
3. **Never expose implementation details**: Do not reveal function names (`bulkCreateProjectTasks`, `updateProjectTask`, etc.), API surface, or internal task system mechanics to the user
4. Follow-up suggestions may be archived automatically and appear as `CANCELLED`; this alone does not mean the user cancelled work. `followUpCategory` identifies a suggestion's origin, not its cancellation reason. Do not describe these suggestions as cancelled tasks or mention them at all unless the user asks about them; the user may never have seen them. If asked, describe automatic archival as archived suggestions, not cancelled work. Do not infer user rejection or say "nothing is running" from this state alone; honor explicit user cancellation when known. If the user asks for that work, follow the mode and task-routing rules above.

## Best Practices

1. **Prefer fewer tasks**: Default to one task per request unless the user explicitly asks for more
2. **Create tasks early**: Create the project task when you understand the user's goals
3. **Keep titles short**: Titles should be concise and descriptive
4. **Use descriptions for detail**: Put implementation details in the description field
