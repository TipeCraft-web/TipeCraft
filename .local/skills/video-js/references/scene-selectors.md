---
name: video-scene-controls
description: Add interactive scene controls (play/pause, jump, lock-loop, progress bar, playback timer) to video-js artifacts. Use when building or updating the scene selector overlay for animated videos. Replaces the old scene-selectors.md pattern with a cleaner hook-based architecture.
---


# Video Scene Controls

Interactive control bar for video-js artifacts that lets viewers pause and resume playback, jump between scenes, lock-loop individual scenes, and see elapsed and total playback time. The bar renders only inside an iframe (the Replit preview pane) so exports stay clean.

## Architecture

Three files, clear separation of concerns:

| File | Role |
| --- | --- |
| `useSceneControls.ts` | Hook that encapsulates all playback workarounds behind a clean index-based API |
| `VideoWithControls.tsx` | Wrapper component: iframe gate, control bar UI, hover/tap reveal, scene-selection announcements to the workspace |
| `VideoTemplate.tsx` | Scene renderer: accepts optional `durations`, `loop`, `onSceneChange` props |

### Why the workarounds exist

The `useVideoPlayer` hook in `src/lib/video/hooks.ts` is read-only (the recording/export pipeline depends on it). It accepts a static `durations` object, advances linearly, and supports only a `paused` option. It has no `seekTo`, `loopCurrent`, or `setActiveScene` API. The `useSceneControls` hook works around these limitations:

- **Jumping to a scene**: Rotate the durations object so the target scene is first, then remount `VideoTemplate` via a `mountKey` bump.
- **Scene-lock looping**: Create a 2-entry durations object with the same scene under `_r1` / `_r2` suffixes. A single entry won't loop because `setCurrentScene(0)` is a no-op when already at 0.
- **Tracking the active scene**: `VideoTemplate` calls `onSceneChange(rawKey)` on every scene transition. The hook strips `_r1`/`_r2` suffixes and maps back to the original index.
- **Pausing**: the `paused` option freezes the scene clock (remaining time is carried across resume) and, via `VideoPausedContext`, any `useSceneTimer` events inside scenes. It does not stop DOM animations already in flight — `VideoWithControls` freezes those separately (see the pause effect below).

These workarounds are hidden inside the hook. Consumers just use `jumpTo(index)`, `toggleLock()`, and `togglePause()`.

## When to use

Run this step once, right after the initial scene build and a clean workflow log. Skip on iteration prompts. Do not delegate it to a subagent.

## Files to create/edit

Create the two new files under `src/components/video/`. The scaffold's `src/lib/video/controls.tsx`, `workspaceControls.ts`, `playerBridge.ts`, and `playerActions.ts` belong to a workspace feature that is off for this project and render no UI. Do not import from them.

### 1. `useSceneControls.ts`

