---
name: video-editing
description: Edit video files with FFmpeg -- trim, merge, add subtitles, effects, voiceovers, and reformat.
---

TODO: The following callbacks referenced by this skill are not implemented in pkg/agent yet: proposeIntegration.

# Video Editing

Edit existing video files server-side using FFmpeg. This skill covers the full editing workflow: trimming, splicing, concatenating, transitions, text overlays, subtitles, audio mixing, effects, and format conversion.

## When to Use

- **Trimming & cutting:** "Trim this video to 0:30-1:15" / "Cut out the first 10 seconds", "Extract a clip from 2:00 to 3:30", "Remove the intro" / "Cut the ending"
- **Merging & compositing:** "Merge these clips together" / "Concatenate these videos", "Put two videos side by side" / "Split screen", "Picture-in-picture"
- **Text, titles & subtitles:** "Add subtitles" / "Add captions", "Put a title card at the beginning", "Add text overlay"
- **Audio:** "Add background music" / "Mix in this audio track", "Add a voiceover" / "Narrate this video" (uses ElevenLabs), "Mute this video" / "Remove the audio", "Replace the audio with this track"
- **Speed & motion:** "Speed up this video 2x" / "Slow motion", "Make this part slow-mo", "Reverse this clip", "Loop this clip 3 times"
- **Visual effects & fixes:** "Rotate this video 90 degrees" / "Flip horizontally", "Stabilize this shaky footage", "Crop out the watermark" / "Remove the watermark", "Add my logo to this video" (image overlay / branding), "Color correct" / "Make it brighter" / "Adjust contrast"
- **Format & size:** "Convert this MP4 to WebM" / "Change format", "Compress this video" / "Make this file smaller", "Resize to 720p" / "Downscale" / "Change resolution", "Extract the audio as MP3", "Create a GIF from this clip", "Make a thumbnail from this video" (frame extraction as image)
- **Social media & platform:** "Make TikTok clips from this" / "Break this into Reels", "Make this vertical for Shorts", "Reframe for Instagram" / "LinkedIn" / "Pinterest" / "Facebook" / "Snapchat", "Convert this to square for Instagram feed"
- **AI-powered analysis:** "Find the best moments" / "Auto-trim for virality", "Extract the highlights" / "Score these clips", "Which parts are most engaging?"
- **Cleanup & optimization:** "Remove dead space" / "Remove silence", "Shorten this by cutting out boring parts", "Tighten up this video"
- **Chunking & splitting:** "Split this into short clips" / "Chunk this for TikTok", "Break this talk into Reels-length videos", "Make 15-second clips from this"
- **No direction (user just uploads a video):** Probe the file, report what it is, and ask what they want to do

## When NOT to Use

- User wants to create an animated video from scratch using code (use the `video-js` skill instead)
- User wants a browser-based video editor UI (build as a `react-vite` artifact with this skill powering the backend)

## User Interaction -- ALWAYS Ask Before Acting

**When a user uploads a video without specific instructions, you MUST ask what they want to do with it.** Do NOT assume a workflow or start processing automatically.

Probe the video first (to report basic info), then ask the user what they'd like. Here's a good pattern:

1. Probe the file and tell the user what they uploaded (duration, resolution, format)
2. Ask what they want to do. Offer common options like:
   - Trim or cut specific sections
   - Find the best/most viral moments
   - Break it into short clips for a specific platform (TikTok, Reels, Shorts, X)
   - Remove dead space / silence
   - Add text, subtitles, or a voiceover
   - Reframe for a different aspect ratio
   - Convert to a different format
   - Something else

**When the user specifies a platform, the full pipeline includes reframing to that platform's native format.** Do not just chunk the video and leave it in the original aspect ratio. Always deliver platform-ready output -- correct aspect ratio, resolution, and duration range.

**When the user says a platform name, apply both the correct duration targets AND the correct aspect ratio/resolution.** For example, "Make TikTok clips" means chunk to 10-45s AND reframe to 9:16. Read `references/platforms.md` whenever a platform is named, for the per-platform aspect ratio, resolution, duration range, ideal length, and file-size limits.

