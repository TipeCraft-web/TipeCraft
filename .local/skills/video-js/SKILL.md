---
name: video-js
description: Create and revise short Replit Animation films (v3.2, with composition/pacing floors, scaffold-protection and frame-capture recipes, transition render-cost rules, photography-first product rules, signature-detail fidelity, compound-transition rules, persistent-layer ownership, and revision-integrity checks) with React, Framer Motion, GSAP, and animated SVG. The design subagent builds and revises the whole film; the main agent runs only the platform callbacks around it. Use for dynamic product launches, brand films, kinetic typography, social announcements, and After Effects-style motion graphics. Prioritizes distinct shot compositions, purposeful choreography, product reveals, and reliable playback/export. Videos auto-play, loop, and have no interactive elements. Attached media assets (images, video clips) can be used as elements. Not a timeline video editor (no trimming, splicing, or footage editing) and not an After Effects project exporter.
---

# Replit Animation -- Motion Design

v3.2 -- the design subagent owns every file in the film; the main agent only runs the platform steps the subagent has no tools for. Keeps the v3.1 floors and recipes (no-empty-frame/wipe-tail floors, push-through, outlined type, 8d scaffold protection, filter-on-scaled-plane, frame capture), now in the linked references.

Build a directed motion piece, not a presentation with animated entrances.

Two agents read this file. The **main agent** asks the platform questions, creates the artifact, gathers brand assets, delegates, restarts the workflow, and presents. The **design subagent** does all creative and implementation work: treatment, script, audio, assets, scenes, styling, controls, validation, and every revision. Section 1 draws the line; sections 2-13 are written for the design subagent.

## 0. Platform steps before any creative work (main agent)

These steps use callbacks the design subagent does not have. The main agent runs them, then delegates.

**Ratio step (before any other work).** Read `.local/skills/video-js/references/resolution.md`. For a NEW video, resolve the ratio from the request as that reference describes -- an explicit ratio or one unambiguous platform or orientation word, otherwise 16:9. Never ask the user for the ratio. Before creating the artifact, resolve the selected ratio to one exact `selectedVideoAspectRatio` value (`16:9`, `9:16`, `1:1`, or `4:5`) and persist it as that reference describes.

**Brand assets step.** If the request names a real company, product, or brand whose visual identity should appear (logos, fonts, brand colors) and the user did not attach those assets, gather them before delegating with `extractBranding` and `imageSearch`, downloading and verifying each logo into `attached_assets/` exactly as `references/first-build.md` Step 1 describes -- the design subagent cannot call these callbacks.


Skip this step when no real brand is involved, the user attached the brand assets, or the callbacks are unavailable or fail. Distilled facts only: keep the logo file paths, font names (with the closest Google Fonts match when proprietary), hex codes, and source URL for the `Brand assets` block of the brief.

**First build.** For a NEW film, `.local/skills/video-js/references/first-build.md` owns the sequence (brand assets, the delegation brief, workflow restart, presentation). Read it once and follow it. This file supplies the creative and technical rules the design subagent relies on.

**Revisions.** Every change to an existing film -- a new shot, a pacing note, a screenshot of a defect, "make it more premium" -- goes to a design subagent with the user's message verbatim, the attached screenshot paths in `relevantFiles`, and `.local/skills/video-js/SKILL.md` in `relevantSkills`. Add no creative direction of your own. When it returns: `refresh_all_logs()`, restart the workflow only if the logs show errors, and do not call `presentArtifact` again -- the preview hot-reloads.

## 1. Operating contract

### Main agent: platform callbacks only

- Never write or edit a file in the video artifact: not `SCRIPT.md`, scenes, CSS, `App.tsx`, `sceneMeta.ts`, controls, audio, or a one-line build fix. Every file change, on the first build and on every revision, goes through a design subagent.
- Run only what the design subagent cannot: the ratio and template questions, `createArtifact` and ratio persistence, `extractBranding` / `imageSearch` downloads, `subagent()`, `restart_workflow` / `refresh_all_logs`, and `presentArtifact`.
- The brief is the user's request verbatim plus facts (ratio, template, downloaded brand assets). No creative direction, palette, typography, scene ideas, or pacing notes. The design subagent is the creative expert.
- When the workflow logs or `scripts/validate-recording.sh` show a problem, send the exact output back to a design subagent with a fix-only task. Do not patch it yourself.
- Report only what the logs, the validation script, and the subagent's changed-file list support. Do not relay a subagent's claims about frames or exports as verified.

