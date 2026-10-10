# Data Story Reel

**Visual Reference**: Before writing any code, check `attached_assets/` for a template reference image (filename containing `data-story-reel`). If present, open and visually read it — your first scene MUST match its layout, palette, typography, and composition as closely as possible. Build Scene 1, screenshot it, and compare against the reference before building the remaining scenes. If no reference image is attached, follow the exact values below.

The "DataStoryReel" template is a formal, annual-report-style data piece that turns numbers into a narrative. The background is pure white (#FFFFFF) with a strictly dark palette: near-black ink (#0A0A0A), charcoal (#1F2937), slate gray (#4B5563) for secondary text, and a deep navy (#1E3A8A) as the single restrained accent. Typography: 'Bebas Neue' for display headlines, section titles, and the big numbers (uppercase, condensed, tight leading — formal poster energy) and 'Inter' for captions, axis labels, and source lines (0.9-1.2vw). Charts are styled divs and inline SVG — bars grow with `scaleY` from origin bottom, counters tick up via `requestAnimationFrame`, rules draw with `scaleX` — always annotated like a printed report graphic (hairline rules, small-caps Inter labels, a source line). Motion language is measured and confident: 0.6-1.0s reveals with `[0.16, 1, 0.3, 1]`, `splitVertical` page-turn transitions, and one inverted black-band scene for contrast. Every scene has a visibly different composition — headline poster, hero number, chart, inverted statement — so no two beats look alike. The aesthetic feel is "annual report set in motion."

## Motion System

- **Entrances**: rules draw first (scaleX), then numbers count up, then labels fade in — always that order
- **Exits**: charts compress toward their baseline plus a page-turn `splitVertical`
- **Default easing**: `[0.16, 1, 0.3, 1]`, 0.6-1.0s; no springs — this template is composed, not bouncy
- **Accent transition**: a thin black progress rule along the top edge fills across the whole video (persistent, keyed to scene index)
- **Scene transitions**: `splitVertical` and vertical wipes; the takeaway inverts to a black band for the finale

## Scene Structure (~23s total)

1. `setup` (4000ms) — poster headline in Bebas Neue over a giant outlined year numeral
2. `number` (4500ms) — the hero stat counts up in 22vw Bebas Neue, black underline draws
3. `compare` (5000ms) — animated bar comparison in the dark palette, bars grow one by one
4. `trend` (5000ms) — SVG line chart draws left to right, a navy annotation dot lands on the inflection
5. `takeaway` (4500ms) — black band slides across the white frame, white Bebas statement inside

## Source Code

**Component:** `DataStoryReel`

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
  setup: 4000,
  number: 4500,
  compare: 5000,
  trend: 5000,
  takeaway: 4500,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Persistent story progress rule along the top edge */}
      <motion.div
        className="absolute top-0 left-0 h-[0.8vh]"
        style={{ backgroundColor: '#0A0A0A', originX: 0 }}
        animate={{ scaleX: (currentScene + 1) / 5, width: '100vw' }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Persistent folio: section label + scene index anchor every scene */}
      <div
        className="absolute top-[4.5vh] left-[6vw] text-[0.9vw] tracking-[0.4em] uppercase"
        style={{ color: '#4B5563' }}
      >
        By the numbers
      </div>
      <div
        className="absolute top-[4.5vh] right-[6vw] text-[1.6vw]"
        style={{ color: '#0A0A0A', fontFamily: "'Bebas Neue', sans-serif" }}
      >
        {String(currentScene + 1).padStart(2, '0')}
      </div>

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="setup" />}
        {currentScene === 1 && <Scene2 key="number" />}
        {currentScene === 2 && <Scene3 key="compare" />}
        {currentScene === 3 && <Scene4 key="trend" />}
        {currentScene === 4 && <Scene5 key="takeaway" />}
      </AnimatePresence>
    </div>
  );
}
```

### Scene 1 — Poster setup (`src/components/video/video_scenes/Scene1.tsx`)

```tsx
import { motion } from 'framer-motion';

