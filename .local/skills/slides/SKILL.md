---
name: slides
description: Instructions for building, editing, importing, and exporting slide deck artifacts in the Replit workspace. Use this skill when the user asks for slides, a presentation, a pitch deck, a slide deck, or any slide-based content; when the user attaches or imports a .pptx file; or when the user asks to export, download, or save their slides as PPTX or PDF. For a NEW deck, read this skill BEFORE creating the slides artifact -- it runs the pre-generation questions (deck length, visual style, content outline) and says when to create the artifact. Covers the manifest contract, slide component conventions, visual editing compatibility, PPTX import, PPTX/PDF export, and design guidance for creating presentations.
---

# Slides -- Presentation Decks in Code

This skill drives the slides flow end to end: PPTX import, export, and -- for NEW decks -- the pre-generation questions that must be settled BEFORE the slides artifact is created. The build-time rules live in `./references/legacy-building.md` and `./references/design-principles.md`; both are injected automatically when the artifact is created.

Only Legacy slides is available. Do not offer or author Slides 2.0, even if requested.

## PPTX Import -- Handle First

**Trigger:** any attachment ending in `.pptx`, or a request to import/convert/open an existing presentation. No interpretation -- `.pptx` attached means import.

**First action:** if no slides artifact exists, scaffold a bare destination (no template styling, no sample slides), then call `importPptx({ filePath: "attached_assets/<filename>.pptx" })`; if one exists, call `importPptx` first. Make one import call per attached `.pptx`.

For that import scaffold, call `createArtifact` with `artifactType: "slides"`. Do not ask count, style, or outline questions. Keep the existing import routing and follow the callback result.

**Do NOT, before importing:** ask clarifying questions, run brand research (`extractBranding`/`webFetch`/`imageSearch`/`webSearch`), generate images, apply a template, or write any slide JSX from scratch. Mixed requests ("import this and tweak X") still import first, then handle the edit on the imported slides.

The goal is near 1:1 fidelity -- the import returns finished components; do not redesign them. Adaptation ("use this as inspiration") is the only exception.

Read `./references/importing.md` **before** doing anything else with the imported files: staging-directory layout, the copy / normalize / manifest workflow, and the adaptation path.

## Exporting Slides (PPTX, PDF)

When the user asks to export, download, or share their slides as a PPTX/PDF or otherwise requests a downloadable file, call `exportSlides({ format: "pptx" | "pdf", presentationName?, artifactDirName? })`, then hand `result.filePath` to `presentAsset` with a clean human-readable title (e.g. `"My Deck (PDF)"`) so the user gets a chat card and a Library file. Never tell the user to click an export button or download from the preview pane instead. Saving the deck to the workspace, as a template, or for reuse is NOT an export; see "Saving a Deck as a Workspace Template" below.

**Export once.** An export request is a one-time deliverable: one `exportSlides` + `presentAsset` pair per requested format, after the deck is finished. Later edit turns update the deck and call `presentArtifact`; they do not re-export or call `presentAsset` again unless the user asks for a new file in that message. See `./references/exporting.md` for why, and for flagging stale files.

Read `./references/exporting.md` **before** calling `exportSlides`, and `./references/export-failures.md` **only when** it returns `success: false` or the user reports a failed UI-button export.

## Saving a Deck as a Workspace Template

When the user asks to save the deck as a template (to their Replit workspace, "for the team", or for reuse on future decks), follow `./references/saving-template.md` (the `prepare-artifact-template` skill, then `saveArtifactAsTemplate`). Never claim the template is saved without calling it; there is no other save path from chat.

## Template Selection and Pre-Generation Flow

For a NEW slide deck, run this flow BEFORE creating the slides artifact: ask for any direction the user hasn't given before anything else. Do not scaffold, research, outline, or write files first -- `createArtifact` comes only at the end of this flow (see "Create the artifact only when ready to build"). This is required.

### Ask only for missing direction

First determine which answers the prompt or conversation already supplied, judging each independently:

