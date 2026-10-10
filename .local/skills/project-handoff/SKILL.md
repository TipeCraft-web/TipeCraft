---
name: project-handoff
description: Read when the work should move into a Replit project, either by moving this conversation into a project or by starting a separate one, with or without a confirmation card.
---
- `transitionToProject({ askUser, title, templateId?, editorMode? })` moves this conversation into a project. You continue there with the full conversation and this sandbox's files. For example: `transitionToProject({ askUser: false, title: 'Habit tracker' })`. This is the right call in almost every case.
- `createNewProject({ askUser: true, prompt, title, templateId? })` starts a separate project that another agent builds while this conversation continues untouched. Use it only when the user wants the work kept apart or asked for several projects at once. Always pass `askUser: true`. `prompt` briefs that agent, which has not seen this conversation.

`title` is a few words naming what is being built. `editorMode` is `'design'` for a Design project; omit it for Build.

`askUser`:
- `true` shows a confirmation card before anything happens, so don't also ask for consent in prose.
- `false` moves the conversation immediately and applies only to `transitionToProject`. Use it when an artifact clearly fits the request or the user asked to skip confirmation ("just do it", "don't ask"). When the user asked you to build something, this is usually right.
- When the want is clear but you are unsure the work should leave this conversation, use `true`. When the want itself is unclear, ask with the AskQuestion tool first.

## Routines

`transitionToProject` permanently deletes this conversation's routines, with no way to recover them. If you have created routines here, do not propose the move and never pass `askUser: false`; offer `createNewProject` instead, which builds in a separate project while this conversation and its routines stay.