export function Scene1() {
  return (
    <motion.div
      className="absolute inset-0"
      exit={{ opacity: 0, y: '-4vh' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Giant outlined year numeral behind the headline */}
      <motion.div
        className="absolute right-[2vw] bottom-[-6vh] leading-none select-none"
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '42vw',
          color: 'transparent',
          WebkitTextStroke: '2px #E5E7EB',
        }}
        initial={{ opacity: 0, x: '4vw' }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        26
      </motion.div>

      <div className="absolute left-[6vw] top-[30vh]">
        <motion.div
          className="h-[0.5vh] mb-[3vh]"
          style={{ backgroundColor: '#0A0A0A', originX: 0, width: '14vw' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
        <h1
          className="leading-[0.95] uppercase"
          style={{ color: '#0A0A0A', fontFamily: "'Bebas Neue', sans-serif", fontSize: '11vw' }}
        >
          {['The year', 'in numbers'].map((line, lineIndex) => (
            <span key={line} className="block" style={{ overflow: 'hidden' }}>
              <motion.span
                className="block"
                initial={{ y: '110%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 + lineIndex * 0.15 }}
              >
                {lineIndex === 1 ? (
                  <>
                    in <span style={{ color: '#1E3A8A' }}>numbers</span>
                  </>
                ) : (
                  line
                )}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p
          className="mt-[3vh] text-[1.2vw] max-w-[30vw]"
          style={{ color: '#4B5563' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.9 }}
        >
          Twelve months of shipping, measured.
        </motion.p>
      </div>
    </motion.div>
  );
}
```

### Scene 2 — Hero stat counter (`src/components/video/video_scenes/Scene2.tsx`)

```tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const TARGET = 63;
const COUNT_MS = 1200;

export function Scene2() {
  const [value, setValue] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / COUNT_MS, 1);
      // easeOutCubic so the counter lands softly on the target
      setValue(Math.round(TARGET * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const timers = [setTimeout(() => setPhase(1), COUNT_MS + 300)];
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ clipPath: 'inset(0 50% 0 50%)' }}
      animate={{ clipPath: 'inset(0 0% 0 0%)' }}
      exit={{ opacity: 0, y: '-4vh' }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      <div
        className="text-[24vw] leading-none tabular-nums"
        style={{ color: '#0A0A0A', fontFamily: "'Bebas Neue', sans-serif" }}
      >
        {value}
        <span style={{ color: '#1E3A8A' }}>%</span>
      </div>
      <motion.div
        className="h-[0.8vh] mt-[1vh]"
        style={{ backgroundColor: '#0A0A0A', originX: 0, width: '24vw' }}
        initial={{ scaleX: 0 }}
        animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.p
        className="mt-[3vh] text-[1.4vw]"
        style={{ color: '#4B5563' }}
        initial={{ opacity: 0, y: 16 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        of teams shipped faster within one quarter
      </motion.p>
    </motion.div>
  );
}
```

### Scene 3 — Animated bar comparison (`src/components/video/video_scenes/Scene3.tsx`)

```tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const BARS = [
  { label: 'Before', value: 34, color: '#4B5563' },
  { label: 'Industry avg', value: 51, color: '#1F2937' },
  { label: 'After', value: 86, color: '#1E3A8A' },
];

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1900),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center px-[12vw]"
      initial={{ clipPath: 'inset(0 50% 0 50%)' }}
      animate={{ clipPath: 'inset(0 0% 0 0%)' }}
      exit={{ opacity: 0, scaleY: 0.9, transformOrigin: 'bottom' }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      <h2
        className="text-[5vw] uppercase mb-[5vh]"
        style={{ color: '#0A0A0A', fontFamily: "'Bebas Neue', sans-serif" }}
      >
        Cycle time, compared
      </h2>
      <div className="flex items-end gap-[6vw] h-[40vh]">
        {BARS.map((bar, i) => (
          <div key={bar.label} className="flex flex-col items-center flex-1 h-full justify-end">
            <motion.div
              className="w-full"
              style={{ backgroundColor: bar.color, originY: 1, height: `${bar.value}%` }}
              initial={{ scaleY: 0 }}
              animate={phase >= 1 ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: i * 0.25 }}
            />
            <motion.span
              className="mt-[2vh] text-[1.1vw] tracking-[0.15em] uppercase"
              style={{ color: '#1F2937' }}
              initial={{ opacity: 0 }}
              animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              {bar.label}
            </motion.span>
          </div>
        ))}
      </div>
      <motion.div
        className="mt-[4vh] text-[0.9vw]"
        style={{ color: '#4B5563' }}
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        Source: internal delivery metrics, FY26
      </motion.div>
    </motion.div>
  );
}
```

### Scene 5 — Inverted takeaway band (`src/components/video/video_scenes/Scene5.tsx`)

```tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [setTimeout(() => setPhase(1), 700)];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Black band wipes across the white frame */}
      <motion.div
        className="absolute left-0 w-full flex items-center justify-center"
        style={{ backgroundColor: '#0A0A0A', top: '32vh', height: '36vh' }}
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2
          className="uppercase text-center leading-none"
          style={{ color: '#FFFFFF', fontFamily: "'Bebas Neue', sans-serif", fontSize: '7vw' }}
        >
          Ship faster. <span style={{ color: '#93C5FD' }}>Prove it.</span>
        </h2>
      </motion.div>
      <motion.div
        className="absolute bottom-[12vh] w-full text-center text-[0.9vw] tracking-[0.3em] uppercase"
        style={{ color: '#4B5563' }}
        initial={{ opacity: 0 }}
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        Full report — example.com/numbers
      </motion.div>
    </motion.div>
  );
}
```

Extend these patterns to the trend scene: an inline SVG polyline drawing left to right with `pathLength`, hairline gray axes, and a navy annotation dot landing on the inflection point with an Inter label. Numbers always animate — never render a static figure — and every chart carries report-style annotations. Compositions must stay visibly distinct scene to scene (poster, number, chart, line, inverted band); keep the white ground and dark palette constant so the reel reads as one document, and give every scene a baseline-compress exit for a clean loop.
