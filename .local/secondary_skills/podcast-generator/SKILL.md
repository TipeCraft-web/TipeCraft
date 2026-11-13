---
name: podcast-generator
description: Turn topics into podcast scripts and audio with ElevenLabs production.
---

# Podcast Generator

Turn research, articles, or topics into podcast-ready scripts and audio content. Generate conversational scripts with host/guest dynamics and produce audio using ElevenLabs text-to-speech. Supports script-only workflows, multilingual episodes, and series planning.

## When to Use

- User wants to turn written content into a podcast episode
- User wants to create a podcast-style summary of a topic or paper
- User wants to generate audio content from research
- User mentions "AI Pods", podcast, or audio content creation
- User wants a podcast script without audio generation (script-only mode)
- User wants to plan a podcast series or recurring show
- User says "create an episode about..." (topic-first requests without explicitly saying "podcast")
- User says "write a script for..." (scriptwriting intent that maps to podcast format)
- User says "make an audio version of..." (converting written content like articles, blog posts, or reports into listenable content)
- User says "plan my next episode" (continuing an existing series)
- User says "record / produce / generate an episode" (audio production intent)

## When NOT to Use

- Music creation or sound effects
- Video content (use storyboard skill for planning)
- Written summaries only (use deep-research skill)

## Workflow Modes

Before starting, determine which workflow the user needs:

| Mode | Description | When to Use |
|------|-------------|-------------|
| **Script-only** | Research + script writing, no audio | User wants the script first, no ElevenLabs key, or iterating on content before committing to audio |
| **Full production** | Research + script + audio generation + normalization | User has ElevenLabs key and wants the finished audio file |
| **Series planning** | Define show identity + episode calendar + recurring structure | User wants to build an ongoing podcast, not just a one-off episode |

If the user's intent is ambiguous, ask which mode they prefer. Default to **script-only** if no ElevenLabs key is available — do not block progress on audio setup.

## Reference Files

Read only the files the current mode and request need:

| File | Read when |
|------|-----------|
| `.local/secondary_skills/podcast-generator/references/research.md` | Always, at Step 1: research checklist, research brief template, parallel search strategy, data verification, and turning data into spoken lines |
| `.local/secondary_skills/podcast-generator/references/formats-and-scripts.md` | At Steps 2–3: format options, segment timing and word-count templates, episode length targets, the two-host NotebookLM pattern, script line format, and script-only production notes |
| `.local/secondary_skills/podcast-generator/references/audio-production.md` | Full production only, at Steps 4–5: ElevenLabs models, voice IDs, voice settings, rendering code, chunking, and loudness normalization |
| `.local/secondary_skills/podcast-generator/references/multilingual.md` | The episode is in a language other than English, or the audience is region-specific |
| `.local/secondary_skills/podcast-generator/references/series-planning.md` | Series planning mode, or continuing an existing series: show bible, episode calendar, and continuity rules |

## Methodology

### Step 1: Structured Research

Gather source material systematically. Do not skip this step — a well-researched script sounds authoritative; a loosely researched one sounds generic. Fill in the research brief from `references/research.md` before writing.

- Run at least 3 parallel web searches covering different facets of the topic; do not serialize them.
- Cross-reference facts across sources, and statistics across at least 2 sources. Flag anything unverified or contradictory and use it as discussion material rather than stating it as fact.
- Include the date context of the research ("as of [date]").

### Step 2: Format Selection

Choose the podcast format: solo explainer, conversational duo (recommended default), interview style, debate, or narrative. Use the segment timing template for that format from `references/formats-and-scripts.md`. In a duo, no host should have less than 40% of total lines.

### Step 3: Script Writing

Follow the two-host NotebookLM pattern in `references/formats-and-scripts.md`: an Explainer and a Questioner, a cold open, a setup, one idea per segment, takeaways, and an outro, at ~150 words per minute of audio.

- **Write for ears, not eyes:** contractions always, no semicolons, no parentheticals. If you wouldn't say it out loud, rewrite it.
- Use one line per utterance with the speaker tag in brackets (`[ALEX]: ...`) and a blank line between speakers. This is the unit you'll chunk for TTS.
- In script-only mode, end the script with the production notes block from `references/formats-and-scripts.md`, then stop.

### Step 4: Audio Generation — ElevenLabs

> **Skip this step in script-only mode.** If the user doesn't have an ElevenLabs key or only wants the script, deliver the script with production notes and stop here.

Render each utterance with ElevenLabs, chunk long utterances at sentence boundaries, and concatenate with short gaps between speakers, following `references/audio-production.md`.

### Step 5: Loudness Normalization

> **Skip this step in script-only mode.**

Normalize the episode to the podcast standard of **-16 LUFS** with `ffmpeg-normalize` (pydub's `normalize()` is peak-only, not LUFS). The exact command is in `references/audio-production.md`.

## Best Practices

1. **Hook early** — if the first 30 seconds aren't interesting, listeners skip
2. **One idea per segment** — don't cram too much; let ideas breathe
3. **Use stories and examples** — abstract concepts need concrete illustrations
4. **Vary pacing** — alternate between fast energy and slow, thoughtful moments
5. **End with value** — give listeners a clear takeaway or action item
6. **Ground in data** — every claim should trace back to your research; vague statements kill credibility
7. **Name your sources** — "according to fbref" or "the manager said in the press conference" adds authority
8. **Maintain series identity** — if this is part of a series, use the show bible for consistent tone, host names, and recurring elements

## Limitations

- Audio generation requires `ELEVENLABS_API_KEY` env var (script-only mode does not)
- Voices mispronounce technical terms/acronyms — spell phonetically in the script (`"Kubernetes"` → `"koo-ber-NET-eez"`) or use ElevenLabs pronunciation dictionaries
- `eleven_multilingual_v2` has known issues with very long single calls (voice drift, occasional stutter) — chunk at sentence boundaries, don't send 5K-char blobs
- Cost: ~$0.18–0.30 per 1000 characters depending on plan; a 20-min episode (~3000 words) ≈ $3–5
- Non-English voices: quality varies by language and voice; always test with a short sample before full rendering