### Design subagent: the whole film

- You own the concept, audio, assets, composition, animation, controls, validation, and every revision. There is no one to hand work back to; finish it.
- Make concrete creative decisions rather than asking permission for routine choices. You cannot ask the user questions; when the brief is ambiguous, choose the reading that best serves the stated subject and say what you chose in your report.
- Script the entire film shot by shot before animation code or asset generation. A treatment, scene outline, or motion-effects list alone does not satisfy this requirement.
- Preserve successful scenes when revising. A request about the last three scenes is not permission to redesign the opening.
- You cannot start or restart workflows, create artifacts, present, or ask the user questions. On a first build the dev server is not running: verify from the files (section 13). On a revision it is running: capture frames.
- Stay inside `src/components/video/`, `public/`, `index.html`, `src/index.css`, `src/App.tsx`, and `SCRIPT.md`. Everything else in the artifact is protected scaffold (section 8d).
- Do not edit platform-managed skill files.
- End every run with the list of files you created or changed and the values that matter (durations total, scene count, asset paths). The main agent relays that list; it cannot check your work for you.

### What you are producing

A short, auto-playing, looping film rendered in the browser. Usually 15-45 seconds; 60 seconds when the story needs it. Treat two minutes as an upper bound, not a target.

<no_interactivity>
No navigation, buttons, hover dependencies, forms, or playback controls inside the composition. The workspace supplies playback controls outside the film. Product-interface elements may appear as noninteractive artwork. No CTA buttons ("Get started", "Learn more"), no arrows, menus, tabs, or pagination dots, no form elements. If a product mockup contains a button, render it as a purely visual element.
</no_interactivity>

This produces After Effects-style visual language, not an .aep file. It is not a footage-editing application. If a user wants to trim, splice, or edit existing footage, this is the wrong stack.

## 2. Resolve the brief without slowing the work

Before a new film, establish from the brief:

- Subject, audience, and one takeaway.
- Format: 16:9, 9:16, 1:1, or 4:5. The brief states the ratio the main agent resolved and persisted; read `references/resolution.md` for how to compose for it. Never change or infer a different ratio. Preserve an existing film's ratio unless the brief asks for a change.
- Approximate runtime.
- Brand inputs, provided assets, and any explicit creative references.

"Dynamic After Effects-style product launch" is enough motion direction to proceed. It does not specify a palette, but the brand and subject can resolve that. If the brief names a template, preserve its recognizable identity, not necessarily every source layout, and recompose it for the chosen ratio.

The artifact already exists and its `videoAspectRatio` is already persisted when you start. Do not create artifacts or edit `.replit-artifact/artifact.toml`.

## 3. Write a compact director's treatment

Before code, make six decisions. A few lines are enough:

- **Promise:** What should the viewer remember?
- **Identity:** Brand-derived palette, one display face, one supporting face.
- **Hero:** The object, interface, person, or visual mechanism that carries the film.
- **Motion:** Two or three dominant techniques, named precisely.
- **Arc:** How energy changes from hook to reveal to conclusion.
- **Payoff:** What makes the ending structurally different from the middle?

Keep creative language in the treatment. Progress updates should plainly describe what is changing.

## 4. Mandatory preproduction: fully script every shot

A scene is a container for a choreographed sequence. It should not be "headline enters, supporting line enters, hold, slide away."

Do not start animation implementation or asset generation until the entire film has a written shot-by-shot script and has passed the variety review in `references/shot-script.md`. Research and inspect existing assets first as needed. Save the script in the artifact's `SCRIPT.md` so the creative decisions guide implementation rather than being invented one component at a time. Do not turn this into an approval gate unless the user asks to review before building.

The compact treatment establishes direction; it does not replace the script. Script every shot from opening frame through final hold and loop handoff. A shot is a framing/action unit, not necessarily a React scene: one scene may contain several cuts, reframings, or timed micro-shots.

For a revision, inspect the whole film's script, fully rescript the affected shots and their incoming/outgoing transitions, and preserve successful unaffected shots. If no script exists, first map the current film so the revised sequence can be judged in context.

Before writing `SCRIPT.md`, read `references/shot-script.md`. It defines the fields every shot needs (number and timing, purpose, exact content, composition, artistic idea, timed choreography, transition contract, assets and technique, sound intent), with a pacing table, an example shot, the variety review, and the composition and timing diversity rules. Write equivalent detail for every shot, not only the hero.

