# Feature Launch

**Visual Reference**: Before writing any code, check `attached_assets/` for a template reference image (filename containing `feature-launch`). If present, open and visually read it — your first scene MUST match its layout, palette, typography, and composition as closely as possible. Build Scene 1, screenshot it, and compare against the reference before building the remaining scenes. If no reference image is attached, follow the exact values below.

The "FeatureLaunch" template is a high-energy kinetic launch piece. The background is near-black (#0A0A0A) with a warm cream (#F5EFE6) for primary type and a hot signal orange (#FF4D00) as the single accent that floods entire frames during transitions. A supporting warm gray (#8A8578) handles labels and metadata. Typography: 'Anton' for towering display numerals and headlines (uppercase, tight leading) and 'Inter' for small caps labels. Motion language is fast and percussive: 0.15-0.3s snaps, morphExpand color floods between scenes, oversized numerals that scale past the frame edge, and char-level staggers with overshoot springs (stiffness 500, damping 22). The aesthetic feel is "drop-day hype film" — bold, loud, confident, zero decoration that does not move.

## Motion System

- **Entrances**: hard snaps (0.2s) and overshoot springs; headline chars stagger at 0.025s intervals
- **Exits**: elements scale INTO the orange flood that becomes the next scene's background
- **Default easing**: `[0.22, 1, 0.36, 1]` for snaps; springs for numerals
- **Accent transition**: an orange panel `morphExpand`s from a shape to full-bleed, then reveals the next scene by shrinking to a corner chip
- **Scene transitions**: color floods and `clipPolygon` diagonal reveals; never fades

## Scene Structure (~19s total)

1. `countdown` (3000ms) — giant 3-2-1 numerals swap with spring overshoot
2. `tension` (3500ms) — "the wait is over" types in over a rising orange edge
3. `name` (4500ms) — feature name floods in on full orange, then inverts
4. `points` (4500ms) — three punchy proof lines snap in one at a time
5. `lockup` (3500ms) — logo + date lockup, orange chip settles in the corner

## Source Code

**Component:** `FeatureLaunch`

### Main wiring (`src/components/video/VideoTemplate.tsx`)

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const SCENE_DURATIONS = {
  countdown: 3000,
  tension: 3500,
  name: 4500,
  points: 4500,
  lockup: 3500,
};

// The orange panel is the persistent star: it morphs from accent chip to
// full-bleed flood and back, stitching scenes together.
const ORANGE_PANEL = [
  { left: '84vw', top: '8vh', width: '8vw', height: '8vw', rotate: 12 },
  { left: '0vw', top: '92vh', width: '100vw', height: '8vh', rotate: 0 },
  { left: '0vw', top: '0vh', width: '100vw', height: '100vh', rotate: 0 },
  { left: '-4vw', top: '-4vw', width: '30vw', height: '30vw', rotate: -8 },
  { left: '88vw', top: '82vh', width: '6vw', height: '6vw', rotate: 0 },
];

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: '#0A0A0A', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Persistent orange panel, OUTSIDE AnimatePresence: chip -> band -> flood -> shard -> chip */}
      <motion.div
        className="absolute"
        style={{ backgroundColor: '#FF4D00' }}
        animate={ORANGE_PANEL[currentScene]}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Persistent ticker rail: keeps motion alive while type is read */}
      <motion.div
        className="absolute bottom-[3vh] whitespace-nowrap text-[0.9vw] tracking-[0.5em] uppercase"
        style={{ color: '#8A8578' }}
        animate={{ x: ['100vw', '-140vw'] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
      >
        launch day — launch day — launch day — launch day — launch day
      </motion.div>

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="countdown" />}
        {currentScene === 1 && <Scene2 key="tension" />}
        {currentScene === 2 && <Scene3 key="name" />}
        {currentScene === 3 && <Scene4 key="points" />}
        {currentScene === 4 && <Scene5 key="lockup" />}
      </AnimatePresence>
    </div>
  );
}
```

### Scene 1 — Countdown (`src/components/video/video_scenes/Scene1.tsx`)

```tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Scene1() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const timers = [
      setTimeout(() => setCount(2), 900),
      setTimeout(() => setCount(1), 1800),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      exit={{ scale: 1.4, opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={count}
          className="text-[38vw] leading-none uppercase"
          style={{ color: '#F5EFE6', fontFamily: "'Anton', sans-serif" }}
          initial={{ scale: 0.4, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 1.6, opacity: 0, rotate: 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        >
          {count}
        </motion.div>
      </AnimatePresence>

      {/* Corner metadata keeps the frame designed, not empty */}
      <div
        className="absolute top-[6vh] left-[6vw] text-[1vw] tracking-[0.4em] uppercase"
        style={{ color: '#8A8578' }}
      >
        T-minus
      </div>
    </motion.div>
  );
}
```

### Scene 3 — Name reveal on flood (`src/components/video/video_scenes/Scene3.tsx`)

The persistent orange panel is full-bleed during this scene, so type sits directly on orange, then the palette inverts as the panel shrinks away at the scene change.

```tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 350),
      setTimeout(() => setPhase(2), 1600),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' }}
      animate={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
      exit={{ y: '-100vh' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <h1
        className="text-[11vw] leading-[0.92] uppercase text-center"
        style={{ color: '#0A0A0A', fontFamily: "'Anton', sans-serif" }}
      >
        {'TURBO MODE'.split('').map((char, i) => (
          <motion.span
            key={i}
            style={{ display: 'inline-block', whiteSpace: 'pre' }}
            initial={{ y: '110%', opacity: 0 }}
            animate={phase >= 1 ? { y: '0%', opacity: 1 } : { y: '110%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 24, delay: phase >= 1 ? i * 0.025 : 0 }}
          >
            {char}
          </motion.span>
        ))}
      </h1>
      <motion.div
        className="mt-[3vh] text-[1.4vw] tracking-[0.45em] uppercase"
        style={{ color: '#0A0A0A' }}
        initial={{ opacity: 0, letterSpacing: '0.9em' }}
        animate={phase >= 2 ? { opacity: 1, letterSpacing: '0.45em' } : { opacity: 0, letterSpacing: '0.9em' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        is here
      </motion.div>
    </motion.div>
  );
}
```

Extend these patterns to the remaining scenes: the tension scene types its line over the rising orange band, the points scene snaps three uppercase proof lines in from alternating sides (0.2s each, 0.5s apart), and the lockup scene pairs the logo with a launch date in `Anton` while the orange chip settles into the corner. Vary beat lengths — the countdown is punchy, the name reveal breathes. Every scene needs an exit so the loop back to the countdown lands clean.
