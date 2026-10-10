# App Demo Showcase

**Visual Reference**: Before writing any code, check `attached_assets/` for a template reference image (filename containing `app-demo-showcase`). If present, open and visually read it — your first scene MUST match its layout, palette, typography, and composition as closely as possible. Build Scene 1, screenshot it, and compare against the reference before building the remaining scenes. If no reference image is attached, follow the exact values below.

The "AppDemoShowcase" template is a polished light-studio product tour: the app itself is the hero, presented inside a white browser frame on a calm fog backdrop. Colors: #EEF2F6 background with a faint dot grid (radial dots in rgba(15,23,42,0.06)), #0F172A primary ink, #64748B secondary text, #7C3AED violet accent, #FFFFFF frame and card surfaces with a 1px #E2E8F0 border and layered soft shadows (`0 1px 2px rgba(15,23,42,0.06), 0 12px 32px rgba(15,23,42,0.12)`). The app's main pane is always filled edge to edge: an app header row (page title, search pill, violet primary button, avatar), a stat-card row, and skeleton content cards below — avatar list rows with pill badges, mini chart bars in #E2E8F0/#EEF2F6 on #FBFCFE card surfaces — with the content cards stretched (flex) to the pane's full height so no scene shows dead white space. Typography: 'Sora' for display headlines (weights 600-700, tight tracking) and 'Inter' for UI labels and captions. The signature mechanic is a rendered mouse pointer (an ink arrow with a white outline) that persists across scenes and travels like a guide — it glides to a control, "clicks" it with a ripple pulse, and the camera dollies into that region while a violet callout chip annotates the feature. The aesthetic feel is "confident product keynote" — bright, airy, and precise, never cluttered.

## Motion System

- **Entrances**: y-offset fades and soft scale-ups with `ease: [0.16, 1, 0.3, 1]`, 0.4-0.7s; the browser frame arrives on a spring (stiffness 300, damping 26)
- **Camera**: the frame's stage scales and translates per scene (`scale` 1 → 1.35-1.7 with an offset origin) using easeInOut over 0.9-1.2s — dolly moves, never cuts. Keep zoom-ins moderate enough that the region's title and controls stay in frame
- **Cursor**: a persistent ~30px mouse-pointer arrow (ink fill, white outline, soft drop shadow), easing between scene positions over 0.8s; clicks emit an expanding violet ripple ring
- **Callouts**: white chips with a violet left tick, sliding in 0.45s circOut after the click lands
- **Scene transitions**: content inside the frame crossfades under the camera move; full-frame scenes (open, close) use soft slide-and-settle. Never hard cuts

## Scene Structure (~22s total)

1. `intro` (3000ms) — headline plus app-name chip; the browser frame rises into view, small and centered
2. `overview` (4500ms) — frame settles full-size; app header row, sidebar, stat cards, and full-height skeleton content cards (avatar list rows, a mini bar chart) build in staggered; the pointer glides in
3. `feature-one` (5000ms) — cursor clicks a sidebar item, ripple; camera dollies into the left region; callout chip annotates
4. `feature-two` (5000ms) — camera pans to the analytics region; cursor clicks a toggle, chart bars respond; second callout
5. `close` (4500ms) — camera pulls back, frame recedes and blurs; logo lockup with a domain pill settles over it

## Source Code

**Component:** `AppDemoShowcase`

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
  intro: 3000,
  overview: 4500,
  featureOne: 5000,
  featureTwo: 5000,
  close: 4500,
};

// Where the guide cursor rests in each scene; scenes add their own click ripples.
const CURSOR = [
  { left: '78vw', top: '82vh', opacity: 0 },
  { left: '62vw', top: '58vh', opacity: 1 },
  { left: '22vw', top: '38vh', opacity: 1 },
  { left: '73vw', top: '14vh', opacity: 1 },
  { left: '52vw', top: '78vh', opacity: 0 },
];

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: '#EEF2F6', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Persistent dot grid, OUTSIDE AnimatePresence */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(15,23,42,0.06) 1.5px, transparent 1.5px)',
          backgroundSize: '2.6vw 2.6vw',
        }}
      />

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="intro" />}
        {currentScene === 1 && <Scene2 key="overview" />}
        {currentScene === 2 && <Scene3 key="featureOne" />}
        {currentScene === 3 && <Scene4 key="featureTwo" />}
        {currentScene === 4 && <Scene5 key="close" />}
      </AnimatePresence>

      {/* Persistent guide pointer: travels between scenes, above all content */}
      <motion.div
        className="absolute z-50"
        animate={CURSOR[currentScene]}
        transition={{ duration: 0.8, ease: [0.45, 0, 0.25, 1] }}
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          style={{ filter: 'drop-shadow(0 2px 5px rgba(15,23,42,0.4))' }}
        >
          <path
            d="M4.8 2.2 L4.8 18.6 L9 14.9 L11.6 20.8 L14.4 19.6 L11.8 13.8 L17.4 13.4 Z"
            fill="#0F172A"
            stroke="#FFFFFF"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </div>
  );
}
```

### Shared browser frame (`src/components/video/video_scenes/BrowserFrame.tsx`)

```tsx
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// Every scene renders the SAME frame at matching coordinates so scene swaps
// read as one continuous shot; `camera` is the per-scene dolly transform.
export function BrowserFrame({
  camera,
  children,
}: {
  camera: { scale: number; x: string; y: string };
  children: ReactNode;
}) {
  return (
    <motion.div
      className="absolute left-[14vw] top-[14vh] w-[72vw] h-[72vh]"
      animate={camera}
      transition={{ duration: 1.1, ease: [0.45, 0, 0.25, 1] }}
    >
      <div
        className="w-full h-full rounded-2xl border overflow-hidden"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#E2E8F0',
          boxShadow:
            '0 1px 2px rgba(15,23,42,0.06), 0 12px 32px rgba(15,23,42,0.12)',
        }}
      >
        <div
          className="flex items-center gap-[0.5vw] px-[1.2vw] h-[4.5vh] border-b"
          style={{ borderColor: '#E2E8F0' }}
        >
          {['#FCA5A5', '#FCD34D', '#86EFAC'].map((dot) => (
            <div
              key={dot}
              className="w-[0.7vw] h-[0.7vw] rounded-full"
              style={{ backgroundColor: dot }}
            />
          ))}
          <div
            className="ml-[1vw] px-[1vw] py-[0.4vh] rounded-md text-[0.8vw]"
            style={{ backgroundColor: '#EEF2F6', color: '#64748B' }}
          >
            app.acme.dev
          </div>
        </div>
        <div className="relative w-full h-[calc(100%-4.5vh)]">{children}</div>
      </div>
    </motion.div>
  );
}
```

### Scene 3 — Feature zoom with click (`src/components/video/video_scenes/Scene3.tsx`)

```tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BrowserFrame } from './BrowserFrame';