**When the user asks for clips or chunking without specifying a platform, ask which platform they're targeting** so you can apply the right duration targets and reframing.

**When you deliver results, always present the output files** so the user can download and preview them. Never just describe what was done -- show the files.

## Core Workflow

FFmpeg 6.1.2 and `ffprobe` are pre-installed on PATH with full codec support; no additional installation is needed for FFmpeg itself. Before writing the first script or API route, read `references/ffmpeg-setup.md` for the codec list, package install commands, and probe, fluent-ffmpeg, execFile, and progress code patterns.

1. **Choose script or API.** For one-off or single-operation tasks (trim a clip, convert a format, extract audio), write a Node.js script in `scripts/src/`. For multi-step editing workflows or a video editor UI, add routes to the API server (`artifacts/api-server/`).
2. **Probe before processing.** Always probe the input with `ffprobe` first. This prevents errors from wrong assumptions about codecs, resolution, frame rate, or duration.
3. **Pick the call style.** Use `fluent-ffmpeg` for complex, multi-step operations; call FFmpeg directly with `child_process.execFile` for simple, well-known one-liners. For longer operations, report progress from FFmpeg's stderr.
4. **Manage files.**
   - Store uploaded/input files in a `tmp/`or`uploads/` directory
   - Store output files where the user can access them -- either `public/` for web serving or a known output directory
   - Clean up temporary files after processing
   - For large files, stream the output rather than buffering in memory
5. **Handle errors.** FFmpeg errors are often cryptic. Always:
   - Log the full stderr output on failure
   - Validate input files exist before processing
   - Check that output codecs are compatible with the output container
   - Use `-y` flag to overwrite output files without prompting

For the exact FFmpeg command for any operation (trim, concat, transitions, text, subtitles, audio, effects, format conversion, GIFs, compression, stabilization, looping, split screen, watermarks, logos), read `operations.md`.

## AI-Powered Virality Scoring

Use AI vision to analyze video content and score it on viral potential. This feature has two modes depending on the workflow.

This feature requires an AI integration (OpenAI or Gemini) to be set up. Set up the AI integration following the `ai-integrations-openai`or`ai-integrations-gemini` skill before proceeding. OpenAI is preferred because gpt-5.2 handles image analysis well and is the default for most tasks. Gemini (gemini-2.5-flash) is a good alternative, especially for high-volume analysis since it supports video/image input natively.

- **Mode 1: Segment scoring (find the best moments)** -- For when the user says "find the best clips" or "auto-trim for virality." Detects scenes, scores small segments, and exports the top moments. Good for finding highlights in raw footage.
- **Mode 2: Clip scoring (rank ready-to-post clips)** -- For when clips already exist (from chunking, manual trimming, etc.) and the user wants to know which ones to post first. Scores each complete clip with a richer evaluation including narrative arc and standalone quality. This is the preferred mode when used with the chunking pipeline.

When the user has a long video and wants social-ready clips, use this order:

```text
Long Video -- Dead Space Removal -- Chunking (10-60s clips) -- Clip-Level Scoring -- Reframe for Platform -- Output
```

This way the AI scores complete, self-contained clips rather than tiny scene fragments. The scores are much more meaningful because each clip is what will actually be posted. When the video has already been chunked, always score the chunks rather than re-running segment detection.

For "find the best moment in this video" requests (no chunking), use the original segment-level pipeline:

```text
Video -- Scene Detection -- Frame Extraction -- Segment Scoring -- Rank -- Trim/Export
```

**When the user asks for auto-trim, ask which output they want.** Present these three options and let the user choose each time. Do not assume a default:

- **Best clip** -- The single highest-scoring segment/clip, trimmed and exported
- **Multiple clips** -- Several top segments/clips exported as separate files, ranked by score
- **Highlight reel** -- Top moments stitched together with crossfade transitions into one video

Before implementing either mode, read `virality-scoring.md` for the scoring criteria and weights, frames to extract per segment or clip, AI prompts, scene detection, and output assembly.

## Dead Space Removal

Automatically detect and remove silence, dead air, and filler from a video to produce a tighter, more engaging cut. This is especially useful for talks, interviews, podcasts, tutorials, and raw footage.

