---
name: slides
description: Instructions for building, editing, importing, and exporting slide deck artifacts in the Replit workspace. Use this skill when the user asks for slides, a presentation, a pitch deck, a slide deck, or any slide-based content; when the user attaches or imports a .pptx file; or when the user asks to export, download, or save their slides as PPTX or PDF. For a NEW deck, read this skill BEFORE creating the slides artifact -- it runs the pre-generation questions (deck length, visual style, content outline) and says when to create the artifact. Covers the manifest contract, slide component conventions, visual editing compatibility, PPTX import, PPTX/PDF export, and design guidance for creating presentations.
---

# Slides -- Presentation Decks in Code

This skill drives the slides flow end to end: PPTX import, export, and -- for NEW decks -- the pre-generation questions that must be settled BEFORE the slides artifact is created. The build-time rules depend on the deck's format and are injected automatically when the artifact is created.

Slides 2.0 is the only version for new decks. Do not offer Legacy slides or ask which version to build. If the user asks for legacy or old-style slides, say new decks are built with Slides 2.0 and continue with Slides 2.0. Existing legacy decks stay legacy; see the existing-deck rules below.

| Selected version | `slideFormat` | Build reference | Principles reference | Visual QA reference |
| --- | --- | --- | --- | --- |
| Slides 2.0 | `"sdm"` | `.local/skills/slides/references/sdm-building.md` | `.local/skills/slides/references/sdm-principles.md` | `.local/skills/slides/references/sdm-visual-qa.md` |
| Legacy slides | `"legacy"` | `.local/skills/slides/references/legacy-building.md` | `.local/skills/slides/references/design-principles.md` | `.local/skills/slides/references/legacy-visual-qa.md` |

New decks use the Slides 2.0 row. The Legacy slides row applies only when editing an existing legacy deck. Do not apply `sdm-principles.md`, `sdm-design.md`, `sdm-layout.md`, or `professional.md` to Legacy slides, and do not apply `design-principles.md` to Slides 2.0.

Always pass `slideFormat: "sdm"` to `createArtifact` for a new deck. For `requestSlideStyleDirection`, omit `slideFormat` or pass `"sdm"`; the form never asks for a version. A template donor never changes the output format.

## PPTX Import -- Handle First
When the destination is a current slides artifact, `importPptx` imports directly as validated SDM documents. Make the call first, then read `./references/importing.md` before acting on its result. If the running pid2 does not expose direct SDM import, the callback safely falls back to the established JSX staging workflow. Other direct-import failures do not fall back.

**Trigger:** any attachment ending in `.pptx`, or a request to import/convert/open an existing presentation. No interpretation -- `.pptx` attached means import.

**First action:** if no slides artifact exists, scaffold a bare destination first -- no template styling, no sample slides. Then call `importPptx({ filePath: "attached_assets/<filename>.pptx" })`. If a destination already exists, call `importPptx` first. Make one import call per attached `.pptx`.

For that import scaffold, call `createArtifact` with `artifactType: "slides"` and `slideFormat: "sdm"`. Do not ask version, count, style, or outline questions. Keep the existing import routing and follow the callback result.

**Do NOT, before importing:** ask clarifying questions, run brand research (`extractBranding`/`webFetch`/`imageSearch`/`webSearch`), generate images, apply a template, or write any slide JSX from scratch. Mixed requests ("import this and tweak X") still import first, then handle the edit on the imported slides.

The goal is near 1:1 fidelity -- the import returns finished components; do not redesign them. Adaptation ("use this as inspiration") is the only exception and follows the path in `./references/importing.md`.

References:

- ./references/importing.md -- read this **before** doing anything else with the imported files. Staging-directory layout, the full copy / normalize / manifest workflow, and the "adaptation instead of 1:1 import" exception.

## Exporting Slides (PPTX, PDF)

When the user asks to export, download, or share their slides as a PPTX/PDF or otherwise requests a downloadable file, call `exportSlides({ format: "pptx" | "pdf", presentationName?, artifactDirName? })`. A request to save the deck to the Replit workspace, as a template, or for future reuse is NOT an export; follow "Saving a Deck as a Workspace Template" below instead. On export `success`, hand `result.filePath` to `presentAsset` with a clean human-readable title (e.g. `"My Deck (PDF)"`) -- that is what produces the chat card and registers the file in the Library. Never tell the user to "click the export button" or "download from the preview pane" as a substitute for actually producing the file.

