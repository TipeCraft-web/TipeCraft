---
name: conversation-project-analytics
description: Query and compare project analytics, or hand off requests to add, remove, or change custom analytics events in an existing project from a conversation.
---

# Cross-Project Analytics

Use `findResources` to find the target projects. Pass its returned `path` values
to `queryAppAnalyticsAcrossProjects`.

Before writing SQL, read
`.local/skills/project-analytics/references/analytics-query-reference.md` and
follow its query contract, rules, limitations, examples, visualization
guidance, and reporting guidance.


## Instrumentation Changes

A conversation cannot edit or publish an existing project.

When the user asks to add, remove, or change analytics instrumentation:

1. Use a project already returned by `findResources`. Otherwise, call `findResources` to find
   the project.
2. Call `surfaceProjects({ projectSlugs: [project.path] })` so the user gets a project card they can open.
3. Tell the user to continue with Agent inside that project.

Do not call `connectToProject` or attempt file edits for this workflow.