```tsx
import { useCallback, useMemo, useState } from 'react';

const REPEAT_SUFFIX_RE = /_r[12]$/;

export function stripRepeatSuffix(key: string): string {
  return key.replace(REPEAT_SUFFIX_RE, '');
}

function rotateFromIndex(
  durations: Record<string, number>,
  startIndex: number,
): Record<string, number> {
  const keys = Object.keys(durations);
  if (startIndex <= 0) return durations;
  const result: Record<string, number> = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[(startIndex + i) % keys.length];
    result[key] = durations[key];
  }
  return result;
}

function buildLockedDurations(key: string, duration: number): Record<string, number> {
  return { [`${key}_r1`]: duration, [`${key}_r2`]: duration };
}

export function useSceneControls(baseDurations: Record<string, number>) {
  const sceneKeys = useMemo(() => Object.keys(baseDurations), [baseDurations]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mountKey, setMountKey] = useState(0);
  const [tick, setTick] = useState(0);

  const durations = useMemo(() => {
    if (locked) {
      const key = sceneKeys[activeIndex];
      return buildLockedDurations(key, baseDurations[key]);
    }
    return rotateFromIndex(baseDurations, activeIndex);
  }, [locked, activeIndex, sceneKeys, baseDurations]);

  const totalDuration = useMemo(
    () => Object.values(baseDurations).reduce((total, duration) => total + duration, 0),
    [baseDurations],
  );
  const activeStartTime = useMemo(
    () => sceneKeys
      .slice(0, activeIndex)
      .reduce((total, key) => total + baseDurations[key], 0),
    [activeIndex, baseDurations, sceneKeys],
  );

  const onSceneChange = useCallback(
    (rawKey: string) => {
      const clean = stripRepeatSuffix(rawKey);
      const idx = sceneKeys.indexOf(clean);
      if (idx >= 0) setActiveIndex(idx);
      setTick((t) => t + 1);
    },
    [sceneKeys],
  );
  // Jump and lock remount VideoTemplate, which restarts playback from the
  // target scene -- always resume so the paused state can't go stale.
  const jumpTo = useCallback((index: number) => {
    setActiveIndex(index);
    setPaused(false);
    setMountKey((k) => k + 1);
    setTick((t) => t + 1);
  }, []);

  const toggleLock = useCallback(() => {
    setLocked((prev) => !prev);
    setPaused(false);
    setMountKey((k) => k + 1);
    setTick((t) => t + 1);
  }, []);
  const togglePause = useCallback(() => {
    setPaused((prev) => !prev);
  }, []);
  return {
    sceneKeys,
    activeIndex,
    locked,
    paused,
    mountKey,
    tick,
    durations,
    activeDuration: baseDurations[sceneKeys[activeIndex]] ?? 0,
    activeStartTime,
    totalDuration,
    onSceneChange,
    jumpTo,
    toggleLock,
    togglePause,
  };
}
```

**Hook API:**

| Return value | Type | Description |
| --- | --- | --- |
| `sceneKeys` | `string[]` | Original scene keys in order |
| `activeIndex` | `number` | Index of the currently playing scene |
| `locked` | `boolean` | Whether scene-lock is on |
| `paused` | `boolean` | Whether playback is frozen |
| `mountKey` | `number` | Increments on jump/lock — use as `key` on `VideoTemplate` to force remount |
| `tick` | `number` | Increments on every scene change — drives progress bar reset |
| `durations` | `Record<string, number>` | Computed durations object to pass to `VideoTemplate` |
| `activeDuration` | `number` | Duration of the currently active scene in ms |
| `activeStartTime` | `number` | Canonical start time of the active scene in ms |
| `totalDuration` | `number` | Total duration of the canonical scene sequence in ms |
| `onSceneChange` | `(rawKey: string) => void` | Pass to `VideoTemplate`'s `onSceneChange` prop |
| `jumpTo` | `(index: number) => void` | Jump to scene by index (resumes playback) |
| `toggleLock` | `() => void` | Toggle scene-lock (resumes playback) |
| `togglePause` | `() => void` | Freeze or resume playback in place |

### 2. VideoTemplate changes

Export `SCENE_DURATIONS` and accept optional props. Strip `_r[12]` suffixes to resolve scene components:

```tsx
export const SCENE_DURATIONS = { /* the film's values */ };
const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  /* map each duration key to its scene component */
};
export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  paused = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  paused?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop, paused });
  useEffect(() => { onSceneChange?.(currentSceneKey); }, [currentSceneKey, onSceneChange]);
  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];
  return (
    <VideoPausedContext.Provider value={paused}>
      <div className="relative w-full h-screen overflow-hidden">
        {/* ... persistent background/midground layers using sceneIndex for position arrays ... */}
        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>
    </VideoPausedContext.Provider>
  );
}
```