**Export once.** An export request is a one-time deliverable, not a standing instruction: one `exportSlides` + `presentAsset` pair per requested format, after the deck is finished. Later edit turns update the deck and call `presentArtifact`; they do not re-export or call `presentAsset` again unless the user asks for a new file in that message. Every `presentAsset` opens the exported file and pulls the user out of the slides editor, so re-exporting on each edit makes their tabs flip between the deck and a PPTX/PDF preview on every turn.

References:

- ./references/exporting.md -- read this **before** calling `exportSlides`. Full callback interface, the `presentAsset` example, the Google Slides redirect, and internal-only implementation notes.
- ./references/export-failures.md -- read this **only when** `exportSlides` returns `success: false`, or when the user reports a failed UI-button export. Per-`errorCode` remedy table, two-attempt cap, and the reproduce-and-diagnose pattern.

## Saving a Deck as a Workspace Template

When the user asks to save the deck as a template (to their Replit workspace, "for the team", or for reuse on future decks), first load and follow the `prepare-artifact-template` skill. Do not start the save until its verification is complete. Then call the `saveArtifactAsTemplate` callback with the slides artifact -- see the `artifact-templates` skill for the full interface and error handling. Never claim the template is saved without calling it; there is no other save path from chat. Saving is asynchronous: on success report that publishing has *started*, not that it is saved. If the result is `NOT_AUTHORIZED`, explain the permission problem in your own words without quoting the raw message or retrying. This is distinct from exporting: export produces a PPTX/PDF file, saving a template makes the deck's style reusable from the theme picker.

## Template Selection and Pre-Generation Flow

When the user asks for a NEW slide deck, run this flow BEFORE creating the slides artifact. Ask the user for any direction they haven't given before doing anything else. Do not scaffold, research, outline, or write files first -- `createArtifact` comes only at the end of this flow (see "Create the artifact only when ready to build"). This is required.

### Ask only for missing direction

First determine which answers the user already supplied in the prompt or conversation. Judge each answer independently:

- **Count**: A slide count, deck length, or per-slide outline settles length. A topic or audience does not. Do not choose a count yourself to skip the question.
- **Template**: A named, saved, or attached template, or an explicit style direction, settles visual style. A topic, audience, count, or content outline alone does not.

If every answer is already supplied, skip the callback. Otherwise, call `requestSlideStyleDirection` once as a CodeExecution callback with only the unanswered questions enabled. Do not split these into separate tool calls. The form shows one stepper in Count -> Template order, omitting answered steps. Progress uses the actual step count (for example, `1/2`, `2/2`; or `1/1`), with one final submit.

The callback arguments are:

| Argument | Meaning |
| --- | --- |
| `slidesTopic` | Required string: a short sentence naming the deck's subject, used to rank templates. |
| `slideFormat` | Optional. Slides 2.0 is the only version, so omit it or pass `"sdm"`; the form never asks for a version. |
| `askDeckLength` | Optional boolean, default `false`. Set `true` only when count/length is missing. |
| `askTemplate` | Optional boolean, default `true`. Set `false` when the user supplied a template or style direction. |

Use the arguments in the matching example with `await requestSlideStyleDirection(...)`:

**No direction supplied**: ask count and template.

```json
{
  "slidesTopic": "A pitch deck for a fintech startup",
  "askDeckLength": true
}
```

**Count already supplied**: ask template only.

```json
{
  "slidesTopic": "An 8-slide pitch deck for a fintech startup"
}
```

**Template already supplied, count missing**: ask count only.

```json
{
  "slidesTopic": "A fintech pitch deck using my saved Acme template",
  "askDeckLength": true,
  "askTemplate": false
}
```

**Style supplied, count missing**: ask count only.

```json
{
  "slidesTopic": "A fintech pitch deck with a blue and white editorial style",
  "askDeckLength": true,
  "askTemplate": false
}
```

