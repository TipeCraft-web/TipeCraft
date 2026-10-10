---
name: code-review
description: Spawn a code review (architect) subagent, only when the user explicitly asks for a code review, an architect, or a second opinion. Never on your own initiative. Relies on `delegation` skill.
---

# Code Review Skill

Spawn a code review (a.k.a architect) subagent that reviews the current changes and reports back. It analyzes; it does not implement.

## When to Use

Only when the user explicitly asks for a code review, an architect, or a second opinion on the work.

## When NOT to Use

- To review your own work after finishing a task or feature. Verify it yourself.
- To re-check fixes you made in response to an earlier review.
- To get unstuck on a bug or a design question. Investigate directly, or ask the user.
- For implementation or file edits (use the delegation skill instead).

## Available Function

### subagent({ name, task, config: { $kind: "architect", ... } })

**Parameters:**

- `name` (str, required): Short handle, alphanumeric and `-` only, e.g. `"code-review"`; reuse the returned `name` for follow-ups.
- `task` (str, required): The analytical task or question.
- `config.$kind` (required): `"architect"`.
- `config.relevantFiles` (list[str], optional): Workspace-relative paths to analyze.
- `config.includeGitDiff` (bool, default `false`): Embed the working-tree diff (lockfiles/node_modules/dotfiles filtered); with an active task, also the diff since its base commit.
- `config.relevantGitCommits` (str, optional): Commit range or single commit (e.g. `"HEAD~3..HEAD"`) whose diff and changed files are embedded.

**Returns:** a job that, when awaited (or collected via `waitForJob`), resolves to a dict with analysis results:

```json
{
    "name": "code-review",
    "jobId": "code-review:0",
    "status": "completed",
    "text": "Full analysis output..." // only text is important for you to see if successful.
    ...
}
```

**Example:**

```javascript
const result = await subagent({
    name: "code-review",
    task: "Review the checkout flow changes for correctness and regressions.",
    config: {
        $kind: "architect",
        relevantFiles: ["src/routes/checkout.ts", "src/services/cart.ts"],
        includeGitDiff: true
    }
});
console.log(result.text);
```

Always use this configuration: `includeGitDiff: true`, and leave `responsibility` unset.

## Best Practices

1. **Be specific in your task description**: Say what the user wants reviewed and the goal of the change
2. **Provide relevant files**: The architect can only analyze files you pass in `relevantFiles` and the embedded diff
3. **Use `relevantGitCommits`**: When the changes to review are already committed (e.g., "HEAD~3..HEAD"); the range's diff is embedded for it
4. **Run one review per user request**: Report the findings to the user; do not re-run the review after fixing them unless the user asks

5. **Build before verifying**: Build/regenerate the workspace before calling `architect`, so its checks run against current artifacts instead of a dependency's stale last build (which surfaces phantom errors). TypeScript example: `tsc --build` (or the repo's `typecheck:libs`).