**IMPORTANT — AnimatePresence key must be `currentSceneKey`, NOT `baseSceneKey`.** When scene-lock is active, the hook creates two durations entries with `_r1` / `_r2` suffixes that both map to the same base scene. If you use `baseSceneKey` as the key, both iterations produce the same key and AnimatePresence won't re-mount/re-animate the scene — causing the loop to appear frozen. Using `currentSceneKey` (which includes the suffix) ensures the key alternates between e.g. `build2_r1` and `build2_r2`, triggering a proper exit/enter cycle on every loop.

For persistent elements that use index-based position arrays (e.g. bottle position, background opacity), use `sceneIndex` (derived from `baseSceneKey`) instead of `currentScene` — this ensures they resolve to the correct position regardless of duration rotation.
Import `VideoPausedContext` from `@/lib/video` alongside `useVideoPlayer`. The provider lets `useSceneTimer` calls inside scenes freeze with the scene clock.
Defaults preserve existing behavior so the export path (`<VideoTemplate />` with no props) is identical to pre-controls behavior.
If the artifact's `src/lib/video/hooks.ts` predates the `paused` option (no `paused` field on `UseVideoPlayerOptions`, no `VideoPausedContext` export), skip the play/pause button and the pause wiring — do not modify `hooks.ts` to add it.
### 3. VideoWithControls wrapper

```tsx
const SCENE_DETAILS: Record<string, { title: string; filePath: string }> = {
  /* one entry per SCENE_DURATIONS key:
     title = short human-readable scene name (e.g. 'Intro'),
     filePath = the scene component's source file relative to the app root
     (e.g. 'src/components/video/scenes/IntroScene.tsx') */
};

function announceSceneSelection(index: number, sceneKeys: string[]) {
  const key = sceneKeys[index];
  const details = SCENE_DETAILS[key];
  // The workspace rejects selections without a source locator.
  if (!details?.filePath) return;
  window.parent.postMessage(
    {
      type: 'REPLIT_VIDEO_SCENE_SELECTED',
      payload: {
        sceneIndex: index,
        sceneCount: sceneKeys.length,
        sceneTitle: details.title || key,
        filePath: details.filePath,
        lineNumber: 1,
      },
    },
    '*',
  );
}

export default function VideoWithControls() {
  const isIframed = typeof window !== 'undefined' && window.self !== window.top;

  const {
    sceneKeys, activeIndex, locked, paused, mountKey, tick,
    durations, activeDuration, activeStartTime, totalDuration,
    onSceneChange, jumpTo, toggleLock, togglePause,
  } = useSceneControls(SCENE_DURATIONS);

  const handleJumpTo = useCallback((index: number) => {
    jumpTo(index);
    announceSceneSelection(index, sceneKeys);
  }, [jumpTo, sceneKeys]);
  // Freeze in-flight DOM animations: CSS animations/transitions and WAAPI,
  // which covers framer-motion's transform/opacity tweens. Resume only the
  // ones this effect paused so finished animations don't restart.
  useEffect(() => {
    if (!paused) return;
    const frozen = document
      .getAnimations()
      .filter((animation) => animation.playState === 'running');
    frozen.forEach((animation) => animation.pause());
    return () => frozen.forEach((animation) => animation.play());
  }, [paused]);
  // ... collapse/hover/tap state ...

  // Export path: no props, preserves recording markers
  if (!isIframed) return <VideoTemplate />;

  return (
    <div className="relative w-full h-screen">
      <VideoTemplate
        key={mountKey}
        durations={durations}
        loop
        paused={paused}
        onSceneChange={onSceneChange}
      />
      {/* Control bar sensor + ControlBar component (pass onJumpTo={handleJumpTo}) */}
    </div>
  );
}
```

Update `App.tsx` to render `VideoWithControls` instead of `VideoTemplate`. Do not wrap it in the component that `src/lib/video/controls.tsx` exports.
Pause coverage: the scene clock, `useSceneTimer` events, CSS/WAAPI animations, and the control-bar timer all freeze. If the video uses GSAP, also call `gsap.globalTimeline.pause()` / `.resume()` in the same effect; if it uses Lottie, pause the player via its ref. Framer-motion JS-driven springs and layout animations are not covered by `document.getAnimations()` — brief motion may finish settling after pause, which is acceptable.
## Scene selection for agent chat