Apply the same rules to other combinations. The count step offers Brief (3-6), Standard (7-12), Exhaustive (15-20), and an "Exact number of slides" box.

The callback returns the answers itself: it waits up to 90 seconds for the user to submit the form, then returns `{ outcome: "answered", answers }` with the submitted values. If the user does not answer in time, dismisses the form, or sends a new message instead, the form closes and it returns `{ outcome: "defaulted", reason, answers }` with the defaults filled in (Standard length, Auto theme). Treat both as final: continue to the next step with the returned `answers` and do not re-ask or wait for another message. If the user states a preference later in chat, apply it to the deck then. Length and template are optional. A submitted blank answer means "no preference": use around 6 slides for length or the Auto path for style. Do not re-ask a submitted blank optional answer. 

Skip these questions for existing-deck edits, imports/conversions, or an explicit request to skip them. New decks are always Slides 2.0 (`slideFormat: "sdm"`). Keep the content outline review as a separate later step. Do not outline, create the artifact, or build until the requested direction is settled.

### Using the Selected Template

This section is about *what* to match, not *when* to start. The order of operations for new decks lives in `<first_build>` -- follow that sequence. Do not begin writing slide files from this section; the Content Outline Review still has to happen first.

The picker also offers the user's own saved workspace templates alongside the built-in catalog. If the user picks one, the response identifies it by `workspace_template_slug`. Call `useArtifactTemplate({ query: workspace_template_slug })` to materialize it. Follow the returned instructions instead of steps 1-2 below (steps 3-4 still apply, using the materialized template as the reference). A saved workspace template is a deck the user built or uploaded on purpose to reuse: replicate its slide designs near identically -- clone each template slide's layout, styling, and composition and swap in the new content -- rather than treating it as a loose style guide.
Saved JSX workspace templates remain selectable under "Your legacy templates" as visual/style donors. `useArtifactTemplate` explains how to translate a legacy donor into SDM; the new deck still uses Slides 2.0.


1. **Study the template preview** -- For a selected template, a preview image is injected into your context after the user picks one. This is your primary visual target -- match it as closely as possible.
2. **Read the reference file** -- For Slides 2.0: Read `sdm-templates/<template-id>/template.md` (relative to the skill file; the injected `reference_path` points at it). It names the palette, fonts, and layout patterns, and its folder holds the 4 sample slides as `slide<N>.sdm.yaml` documents. Follow its "Apply this template" steps: `cp` the sample documents into the deck's `src/data/slides/`, register them in the manifest, and edit copy in place. Never retype or re-emit YAML, and do not read the legacy `templates/<template-id>.md` JSX donor for an SDM deck. For Legacy slides: Read `templates/<template-id>.md` (relative to the skill file) for exact hex codes, font choices, layout details, source code for all 4 slides, and design patterns.
3. **Plan Slide 1 fidelity first** -- When you do build (after the Content Outline Review in `<first_build>` step 3), write Slide 1 first to match the reference image as closely as possible. Take a screenshot and compare against the reference image to verify fidelity before extending the patterns to the remaining slides.
4. **Extend patterns to the rest of the deck** -- Maintain consistent styling throughout the deck guided by both the reference images and the text description. Templates only ship with ~4 sample slides and their images, so for any additional slides you'll need to fill in the gaps yourself: source or generate fitting images via `imageSearch` or the `media-generation` skill, and extend the template's layout patterns to cover the remaining content.

The preview image is the ground truth. The text description and source code supplement it with precise values. Follow both as your creative direction, then adapt to the specific content.

For a materialized workspace template, read every available `artifact/src/data/.slide-thumbnails/t-*.jpg` file first as the ground-truth visual reference to reproduce near identically. Inspect its manifest to identify the donor format. For each slide you author, pick the matching template slide and clone its layout -- element positions, palette, fonts, composition, and spacing -- swapping only the content. For Slides 2.0 with a legacy donor, translate that design into SDM YAML, not JSX/Tailwind; the rendered result should still look like the template slide with different content. Convert geometry with `1vw = 19.2` units and `1vh = 10.8` units; convert `Nvw` text to about `N * 9.6pt`. For Legacy slides with an SDM donor, translate the same design into JSX and viewport-relative CSS. Do not copy SDM documents or their manifest entries into a legacy output. Attached templates follow the same donor rules; PPTX attachments still import first.


