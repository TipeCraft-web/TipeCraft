
Every video targets ONE aspect ratio, chosen before any work begins:

- **16:9 landscape** -- YouTube, web, presentations, and the default when the user asks to skip the question.
- **9:16 vertical** -- TikTok, Instagram Reels, YouTube Shorts, Stories, or an explicit vertical/mobile request.
- **1:1 square** -- square social feed posts.
- **4:5 portrait** -- Instagram feed posts.

For a NEW video, first determine whether the user selected a ratio or gave one unambiguous platform or orientation. If the ratio is missing or ambiguous, ask before research, artifact creation, planning, or file changes.

Call `AskQuestion` directly as a model tool. Do not call it inside `CodeExecution`. Use this required single-select question:


```json
{
  "question": "What aspect ratio should the video use?",
  "fields": [
    {
      "kind": "singleSelect",
      "name": "videoAspectRatio",
      "title": "Aspect ratio",
      "required": true,
      "options": [
        { "value": "16:9", "label": "16:9 (YouTube, presentations, default)" },
        { "value": "9:16", "label": "9:16 (TikTok, Instagram Reels, Shorts)" },
        { "value": "1:1", "label": "1:1 (Square social posts)" },
        { "value": "4:5", "label": "4:5 (Instagram feed posts)" }
      ]
    }
  ]
}
```

Whichever way you ask, end the turn and wait for the user's answer. Do not start work while the question is open. Skip the question only for edits to an existing video, an explicit ratio, one unambiguous platform or orientation, or when the user asks to skip it. If the user asks to skip it, use 16:9. State the selected ratio in your director's treatment.

Before writing the composition, persist the selected ratio in the target video artifact's `.replit-artifact/artifact.toml` while preserving all existing artifact configuration:

```toml
kind = "video"
videoAspectRatio = "9:16"
```

`artifact.toml` is protected. Write the full updated TOML to an absolute temporary file inside the workspace, then call `verifyAndReplaceArtifactToml({ tempFilePath, artifactTomlPath })` with absolute paths. Set `videoAspectRatio` to the selected `16:9`, `9:16`, `1:1`, or `4:5` value. This per-artifact field is the source of truth for preview and export. Do not change it during ordinary visual edits. A ratio change requires recomposing that video for the new frame.

For a legacy root VIDEO_JS project with no `artifact.toml`, persist the same value as `videoAspectRatio` under `[agent]` in `.replit` through `verifyAndReplaceDotReplit`.

If the project has `src/lib/video/layout.tsx`, set `VIDEO_ASPECT_RATIO` in `src/components/video/VideoTemplate.tsx` to the same persisted ratio. Keep `VideoCanvas` as the root and use its `SafeFrame`, `SceneLayout`, `VideoText`, and `MediaFrame` primitives for ratio-aware insets, composition, short-edge type scaling, and media fitting. If that file does not exist (legacy VIDEO_JS projects and older artifacts), set your root video container to fill the viewport with `w-full h-screen` and use viewport-relative units (`vw`/`vh`) for sizing. Design all scenes for the chosen fixed canvas. Do not add viewport breakpoints.

Compose FOR the ratio -- never letterbox or shrink a 16:9 layout into a different frame:

- **9:16:** Stack content vertically and push type larger. Keep critical text and logos inside the middle ~80% of the height because platform UI covers the top and bottom edges.
- **1:1 and 4:5:** Favor centered, compact compositions over wide horizontal spreads.

The export pipeline captures the viewport at exactly the persisted ratio. For example, 16:9 HD is 1920x1080 and 9:16 HD is 1080x1920.