The Replit workspace listens for `REPLIT_VIDEO_SCENE_SELECTED` messages from the preview iframe. When the user is in design mode and clicks a scene segment, the workspace turns the message into a chat selection labeled `Scene N/M - Title`, so the agent scopes the user's next request to that scene. Contract rules:

- Post the message ONLY from the user's click on a scene segment (`handleJumpTo`), never from automatic scene advancement or `onSceneChange`.
- `sceneIndex` is zero-based; `sceneCount` is the number of entries in `SCENE_DURATIONS`.
- Fill `SCENE_DETAILS` for every scene: `title` becomes the label the user sees; `filePath` must point at the file that implements the scene component so the agent can jump straight to it. `filePath` is required — the workspace ignores selections without it, and the helper skips posting for scenes missing from the map. Keep this map in sync when adding, removing, or reordering scenes.
- The wrapper only renders when iframed, so exports never post messages. Outside Replit (or outside design mode) the message is ignored by the parent page — no feature detection needed.

## Control bar UI

Full-width strip at the bottom of the video. Left-to-right inside the bar: **play/pause button, scene-lock button, vertical divider, segmented progress bar, scene counter, elapsed/total playback timer, collapse chevron**. When audio is present, its mute button sits between scene-lock and the divider. The bar sits inside a taller invisible hover sensor so it reappears on mouseover after the user has collapsed it.

### Visibility behavior

- Bar shows by default on load.
- Clicking the chevron hides it (slides down via `translate-y-full opacity-0 pointer-events-none`).
- While collapsed, moving the mouse into the bottom `height: 25%` of the video reveals it. Leaving the sensor hides it again.
- Clicking the chevron a second time (it now reads `ChevronUp`) pins the bar visible again even when the mouse leaves.
- On touch, tapping inside the sensor while collapsed pins the bar until the user taps outside the sensor.
- Use `translate-y` + `opacity` for the slide — not `display: none`, which would kill the hover sensor.

### ControlBar