When the user selected an "Auto" option or left the theme question blank, no preview image is injected. For Slides 2.0, develop the deck's own direction with `<communication>` and `<direction>` in `./references/sdm-principles.md`. The theme answer `Visual theme: Professional` (raw value `auto-professional`) is the signal that loads `./references/professional.md`: read it before planning and follow it for that deck. `Visual theme: Auto` (raw value `auto-creative`) and a blank answer mean you choose the direction from the brief -- including for business, board, investor, or technical subjects, where a restrained system is one available answer among several rather than the default. A subject on its own never switches a deck to the Professional treatment; an explicit user request for one does. For Legacy slides, follow the standard planning process in `./references/design-principles.md` (`<planning>`) to develop an original creative direction.

### Required: Content Outline Review (new decks only)

For every new slide deck, call `proposeSlideContent` with a concrete content outline and wait for the user's confirmation before writing any slide files, unless one of the skip cases below applies. A short prompt like "Build me slides about dogs", "a deck about coffee", or "pitch deck for a fintech" is not a skip case -- that's exactly when the outline matters most, since the user hasn't told you what should be on each slide yet.

The outline IS the content of the deck, slide by slide -- not a summary of it. Each entry must carry the **exact** copy that will appear on that slide: the real `headline` the slide will show, and a `body` containing the actual bullets, stats, and supporting lines for that slide. The user should be able to read the outline top-to-bottom and see precisely what every slide will say. Do not send slide titles only, vague descriptions ("intro slide", "overview of the problem"), or meta-notes about what you plan to put there -- write the literal slide copy.

Format the `body` as a clean, readable list: one bullet per line, each starting with `- `, so it renders as a tidy bullet list. Keep bullets to short phrases or fragments, the way they will read on the slide. For a title or section slide whose body is a single subtitle line, a plain line without a bullet is fine. Do not cram a whole paragraph into one bullet.

Images can make decks feel much more produced, especially creative or personal decks. When a searched or generated image would make a slide stronger, include a brief `Image:` note as its own line in that slide's body describing what the image should show and how it fits the slide.

Send the outline through the callback. Include the actual text content that will appear on each slide, plus any `Image:` notes for searched or generated imagery.

```js
await proposeSlideContent({
  prompt:
    "Here's a draft outline for your deck. Edit anything you'd like, then confirm.",
  slides: [
    {
      headline: "Acme Analytics",
      body: "The fastest way to turn raw events into decisions.",
    },
    {
      headline: "The problem",
      body: "- Teams lose hours stitching dashboards together\n- Insights arrive a week too late to act on\n- Every new question means another data-team ticket\nImage: a cluttered, overwhelming legacy dashboard",
    },
    {
      headline: "Traction",
      body: "- 3x revenue growth over the last two quarters\n- 92% logo retention\n- 40+ teams live in production",
    },
  ],
});
```

**Research first when the deck depends on real facts.** If the deck is about a real company, real product, real industry, or any subject where the slides need verifiable claims (revenue, headcount, market data, product specifics, dates), complete brand research and content/fact verification *before* drafting the outline -- see `<first_build>` steps 1--2 (full research guidance: `<research>` in `./references/sdm-principles.md` for Slides 2.0, or `<planning>` steps 1--2 in `./references/design-principles.md` for Legacy slides). Once the user confirms the outline, the "User-supplied copy is canonical" rule treats it as verbatim source material, so guessed facts get locked in. **Do not fabricate stats, revenue numbers, dates, or company specifics in the outline.** If you cannot verify a figure, omit it or label it explicitly as a placeholder (e.g. "[stat to verify]"). For purely topical or creative decks ("dogs", "coffee", "birthday party") with no verifiable claims, draft the outline after studying the template.

Wait for the user's response. If they request changes, incorporate them. Then create the artifact and build (see `<first_build>` below).

### Skip conditions

Skip the content outline review and proceed directly to building only when one of these is true:

- The user is asking to edit/modify an existing deck, not create a new one.
- The user is importing/converting from an existing file (PPTX, PDF, etc.) -- the source file already defines the content and structure. For `.pptx`, the "Handle First" section is required, not optional.
- The user already supplied per-slide content -- a numbered or bulleted slide-by-slide outline ("Slide 1: Title -- X. Slide 2: Problem -- Y--"), an attached script / talking-points / Google Doc that names what each slide should say, or copy in the prompt that maps cleanly onto specific slides. A topic, a brand, an audience, or a slide count alone is not per-slide content.
- The user explicitly opts out ("just build it", "skip the outline", "no questions, please").

Don't skip just because:

- The prompt is short.
- The user gave you a topic but not per-slide content ("a deck about coffee", "pitch deck for a fintech").
- The user gave you a slide count but not per-slide content ("make me 8 slides on X").
- You feel confident you can fill in sensible defaults -- that's exactly when the outline review is most valuable.

If you're unsure whether the user supplied "enough", err toward running the outline review -- it costs one round-trip and prevents rebuilding a deck that misses the user's intent.

### Create the artifact only when ready to build

For a NEW deck, do not call `createArtifact` while any pre-generation question is unresolved. Create the slides artifact only once deck length, visual style, and the content outline are all settled -- each either answered by the user, already given, or skipped per its skip conditions. If the user opted out of all questions ("just build it"), create it right away with `slideFormat: "sdm"`.

Call `createArtifact({ artifactType: "slides", slideFormat: "sdm", ... })` as described in the `artifacts` skill. The callback scaffolds the deck, registers its workflow, and injects the configured skill references and initial files. If only a redirect is in context, read its target before writing slide files. Do not reread files already in context.

<clarifying_questions>
**If a `.pptx` is attached, do not ask anything -- go straight to `importPptx` per "PPTX Import -- Handle First".**

Deck length and visual style are governed only by "Template Selection and Pre-Generation Flow", including its edit/import/opt-out skips. Ask for missing direction through one `requestSlideStyleDirection` callback, including count-only requests with `askTemplate: false`. Do not apply the ambiguity test below to these questions.

This section governs only short clarifying questions other than deck length and visual style. For those other details, do not re-ask what the user already gave:

- **Audience** ("for the board", "for a sales pitch", "internal team")
- **Tone** ("playful", "corporate", "editorial")
- **Brand or company** (named company, attached logo, linked website)
- **Content topic** (the deck subject -- explicit topic vs. vague hand-wave)

Ask about these only if genuinely ambiguous and the answer would materially change the deck. Otherwise use sensible defaults -- infer audience from topic, and commit to an aesthetic that matches the subject.

This section governs only short clarifying Q&A. It doesn't override the Content Outline Review under "Template Selection and Pre-Generation Flow" -- that step still runs on every new deck unless one of the Skip conditions there applies.
</clarifying_questions>

<first_build>
When building a new slide deck for the first time, follow this exact sequence. Steps 0--3 happen BEFORE the slides artifact exists -- do not create it early:

0. **Resolve pre-generation direction** -- run "Template Selection and Pre-Generation Flow" before outlining or building. It governs the single combined callback for missing count, and template answers, and the skip conditions.
1. **Research brand** (real companies only): **Skip this step entirely if the user already supplied the brand source of truth** -- attached brand guide, exact hex codes, approved fonts, design system file, sibling artifact CSS, etc. Use what they gave you. For Slides 2.0, translate supplied tokens into each document's `theme` with the mapping in `./references/sdm-design.md` -- CSS, Tailwind, and design-system files never style SDM elements directly. Otherwise, for real companies, prefer the Firecrawl-backed tools -- they return real, structured data. The order is: `extractBranding` -- `webFetch` on official pages -- `webSearch` only as a last resort.
   - Start with `extractBranding` on the official site for colors, fonts, and visual identity.
   - Use `webFetch` on the homepage, about page, or key product pages for real company copy and positioning.
   - Only fall back to `webSearch` if neither tool can reach the site (e.g. the company has no public site, or you genuinely cannot find the URL). Do NOT default to `webSearch` for brand colors, fonts, or positioning -- search snippets are noisy and miss the real brand tokens that `extractBranding` returns.
   - `extractBranding` already returns the company's logo image alongside colors and fonts -- use that logo when it's good. `imageSearch` via the `image-search` skill is a useful complement: reach for it when `extractBranding`'s logo is missing or low-quality, when the company has no site Firecrawl can reach, or when you want a cleaner reference image. For non-brand real-world imagery (product shots, team photos, venues), defer to the build phase (step 5 below and the image-sourcing guidance in the selected version's principles reference) -- don't stall the first build crawling for those.
   - If the visual feel of the source site matters, use external-URL `screenshot` for quick visual reference.
