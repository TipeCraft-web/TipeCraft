# Social Announcement

**Visual Reference**: Before writing any code, check `attached_assets/` for a template reference image (filename containing `social-announcement`). If present, open and visually read it — your first scene MUST match its layout, palette, typography, and composition as closely as possible. Build Scene 1, screenshot it, and compare against the reference before building the remaining scenes. If no reference image is attached, follow the exact values below.

The "SocialAnnouncement" template is a playful, sticker-pop announcement built for feed-stopping energy. The background is saturated sunshine (#FFD23F) with deep charcoal ink (#1E1E24), punch pink (#FF4E88), and cobalt (#3D5AFE) as rotating accents; white (#FFFFFF) cards carry the message like oversized stickers with 0.4vw charcoal borders and hard offset shadows (no blur, 0.8vw offset). Typography: 'Baloo 2' (weights 600-800) for chunky rounded display type and 'Nunito' for supporting lines. Motion language is bouncy and tactile: everything enters with overshoot springs (stiffness 300-500, damping 14-18), sticker cards rock a few degrees on landing, a confetti field of dots and squiggles drifts continuously, and scenes hand off via `clipCircle` blooms from the last tapped-looking element. Even though the piece is 16:9, the composition keeps the message inside a centered square safe zone so crops for social feel natural. The aesthetic feel is "sticker sheet come to life."

## Motion System

- **Entrances**: overshoot springs with 2-4 degree rotation settle; stagger siblings 0.08-0.12s
- **Exits**: cards pop off-screen with a shrink-then-fling; the next scene blooms through a `clipCircle`
- **Default easing**: springs everywhere; reserve one slow drift (confetti field) as the constant backdrop
- **Accent transition**: background color rotates per scene (#FFD23F → #FF4E88 → #3D5AFE → #FFD23F → #1E1E24) — the swap happens on the persistent root, not inside scenes
- **Scene transitions**: `clipCircle` blooms and card flings; never straight fades

## Scene Structure (~18s total)

1. `tease` (3000ms) — "psst." sticker drops in, confetti scatters
2. `drop` (4000ms) — the announcement headline stacks in as three sticker cards
3. `detail` (4000ms) — key detail (date/price/name) wobbles in on a badge
4. `hype` (3500ms) — repeated word marquee + burst shapes
5. `handle` (3500ms) — logo/handle lockup on ink, confetti settles

## Source Code

**Component:** `SocialAnnouncement`

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
  tease: 3000,
  drop: 4000,
  detail: 4000,
  hype: 3500,
  handle: 3500,
};

const SCENE_BG = ['#FFD23F', '#FF4E88', '#3D5AFE', '#FFD23F', '#1E1E24'];

const CONFETTI = [
  { x: '12vw', y: '18vh', size: '1.2vw', color: '#FF4E88', shape: 'circle' },
  { x: '82vw', y: '12vh', size: '1.6vw', color: '#3D5AFE', shape: 'square' },
  { x: '70vw', y: '78vh', size: '1vw', color: '#1E1E24', shape: 'circle' },
  { x: '20vw', y: '80vh', size: '1.4vw', color: '#FFFFFF', shape: 'square' },
  { x: '90vw', y: '48vh', size: '1.1vw', color: '#FF4E88', shape: 'circle' },
  { x: '6vw', y: '50vh', size: '1.3vw', color: '#3D5AFE', shape: 'circle' },
] as const;

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <motion.div
      className="relative w-full h-screen overflow-hidden"
      style={{ fontFamily: "'Nunito', sans-serif" }}
      animate={{ backgroundColor: SCENE_BG[currentScene] }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Persistent confetti field: drifts and spins forever, OUTSIDE AnimatePresence */}
      {CONFETTI.map((piece, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: piece.x,
            top: piece.y,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: piece.shape === 'circle' ? '9999px' : '0.2vw',
          }}
          animate={{ y: [0, -14, 0], rotate: [0, i % 2 === 0 ? 180 : -180, 360] }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="tease" />}
        {currentScene === 1 && <Scene2 key="drop" />}
        {currentScene === 2 && <Scene3 key="detail" />}
        {currentScene === 3 && <Scene4 key="hype" />}
        {currentScene === 4 && <Scene5 key="handle" />}
      </AnimatePresence>
    </motion.div>
  );
}
```

### Scene 1 — Sticker tease (`src/components/video/video_scenes/Scene1.tsx`)

```tsx
import { motion } from 'framer-motion';

export function Scene1() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        className="px-[4vw] py-[2.5vh] bg-white"
        style={{
          border: '0.4vw solid #1E1E24',
          borderRadius: '2vw',
          boxShadow: '0.8vw 0.8vw 0 #1E1E24',
        }}
        initial={{ y: '-120vh', rotate: -14 }}
        animate={{ y: 0, rotate: -3 }}
        exit={{ scale: 0.6, y: '30vh', rotate: 10, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 16 }}
      >
        <span
          className="text-[7vw] font-extrabold"
          style={{ color: '#1E1E24', fontFamily: "'Baloo 2', sans-serif" }}
        >
          psst.
        </span>
      </motion.div>

      {/* Burst lines radiate on landing — decorative, timed after the sticker settles */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <motion.div
          key={angle}
          className="absolute w-[3vw] h-[0.5vh] rounded-full"
          style={{
            backgroundColor: '#1E1E24',
            rotate: angle,
            transformOrigin: 'center',
            translate: `${Math.cos((angle * Math.PI) / 180) * 16}vw ${Math.sin((angle * Math.PI) / 180) * 16}vw`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1, 0.6], opacity: [0, 1, 0] }}
          transition={{ duration: 0.7, delay: 0.55, ease: 'circOut' }}
        />
      ))}
    </motion.div>
  );
}
```

### Scene 2 — Stacked announcement cards (`src/components/video/video_scenes/Scene2.tsx`)

```tsx
import { motion } from 'framer-motion';

const CARDS = [
  { text: 'WE JUST', rotate: -2.5, bg: '#FFFFFF', color: '#1E1E24' },
  { text: 'LAUNCHED', rotate: 1.8, bg: '#1E1E24', color: '#FFD23F' },
  { text: 'SOMETHING BIG', rotate: -1.2, bg: '#FFFFFF', color: '#FF4E88' },
];

export function Scene2() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center gap-[2.5vh]"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(120% at 50% 50%)' }}
      exit={{ y: '-100vh', rotate: -4 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      {CARDS.map((card, i) => (
        <motion.div
          key={card.text}
          className="px-[3.5vw] py-[1.6vh]"
          style={{
            backgroundColor: card.bg,
            border: '0.4vw solid #1E1E24',
            borderRadius: '1.6vw',
            boxShadow: '0.8vw 0.8vw 0 #1E1E24',
          }}
          initial={{ scale: 0, rotate: card.rotate * 4 }}
          animate={{ scale: 1, rotate: card.rotate }}
          transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.15 + i * 0.12 }}
        >
          <span
            className="text-[4.5vw] font-extrabold tracking-tight"
            style={{ color: card.color, fontFamily: "'Baloo 2', sans-serif" }}
          >
            {card.text}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}
```

Extend these patterns to the remaining scenes: the detail scene wobbles a circular badge in (spring stiffness 500, damping 14) with the date or price set in `Baloo 2`, the hype scene runs a repeated-word marquee (two staggered rows moving opposite directions) behind burst shapes, and the handle scene lands the logo or @handle as a white sticker on the ink background while the confetti slows. Keep the message inside the centered square safe zone, rotate every sticker a few off-axis degrees, and make every exit a fling or bloom so the loop back to "psst." feels like the next post.
