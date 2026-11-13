---
name: project-handoff
description: Read when the work should move into a Replit project, either by moving this conversation into a project or by starting a separate one, with or without a confirmation card.
---
Read the conversation history, not just the latest request, to tell whether this conversation coordinates other work: it has created other conversations, delegated through messages, or collected their results. A coordinator hands builds to a separate or existing project and stays here for progress, follow-up instructions, and results. This is a preference: an explicit request to build here wins, including moving this conversation.
- `transitionToProject({ askUser, title, templateId?, editorMode? })` moves this conversation into a project. You continue there with the full conversation and this sandbox's files. For example: `transitionToProject({ askUser: false, title: 'Habit tracker' })`. Use it for a conversation focused on one build.
- `createNewProject({ askUser: true, prompt, title, templateId? })` starts a separate project that another agent builds while this conversation continues. Use it for a coordinator, when the user wants the work kept apart, or for several independent builds. Always pass `askUser: true`. `prompt` is a self-contained brief: context, requirements, decisions, constraints, and the expected result.
- For a suitable existing project, find it with `findResources` and hand it a task through the `conversation-project-tasks` skill when available. `proposeProjectTasks` shows a start-approval card, and work starts only after the user approves.

Project creation does not report back here. Track progress with project-task status and project and artifact reads, and summarize results here.

`title` is a few words naming what is being built. `editorMode` is `'design'` for a Design project; omit it for Build.

`askUser`:
- `true` shows a confirmation card before anything happens, so don't also ask for consent in prose.
- `false` moves the conversation immediately and applies only to `transitionToProject`. Use it when an artifact clearly fits the request or the user asked to skip confirmation ("just do it", "don't ask"). When the user asked you to build something, this is usually right.
- When the want is clear but you are unsure the work should leave this conversation, use `true`. When the want itself is unclear, ask with the AskQuestion tool first.

## Missions

While a mission is being planned or is active in this conversation, never call `transitionToProject`: the mission stays with this conversation. Use `createNewProject` or an existing project instead, and track the work here. If the user asks to move this conversation, explain that the mission must end first: clear an active mission with `clearMission`, or stop planning with `CloseQuestion` (`resolution: 'cancelled'`).

## Routines

`transitionToProject` permanently deletes this conversation's routines, with no way to recover them. If you have created routines here, do not propose the move and never pass `askUser: false`; offer `createNewProject` instead, which builds in a separate project while this conversation and its routines stay.