2. **Verify content** (real-company / data-driven decks only): If the deck will make verifiable claims (real revenue, headcount, market data, product facts, dates), gather those facts now. Lead with `webFetch` on the company's own pages, then `webSearch` only for facts not on the company's site (batch concurrent queries). The full research guidance lives in `<research>` in `./references/sdm-principles.md` for Slides 2.0 and `<planning>` steps 1--2 in `./references/design-principles.md` for Legacy slides. Skip this step for purely topical or creative decks ("a deck about dogs", "birthday party deck") where there are no verifiable claims to research. **Do not fabricate stats, revenue numbers, dates, or company specifics.** Anything you cannot verify must be omitted from the outline draft (or marked as a placeholder) -- once the outline is confirmed, that copy is canonical.
3. **Run the Content Outline Review** -- only after length and style are known, call `proposeSlideContent` with a concise outline, using only verified facts from steps 1--2, and wait for the user's response before any of the steps below. This reviews content only; never use it to ask for length or style. Skip only for the cases listed in "Skip conditions" under "Template Selection and Pre-Generation Flow".
4. **Create the slides artifact** -- see "Create the artifact only when ready to build" above. This is the first step that touches the workspace; everything before it was questions and research.
5. **Generate images and write every file in a parallel batch.** Slide files only reference image paths, which you choose before the batch, so writes do not need to wait for finished images. You can put every `generateImage` call and every file write in a single parallel tool call. Never one call per file, and never a separate call per image.
For Slides 2.0 (`slideFormat: "sdm"`):

   - `generateImage` for each planned image, with `outputPath` pointing inside the deck's `public/` directory so the documents' asset `src` values resolve.
   - `index.html`: Registry fonts (font table in `./references/sdm-building.md`) load automatically; add Google Fonts links only for families outside the registry, covering every weight any document uses.
   - `index.css`: Leave the scaffold styling intact; CSS variables do not style SDM elements.
   - Each slide document in `src/data/slides/`, using stable slide/element IDs and the same `theme.colors` / `theme.fonts` token maps across the deck. When the user picked a built-in template, `cp` its sample documents first (see "Using the Selected Template") and author only the remaining slides.
   - For uniformly spaced lists, save `lineHeight` and `spaceAfterPt` on every paragraph, including the final item. Enter inherits that formatting. Allow room for trailing spacing in the text frame. Use explicit `spaceAfterPt: 0` only when zero spacing is intentional.
   - Any chart or diagram widget module the deck needs, written to `src/widgets/<Name>.tsx` in this same batch (see `## Chart and diagram widgets` in `./references/sdm-building.md`).
   - `slides-manifest.json` with every entry declared as `kind: "sdm"` and pointing to its matching document.

   For Legacy slides (`slideFormat: "legacy"`):

- `generateImage` for each planned image, with `outputPath` pointing inside the deck's `public/` directory (or `attached_assets/` for `@assets/...` imports).
   - `index.html`: Update Google Fonts links for your chosen display + body fonts.
   - `index.css`: Fill in CSS variables in `:root` with brand palette and font families. Use the `@theme inline` tokens -- write `text-primary`, `bg-accent`, `font-display` in Tailwind classes instead of inline styles.
   - Each slide `.tsx` file in `src/pages/slides/`
   - `slides-manifest.json` with all entries
