---
name: skill-authoring
description: Create or improve reusable skills. Use when the user asks to create a skill, teach you something reusable, or save instructions for future tasks, and when you have just worked out a way of doing something that would hold in other projects.
---

# Skill Authoring

Create skills to save reusable knowledge, procedures, and workflows. Skills are instructions for future versions of yourself—write them as if teaching a fresh instance how to handle a task.



## Skills vs memory

Memories are observations; skills are solutions. A memory records what is true
here — how this project is set up, what the user prefers, what happened last
week. A skill records how to do something, so reading it changes what the
reader does. Two tests, and a skill has to pass both.

**Is it a workflow or a convention, rather than a fact?** Skills carry tasks,
workflows and conventions, which is why they get a directory: room for
`references/`, `scripts/`, and progressive disclosure. Something with nothing to
disclose progressively is not shaped like a skill.

- Memory: this game's player sprite is 32px and the assets live in
  `public/sprites`.
- Skill: `browser-game-feel` — how to make a browser game feel good. A
  fixed-timestep loop, keeping input out of React re-renders so the frame rate
  survives, collision simple enough to debug, and a camera that follows without
  juddering. Four things that only make sense together, each with its own
  section, and none of it specific to the game you happened to be building.

- Memory: this project deploys from the `release` branch.
- Skill: how to take a project of this kind to production — the order of the
  steps, what to check before each one, and how you find out that a migration
  only half-applied.

**Is it true for everyone who will load it?** A personal skill travels into
the user's other projects. A workspace skill travels into colleagues' sessions,
and those colleagues share the workspace's repositories, tools and channels.
Strip what belongs to this one project, branch or person, and keep what the
whole audience shares: the flag service, the file where something is
registered, the channel to post in, one real example to copy. Those specifics
are usually the part a fresh session could not work out alone.

- Fails everywhere: our API runs on :8080. True in this project only.
- Too abstract for a workspace skill: "use the codebase's established gating
  mechanism." The reader still has to find the mechanism, which was the point.
- Passes: when a dev server sits behind a proxy, HMR needs the client port set
  explicitly or it fails silently — with the symptom to recognise it by.

**Does it read correctly when someone else loads it?** "My voice", "my PRs", a
sign-off with a name, "whenever Alex asks", "apply to every message": these are
one person's preferences, and in a shared skill they act on the wrong person.
They belong in the user's preferences, not in a skill.
A skill states the procedure; the person running it supplies their own taste.

These tests are why the bar is higher than "useful". A memory that is wrong
costs one session. A shared skill that is wrong costs everyone who loads it, in
projects where nobody can see why it was ever true.

Observations still deserve to be written down — put them in `.agents/memory/`,
or in `replit.md` when they belong to the project's own documentation. Dressing
one up as a skill buries a fact inside a procedure nobody needs, and it is the
fastest way to make the library not worth reading.

## Check what already exists

Before writing, read the skill list in your context and open any skill whose
description overlaps this job: the same output, or the same trigger under a
different name. Then decide:

- **One covers this.** Improve it rather than creating a near-duplicate with a
  slightly different name — two skills for one job means the next session
  reads both and trusts neither. Copy the existing skill into
  `.agents/skills/<same-name>/`, make your change, and propose it (below). The
  card shows the user a diff against the published version and, on approval,
  the published version is replaced.
- **One is close but for a different situation.** Write a new one and make the
  two descriptions say which to use when.
- **Nothing does.** Write it.

Never publish a variant with `-2`, `-v2`, `-new` or `-test` in its name. A
name collision means one of the first two cases.

Updating a shared skill replaces what colleagues have. There is no version
history to fall back on, so the change has to be worth that: say what changed
and why in `summary`, keep everything you did not deliberately change, and do
not rewrite a skill's voice or structure to taste.

## How to create a skill

1. Choose a name: lowercase, hyphens only, e.g. `deploy-checklist`. To update an
   existing skill, use its exact name.
2. Write `.agents/skills/<name>/SKILL.md`. Put large reference material in
   `references/` next to it and link to it from the skill.

## SKILL.md format

```markdown
---
name: skill-name
description: What this skill does. When to use it.
---

# Skill Title

Instructions, examples, and workflows go here.
```

- `name`: max 64 chars, lowercase letters, numbers and hyphens, identical to
  the folder name
