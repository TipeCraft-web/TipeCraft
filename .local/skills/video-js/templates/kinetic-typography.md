# Kinetic Typography

**Visual Reference**: Before writing any code, check `attached_assets/` for a template reference image (filename containing `kinetic-typography`). If present, open and visually read it — your first scene MUST match its layout, palette, typography, and composition as closely as possible. Build Scene 1, screenshot it, and compare against the reference before building the remaining scenes. If no reference image is attached, follow the exact values below.

The "KineticTypography" template is a pure type-driven editorial piece — no images, no icons, no panels; the words ARE the visuals. The background is warm ivory (#F4F1EA) with deep ink (#1A1A1A) type and a burnt vermilion accent (#D1481F) used for one emphasized word per scene and for a persistent underline bar that travels with the message. Typography: 'Archivo Black' for display words at extreme sizes (10-20vw, tight negative tracking) and 'Space Grotesk' for small marginalia (scene numbers, captions at 0.9vw with wide letter-spacing). Motion language is theatrical typography: per-character perspective staggers (rotateX from -70 with transformPerspective 800), words that scale up to become the next scene's background, baseline-shift reveals where letters rise from behind an invisible masking line, and zoomThrough transitions that push the camera through a counter of an O or a 0. The aesthetic feel is "editorial type poster in motion."

## Motion System

- **Entrances**: chars rise from below a baseline mask (`y: '110%'` to `0%`) with 0.02-0.04s stagger and rotateX settle
- **Exits**: the emphasized word scales to 8-12x and drives a zoom-through into the next scene
- **Default easing**: `[0.16, 1, 0.3, 1]` at 0.5-0.9s; micro-springs (stiffness 400, damping 25) on char settles
- **Accent transition**: the vermilion underline bar persists across scenes, resizing to sit under each scene's key word
- **Scene transitions**: scale-morphs and zoomThrough; the ivory/ink palette inverts on scene 4 for contrast

## Scene Structure (~21s total)

1. `word1` (3500ms) — single massive word rises char by char, underline draws
2. `build` (4000ms) — a sentence assembles line by line with alternating alignment
3. `pivot` (4000ms) — key word scales through the frame, palette holds
4. `invert` (5000ms) — ink background, ivory type, the message lands
5. `close` (4500ms) — return to ivory, final word + marginalia, underline settles

## Source Code

**Component:** `KineticTypography`

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
  word1: 3500,
  build: 4000,
  pivot: 4000,
  invert: 5000,
  close: 4500,
};

const UNDERLINE = [
  { left: '10vw', top: '62vh', width: '34vw' },
  { left: '54vw', top: '74vh', width: '22vw' },
  { left: '30vw', top: '56vh', width: '40vw' },
  { left: '10vw', top: '70vh', width: '18vw' },
  { left: '42vw', top: '64vh', width: '16vw' },
];

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });
  const inverted = currentScene === 3;

  return (
    <motion.div
      className="relative w-full h-screen overflow-hidden"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      animate={{ backgroundColor: inverted ? '#1A1A1A' : '#F4F1EA' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Persistent vermilion underline: travels to sit under each scene's key word */}
      <motion.div
        className="absolute h-[1.4vh]"
        style={{ backgroundColor: '#D1481F' }}
        animate={UNDERLINE[currentScene]}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Persistent marginalia: scene counter keeps the poster designed */}
      <motion.div
        className="absolute top-[5vh] right-[5vw] text-[0.9vw] tracking-[0.5em] uppercase"
        animate={{ color: inverted ? '#F4F1EA' : '#1A1A1A' }}
        transition={{ duration: 0.6 }}
      >
        {String(currentScene + 1).padStart(2, '0')} / 05
      </motion.div>

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="word1" />}
        {currentScene === 1 && <Scene2 key="build" />}
        {currentScene === 2 && <Scene3 key="pivot" />}
        {currentScene === 3 && <Scene4 key="invert" />}
        {currentScene === 4 && <Scene5 key="close" />}
      </AnimatePresence>
    </motion.div>
  );
}
```

### Scene 1 — Masked word rise (`src/components/video/video_scenes/Scene1.tsx`)

```tsx
import { motion } from 'framer-motion';

const WORD = 'BOLDER';

export function Scene1() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center px-[10vw]"
      exit={{ scale: 6, opacity: 0, transition: { duration: 0.7, ease: [0.7, 0, 0.84, 0] } }}
    >
      <h1
        className="text-[16vw] leading-[0.9] tracking-[-0.03em]"
        style={{ color: '#1A1A1A', fontFamily: "'Archivo Black', sans-serif" }}
      >
        {WORD.split('').map((char, i) => (
          // Each char rises from behind an overflow-hidden baseline mask
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
            <motion.span
              style={{ display: 'inline-block', transformPerspective: 800 }}
              initial={{ y: '110%', rotateX: -70, opacity: 0 }}
              animate={{ y: '0%', rotateX: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.15 + i * 0.05 }}
            >
              {char === 'O' ? <span style={{ color: '#D1481F' }}>O</span> : char}
            </motion.span>
          </span>
        ))}
      </h1>
    </motion.div>
  );
}
```

### Scene 2 — Line-by-line build (`src/components/video/video_scenes/Scene2.tsx`)

```tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const LINES = [
  { text: 'Some ideas whisper.', align: 'flex-start' as const, size: '4.5vw' },
  { text: 'Yours should not.', align: 'flex-end' as const, size: '6vw' },
];

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1400),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center gap-[4vh] px-[10vw]"
      exit={{ x: '-20vw', opacity: 0, filter: 'blur(14px)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {LINES.map((line, lineIndex) => (
        <div key={line.text} className="flex w-full" style={{ justifyContent: line.align }}>
          <div
            className="leading-[1]"
            style={{ color: '#1A1A1A', fontFamily: "'Archivo Black', sans-serif", fontSize: line.size }}
          >
            {line.text.split(' ').map((word, i) => (
              <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
                <motion.span
                  style={{
                    display: 'inline-block',
                    whiteSpace: 'pre',
                    color: word === 'not.' ? '#D1481F' : undefined,
                  }}
                  initial={{ y: '110%' }}
                  animate={phase >= lineIndex + 1 ? { y: '0%' } : { y: '110%' }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
                >
                  {word}{' '}
                </motion.span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
```

Extend these patterns to the remaining scenes: the pivot scene scales its vermilion key word until a counter (an O or 0) swallows the frame, the inverted scene sets ivory type on ink with slower, heavier reveals (0.8-0.9s), and the close scene returns to ivory with one final word plus small marginalia rows. Words carry all the meaning — keep each scene under seven words, vary alignment aggressively, and never let a scene sit static: chars keep micro-drifting (`y: [0, -3, 0]` loops at low amplitude) while lines are read. Every scene exits by scaling or sliding into the next so the loop stays continuous.