```tsx
const PROGRESS_TICK_MS = 60;

interface ControlBarProps {
  visible: boolean;
  collapsed: boolean;
  locked: boolean;
  paused: boolean;
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  activeStartTime: number;
  totalDuration: number;
  tick: number;
  onTogglePause: () => void;
  onToggleLock: () => void;
  onJumpTo: (index: number) => void;
  onToggleCollapsed: () => void;
}

function ControlBar({
  visible, collapsed, locked, paused, sceneKeys, activeIndex, activeDuration,
  activeStartTime, totalDuration, tick,
  onTogglePause, onToggleLock, onJumpTo, onToggleCollapsed,
}: ControlBarProps) {
  return (
    <div
      className={`flex items-center gap-3 bg-black/50 backdrop-blur-sm px-5 py-4 transition-all duration-200 ease-out ${
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
      aria-hidden={!visible}
    >
      <button
        onClick={onTogglePause}
        className="w-14 h-14 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors rounded-lg shrink-0"
        title={paused ? 'Play' : 'Pause'}
        aria-label={paused ? 'Play' : 'Pause'}
      >
        {paused ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}
      </button>
      <button
        onClick={onToggleLock}
        className={`w-14 h-14 flex items-center justify-center transition-colors rounded-lg shrink-0 ${
          locked
            ? 'text-white bg-white/15 hover:bg-white/25'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
        title={locked ? 'Loop current scene: on' : 'Loop current scene: off'}
        aria-label={locked ? 'Loop current scene: on' : 'Loop current scene: off'}
        aria-pressed={locked}
      >
        <Repeat className="w-8 h-8" />
      </button>

      <div className="w-px self-stretch bg-white/15" aria-hidden="true" />

      <PlaybackStatus
        sceneKeys={sceneKeys}
        activeIndex={activeIndex}
        activeDuration={activeDuration}
        activeStartTime={activeStartTime}
        totalDuration={totalDuration}
        tick={tick}
        paused={paused}
        onJumpTo={onJumpTo}
      />

      <button
        onClick={onToggleCollapsed}
        className="w-14 h-14 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors rounded-lg shrink-0"
        title={collapsed ? 'Show controls' : 'Hide controls'}
        aria-label={collapsed ? 'Show controls' : 'Hide controls'}
        aria-expanded={!collapsed}
      >
        {collapsed ? <ChevronUp className="w-10 h-10" /> : <ChevronDown className="w-10 h-10" />}
      </button>
    </div>
  );
}
```

### PlaybackStatus (isolated timer)

The 60ms interval lives here so its ticks don't re-render `VideoWithControls` or `VideoTemplate`. Use this same clock for both the active segment fill and the playback timer so they cannot drift apart.

```tsx
function PlaybackStatus({
  sceneKeys, activeIndex, activeDuration, activeStartTime, totalDuration,
  tick, paused, onJumpTo,
}: {
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  activeStartTime: number;
  totalDuration: number;
  tick: number;
  paused: boolean;
  onJumpTo: (index: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  // Elapsed time accumulated before the current run of the interval, so the
  // timer resumes where it froze instead of restarting the scene at 0.
  const elapsedBaseRef = useRef(0);

  useEffect(() => {
    setElapsed(0);
    elapsedBaseRef.current = 0;
  }, [tick]);

  useEffect(() => {
    if (paused) return;
    const start = performance.now();
    const id = window.setInterval(() => {
      setElapsed(elapsedBaseRef.current + (performance.now() - start));
    }, PROGRESS_TICK_MS);
    return () => {
      window.clearInterval(id);
      elapsedBaseRef.current += performance.now() - start;
    };
  }, [tick, paused]);

  const progress = activeDuration > 0 ? Math.min(1, elapsed / activeDuration) : 0;
  const totalElapsed = Math.min(
    totalDuration,
    activeStartTime + Math.min(elapsed, activeDuration),
  );

  return (
    <>
      <div className="flex-1 flex items-center gap-1.5">
        {sceneKeys.map((key, i) => {
          const isActive = i === activeIndex;
          const fill = isActive ? progress * 100 : 0;
          return (
            <button
              key={key}
              onClick={() => onJumpTo(i)}
              className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden cursor-pointer hover:h-4 hover:bg-white/25 transition-all relative min-h-[12px]"
              aria-label={`Jump to scene ${i + 1}`}
              aria-current={isActive ? 'true' : undefined}
            >
              <div
                className="absolute inset-y-0 left-0 bg-white/90 rounded-full transition-[width] duration-100"
                style={{ width: `${fill}%` }}
              />
            </button>
          );
        })}
      </div>

      <div className="text-xl text-white/60 font-mono tabular-nums shrink-0">
        {activeIndex + 1}/{sceneKeys.length}
      </div>

      <div
        className="min-w-[11ch] text-right text-xl text-white/80 font-mono tabular-nums shrink-0"
        role="timer"
        aria-label={`Playback time ${formatPlaybackTime(totalElapsed)} of ${formatPlaybackTime(totalDuration)}`}
      >
        {formatPlaybackTime(totalElapsed)} / {formatPlaybackTime(totalDuration)}
      </div>
    </>
  );
}

function formatPlaybackTime(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
```

The timer shows canonical full-video time. It resets to `0:00` when the video loops, moves to the selected scene's start time after a scene jump, repeats within the active scene's canonical time range while scene-lock is enabled, and freezes in place while paused.

### Sizing notes
- Play/pause, scene-lock, and chevron buttons are all `w-14 h-14` (56px). Play/pause and scene-lock icons are `w-8 h-8`; chevron is `w-10 h-10` because `ChevronDown`/`ChevronUp` read visually lighter than `Repeat` at the same size.
- Progress segments are `h-3` normally, `h-4` on hover (makes them easier to click). `flex-1` keeps them equal width.
- Scene counter and playback timer are `text-xl` so they read alongside the 32–40px icons.
- Playback time uses `font-mono tabular-nums`, right alignment, and a stable minimum width so the bar does not shift as digits change.
- Bar container padding is `px-5 py-4`; gap between elements is `gap-3`.
- No text labels on segments — `aria-label` only. The scene counter gives the "N/total" context.

### Sensor + reveal (inside `VideoWithControls`)

```tsx
const sensorRef = useRef<HTMLDivElement | null>(null);
const [collapsed, setCollapsed] = useState(false);
const [hovering, setHovering] = useState(false);
const [tapPinned, setTapPinned] = useState(false);

const handlePointerEnter = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
  if (e.pointerType === 'mouse') setHovering(true);
}, []);
const handlePointerLeave = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
  if (e.pointerType === 'mouse') setHovering(false);
}, []);
const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
  if (e.pointerType === 'mouse') return;
  if (collapsed) setTapPinned(true);
}, [collapsed]);
const handleToggleCollapsed = useCallback(() => {
  setCollapsed(c => {
    // Clear any stale hover/tap-pin state so the chevron click wins.
    if (!c) { setHovering(false); setTapPinned(false); }
    return !c;
  });
}, []);

// Clear tapPinned when the user taps outside the sensor.
useEffect(() => {
  if (!(collapsed && tapPinned)) return;
  const onDocPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    const sensor = sensorRef.current;
    if (sensor && !sensor.contains(e.target as Node)) setTapPinned(false);
  };
  document.addEventListener('pointerdown', onDocPointerDown);
  return () => document.removeEventListener('pointerdown', onDocPointerDown);
}, [collapsed, tapPinned]);

const barVisible = !collapsed || hovering || tapPinned;

// In the return():
<div
  ref={sensorRef}
  className="absolute bottom-0 left-0 right-0 z-50 flex flex-col justify-end"
  style={{ height: '25%' }}
  onPointerEnter={handlePointerEnter}
  onPointerLeave={handlePointerLeave}
  onPointerDown={handlePointerDown}
>
  <div className="flex-1 w-full" aria-hidden="true" />
  <ControlBar
    visible={barVisible}
    collapsed={collapsed}
    locked={locked}
    paused={paused}
    sceneKeys={sceneKeys}
    activeIndex={activeIndex}
    activeDuration={activeDuration}
    activeStartTime={activeStartTime}
    totalDuration={totalDuration}
    tick={tick}
    onTogglePause={togglePause}
    onToggleLock={toggleLock}
    onJumpTo={handleJumpTo}
    onToggleCollapsed={handleToggleCollapsed}
  />
</div>
```

The invisible `flex-1 w-full` filler above the bar gives the pointer a target area to mouse into while the bar is hidden. The sensor stays mounted at all times so `onPointerEnter` re-fires on every re-entry, not just the first.

## Recording safety
- **Export path** (`!isIframed`): renders `<VideoTemplate />` with no props. `startRecording` fires on mount, `stopRecording` after the last scene. No rotation, no lock, no pause, no remounts — the export always plays through at full speed.
- **Preview path** (iframed): `window.startRecording` / `window.stopRecording` are undefined, so marker calls are no-ops. Mount key bumps and pausing are safe.

## Validation

1. Make sure that `src/App.tsx` imports `VideoWithControls` from `@/components/video/VideoWithControls` and imports nothing from `src/lib/video/controls.tsx`.
2. Run `bash scripts/validate-recording.sh` — fix any issues.
3. Restart the workflow.
4. Read logs — fix build errors until clean.
5. Call `presentArtifact`.

