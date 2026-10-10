<first_build>
When building a new animated video for the first time, follow this sequence. You build the film yourself; do not delegate it to a design subagent.

## What the scaffold provides

These files are already opened in your context after `createArtifact()` returns. Do NOT re-read them:

- `src/components/video/VideoTemplate.tsx` -- template with placeholder ReplitLoadingScene, `useVideoPlayer` hook wired up
- `src/lib/video/hooks.ts` -- `useVideoPlayer`, `useSceneTimer` hooks (DO NOT MODIFY -- recording/export depends on exact implementation)
- `src/lib/video/layout.tsx` -- `VideoCanvas`, `SafeFrame`, `SceneLayout`, `VideoText`, `MediaFrame` ratio-aware primitives (DO NOT MODIFY)
- `src/lib/video/animations.ts` -- 40+ animation presets (springs, easings, scene transitions, element animations, kinetic typography variants)
- `src/lib/video/index.ts` -- barrel export of hooks, layout, and animations
- `src/index.css` -- Tailwind imports + CSS variables for colors and fonts (customize these)
- `index.html` -- HTML shell with Google Fonts preloaded
- `src/main.tsx` -- React entry point

Pre-installed packages (do NOT install these): `framer-motion`, `gsap`, `@react-spring/web`, `three`, `@react-three/fiber`, `@react-three/drei`, `lucide-react`, `tailwindcss`, `clsx`, `tailwind-merge`, `lottie-react`.

Everything outside `src/components/video/`, `public/`, `index.html`, `src/index.css`, `src/App.tsx` (the controls step wraps it), and `SCRIPT.md` is read-only scaffold. Do not replace `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, anything in `src/lib/video/`, or `.replit-artifact/artifact.toml` by hand (see section 8d of the skill).

## Build sequence

Execute these steps in order. Step 1 runs only when the request calls for a real brand's identity; every other step always runs.

Before step 1, `selectedVideoAspectRatio` must hold one exact ratio, resolved per the ratio step in `.local/skills/video-js/SKILL.md`. If the ratio is still missing or ambiguous, ask the required question from `.local/skills/video-js/references/resolution.md` now, end your turn, and continue only after the user answers. No research, downloads, or file changes before the ratio is resolved. Persist it in the artifact's `artifact.toml` through `verifyAndReplaceArtifactToml` before writing the composition, and set `VIDEO_ASPECT_RATIO` in `VideoTemplate.tsx` to the same value.

### Step 1: Pull brand media from the web (only when the request needs it)

If the request names a real company, product, or brand whose visual identity should appear (e.g. "use our fonts and logos") and the user did not attach the brand assets, gather them now:

- Use `extractBranding` on the official site for brand tokens (colors, fonts) and logo asset URLs.
- Download each usable logo image into `attached_assets/` and verify it is a real image file (SVG/PNG content, not an HTML page); discard anything that fails.
- If `extractBranding` gave no usable logo, use `imageSearch` (`"<company> logo png"` or `"<company> logo transparent"`, preferring official domains and press or brand asset pages), then download the best candidate the same way.

Skip this step when no real brand is involved, when the user attached the brand assets, or when the callbacks are unavailable or fail.

### Step 2: Treatment and full shot script

Write the compact director's treatment (skill section 3), then the complete shot-by-shot script (section 4) into the artifact's `SCRIPT.md`, and run the pre-code variety review and the 4b floors against it. No animation code and no asset generation before the script exists. State the selected ratio in the treatment.

### Step 3: Start asset jobs, then build the scenes

Start every independent asset job together (skill section 7: the standard product asset kit for a physical product, textures, cutouts, and any video-generation clips), using the `media-generation` skill's documented tools. Do not generate music, voiceover, or sound effects in this step.

While the jobs run: write `src/index.css` tokens and the Google Fonts import in `index.html`, update the Open Graph and Twitter meta tags, set `SCENE_DURATIONS` from the script, and build the persistent layers and each scene file under `src/components/video/video_scenes/` (skill sections 5, 6, 6b, 8, 8b). Await each asset file before a scene consumes it; reference public assets through `import.meta.env.BASE_URL` and attached assets through `@assets/...` imports.

### Step 4: Restart the workflow and read the logs

```javascript
await restart_workflow({ name: "artifacts/<slug>: web" });
await refresh_all_logs();
```

If there are build errors (missing imports, syntax errors, etc.), fix them and restart the workflow again. Continue only when the logs are clean.

### Step 5: Generate the default background music

Generate exactly one default background music bed with the `generateMusic` callback, following `.local/skills/video-js/references/audio.md` for prompting, output path, and runtime matching. Do not generate voiceover/TTS or SFX unless the user explicitly requested them. Generate the audio before wiring playback so you know which file path the player will use. Once the bed exists, the total runtime is locked to its length (skill section 10b).


### Step 6: Add the in-artifact scene controls and synced audio

Add the control bar at the bottom of the video so the viewer can jump between scenes, toggle scene-lock, and pause and mute preview audio. The bar renders only when the video is inside an iframe (the Replit preview pane); the exporter launches the video as the top-level document, so the exported frame stays clean.

The scaffold ships `src/lib/video/controls.tsx`, `workspaceControls.ts`, `playerBridge.ts`, and `playerActions.ts` for a workspace feature that is off for this project. They render no UI. Do not import from them, and do not wrap `App.tsx` in the component that `controls.tsx` exports. Build the bar in `VideoWithControls.tsx` exactly as `.local/skills/video-js/references/scene-selectors.md` describes.

While making those edits, follow `.local/skills/video-js/references/audio.md`: add the audio controls to `VideoWithControls`, pass `muted` into `VideoTemplate`, then wire the generated audio with scene-synced playback.


### Step 7: Verify with evidence, then present once

Run skill section 13: check the script against the built scenes, run the artifact typecheck and `bash scripts/validate-recording.sh`, confirm the recording hook and static duration object are intact, restart the workflow once more only if this step changed code, capture frames from every scene (first frame plus the last 15% of each shot) and fix any dead frame, doubled layer, or wipe tail. Then call `presentArtifact` once.

## First build rules

- Do NOT delegate the film, the script, or the scenes to a design subagent. Narrow help (a single asset job, one scene file) is optional; verify anything it produces from the files and frames (skill sections 8c and 8d).
- Do NOT start asset generation or scene code before `SCRIPT.md` holds the full shot-by-shot script.
- Do NOT restart the workflow before the scenes are written; restart once after the batch, and again only after fixing build errors or the controls step.
- Do NOT call `SuggestUserAction({ action: "deploy", message: "..." })` -- video artifacts are not deployable. They are exported from the preview pane.
- Do NOT call `presentArtifact` more than once for the first build.
- Do NOT claim an export, an audio check, or a full loop check you did not perform.
</first_build>
