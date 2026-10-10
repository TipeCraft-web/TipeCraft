# Product Explainer

**Visual Reference**: Before writing any code, check `attached_assets/` for a template reference image (filename containing `product-explainer`). If present, open and visually read it — your first scene MUST match its layout, palette, typography, and composition as closely as possible. Build Scene 1, screenshot it, and compare against the reference before building the remaining scenes. If no reference image is attached, follow the exact values below.

The "ProductExplainer" template is a dark, engineered tech-product piece. The background is a deep slate (#0B1220) with a persistent, slowly drifting grid of hairlines (rgba(148,163,184,0.08)) and a soft radial glow in the brand blue. Colors: #0B1220 background, #E2E8F0 primary text, #94A3B8 secondary text, #3B82F6 brand accent, #1E293B panel surfaces with a 1px #334155 border. Typography: 'Space Grotesk' for display headlines (tight tracking, weights 500-700) and 'Inter' for body/labels. Motion language is crisp and snappy: circOut entrances between 0.3s and 0.6s, wipe and splitHorizontal scene transitions, and a persistent accent line that travels between scenes like a cursor. The aesthetic feel is "precision-engineered product film" — think dark developer-tool launch video, not neon sci-fi.

## Motion System

- **Entrances**: clip-path wipes and y-offset fades with `ease: [0.16, 1, 0.3, 1]`, 0.3-0.6s
- **Exits**: inverse wipe plus slight scale-down and blur
- **Default easing**: circOut; springs (stiffness 400, damping 30) reserved for the product-panel reveal
- **Accent transition**: the blue accent line sweeps to a new position on every scene change (persistent element outside `AnimatePresence`)
- **Scene transitions**: `splitHorizontal` and custom inset-wipes; never crossfades

## Scene Structure (~22s total)

1. `hook` (3500ms) — oversized claim, char-staggered, grid background fades up
2. `problem` (4000ms) — three pain-point labels stagger in along the accent line
3. `reveal` (5000ms) — product UI panel springs in over a glow, feature labels annotate it
4. `proof` (4500ms) — metric counters and a mini bar chart build up
5. `close` (4000ms) — logo lockup with tagline, accent line settles under it

## Source Code

**Component:** `ProductExplainer`

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
  hook: 3500,
  problem: 4000,
  reveal: 5000,
  proof: 4500,
  close: 4000,
};

const ACCENT_LINE = [
  { left: '8vw', top: '78vh', width: '24vw' },
  { left: '8vw', top: '20vh', width: '36vw' },
  { left: '56vw', top: '84vh', width: '30vw' },
  { left: '8vw', top: '86vh', width: '84vw' },
  { left: '38vw', top: '62vh', width: '24vw' },
];

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: '#0B1220', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Persistent background: engineered grid + drifting glow, OUTSIDE AnimatePresence */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)',
          backgroundSize: '4vw 4vw',
        }}
        animate={{ backgroundPosition: ['0vw 0vw', '4vw 4vw'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[55vw] h-[55vw] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%)' }}
        animate={{
          x: ['8vw', '48vw', '20vw', '60vw', '30vw'][currentScene],
          y: ['30vh', '-10vh', '40vh', '10vh', '20vh'][currentScene],
        }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Persistent accent line: travels between scenes like a cursor */}
      <motion.div
        className="absolute h-[2px]"
        style={{ backgroundColor: '#3B82F6' }}
        animate={ACCENT_LINE[currentScene]}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="hook" />}
        {currentScene === 1 && <Scene2 key="problem" />}
        {currentScene === 2 && <Scene3 key="reveal" />}
        {currentScene === 3 && <Scene4 key="proof" />}
        {currentScene === 4 && <Scene5 key="close" />}
      </AnimatePresence>
    </div>
  );
}
```

### Scene 1 — Hook (`src/components/video/video_scenes/Scene1.tsx`)

```tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1300),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center px-[8vw]"
      initial={{ clipPath: 'inset(0 100% 0 0)' }}
      animate={{ clipPath: 'inset(0 0% 0 0)' }}
      exit={{ opacity: 0, y: '-6vh', filter: 'blur(12px)' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="text-[1vw] tracking-[0.4em] uppercase mb-[3vh]"
        style={{ color: '#3B82F6', fontFamily: "'Space Grotesk', sans-serif" }}
        initial={{ opacity: 0, x: -20 }}
        animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
        transition={{ duration: 0.4, ease: 'circOut' }}
      >
        Introducing
      </motion.div>
      <h1
        className="text-[6.5vw] font-bold leading-[1.02] tracking-tight"
        style={{ color: '#E2E8F0', fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {'Ship faster.'.split('').map((char, i) => (
          <motion.span
            key={i}
            style={{ display: 'inline-block', whiteSpace: 'pre' }}
            initial={{ opacity: 0, y: 50 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: phase >= 1 ? i * 0.03 : 0 }}
          >
            {char}
          </motion.span>
        ))}
      </h1>
      <motion.p
        className="text-[1.6vw] mt-[3vh] max-w-[38vw]"
        style={{ color: '#94A3B8' }}
        initial={{ opacity: 0, filter: 'blur(8px)' }}
        animate={phase >= 2 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(8px)' }}
        transition={{ duration: 0.5 }}
      >
        The build pipeline your team actually wants.
      </motion.p>
    </motion.div>
  );
}
```

### Scene 3 — Product reveal (`src/components/video/video_scenes/Scene3.tsx`)

```tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const FEATURES = ['Zero-config caching', 'Parallel test shards', 'Instant rollback'];

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ clipPath: 'inset(50% 0 50% 0)' }}
      animate={{ clipPath: 'inset(0% 0 0% 0)' }}
      exit={{ opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Product panel: purely visual UI mockup, no interactivity */}
      <motion.div
        className="relative w-[52vw] rounded-xl border p-[2vw]"
        style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 60, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="flex gap-[0.6vw] mb-[1.6vw]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-[0.8vw] h-[0.8vw] rounded-full" style={{ backgroundColor: '#334155' }} />
          ))}
        </div>
        {[76, 58, 88].map((width, i) => (
          <motion.div
            key={i}
            className="h-[1.4vw] rounded mb-[1vw]"
            style={{ backgroundColor: i === 1 ? '#3B82F6' : '#334155', originX: 0 }}
            initial={{ scaleX: 0 }}
            animate={phase >= 2 ? { scaleX: width / 100 } : { scaleX: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.12 }}
          />
        ))}
      </motion.div>

      {/* Feature annotations stagger in beside the panel */}
      <div className="absolute right-[6vw] top-[24vh] flex flex-col gap-[3vh]">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature}
            className="flex items-center gap-[1vw]"
            initial={{ opacity: 0, x: 40 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.45, ease: 'circOut', delay: i * 0.15 }}
          >
            <div className="w-[1.4vw] h-[2px]" style={{ backgroundColor: '#3B82F6' }} />
            <span
              className="text-[1.3vw]"
              style={{ color: '#E2E8F0', fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {feature}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
```

Extend these patterns to the remaining scenes: the problem scene lays labels along the accent line, the proof scene animates counters with `useEffect` timers and bar growth via `scaleY`, and the close scene settles the accent line under a `Space Grotesk` logo lockup. Keep every scene on the same grid-and-glow background system, and give every scene an exit animation so the loop back to Scene 1 stays clean.