6. **Run validation**: `pnpm run --filter @workspace/<slug> validate-slides`. It applies and reports only unambiguous structural repairs before validating. Use `pnpm run --filter @workspace/<slug> validate-slides -- --check` only when you need a report without file changes. Fix every error and rerun until it passes -- a deck with outstanding errors is not done and must not be presented.
7. **Restart workflow**.
8. **Take the cover screenshot** -- one `screenshot` call with `source: { "type": "appPreview", "artifactDirName": "<deck dir>", "path": "/slide1" }`. This screenshot becomes the deck's cover image on the home screen and on saved templates -- without it the deck shows a generic placeholder icon -- and it confirms the deck actually renders (no blank screen, no error overlay). Do not screenshot the other slides. Take this shot after validation and the visual QA pass are complete; if slide 1 or the deck-wide theme changes afterward for any reason (a defect the shot itself reveals, a late repair), retake it after the fix -- the stored cover is always the newest screenshot.

**First-pass call budget.** Steps 4--8 are five tool calls when the initial validation passes -- `createArtifact`, the build batch, validation, the restart, and the cover screenshot -- plus one read of the selected version's visual QA reference (Slides 2.0 also takes one content-slide screenshot plus one per widget slide) for the QA pass before that cover shot. If a build reference is missing from context, its required read adds a call before the build batch. A validation failure adds one batched edit and one rerun per repair round; these required corrections take priority over the first-pass budget. A separate call per slide, per image, or per file multiplies the cost of the whole deck -- batch every independent action.

Do NOT restart workflow until all slides are written. Do NOT read files you just scaffolded -- they are already in your context.
A quick seamless build is what you are aiming for. If the user gave you an exact slide count (in their prompt or the "Exact number of slides" box on the `requestSlideStyleDirection` form), use that exact number. If they picked a length range, pick a slide count that feels right inside that range. If the length question was skipped (opt-out, edit, or import) or left blank, default to around 6 -- don't go longer unless the user asked for it.
Do not screenshot-iterate during the build -- `validate-slides` is your layout QA loop, and you have two priorities: speed and design. The only screenshots a first build needs are the slide 1 template-fidelity check (when a template reference image exists), for Slides 2.0 the QA shots from `./references/sdm-visual-qa.md` (one content slide plus every widget slide), and the cover screenshot in step 8.
</first_build>

## Building and editing decks

For an existing deck, infer its format from `src/data/slides-manifest.json`, not a new version selection. Entries with `kind: "sdm"` are SDM; JSX entries are legacy. Preserve each entry's format when editing a mixed deck. When adding slides to an existing deck, or applying a saved template to one, use the format of the deck's last manifest entry. Use `./references/legacy-building.md` for legacy entries and `./references/sdm-building.md` for SDM entries. Do not convert formats because a donor template uses another format.

The build-time rules -- the artifact and manifest contract, the workspace export contract, planning, layout, typography, and the hard constraints every slide must follow -- live in the selected version's build reference and principles reference listed at the start of this skill. Before writing slide files, read any reference that is missing from context. A redirect does not contain the build contract. Do not reread references already in context.

After an edit session that changed slide 1 or the deck-wide theme, retake the cover screenshot (step 8 of `<first_build>`) so the deck's cover stays current. If you are unsure the deck ever had a cover (older decks), take one.
## SDM Documents

For Slides 2.0 (`slideFormat: "sdm"`) only, author slides as YAML at `src/data/slides/<id>.sdm.yaml` and declare `kind: "sdm"` in `src/data/slides-manifest.json`. Do not create per-slide TSX wrappers for SDM documents. Legacy slides uses JSX and the legacy references instead. Use stable element IDs, follow the 1920×1080 coordinate contract and placement rules in `./references/sdm-layout.md`, plan the deck's message and direction with `./references/sdm-principles.md`, and compose with the design language in `./references/sdm-design.md`. Run `validate-slides` after the initial parallel write and after each later batch of document or manifest edits, then follow `./references/sdm-visual-qa.md`. The validation requirement is absolute: if slide or manifest files changed after the last run, run it again, and never present, screenshot, or end the turn while errors are outstanding.

SDM decks can add present-mode animation through the `replit.motion` extensions block -- preset entrances, exits, and loops that play in Present and the deployed viewer while editing, thumbnails, and exports stay static. The authoring contract, taste rules, and `motion-*` validation codes live in `./references/sdm-motion.md`; read it only when a deck uses motion. Default to static decks.