1. **Silence detection** -- Use FFmpeg's `silencedetect` filter to find all silent intervals (configurable threshold and minimum duration)
2. **Segment extraction** -- Extract all non-silent segments as individual clips
3. **Reassembly** -- Concatenate the non-silent segments back together with optional brief crossfade transitions
4. **Optional: AI-assisted filler removal** -- For more aggressive editing (removing "ums", filler words, repetitive sections), combine silence detection with AI transcription analysis

Ask these clarifying questions if not clear from context:

- **How aggressive?** Light (remove only true silence, > 1s gaps) vs. aggressive (remove short pauses > 0.3s for a fast-paced edit)
- **Transitions?** Hard cuts between segments (default) or brief crossfades (0.2-0.5s) for smoother flow

| Preset | Silence Threshold | Min Silence Duration | Use Case |
|--------|------------------|---------------------|----------|
| Light | -40dB | 1.0s | Talks, interviews -- remove obvious dead air |
| Medium | -35dB | 0.5s | Podcasts, tutorials -- tighter pacing |
| Aggressive | -30dB | 0.3s | Fast-paced edits, social media -- maximum tightness |

To implement it, read the "Dead Space Removal" section of `dead-space-and-chunking.md` for the FFmpeg commands and Node.js pipeline.

## Social Media Chunking

Break a longer video (ad, promo, talk, presentation, livestream) into self-contained clips suitable for TikTok, Reels, and Shorts. Each clip should be 10-60 seconds and feel complete on its own.

1. **Scene detection + silence detection** -- Find natural break points using both visual scene changes and audio silence gaps
2. **Smart boundary selection** -- Merge adjacent segments into clips targeting 10-60 seconds, preferring to break at silence or scene changes rather than mid-sentence
3. **AI content analysis (optional)** -- Score each potential clip with AI to identify which ones are worth posting, suggest captions, and recommend clip order
4. **Export** -- Output each clip as a separate file, numbered and ranked

Ask which platform they're targeting (or default to TikTok at 15-45s); the per-platform clip lengths are in `references/platforms.md`. The chunking algorithm should:

- **Never cut mid-sentence** -- Always break at silence gaps or natural pauses
- **Prefer scene boundaries** -- Break where the visual content changes
- **Ensure each clip stands alone** -- Each clip should have a clear beginning, not start mid-thought
- **Target the platform's sweet spot** -- Not just "under 60s" but actually the ideal range for that platform

To implement it, read the "Social Media Chunking" section of `dead-space-and-chunking.md` for the complete pipeline with code examples.

These features work well together in a pipeline that takes a raw long-form video and produces polished, platform-ready social clips end to end:

```text
Long Video -- Dead Space Removal -- Chunking into Clips -- Virality Scoring -- Reframe for TikTok -- Output
```

## Voiceovers with ElevenLabs

Add AI-generated voiceovers to videos using ElevenLabs text-to-speech, then mix the audio into the video with FFmpeg.

### Prerequisites

ElevenLabs is available as a Replit integration (connector). The user needs to connect their ElevenLabs account through Replit's integration system -- no manual API keys needed. Search for the integration and propose it to the user:

```javascript

const results = await searchIntegrations({ query: ["elevenlabs"] });
console.log(results);

```

Use the exact `handle` it returns and follow its `status`: `ready` is usable now; `connect` with a note means do what the note says; `connect` with no note means call `ProposeIntegration` with the handle. An accepted proposal is already attached, so do not call `addIntegration` afterward. Once connected, use `listConnections('elevenlabs')` inside a `"use impure"` function in the code execution sandbox to get the credentials.

### Workflow

1. **Generate voiceover audio** -- Send text to ElevenLabs TTS API, receive audio file
2. **Mix into video** -- Use FFmpeg to add the voiceover as a new audio track, optionally ducking (lowering volume of) existing audio

When the user asks for a voiceover, they may want one of these:

- **Replace audio** -- Remove existing audio entirely, use only the voiceover
- **Mix over** -- Layer voiceover on top of existing audio (with existing audio volume reduced)
- **Add as track** -- Keep existing audio at full volume, add voiceover on top

