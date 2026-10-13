<first_build>
When building a new animated video for the first time, follow this sequence. The design subagent builds the film. You (the main agent) run only the callbacks it does not have: brand downloads, `subagent()`, the workflow restart and log read, and `presentArtifact`. You write no file in the artifact.

## What the scaffold provides

These files are already opened in your context after `createArtifact()` returns. Do NOT re-read them:

- `src/components/video/VideoTemplate.tsx` -- template with placeholder ReplitLoadingScene, `useVideoPlayer` hook wired up
- `src/lib/video/hooks.ts` -- `useVideoPlayer`, `useSceneTimer` hooks (DO NOT MODIFY -- recording/export depends on exact implementation)
- `src/lib/video/layout.tsx` -- `VideoCanvas`, `SafeFrame`, `SceneLayout`, `VideoText`, `MediaFrame` ratio-aware primitives (DO NOT MODIFY)
- `src/lib/video/animations.ts` -- 40+ animation presets (springs, easings, scene transitions, element animations, kinetic typography variants)
- `src/lib/video/index.ts` -- barrel export of hooks, layout, and animations
- `src/index.css` -- Tailwind imports + CSS variables for colors and fonts (the design subagent customizes these)
- `index.html` -- HTML shell with Google Fonts preloaded
- `src/main.tsx` -- React entry point

Pre-installed packages (do NOT install these): `framer-motion`, `gsap`, `@react-spring/web`, `three`, `@react-three/fiber`, `@react-three/drei`, `lucide-react`, `tailwindcss`, `clsx`, `tailwind-merge`, `lottie-react`.

## Build sequence

Execute these steps in order. Step 1 runs only when the request calls for a real brand's identity; every other step always runs.

Before step 1, `selectedVideoAspectRatio` must hold one exact ratio, resolved from the request per `.local/skills/video-js/references/resolution.md` (explicit ratio or unambiguous platform word, otherwise 16:9 -- never ask). Persist it in the artifact's `artifact.toml` through `verifyAndReplaceArtifactToml` before delegating -- the design subagent cannot call that callback. The brief tells the subagent to set `VIDEO_ASPECT_RATIO` in `VideoTemplate.tsx` to the same value.

### Step 1: Pull brand media from the web (only when the request needs it)

If the request names a real company, product, or brand whose visual identity should appear (e.g. "use our fonts and logos") and the user did not attach the brand assets, gather them now -- the design subagent cannot call these callbacks itself:

- Use `extractBranding` on the official site for brand tokens (colors, fonts) and logo asset URLs.
- Download each usable logo image into `attached_assets/` and verify it is a real image file (SVG/PNG content, not an HTML page); discard anything that fails.
- If `extractBranding` gave no usable logo, use `imageSearch` (`"<company> logo png"` or `"<company> logo transparent"`, preferring official domains and press or brand asset pages), then download the best candidate the same way.

Skip this step when no real brand is involved, when the user attached the brand assets, or when the callbacks are unavailable or fail -- go straight to step 2.

### Step 2: Delegate the whole film to the design subagent

Call `subagent()` and do not await it. The task is the user's request exactly as written, plus the facts below. Do NOT add creative direction, color guidance, typography choices, scene ideas, or pacing notes; the design subagent reads the skill and makes every creative and implementation decision. The only additions are facts: the selected ratio, the selected template, and the `Brand assets` block from step 1 (file labels, font names, hex codes, source URL -- never raw `extractBranding` or search output, and never an image URL in place of a downloaded file). A fact is a noun phrase the subagent could not know ("no brand assets were downloaded", "the user asked for a voiceover"). Do NOT add directives ("do not add a mute button", "skip section 10", "do not invent a logo") or restate the request's constraints; the request text and the skill already carry them. Copy the Audio and ratio lines below as written, even for a silent film.

```javascript
const videoDesignTask = `You are the design subagent building this Replit Animation. Read .local/skills/video-js/SKILL.md first and follow it end to end; you own every file change in artifacts/<slug>/.

[Insert the user's request verbatim]

Brand assets (downloaded to the workspace): [Omit when step 1 was skipped.]
- attached_assets/<company>-logo.svg -- primary logo, from <official source url>
- Brand fonts: <names, closest Google Fonts match if proprietary>
- Brand colors: <hex codes>

Audio: generate it yourself with the generateMusic / generateSoundEffect / textToSpeech callbacks inside CodeExecution (skill section 10 and references/audio.md): the bed right after the script so the cuts sit on real beats, voiceover and effects only when the user asked.

Use the ${selectedVideoAspectRatio} aspect ratio. This ratio is authoritative and already persisted. Set VIDEO_ASPECT_RATIO in VideoTemplate.tsx to the same value.`;

subagent({
  name: "video-design",
  task: videoDesignTask,
  config: {
    $kind: "design",
    relevantSkills: [
      ".local/skills/video-js/SKILL.md",
      ".local/skills/video-js/references/scene-selectors.md",
      ".local/skills/video-js/references/audio.md",
      ".local/skills/video-js/references/resolution.md",
    ],
    relevantFiles: [
      "attached_assets/<company>-logo.svg", // only when step 1 downloaded assets
    ],
  },
});
```

The completion notification resumes you for the next step. End your turn after spawning; do not poll.

### Step 3: Restart the workflow and read the logs

```javascript
await restart_workflow({ name: "artifacts/<slug>: web" });
await refresh_all_logs();
```

Then run `bash artifacts/<slug>/scripts/validate-recording.sh`. If the logs show build errors or the script fails, do not fix the code yourself: spawn a follow-up design subagent with the exact log excerpt or script output, the task "fix these build errors only; change nothing else", and the same `relevantSkills`. When it returns, restart and read the logs again. Repeat until the logs are clean and the script passes.

### Step 4: Present once

Call `presentArtifact` once. Say what the logs and `validate-recording.sh` proved; do not claim an export, an audio check, or a full loop check. Revisions the user asks for afterwards go to a design subagent the same way (skill section 0, Revisions).

## First build rules

- Do NOT write or edit any file in the artifact yourself -- not `SCRIPT.md`, scenes, CSS, `App.tsx`, `sceneMeta.ts`, controls, audio, or config such as `tsconfig.json` and `package.json`. Every change, including a one-line build-error or config fix, goes through a design subagent.
- Do NOT run `pnpm run typecheck` in the artifact. The scaffold's shared base config reports DOM type errors that do not affect the preview or export; step 3's logs and `validate-recording.sh` are the checks.
- Do NOT add your own creative direction, style instructions, color guidance, or typography choices to the brief. The design subagent is the creative expert. Facts only: ratio, template, downloaded brand assets.
- Do NOT await the design subagent inline. The completion notification resumes you.
- Do NOT restart the workflow before the design subagent completes.
- Do NOT review, critique, or revise the film after the design subagent returns. The only follow-up subagent on a first build is the step 3 build-error fix. If the film contains details the user did not supply (a tagline, a price, an event name, a product claim), say so in the present message and ask the user; do not send a second subagent to remove or reword them.
- Do NOT call `SuggestUserAction({ action: "deploy", message: "..." })` -- video artifacts are not deployable. They are exported from the preview pane.
- Do NOT call `presentArtifact` more than once for the first build.
- Do NOT claim an export, an audio check, or a full loop check you did not perform. Relay only what the logs, `validate-recording.sh`, and the subagent's changed-file list support.
</first_build>
