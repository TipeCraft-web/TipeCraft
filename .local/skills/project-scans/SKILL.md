---
name: project-scans
description: "Start a tracked security or SEO scan task in a project. Use when the user requests a full project scan whose findings should appear in Security Center or the Growth pane."
---

# Project Scans


Start a security or SEO scan as a background task in a project.
The scan runs separately from this conversation. Security findings appear
in Security Center. SEO findings appear in the Growth pane.


## When to Use


- The user requests a full security or SEO scan of a project.
- The user wants findings tracked in Security Center or the Growth pane.

- The user requests another scan after the prior scan completes.

## When NOT to Use

- The user requests a quick security check summarized in this conversation.
  Use the `security-scan` skill and its inline scanners instead.
- The user requests an SEO audit that you perform and explain in this
  conversation. Use the `seo-auditor` skill instead.

- The user asks to fix an existing finding. That requires a fix task, not a
  scan task.

## Current Project

### startProjectScan({ kind, onlyScanChanges? })

Call `startProjectScan` for the current project. Pass one object:

```javascript
await startProjectScan({ kind: "security" });
await startProjectScan({ kind: "seo", onlyScanChanges: true });
```


- `kind` (str): `"security"` or `"seo"`.

- `onlyScanChanges` (bool, optional): scan only changes since the last scan.
  The default is false, which scans the full project.

## Results

The function starts the scan, then waits for the scan task to finish.
Awaiting the call blocks until the task reaches a terminal state or the
wait budget runs out; the scan itself keeps running either way. If a scan
of that kind is already open, no new scan starts and the call waits on the
existing task instead.


- Success: `{ok: true, status: "completed", taskId, taskUrl}`. The scan
  finished and its findings are in Security Center or the Growth pane.

- The scan stopped without finishing:
  `{ok: false, status, error, taskId, taskUrl}`. `status` is
  `"cancelled"` (the task was cancelled), `"waitingOnInput"` (the task is
  paused for user input in the workspace), or `"agentError"` (the scan
  agent stopped on an error; the user can retry from the task pane).
- The scan could not start: `{ok: false, error, errorKind}`. `errorKind`
  is `"not_authorized"`, `"disabled"`, `"unsupported_project"`, or
  `"service_unavailable"`.

When the scan completes, tell the user it finished and link `taskUrl` for
the findings. If the wait times out, the scan is still running: link the
  task and call the function again later to resume waiting; it uses
`alreadyRunning` semantics by waiting on the same task. On any other
outcome, relay `error` to the user with the task link.
