---
name: routines
description: Create and manage cron-routines that message the agent, run a background subagent, or run a script without a model turn on a recurring schedule. Use when the user asks for recurring, scheduled, daily/weekly, or cron-based work.
---

# Routines

Create, inspect, and run recurring routines for this agent. These
are distinct from project tasks (the build plan): a routine holds a
cron schedule and an action; when it fires, the action runs separately
from the user's conversation queue.

## When to Use

- The user asks for something recurring: "every morning", "weekly", "on a
  schedule", "remind me", "check X daily".
- The user asks what routines exist, or wants one changed, run
  immediately, or removed.

## Where the User Sees Routines

The user manages their routines on the **Routines** page in the sidebar — that
page lists their routines in the current workspace, across conversations, not
just this one. It is scoped to the workspace the user is in, so routines in
their other workspaces (personal or team) show up on that workspace's own
Routines page. When the user asks where to find, view, or manage their
routines, point them there. You can still use `listRoutines` to read this
conversation's routines inline when that answers their question directly.

## When NOT to Use

- One-off future work with no recurrence — do it now or ask the user.
- Sub-hourly cadences: routine schedules must be at least 60 minutes
  apart; a faster schedule is rejected. When the user asks for a faster
  cadence (e.g. "every 10 minutes"), tell them about the 60-minute
  minimum and agree on a cadence before proposing anything — never
  silently substitute a slower schedule than they asked for.

## Routine Actions

Every routine carries one action, a dict with a `kind` field:


- `{kind: "message", message}` — the default action. When the routine
  fires, this agent runs a normal turn on the message, with the
  conversation's memory as context. Use when the work needs the
  conversation's history or judgment, or should land directly in the chat.


- `{kind: "subagent", message}` — when the routine fires, a separate
  subagent is spawned in this conversation's environment and runs the
  message as its task at a cheap model tier; this agent runs no turn and
  the conversation history is not shared. Do not select this action when
  creating a routine or switching an existing routine's action — those
  calls are rejected. Exception: when editing a routine that already
  carries a subagent action, send its action back with `kind: "subagent"`
  (updates replace the full definition, and sending `message` would
  silently convert its fires into normal turns on this agent).


- `{kind: "script", script}` — when the routine fires, the JavaScript runs
  as a durable PTC block with the callbacks your own executed code has and
  **no model call**: a clean exit is silent, a throw records the run as
  failed, and `await wakeAgent({message})` escalates to this agent. Use for
  mechanical work whose interesting outcome is rare (probe an endpoint,
  compare a value, roll data forward) so an uneventful fire costs nothing.
  See "Script actions" below before writing one.


A subagent or script run is unattended: nobody is watching, so the run never asks
the user questions. If it genuinely needs a person it escalates — this
agent is woken with the run's message and decides what to do. Success is
silent: a subagent run's report is recorded on the invocation (`summary`),
not announced.


### Script actions

The script body is a self-contained JavaScript block. It runs the way your
own executed code runs, with the same callback catalog minus the callbacks
that need a person: asking the user questions, proposing project tasks,
flows that raise an approval card, and `proposeRoutine`, `updateRoutine`,
and `runRoutineNow` (a script never creates, edits, or triggers routines).
`listRoutines`, `getRoutine`, and `deleteRoutine` stay available. Nothing
runs a model during the run: what the script does not do, nobody does.

- Callbacks and background jobs work as in your own executed code, including
  starting several jobs and awaiting them together. Anything still pending
  when the run ends is cancelled, so await what you start.
- `await wakeAgent({message})` escalates. Return right after calling it: the
  run ends `"escalated"` and this agent runs a turn on the message, under the
  routine's budget and attribution. At most one call per run — a second call
  throws. A throw after the wake records the run `"failed"` with the message
  attached and not delivered.
- A clean exit is silent: the run records `"succeeded"` and nothing else
  happens — no turn, no message.
- An uncaught throw records `"failed"` with the error in `errorSummary`. It
  does not wake this agent; read `lastInvocation` to see it.
- Runs are stateless: no variables, notebook, or in-flight work carry from
  one run to the next. Keep cursors and watermarks in a file or database the
  script reads back.
- Runs are bounded: 10 minutes of wall clock and 500 resolved callback
  calls. Exceeding either records `"failed"`.
- A connector write that would need approval fails as a catchable error
  instead of waiting on a card. Catch it and `wakeAgent` when a person must
  decide, or let the throw record the failure; the approval then happens in
  the conversation.

Reserve `wakeAgent` for outcomes a person should see: check the condition,
escalate only when it is met, and let every other run exit cleanly. Choose
a **script** for mechanical work that needs no judgment until a condition
is met; a **message** when the work needs the conversation's history or
its result belongs in the chat every time.


## Routines That Need Connector Access