- **Count**: A slide count, deck length, or per-slide outline settles length. A topic or audience does not. Do not choose a count yourself to skip the question.
- **Template**: A named, saved, or attached template, or an explicit style direction, settles visual style. A topic, audience, count, or content outline alone does not.

If every answer is already supplied, skip the callback. Otherwise, call `requestSlideStyleDirection` once as a CodeExecution callback with only the unanswered questions enabled. Do not split these into separate tool calls.

Before calling it, read `./references/style-direction.md` for the arguments, examples, and result handling. It returns final answers, `answered` or `defaulted` (Standard length, Auto theme). Continue with the returned `answers`; do not re-ask or wait for another message.

Skip these questions for existing-deck edits, imports/conversions, or an explicit request to skip them.  Keep the content outline review as a separate later step. Do not outline, create the artifact, or build until the requested direction is settled.

### Using the Selected Template

Once the visual style is settled, read `./references/using-templates.md` before drafting the outline or writing slide files. It covers built-in, saved workspace (`useArtifactTemplate`), and attached templates, and the Auto, Professional, and blank-theme paths. Order of operations stays in `<first_build>`.

### Required: Content Outline Review (new decks only)

For every new slide deck, call `proposeSlideContent` with a concrete content outline and wait for the user's confirmation before writing any slide files, unless one of the skip cases below applies. A short prompt like "a deck about coffee" is not a skip case -- that's when the outline matters most, since the user hasn't said what each slide should say.

The outline IS the deck's content: each entry carries the exact `headline` and `body` copy for that slide, not a description of it. Before calling `proposeSlideContent`, read `./references/content-outline.md` (body format, `Image:` notes, example call, research-first rule). **Do not fabricate stats, revenue numbers, dates, or company specifics in the outline**; once the user confirms it, the outline is canonical copy.

Wait for the user's response. If they request changes, incorporate them. Then create the artifact and build (see `<first_build>` below).

### Skip conditions

Skip the content outline review and proceed directly to building only when the user is editing an existing deck; importing/converting an existing file (for `.pptx`, "Handle First" is required); already supplied per-slide content (a slide-by-slide outline, or a script, doc, or prompt copy that maps onto specific slides); or explicitly opts out ("just build it", "skip the outline"). `./references/content-outline.md` spells out each case.

A topic, brand, audience, or slide count alone is never a skip case; when unsure, run the review.

### Create the artifact only when ready to build

For a NEW deck, do not call `createArtifact` while any pre-generation question is unresolved. Create the slides artifact only once deck length, visual style, and the content outline are all settled -- each either answered by the user, already given, or skipped per its skip conditions. If the user opted out of all questions ("just build it"), create it right away.

Call `createArtifact({ artifactType: "slides", ... })` (see the `artifacts` skill); it scaffolds the deck and injects the configured skill references and initial files. If only a redirect is in context, read its target before writing slide files. Do not reread files already in context.

<clarifying_questions>
**`.pptx` attached: ask nothing; go straight to `importPptx` ("PPTX Import -- Handle First").**

Deck length and visual style are governed only by "Template Selection and Pre-Generation Flow" and its skips: ask through one `requestSlideStyleDirection` callback (count-only uses `askTemplate: false`), never via the ambiguity test below.

For other details -- **audience**, **tone**, **brand or company** (named company, attached logo, linked website), and **content topic** (explicit vs. vague) -- do not re-ask what the user already gave. Ask only if genuinely ambiguous and material to the deck; otherwise infer audience from topic and commit to an aesthetic that fits the subject. These questions never replace the Content Outline Review.
</clarifying_questions>

<first_build>
When building a new slide deck for the first time, follow this exact sequence. Steps 0--3 happen BEFORE the slides artifact exists -- do not create it early:

0. **Resolve pre-generation direction** -- run "Template Selection and Pre-Generation Flow" (one combined callback for missing answers, plus its skip conditions) before outlining or building.
1. **Research brand** (real companies only): **Skip this step entirely if the user already supplied the brand source of truth** -- attached brand guide, exact hex codes, approved fonts, design system file, sibling artifact CSS, etc. Use what they gave you. Otherwise read `./references/research.md` first and use the Firecrawl-backed tools in order: `extractBranding` -- `webFetch` on official pages -- `webSearch` only as a last resort.
2. **Verify content** (real-company / data-driven decks only): If the deck will make verifiable claims (real revenue, headcount, market data, product facts, dates), gather those facts now, following "Content verification" in `./references/research.md`. Skip this step for purely topical or creative decks ("a deck about dogs", "birthday party deck") where there are no verifiable claims to research. **Do not fabricate stats, revenue numbers, dates, or company specifics.** Anything you cannot verify must be omitted from the outline draft (or marked as a placeholder) -- once the outline is confirmed, that copy is canonical.
3. **Run the Content Outline Review** -- only after length and style are known, call `proposeSlideContent` with a concise outline, using only verified facts from steps 1--2, and wait for the user's response before any of the steps below. This reviews content only; never use it to ask for length or style. Skip only per "Skip conditions" above.
4. **Create the slides artifact** -- see "Create the artifact only when ready to build" above; this is the first step that touches the workspace.
5. **Delegate the build to a design subagent.** Follow `./references/design-subagent.md`: start `subagent({ name: "slides-design-<slug>", task, config: { $kind: "design", outputDir: "artifacts/<slug>", relevantSkills } })` without awaiting it, restart the deck's workflow once the install finishes, and never write or edit slide files yourself. It does the rest of this step, step 6, and visual QA; then continue at step 7.
6. **Run validation**: `pnpm run --filter @workspace/<slug> validate-slides`. It applies and reports only unambiguous structural repairs before validating. Use `pnpm run --filter @workspace/<slug> validate-slides -- --check` only when you need a report without file changes. Fix every error and rerun until it passes -- a deck with outstanding errors is not done and must not be presented.
7. **Restart workflow**.
8. **Take the cover screenshot** -- one `screenshot` call with `source: { "type": "appPreview", "artifactDirName": "<deck dir>", "path": "/slide1" }`. It becomes the deck's cover on the home screen and saved templates, and confirms the deck renders. Do not screenshot the other slides. Take it after validation and the visual QA pass; if slide 1 or the deck-wide theme changes afterward for any reason, retake it after the fix -- the newest screenshot is the stored cover.

**First-pass call budget.** Steps 4--8 are five tool calls when the initial validation passes, plus one read of `./references/legacy-visual-qa.md` before the cover shot. Batch every independent action; `./references/build-batch.md` lists what adds calls.

Apart from the restart during the build in step 5, do NOT restart workflow until all slides are written. Do NOT read files you just scaffolded -- they are already in your context.
A quick seamless build is what you are aiming for. Use an exact slide count from the prompt or the form's "Exact number of slides" box; for a picked length range, choose a count inside it. If the length question was skipped (opt-out, edit, or import) or left blank, default to around 6 -- don't go longer unless asked.
Do not screenshot-iterate during the build -- `validate-slides` is your layout QA loop, and you have two priorities: speed and design. `./references/build-batch.md` lists the only screenshots a first build takes.
</first_build>

## Building and editing decks

For an existing deck, infer its format from `src/data/slides-manifest.json`, not a new version selection. Entries with `kind: "sdm"` are SDM; JSX entries are legacy. Preserve each entry's format when editing a mixed deck. When adding slides to an existing deck, or applying a saved template to one, use the format of the deck's last manifest entry. Author legacy only. If an edit requires SDM authoring, explain that Slides 2.0 is unavailable; do not convert the deck or bypass eligibility.

The build-time rules (artifact, manifest, and workspace export contracts, planning, layout, typography, hard constraints) live in `./references/legacy-building.md` and `./references/design-principles.md`. Before writing slide files, read any reference that is missing from context. A redirect does not contain the build contract. Do not reread references already in context.

Send edits to an existing deck to a design subagent per `./references/design-subagent.md`, then present. After an edit session that changed slide 1 or the deck-wide theme, retake the cover screenshot (step 8 of `<first_build>`) so the deck's cover stays current. If you are unsure the deck ever had a cover (older decks), take one.