Ask which mode the user prefers if not clear from context.

To implement it, read `voiceover.md` for the ElevenLabs TTS integration, voice selection from the library or cloned voices, voice settings (stability, similarity boost, style), multiple languages, audio mixing and ducking with FFmpeg, and timed voiceover segments.

## Social Media Reframing

When the user asks to reframe, ask which platform they're targeting. Use **blurred fill** by default for aspect ratio changes that would lose significant content (e.g., landscape to portrait). Use **center crop** when the content is center-focused. Use **letterbox** only if the user explicitly asks for it.

Read `references/platforms.md` for the platform specs, the three reframing strategies, and multi-platform batch export, and the "Social Media Reframing" section of `operations.md` for the FFmpeg commands for each strategy.

## Building a Video Editor UI

If the user wants a visual editor interface, create a `react-vite` artifact for the frontend and add API routes to `artifacts/api-server/` that process videos with FFmpeg. Read the "Building a Video Editor UI" section of `references/ffmpeg-setup.md` for the upload, storage, and frontend steps.

## Supporting Files

- `references/ffmpeg-setup.md` -- read before the first script or API route: environment, install commands, code patterns, editor UI
- `references/platforms.md` -- read when a platform is named or for chunking and reframing: specs, clip lengths, reframing strategies
- `operations.md` -- read for the exact FFmpeg command for any editing operation
- `virality-scoring.md` -- read before implementing virality scoring or auto-trim
- `voiceover.md` -- read before generating a voiceover or mixing it into a video
- `dead-space-and-chunking.md` -- read before implementing dead space removal or chunking

## Tested Bugs & Caveats (Do Not Regress)

These issues were discovered during real-world testing and are documented here to prevent regressions:

- **Scene detection:** The `ffprobe -f lavfi`approach does NOT work in Replit. Use`ffmpeg`with`select='gt(scene,threshold)',showinfo`and parse`pts_time` from stderr.
- **Segment indexing:** Use `index: segments.length`when building segments, NOT the loop counter`i` -- filtered segments cause index mismatches.
- **Minimum segment duration:** Use 2.0s minimum -- segments under 2 seconds waste API calls and don't produce useful scores.
- **Content safety:** OpenAI vision may reject frames (medical/documentary/news content). Always wrap AI calls in try/catch and skip failed segments gracefully.
- **Frame extraction timestamp clamping:** Clamp the last frame timestamp to `segment.endTime - 0.1`. Without this, the last clip in a video fails because`startTime + 1.0 * duration` can exceed the actual file duration due to floating point arithmetic.
- **`silenceremove` filter:** Only strips audio silence, NOT video frames. Must use segmented extract+concat approach for proper dead space removal.
- **Dead space with many segments:** Videos with lots of short dialogue (50+ speaking segments) can be very slow to process with re-encoding. Use `-preset ultrafast` for testing, or skip dead space removal for dialogue-heavy content where there's little dead space anyway.
- **OpenAI for scripts:** Install `openai` directly with `pnpm add -w openai`, create client with`AI_INTEGRATIONS_OPENAI_BASE_URL`and`AI_INTEGRATIONS_OPENAI_API_KEY` env vars. No need for the full workspace integration library.
- **AI scoring duration:** A 90-second video with ~13 segments takes 1-2 minutes for AI analysis. A 3.5-minute video with 9 clips takes ~3 minutes. Always warn the user and set generous timeouts.

## Limitations

- **No GPU acceleration** -- Replit containers do not have GPU access, so hardware encoding (NVENC, VAAPI) is unavailable. Use software encoding (libx264, libx265, libvpx-vp9).
- **Memory and CPU** -- Very large files or high-resolution encoding (4K+) may be slow or hit memory limits. For large files, prefer stream-copy (`-c copy`) where possible and avoid unnecessary re-encoding.
- **Disk space** -- Video files are large. Clean up temporary files after processing. Monitor disk usage for batch operations.
- **No real-time preview** -- FFmpeg processes offline. Users cannot preview effects in real-time during editing (unlike desktop NLEs). Generate short previews of segments instead.