## 4b. Composition and pacing floors

These are hard floors, not taste. Read `references/composition-floors.md` before scripting and audit every shot against it before you report. It covers hero scale, beat density, dead tails, empty frames, the type scale floor, photography-first for physical products, and signature-detail fidelity.

## 5-7. Motion, transitions, and assets

- Read `references/motion-vocabulary.md` while scripting choreography and transitions: motion hierarchy, kinetic type, product reveals, the virtual camera, finales, and compound transitions (every cut combines at least two mechanics and carries one element across).
- Read `references/assets.md` before generating, downloading, or importing any image, logo, footage, or icon. Its non-negotiables: a `Brand assets` inventory from the platform step is ground truth; never redraw or fabricate an existing company's logo; never invent a product, release date, endorsement, performance claim, or price; and never disguise a still photograph as moving footage.

## 8. Implementation architecture

Read `references/implementation.md` before writing `VideoTemplate.tsx`, scenes, or persistent layers. It has the scaffold layout, scene skeleton, timer and particle rules, radial ticks, outlined type, persistent-layer ownership, and performance limits. The rules most often broken:

- `VideoTemplate` owns one static `SCENE_DURATIONS` object and calls `useVideoPlayer`; each scene exports a named component matching its filename.
- Use `VideoCanvas` with the persisted ratio, and place scenes in `AnimatePresence mode="sync"` or `"popLayout"` with unique keys and explicit exits.
- Drive phases, counters, and odometers from `useSceneTimer`. Never start `setInterval`, `requestAnimationFrame`, or `performance.now()` loops from a scene.
- Every persistent layer has one owner per scene and an explicit branch for every scene index.

## 8c. Report from the files, never from intent

Your completion message is the only account of the film the main agent gets, and it cannot check it for you. Twice on one film a design subagent reported "rebuilt Scene 2 around the hero photo" and "spec lines at 3.2vmin" while the file still held the previous CSS dial and the text rendered at ~1.5vmin. Before you report: grep every touched scene file for the new imports and values you are about to claim, re-read `SCENE_DURATIONS`, and (when the dev server is running) capture frames from the changed scenes. Report what the files contain. If you ran out of budget before a change landed, say which shot is unfinished instead of describing the plan as done.

## 8d. Scaffold protection (learned on a Gap film)

A design subagent handed a video artifact treated it as a fresh Vite project: it replaced `package.json`, `vite.config`, `tsconfig`, `main.tsx`, `index.css`, the protected `src/lib/video/hooks.ts` and `layout.tsx`, added postcss/tailwind configs, and tried to overwrite `.replit-artifact/artifact.toml` -- which would have deleted the managed workflow -- then wrote scenes against primitives that do not exist. Its completion report described a finished film.

The artifact is a scaffold with a recording contract, not a blank project. Write only inside `src/components/video/`, `public/`, `index.html`, `src/index.css`, `src/App.tsx`, and `SCRIPT.md`. Do not add config files. Do not install packages. Build on the primitives that exist (`src/lib/video/`), and read them before assuming an API.

Before you finish any run, diff every protected file (`src/lib/video/*`, `src/main.tsx`, `vite.config.ts`, `tsconfig.json`, `package.json`, `scripts/`) against the pristine scaffold copy at `.local/skills/artifacts/artifacts/video-js/files/`. If any differ, copy the scaffold version back, delete stray config files, re-run `scripts/validate-recording.sh` and the typecheck, and fix only the scene files that depended on the drift. Never blanket-revert the artifact: scene files, `SCRIPT.md`, and generated assets are the deliverable and must survive. If `.replit-artifact/artifact.toml` or the managed workflow looks wrong, say so in your report; only the main agent can repair it.

## 9. Playback and export invariants

These are implementation requirements, not creative suggestions:

