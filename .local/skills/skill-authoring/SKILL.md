---
name: skill-authoring
description: Create or improve reusable skills. Use when the user asks to create a skill, teach you something reusable, or save instructions for future tasks.
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

**Does it survive leaving this project?** A saved skill travels into the user's
other projects and, when shared, into colleagues' sessions on codebases you will
never see. Write for that reader and test against them.

- Fails: our API runs on :8080. True here, false everywhere it lands.
- Passes: when a dev server sits behind a proxy, HMR needs the client port set
  explicitly or it fails silently — with the symptom to recognise it by.

The second test is why the bar is higher than "useful". A memory that is wrong
costs one session. A shared skill that is wrong costs everyone who loads it, in
projects where nobody can see why it was ever true.

Observations still deserve to be written down — put them in `.agents/memory/`,
or in `replit.md` when they belong to the project's own documentation. Dressing
one up as a skill buries a fact inside a procedure nobody needs, and it is the
fastest way to make the library not worth reading.

## Check what already exists

- User asks to "create a skill" or "teach you how to do X"
- User wants to save instructions for repeated future use
- A workflow should be reusable across sessions

- **One covers this.** Improve it rather than creating a near-duplicate with a
  slightly different name — two skills for one job means the next session
  reads both and trusts neither. Copy the existing skill into
  `.agents/skills/<same-name>/`, make your change, and propose it (below). The
  card shows the user a diff against the published version and, on approval,
  the published version is replaced.
- **One is close but for a different situation.** Write a new one and make the
  two descriptions say which to use when.
- **Nothing does.** Write it.

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

- `name`: max 64 chars, lowercase letters, numbers and hyphens
- `description`: max 1024 chars. This is the only line a future session reads
  before deciding whether to open the skill, so write it as the answer to
  "when would I need this?" — what it does and when to use it, not a title.
  Bad: `Processes documents`. Good: `Extracts text and images from PDF files.
  Use when the user asks to read, parse, or convert PDF documents.`


## Writing tips

- **Be concise**: only include what a capable engineer would not already know.
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

```markdown
---
name: pr-review
description: Reviews pull requests for code quality and security. Use when the user asks to review a PR or check code changes.
---

# PR Review

## Process

1. Read the PR description and linked issues
2. Review each file for issues
3. Check for test coverage
4. Look for security vulnerabilities
5. Summarize findings with line references

## What to Check

- Logic errors and edge cases
- Security issues (injection, XSS, auth bypass)
- Performance concerns
- Missing error handling

## Output Format

\`\`\`markdown
## Summary
[1-2 sentence overview]

## Issues Found
- **[severity]** file:line - description

## Verdict
[Approve / Request Changes / Comment]
\`\`\`
```