A fired run is unattended: it cannot complete OAuth, fix a missing
connection, or wait on an approval card. So when a routine's action will
call a connector (Gmail, Slack, Notion, etc.), sort out access **before**
the routine first fires:

First follow the creation preflight below. Do not inspect or set up connectors
until it returns `authorized`.

- Make sure every connector the action needs is already connected and
  authorized. Check the connector's status and request any missing access
  through the usual integration flow (see the `integrations` skill) before
  or alongside proposing the routine.
- Connector calls that require approval interrupt the run, and a fired
  run cannot wait on an approval card. You cannot read a connector's
  permission mode, so when the action writes (sends email, posts
  messages), offer to perform one representative write now, while the
  user is present — the user scheduled the side effect for later, so
  never write during setup unless they agree, and preview the content in
  chat first as usual. Tell the user **before** issuing the call: the
  approval card (and this conversation's Integrations panel) offers the
  connector's permission modes — **Always allow** lets the routine run
  without interruption, **Decide for me** (the `auto` mode) still asks
  when a call looks risky, and **Always ask** raises a card on every
  call and blocks every unattended run. Say it up
  front because you may never see the card: an approved call just
  returns results — only a declined call or a `waiting_for_approval`
  outcome tells you one was raised. Leave the choice to them; the
  workspace limit may cap which modes are offered.

## Available Functions

All functions live on the standard callback interface. Routine objects returned
by `getRoutine` and `listRoutines` have this full shape; update/delete return
the same object without `lastInvocation`. `proposeRoutine` returns no routine —
only `{approvalRequest}` (see its section):

- `routineId` (str): stable id, minted when the routine is created
- `title` (str), `description` (str)
- `cron` (str): 5-field cron expression
- `timezone` (str): IANA timezone the cron is evaluated in
- `enabled` (bool): disabled routines are kept but never fire
- `action` (dict | None): the routine's action (see Routine Actions)
- `nextFireAt` (str | None): ISO timestamp of the next scheduled fire;
  the run may start a little before or after this moment
- `lastInvocation` (dict | None): latest run — `invocationId`,
  `triggerType` (`"cron"` | `"manual"`), `status` (`"queued"`,
  `"running"`, `"succeeded"`, `"failed"`, `"escalated"`,
  `"skipped_overlap"`, `"skipped_disabled"`, `"superseded"`),
  `queuedAt`, `startedAt` (str | None), `completedAt` (str | None),
  `errorSummary` (str | None — why a failed run failed, including a
  script's thrown error or exceeded bound), `summary` (str | None — a succeeded
  subagent run's report). Only `getRoutine` and
  `listRoutines` return it; update/delete responses carry the
  routine definition without run history.

### checkRoutineAccess()

For each routine creation request, call `checkRoutineAccess()` before doing any
creation work. Do this before asking schedule or timezone questions, checking
integrations, performing representative setup calls, or calling
`proposeRoutine`. Do not use cron, sleep, or another delayed mechanism to bypass
this preflight.

The callback returns
`{access: "authorized" | "requires_upgrade" | "unavailable"}`. Read its
`access` field and handle it as follows:

- `authorized` — continue with creation setup and proposal.
- `requires_upgrade` — stop. Explain in text that creating routines requires a
  paid plan and ask the user to upgrade their Replit plan.
  Do not open checkout or show an upgrade card.
- `unavailable` — stop with actionable, non-upgrade guidance: ask the user to
  verify their workspace access or try again later. Do not suggest upgrading.

This preflight applies only to creation. Listing, inspecting, updating,
deleting, and manually running existing routines are unchanged.

### proposeRoutine(title, description, cron, timezone?, enabled, action, approvedSchedule, routineInvocationBudget?)

Proposes a routine for the user to approve. The call returns
`{approvalRequest}` immediately — the routine does **not** exist yet. The user
sees an approval card with the title, instructions, schedule, and budget (for
a script action, the description stands in for the instructions; the script
body is not shown or editable). They
can edit these values before accepting. You are told the outcome as a follow-up
message. Do not call `proposeRoutine` again while approval is pending. If the
user accepts edits, follow the response instructions and call `proposeRoutine`
once with the revised values. Never re-propose a declined routine unless the
user asks.

Propose the schedule the user asked for. If their requested cadence is below
the 60-minute minimum, do not propose yet: tell them the minimum and let them
pick the cadence first.

If the user does not specify a timezone, omit `timezone` so the routine uses
the sender timezone from the current system reminder. If the user specifies a
timezone, pass its IANA name. Ask which timezone to use only when no sender
timezone is available.

The `description` is required but stays internal. Write one or two sentences on
what the routine is for. The action's `message` is the instruction that runs
when the routine fires. Make it complete and self-contained. Do not put schedule
or timing details in `message`; use `cron` and `timezone` for scheduling.
For a script action, the `script` is the code
that runs; the `description` is what the user approves, so make it say plainly
what the script does and when it will wake you.

Do not pin periodic routines to the start of an hour or day, or to another
common clock time, unless the user asks for that time. If the user specifies no
time, anchor the cron schedule to the current time in the sender timezone:
read the clock in the execution environment and convert it to the sender
timezone from the system reminder. Round the anchored minute down to the
previous multiple of 10, so 2:17 PM anchors to minute 10 and 2:53 PM anchors
to minute 50. An anchor that lands on the hour is fine: rounding spreads
anchors evenly, which pinning to a common clock time does not. Always use a
time the user specifies exactly. When the user omits a time, do not ask for,
suggest, or recommend one; continue with the rounded current-time anchor.

Set `approvedSchedule` to a natural-language description of `cron` and
`timezone` that includes the time, such as "Every hour at :10" or "Every day
at 2:10 PM". After the user edits a proposal, copy the approved Schedule text
exactly. The approval token only authorizes that exact schedule text.

### updateRoutine(routineId, title, description, cron, timezone, enabled, action)

Replaces the full definition of an existing routine and returns `{routine}`.
Partial edits are not supported: fetch the routine first and send every field
back, changing only what the user asked for. Unknown `routineId` is an error —
an edit can never create a routine. Edits always win for fires that have not
started yet: a pending fire runs the updated definition, while a run already
in progress finishes on the definition it started with.

### listRoutines()

Returns `{routines}` — every routine with its latest invocation.

### getRoutine(routineId)

Returns `{routine}` for one routine. Unknown `routineId` is an error.

### deleteRoutine(routineId)

Returns `{deleted, routine}`. Deleting an unknown id returns
`{deleted: false, routine: None}` rather than an error. Deleting a routine also
cancels its pending fires and stops a subagent run still in flight.

### runRoutineNow(routineId)

Triggers the routine immediately without changing its cron schedule and returns
`{invocation}` with status `"queued"`. The action runs after the
current turn, so the result is not visible in this turn. If another run of
the routine is still in flight when it would start, it is skipped as
`"skipped_overlap"`. Manual runs work while a routine is disabled and do not
resume its schedule. Inside a turn that a routine started (or a subagent it
spawned), `runRoutineNow` is not available for any routine — routines cannot
trigger routines.

## Limits and Behavior

- At most **20 routines** per agent; delete one before adding more.
- The workspace also caps **active (enabled) routines across all of its
  chats** (the limit depends on the plan). Disabled routines don't count.
  When the workspace is at its cap, creating an enabled routine or
  enabling a disabled one is rejected even though this agent is under its
  own cap; the user must pause or delete a routine somewhere in the
  workspace first.

- A script body is capped at **64KB**. A script run is capped at **10
  minutes** and **500 resolved callback calls**; exceeding either records the
  run `"failed"`.

- Cron schedules must be **at least 60 minutes apart on the schedule**. This
  is checked when the routine is saved (over the next few fires, so "every
  minute during one hour" shapes are also rejected) and enforced again at run
  time between scheduled occurrences; manual runs don't count against it.
- Runs do not start at the exact scheduled moment: each fire may begin a
  little **before or after** its scheduled time, so two actual run starts can
  occasionally sit closer together than the scheduled 60-minute minimum.
  Never promise the user an exact start time, and don't treat a slightly
  early, late, or close-together run as an error.
- If a routine fires while its previous run is still going, the new fire is
  **skipped** (`skipped_overlap`) and the schedule advances normally.
- A schedule that was overdue while the agent was dormant fires **once**,
  never a catch-up burst.
- Routines survive checkpoint reverts and conversation resets; they are removed
  only by `deleteRoutine` or clearing the agent's context.
- Moving the conversation into a project (`transitionToProject`) also deletes
  every routine, permanently. Do not propose that move while routines exist;
  offer `createNewProject` instead.

## Testing a Routine on Request

Never run a freshly created routine unprompted — `runRoutineNow` performs
the routine's real work, which the user scheduled for later. Only when the user
explicitly asks to test or trigger it:

1. Call `runRoutineNow(routineId)` and note the `invocationId`.
2. In a later turn (or when the user next asks), check
   `getRoutine(routineId).routine.lastInvocation` — a `"failed"` status with
   an `errorSummary` means the routine's message needs rewording, or the
   script threw or exceeded a bound.

## Writing Good Routine Actions

A fired message routine runs as its own turn on this agent, with the agent's
memory — including the recent conversation — available as context. It does not
interrupt other work and never sees messages still waiting in the queue.
A fired subagent routine sees **none** of the conversation. In both cases,
write the instruction as complete and self-contained — what to do, where to
put results, and how to tell the user (e.g. "summarize X and post the result
in the conversation") — because by the time it fires, the conversation may
have moved far past today's context.
A fired script sees none of the conversation
either and cannot ask: write it to work from what it can read at run time, and
put everything a person needs to act into the `wakeAgent` message.