- Do not modify `src/lib/video/` to make a scene easier to build.
- Keep `useVideoPlayer({ durations: SCENE_DURATIONS })` in `VideoTemplate`. It owns scene advancement, looping, `window.startRecording?.()`, and `window.stopRecording?.()`.
- Do not replace those calls with a custom timer, remove them during cleanup, or stop advancement at the outro. Before you finish any turn that touched video code, re-read `VideoTemplate.tsx` and confirm the hook and both calls are intact, then run `bash scripts/validate-recording.sh`.
- Keep the aspect ratio consistent between artifact metadata and `VideoCanvas`.
- The in-artifact control bar (`VideoWithControls.tsx` + `useSceneControls.ts`) is built exactly as `references/scene-selectors.md` describes; it renders only inside an iframe so exports stay clean. Do not import from `src/lib/video/controls.tsx`, `workspaceControls.ts`, `playerBridge.ts`, or `playerActions.ts` -- they belong to a workspace feature that is off for this project.
- Use `${import.meta.env.BASE_URL}images/...` and the equivalent for audio/video. Bare `/images/...` URLs may escape the artifact path. This applies to `<video>`, `<img>`, `backgroundImage`, and CSS `url()` in inline styles.
- Reference uploaded assets through supported module imports (`import logo from "@assets/logo.png"`), not filesystem URLs. `attached_assets/` is not served as a static directory and Vite cannot serve `/src/...` paths.
- Update `og:title`, `og:description`, `twitter:title`, and `twitter:description` in `index.html`; never remove `og:image` / `twitter:image`, and keep `twitter:site` at `@replit` unless asked.
- Check the renderer's supported features before relying on WebGL, shaders, fonts, blend modes, or expensive filters. WebGL2 is not available in the recording environment.

## 10. Audio

- Generate the bed right after the script and before scene code, following `references/audio.md`: write the "Audio spec" section of `SCRIPT.md`, call the `generateMusic` callback inside `CodeExecution` with `durationSeconds` = the scripted runtime, then find the track's real onsets and move your cut times onto them before you build. Choreograph to the track you have, not the one you asked for. Once the bed exists the runtime is locked ("Runtime lock" in that reference).
- Generate voiceover (`searchVoices` then `textToSpeech`) and sound effects (`generateSoundEffect`) only when the user requested them, all as callbacks inside `CodeExecution`. When there is more than one file, pre-mix `public/audio/composite_audio.mp3` with `ffmpeg` at the spec times and play that; otherwise play `bg_music.mp3`.
- If the user supplies audio, choreograph major hits to it. Otherwise, do not claim beat synchronization unless you actually aligned it.
- Preserve an existing soundtrack during visual revisions unless it no longer fits or the user requests a change.
- Derive cumulative audio offsets from the canonical scene durations.
- Wire the mute toggle through the in-artifact control bar as `references/scene-selectors.md` and `references/audio.md` describe.
- Pause/resume audio with the scene clock. Seek on scene changes, not on every resume.
- Catch browser autoplay rejection. Do not present autoplay blocking as successful audible playback.
- Do not add independent audio looping; the video's loop boundary resets the track.
- If VO/SFX are requested, use one time-aligned composite track when needed for export parity.

## 12. Revision playbook

Read `references/revision-playbook.md` when revising from feedback: it translates vague notes ("too slidey", "more premium", "boring", a screenshot of a defect) into structural changes. When the user likes one part and rejects another, preserve what worked and upgrade the criticized scene's choreography, not just its easing curve.

**Revision integrity:** a broad pass (whole-film motion audit, "polish everything") must not undo earlier targeted fixes. Before starting a broad pass, list the locked decisions (durations, opener timing, closed persistent layers, hero scales) and re-verify each one from the files afterward -- not from memory of having done it. Each revision run starts from the files, not from the last run's memory: read `SCRIPT.md`, `SCENE_DURATIONS`, and the persistent layers in `VideoTemplate` before touching anything, and treat every decision recorded there as locked unless the brief changes it.

## 13. Finish with evidence, not extra ceremony

After a coherent build or revision, run the checks below. On a first build the dev server is not running and you cannot start it, so the file checks are the gate and the frame checks wait for the first revision. On a revision the preview is running: capture frames. Read `references/verification.md` before finishing any run: it lists the checks, the headless frame-capture recipe (one browser, real-time sampling, never `--virtual-time-budget`), the dead-frame scan, and the final creative check.

- Run the artifact typecheck and `scripts/validate-recording.sh` when available, and confirm the recording hook and static duration object remain intact.
- Confirm every scripted shot, internal beat, and handoff exists in the scenes; reconcile intentional deviations in `SCRIPT.md`.
- Report the changed files, the duration total, and what you verified. A passing recording-wiring script is not proof that an MP4 export rendered. Do not claim an export, audio check, frame check, or full loop check you did not perform.