const NAV_ITEMS = ['Dashboard', 'Pipelines', 'Alerts', 'Settings'];

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 900), // click lands
      setTimeout(() => setPhase(2), 1500), // callout annotates
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Dolly into the sidebar: scale up, push the stage right and down */}
      <BrowserFrame camera={{ scale: 1.7, x: '28vw', y: '12vh' }}>
        <div className="flex w-full h-full">
          <div
            className="w-[22%] h-full border-r px-[1vw] py-[2vh]"
            style={{ borderColor: '#E2E8F0' }}
          >
            {NAV_ITEMS.map((item, i) => (
              <motion.div
                key={item}
                className="rounded-lg px-[0.9vw] py-[1.2vh] mb-[1vh] text-[0.95vw] font-medium"
                animate={
                  i === 1 && phase >= 1
                    ? { backgroundColor: '#7C3AED', color: '#FFFFFF' }
                    : { backgroundColor: '#FFFFFF', color: '#0F172A' }
                }
                transition={{ duration: 0.25 }}
              >
                {item}
              </motion.div>
            ))}
          </div>
          <div className="flex-1 p-[1.5vw]">
            {[82, 64, 91].map((width, i) => (
              <motion.div
                key={i}
                className="h-[1.6vh] rounded mb-[1.4vh]"
                style={{ backgroundColor: '#EEF2F6', originX: 0 }}
                initial={{ scaleX: 0 }}
                animate={phase >= 1 ? { scaleX: width / 100 } : { scaleX: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </BrowserFrame>

      {/* Click ripple at the cursor's resting point */}
      {phase >= 1 && (
        <motion.div
          className="absolute left-[22vw] top-[38vh] w-[18px] h-[18px] rounded-full border-2"
          style={{ borderColor: '#7C3AED', translateX: '-50%', translateY: '-50%' }}
          initial={{ scale: 1, opacity: 0.9 }}
          animate={{ scale: 4.5, opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      )}

      {/* Callout chip */}
      <motion.div
        className="absolute left-[30vw] top-[24vh] flex items-center gap-[0.8vw] rounded-xl border px-[1.4vw] py-[1.4vh]"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#E2E8F0',
          boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
        }}
        initial={{ opacity: 0, x: -24 }}
        animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
        transition={{ duration: 0.45, ease: 'circOut' }}
      >
        <div className="w-[0.4vw] h-[3.2vh] rounded-full" style={{ backgroundColor: '#7C3AED' }} />
        <div>
          <div
            className="text-[1.15vw] font-semibold"
            style={{ color: '#0F172A', fontFamily: "'Sora', sans-serif" }}
          >
            One-click pipelines
          </div>
          <div className="text-[0.85vw]" style={{ color: '#64748B' }}>
            Ship a full workflow from the sidebar
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
```

Extend these patterns to the remaining scenes: the intro floats the headline and app-name chip above a small, rising frame (`camera={{ scale: 0.55, x: '0vw', y: '32vh' }}` — a slight bottom crop reads as the frame still rising); the overview settles the camera at `scale: 1` and staggers the app header row, sidebar, stat cards, and two skeleton content cards in with 0.08s delays — a list card of seven avatar-and-two-line rows with pill badges, and a mini bar-chart card, both stretched to the pane's full height (`flex-1` columns, rows spread with `justify-between`); feature-two pans the camera to the analytics region (`camera={{ scale: 1.35, x: '-16vw', y: '2vh' }}`) where the chart fills the pane height (`flex-1` bars), clicking the period toggle re-sorts animated bar heights, and a strip of three mini stat cards closes out the bottom so the zoom shows no empty pane; and the close pulls back to `scale: 0.88` with a blur while a 'Sora' logo lockup and a violet domain pill settle over the frame. Keep the same frame coordinates in every scene so the dolly reads as one continuous camera, always move the cursor before showing a ripple, and give every scene an exit animation so the loop back to Scene 1 stays clean.