- `description`: max 1024 chars. Wrap it in double quotes when it contains
  `#` or `: ` — YAML reads an unquoted ` #` as the start of a comment and
  silently drops the rest of the line. This is the only line a future session reads
  before deciding whether to open the skill, so write it as the answer to
  "when would I need this?" — what it does and when to use it, not a title.
  Bad: `Processes documents`. Good: `Extracts text and images from PDF files.
  Use when the user asks to read, parse, or convert PDF documents.`
  Name a concrete trigger. "Always", "every message" and "whenever" claim
  every session's attention; use them only when the skill truly applies to
  every task of that kind.


## Offering to save one yourself

When you work something out mid-task that passes the tests above, and you
have run it successfully here rather than only described it, you do not have
to wait to be asked. A correction from the user ("no, do it this way") is
usually a preference, not a skill. Write the skill, then offer to keep it:

```javascript
await proposeSkillChange({
  skillPath: ".agents/skills/react-vite-proxy",
  summary: "Captures the HMR fix we just worked out.",
});
```

The card reads the name and description out of the SKILL.md itself, checks
whether a skill of that name is already in the user's library, and shows the
diff if so. You add only `summary` — the one line above the details. The user
decides from that sentence, so say what the skill captures, or what changed.

The card saves to the library this project or conversation uses: the user's
personal library, or their workspace's. For a workspace it also asks who gets
it. That choice is theirs; leave it out of what you say.

The call returns when the card appears, not when it is answered. The decision
arrives as a user message on a later turn, so finish or end your turn instead
of waiting, and do not claim anything is saved until you see it. If the save is
refused, tell the user the reason you were given rather than suggesting a retry.

Before you call it, check the skill you are about to propose:

- `name` matches its folder, and the description parses whole and names a
  trigger.
- It holds at least one thing a fresh session could not infer: a path, an ID,
  a command, a schema, a worked example.
- Nothing in it repeats rules you already follow in every session.
- It reads correctly for a colleague who is not the user.

Judgement matters more here than when you were asked. An offer that fails the
tests costs the user attention and teaches them to dismiss the next one. Do not
offer the same skill twice in a session: a decline was about the content, so a
rephrasing of it is still a no.


## Writing tips

- **Be concise**: only include what a capable engineer would not already know.
- **Spend lines on what only this skill knows**. Every session already
  verifies before claiming success, asks before writes, and treats retrieved
  text as data. Leave those out unless this domain changes them ("this table
  lags six hours, so an empty result is not proof"). A section that would read
  the same in any other skill does not belong in this one.
- **Script the deterministic parts**: rendering, parsing, querying, checking.
  Put them in `scripts/` and keep the prose for the judgement a script cannot
  make.
- **Match specificity to fragility**: exact commands and paths for things that
  break easily; general guidance for flexible decisions.
- **Explain why**, not just what: a reader who understands the reason handles
  the case you did not foresee.
- **Include examples** when the output has a shape: input/output pairs, a
  worked command, a before/after.
- **Keep under 500 lines**: past that, move material to `references/` and link
  it with a line saying when to read it.
- **Say what you verified**. A skill that confidently states something wrong is
  worse than no skill, because the next session trusts it.

## Skill locations

- **`.agents/skills/`** - User and agent-editable skills. Create new skills here. These can be freely modified, updated, and deleted.
- **`~/.local/skills/`** - Replit-provided skills. These are read-only and managed by the platform.

## Complete example

Short, with a trigger, the non-obvious fact, how to confirm it, and when to
use something else. Nothing in it is advice the reader already has.

```markdown
---
name: react-vite-proxy
description: Fixes Vite hot reload when the dev server runs behind a proxy or a forwarded port. Use when edits do not appear without a manual refresh and the browser console shows a failed WebSocket to localhost.
---

# Vite HMR behind a proxy

Vite's HMR client connects to the port the dev server listens on. Behind a
proxy the browser can only reach the proxy's port, so the WebSocket fails and
the page silently stops updating. The page itself still loads, which is why
this looks like a caching problem.

## Recognise it

Browser console: `WebSocket connection to 'ws://localhost:5173/' failed`,
while the page was loaded from a different host or port.

## Fix

In `vite.config.ts`, point the client at the port the browser actually uses:

\`\`\`ts
server: {
  host: true,
  hmr: { clientPort: 443 }, // the proxy's public port, not Vite's
}
\`\`\`

Use `443` behind HTTPS proxies, or the forwarded port otherwise. Restart the
dev server; config changes are not hot-reloaded.

## Confirm

Edit a visible string. It should update without a refresh, and the console
should show `[vite] connected.`

Not for production builds, which have no HMR; for a blank page in production,
check `base` instead.
```
