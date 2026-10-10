---
name: video-js
description: Create and revise short Replit Animation films (v3.1, with composition/pacing floors, scaffold-protection and frame-capture recipes, transition render-cost rules, photography-first product rules, signature-detail fidelity, compound-transition rules, persistent-layer ownership, subagent-output verification, and revision-integrity checks) directly with React, Framer Motion, GSAP, and animated SVG. Use for dynamic product launches, brand films, kinetic typography, social announcements, and After Effects-style motion graphics. Prioritizes distinct shot compositions, purposeful choreography, product reveals, and reliable playback/export. Videos auto-play, loop, and have no interactive elements. Attached media assets (images, video clips) can be used as elements. Not a timeline video editor (no trimming, splicing, or footage editing) and not an After Effects project exporter.
---

# Replit Animation -- Motion Design

v3.1 -- adds 4b no-empty-frame/wipe-tail floors, 6b push-through recipe, 8 outlined-type rule, 8d scaffold protection, 11 filter-on-scaled-plane rule, 13 frame-capture recipe. Learned on a 20 s Gap linen-shirt brand film.

Build a directed motion piece, not a presentation with animated entrances.

This is a single-agent creative and implementation workflow. The agent owns the concept, assets, composition, animation, audio integration, and verification.

## 0. Platform steps before any creative work

**Ratio step (before any other work).** Read `.local/skills/video-js/references/resolution.md`. For a NEW video, complete its required ratio question before research, artifact creation, planning, template selection, or file changes. If you ask the question, end your turn and wait for the user's answer. Skip the question only when that reference permits it. Before creating the artifact, resolve the selected ratio to one exact `selectedVideoAspectRatio` value (`16:9`, `9:16`, `1:1`, or `4:5`) and persist it as that reference describes.

**Brand assets step.** If the request names a real company, product, or brand whose visual identity should appear (logos, fonts, brand colors) and the user did not attach those assets, gather them before designing:

- Use `extractBranding` on the official site for brand tokens (colors, fonts) and logo asset URLs.
- Download each usable logo image into `attached_assets/` and verify it is a real image file (SVG/PNG content, not an HTML page); discard anything that fails.
- If `extractBranding` gave no usable logo, use `imageSearch` (`"<company> logo png"` or `"<company> logo transparent"`, preferring official domains and press or brand asset pages), then download the best candidate the same way.

Skip this step when no real brand is involved, the user attached the brand assets, or the callbacks are unavailable or fail. Distilled facts only: keep the logo file paths, font names (with the closest Google Fonts match when proprietary), hex codes, and source URL for the treatment.

**First build.** For a NEW film, `.local/skills/video-js/references/first-build.md` owns the build order (artifact creation, script, assets, scenes, workflow restart, audio, controls, verification, presentation). Read it once and follow it; this file supplies the creative and technical rules it relies on.

## 1. Operating contract

- Implement directly by default. Do not automatically delegate the film to a design subagent.
- Honor an explicit request to work without subagents. Otherwise, narrow independent assistance is optional, not a prerequisite to starting.
- Make concrete creative decisions rather than repeatedly asking permission for routine choices.
- Script the entire film shot by shot before animation code or asset generation. A treatment, scene outline, or motion-effects list alone does not satisfy this requirement.
- Preserve successful scenes when revising. A request about the last three scenes is not permission to redesign the opening.
- This skill supplies the build workflow. Do not also execute a legacy first-build recipe that mandates delegation, prohibits creative direction, or repeats finalization. Higher-priority platform instructions still apply.
- Do not edit platform-managed skill files. Save editable variants in the user-skill directory and clearly identify what was installed versus supplied as a proposed replacement.
- Make no model-specific capability claims. Discover available tools through their documented skills.

### What you are producing

A short, auto-playing, looping film rendered in the browser. Usually 15-45 seconds; 60 seconds when the story needs it. Treat two minutes as an upper bound, not a target.

<no_interactivity>
No navigation, buttons, hover dependencies, forms, or playback controls inside the composition. The workspace supplies playback controls outside the film. Product-interface elements may appear as noninteractive artwork. No CTA buttons ("Get started", "Learn more"), no arrows, menus, tabs, or pagination dots, no form elements. If a product mockup contains a button, render it as a purely visual element.
</no_interactivity>

This produces After Effects-style visual language, not an .aep file. It is not a footage-editing application. If a user wants to trim, splice, or edit existing footage, this is the wrong stack.

## 2. Resolve the brief without slowing the work

Before a new film, establish:

- Subject, audience, and one takeaway.
- Format: 16:9, 9:16, 1:1, or 4:5. Before creative work, read `references/resolution.md` and follow its ratio instructions exactly.
- Approximate runtime.
- Brand inputs, provided assets, and any explicit creative references.

Infer format from an unambiguous request: Shorts/Reels -> 9:16; square feed -> 1:1. Ask one concise question when format is consequential and unspecified. If the user explicitly delegates the choice or asks to skip questions, use 16:9 and state it briefly. Preserve an existing film's ratio unless a change is requested.

"Dynamic After Effects-style product launch" is enough motion direction to proceed. It does not specify a palette, but the brand and subject can resolve that. Do not force a template questionnaire after the user has already given actionable direction.

If the environment requires a style/ratio picker, use it once. If the user selects a template, preserve its recognizable identity, not necessarily every source layout. Recompose for the chosen ratio.

Use the artifact tools to list existing artifacts before creating one. Reuse a matching video; create a video-js artifact for a new product or standalone film. Persist `videoAspectRatio` through the validated artifact-configuration workflow, never a direct edit to protected TOML.

## 3. Write a compact director's treatment

Before code, make six decisions. A few lines are enough:

- **Promise:** What should the viewer remember?
- **Identity:** Brand-derived palette, one display face, one supporting face.
- **Hero:** The object, interface, person, or visual mechanism that carries the film.
- **Motion:** Two or three dominant techniques, named precisely.
- **Arc:** How energy changes from hook to reveal to conclusion.
- **Payoff:** What makes the ending structurally different from the middle?

Good:

> Coffee as a morning upgrade. Espresso, cream, and gold; editorial serif paired with bold launch typography. Roasted beans become a pour, then a centered cup reveal. Use object-scale transitions, masked type, and short punch cuts. Accelerate through preparation, pause for the product, finish on a gold brand lockup.

Weak:

> Make it premium, cinematic, beautiful, engaging, and smooth.

Keep creative language in the treatment. Progress updates should plainly describe what is changing.

## 4. Mandatory preproduction: fully script every shot

A scene is a container for a choreographed sequence. It should not be "headline enters, supporting line enters, hold, slide away."

Do not start animation implementation or asset generation until the entire film has a written shot-by-shot script and has passed the variety review below. Research and inspect existing assets first as needed. Save the script in the artifact's `SCRIPT.md` so the creative decisions guide implementation rather than being invented one component at a time. Do not turn this into an approval gate unless the user asks to review before building.

The compact treatment establishes direction; it does not replace the script. Script every shot from opening frame through final hold and loop handoff. A shot is a framing/action unit, not necessarily a React scene: one scene may contain several cuts, reframings, or timed micro-shots.

For a revision, inspect the whole film's script, fully rescript the affected shots and their incoming/outgoing transitions, and preserve successful unaffected shots. If no script exists, first map the current film so the revised sequence can be judged in context.

### Required script fields for every shot

- **Number and timing:** Exact start, end, duration, and any internal cut points. Durations must account for the whole runtime without accidental gaps or double-counted overlaps.
- **Purpose:** The idea, feeling, or product detail this shot communicates.
- **Exact content:** Every on-screen word, its appearance and hold times, and any requested narration. No "headline here" placeholders.
- **Composition:** Opening and ending framing; focal point, subject scale, position, crop, depth layers, negative space, palette, and lighting.
- **Artistic idea:** The specific visual invention that makes the shot interesting -- a material transformation, unexpected crop, typographic/object relationship, scale reversal, or graphic match. "Premium" and "cinematic" are not ideas.
- **Timed choreography:** Describe what moves, how, and when, including the main action, secondary reactions, camera movement, and the settled readable frame. Include meaningful events after the entrance.
- **Transition contract:** What carries over from the previous shot and exactly how the next shot is revealed. Identify shared objects, matching geometry, overlapping actions, or the motivation for a hard cut.
- **Assets and technique:** Required imagery, cutouts, geometry, fonts, masks, SVG effects, or footage. Mark what already exists and what must be created.
- **Sound intent:** Silence, music character, or an intended accent; include VO/SFX only when requested. Mark planned beat alignment as unverified until the audio exists.

Use a timeline table to check pacing, then expand each row into its full script:

| Time | Viewer's focus | Motion event | Composition | Handoff |
| --- | --- | --- | --- | --- |
| 0-4s | A hero object and short hook | Object rushes into focus; letters resolve in two beats | Asymmetric, layered depth | Push into the object |
| 4-8s | Material or mechanism | Macro crop, controlled rotation, match cut | Full-bleed detail | A moving line becomes the next action |
| 8-14s | Preparation or transformation | Three punch words, active process, timed accents | Image-led kinetic sequence | Circular aperture opens |
| 14-20s | The product | Centered scale/depth reveal, mask-revealed type, two callouts | Symmetric product stage | Tight camera push or purposeful cut |
| 20-27s | Brand and takeaway | Brief rapid-type burst, then a resolved lockup | Full-screen color field | Deliberate loop transition |

This is a rhythm overview, not a complete script or mandatory five-scene template. Change scene count and duration to fit the subject.

### Example of one fully scripted shot

**Shot 04 / 14.00-20.00s / 6.00s -- "DAILY UPGRADE."**

Purpose: Make the coffee feel like an object worth anticipating, not an image beside marketing copy.

Composition and artistic idea: The outgoing coffee-surface circle becomes a cream aperture around a centered ivory cup. Start tightly cropped, then reveal the whole cup against a muted gold disc. Large type sits behind the cup; delicate callouts sit in front. Warm upper-left light and a soft grounded shadow establish depth.

Exact copy: "DAILY" at 14.55s, "UPGRADE." at 14.85s; "Big flavor." at 15.50s; "Fully awake." at 16.25s; "A small ritual. A different kind of morning." at 17.20s. Hold all copy through the shot's end.

Choreography, relative to shot start: 0.00-0.65s: the aperture opens from the previous shot's circular contact point. 0.15-1.30s: cup scales from 0.35 to a brief 1.06 overshoot, then settles at 1.00; rotation resolves from -12 deg to 0 deg. 0.55-1.35s: the two headline lines unmask in opposite vertical directions without translating across the frame. 1.50-2.00s: left annotation traces toward the cup; 2.25-2.75s: right annotation responds. 0.80-6.00s: staggered steam rises from the cup while a subtle camera push continues. 3.20-3.70s: the caption resolves. 3.70-6.00s: readable hero hold with restrained material motion.

Handoff: At 20.00s, match-cut the gold disc to a full gold field for the next shot's short word burst. No lateral slide or generic wipe.

Assets/technique: Existing transparent cup cutout, locally loaded fonts, CSS aperture and shadow, masked typography, SVG steam parented to the cup. No new footage needed.

Sound intent: Existing instrumental continues; aim the next cut at a musical accent if the track supports it. Alignment must be checked, not assumed.

Write equivalent detail for every shot, not only the hero. Use subject-specific ideas rather than repeating this example.

### Pre-code variety and artistry review

Read the complete script as a film before writing components:

- **Distinct shots:** Adjacent major shots should differ in at least two useful dimensions -- framing, scale, composition, dominant action, pacing, or visual medium. Brief repetitions are valid only when they create an intentional rhythmic sequence.
- **Substantial motion:** Every main shot needs a developed action or transformation, not just an entrance followed by ambient drift. Treat a deliberate final hold as a pacing choice, not a failure to animate.
- **Visual interest:** Can you name the artistic idea in each shot? Replace generic type-on-background or product-next-to-copy shots that have no specific visual relationship.
- **Range:** Include contrast across the film: close and wide, asymmetric and centered, material and graphic, fast and measured. Select what suits the subject; do not mechanically force every category into a short film.
- **Cohesion:** Variety must still feel like one art direction. Shared color, type, subjects, and transition logic connect the changing compositions.
- **Readability and hierarchy:** Plan where the eye looks at each beat. Lots of motion means rich choreography over time, not constant competing movement or rapid flashing.
- **Progression:** Does each shot develop the message, and does the ending resolve it differently from the opening?
- **Feasibility:** Can the assets and renderer support the scripted action? Resolve impossible camera moves or asset mismatches now, not after generating files.

Rewrite weak or repetitive shots before implementation. Do not proceed with an incomplete script intending to "make it artistic" through effects later. During implementation, update the script if timing or choreography materially changes; keep the full-film review intact.

### Composition diversity

- Do not repeat left headline + right product through the whole film.
- Do not use the same heading/eyebrow/subline wrapper for every scene.
- Give adjacent major beats different framing, scale, or visual structure.
- Reuse colors, type relationships, objects, and motion rules -- not identical layouts.
- Keep the ending different from the hero: change scale, framing, color field, or the role of the brand mark.

A centered shot can be excellent. Five centered title cards are not.

### Timing diversity

Mix quick impact beats with longer readable moments:

- Impact or match cut: 100-200ms.
- Word replacement or small accent: 180-350ms.
- Main type reveal: 400-800ms.
- Product reveal: 800-1400ms.
- Camera drift or material evolution: 2-6s.
- Resolved end-card read: usually at least 2s.

Choose times based on copy length and movement distance. Do not make all scenes or all transitions the same duration.

## 4b. Composition and pacing floors (learned on production films)

These are hard floors, not taste. Violating any of them reliably reads as "boring", "slow", or "weird" to reviewers.

- **Hero scale:** a product hero occupies 60-100% of the frame's short edge, cropped and angled when useful. A small object floating in an empty field is a defect even if it is animated.
- **Texture budget:** any single background texture or plate (a coffee swirl, a marble slab, a gradient plate) appears in at most two shots of the film. Retire it by changing the field to a color block, a different plate, or a hard graphic system.
- **Beat density:** something visible changes at least every 1.0 s in every shot; in the opener, every 0.5 s. Count the beats in the script before coding.
- **No dead tail:** the final 15-20% of every shot is handoff motion, not a hold. If the last beat finishes early, either pull the beat later or start the outgoing move sooner. A frame with the background alone and no subject in transit is a dead frame.
- **Zone ownership:** assign the headline, callouts, and hero to non-overlapping regions of the frame in the script (e.g. headline top-left, callouts lower-left, hero right third). Callouts arrive sequentially, one at a time, never as a stack next to the headline.
- **Composition variety:** adjacent shots differ in at least two of: background system, hero scale, hero position, dominant mechanic (aperture, wipe, split, montage, turntable, macro).
- **Openers:** an escalating opener (pop, pop, pop, fill) needs discrete snaps with stiff springs (stiffness >= 240) and gaps of 0.4-0.5 s. Slow, evenly eased growth reads as a loading spinner.
- **Type scale floor:** a kinetic hero word (one word owning the frame) is 28-34vmin cap height and may crop at the frame edge; a headline in a type column is 18-24vmin for a numeral/short word or 7-11vmin for a phrase; supporting lines 3-3.5vmin; eyebrows 1.9-2.2vmin. Anything set smaller than these on a 16:9 frame reads as a slide deck. Text sits inside the safe frame with a 4-6% inset; a headline flush against the frame edge is a defect.
- **Explicit sizes:** scaffold text primitives may apply their own scale; when a size matters, set `fontSize` in vmin on a plain element (or on the primitive's `style`) and confirm the rendered size from a frame, not from the code.
- **No empty incoming frame:** the incoming shot's hero must be no more than one frame outside the visible area at scene start (e.g. y -96% of its own height, not -115%), and a second element (outline word, eyebrow, rule) must be on screen within 0.25 s. A spring from far off-frame plus a 0.2 s outgoing fade produces a 0.3 s blank field -- it reads as a glitch even when nothing is technically wrong.
- **Wipe tail:** when a color wipe hands off to a type burst, the first word fires within 50 ms of the wipe completing. A full-frame solid color held for more than ~0.1 s is a dead frame.
- **Photography-first for physical products:** a film about a real object (watch, car, shoe, bottle, device) carries at least one photoreal hero cutout (transparent PNG) and at least one photoreal macro of its signature material in the FIRST build. CSS/SVG-drawn objects are for instruments, diagrams, apertures, and graphic systems -- not the product itself. A film with no photography reads as a UI demo, and the reviewer will ask for photos. If brand photography cannot be used (copyright), generate photoreal stand-ins that omit brand text and say so.

## 4c. Signature-detail fidelity (learned on a watch film)

When a shot depicts a specific product or category -- a Daytona dial, a Porsche silhouette, a Leica top plate -- it must be recognizable without its label. Before drawing or generating it, list the three to five signature features that make it that object (e.g. black ceramic tachymeter bezel band with numerals, three grooved registers at 9/3/6 with a steel rim, printed minute track, applied batons, red-tipped chrono hand) and build all of them. A schematic (white disc with black dots, grey rectangle with rounded corners) is a defect even when it animates well. Prefer a photoreal asset for the whole object and reserve drawn geometry for the part that must animate (a bezel that spins, a hand that sweeps, a register that scales up as a transition carrier).

## 5. Choreograph motion with a clear hierarchy

Every substantial movement should perform a job:

- Establish focus.
- Explain a relationship or process.
- Reveal a product or feature.
- Transfer attention between shots.
- Punctuate a message.

Use three levels:

- **Primary:** Hero object, main word, camera, or reveal.
- **Secondary:** Supporting type, callout, one reaction or accent.
- **Ambient:** Subtle texture, steam, slow drift, or particles.

One dominant event per beat. Avoid making every layer compete at once. Dynamic does not mean everything is constantly moving at maximum intensity.

### The entrance is not the whole scene

Plan at least one meaningful event after the first reveal: a tighter crop, a word replacement, an object transformation, a process progressing, or an annotation arriving at the relevant moment.

Example six-second product sequence:

- 0.00s: Aperture begins opening.
- 0.20s: Product comes into focus through scale and rotation.
- 0.55s: Large background type reveals through a mask.
- 1.40s: First detail/callout draws from the object.
- 2.20s: Second detail appears on the opposite side.
- 3.10s: Camera settles into a readable hero composition.
- 4.70s: A small deliberate push sets up the next cut.

Do not implement this as six separate slides.

## 6. Motion vocabulary: use deliberately

### Kinetic typography

- Short, large, readable phrases.
- Masked line reveals, per-word punches, staggered letter rotations, tracking compression, and scale-to-focus.
- Animate letters for a hero word; animate words or lines for longer copy.
- Keep the final resting baseline stable and glyphs unclipped, including italic overhangs and descenders.
- Use 30-70ms letter offsets or 100-200ms word offsets as starting points.
- For rapid word bursts, reserve a stable absolute-positioned stage. Replace words with overlapping scale/blur transitions, not flex-layout reflow.
- Readability comes from the settled frame. Motion should not make short copy difficult to parse.

### Product reveals without "slidey" motion

Prefer one of:

- A radial aperture opens around a centered object.
- A close crop pulls back to reveal the whole product.
- A product scales out of a field of color while surrounding type unmasks.
- A light sweep reveals material, followed by annotations.
- An exploded arrangement assembles into its finished form.
- A controlled rotation resolves into a strong hero angle.

Use scale, masks, depth, lighting, and focus before reaching for horizontal translation.

A cutout photo is a plane, not a 3D model. Small rotations and parallax work; a full turn of a flat product image usually looks wrong. Use true geometry only when it improves the shot and the export renderer supports it.

### Object-led continuity

Let the subject motivate the transition:

- Bean -> macro roast texture -> stream -> cup.
- Device detail -> full device -> interface -> brand mark.
- One data point -> network -> result.
- Packaging silhouette -> product stage.

Persistent objects can move between compositions without remounting. Keep them outside `AnimatePresence` when continuity benefits from that. Do not enforce a percentage of persistent elements; some shots need a clean cut.

### Depth and camera

- Separate foreground, subject, and background.
- Move the camera or scene group when you want a camera effect, rather than sliding every child independently.
- Use near/far scale differences, shadows, small rotations, and selective blur.
- Combine a quick initial camera move with a slower settle.
- Place flying objects around the reading area, not across every word.
- Keep key product features and logos in the safe frame.

### Virtual camera over a world (After Effects camera language)

When a shot needs pull-backs, whip-pans, punch-ins, or a tour through several objects, build the shot as a world plus a camera instead of animating each object into the frame:

- **World:** lay objects (slides, cards, screens, panels) out at fixed positions in one coordinate space, expressed as offsets from the stage centre (vw/vh). Objects keep their positions; they do not "enter" from screen edges.
- **Camera:** one wrapper inside a perspective parent whose x, y, scale, rotateX, rotateY are driven by a table of named poses. Centring a world point p at zoom s is x = -p.x * s, y = -p.y * s (translate is applied before scale). A helper such as `focusOn(point, scale, extra)` keeps the beat table readable.
- **Beat table:** a list of `{ time, pose, transition }` pairs advanced by the scene timer. Every camera move is a row; the objects' own events (content drawing in, edits, flashes) are scheduled in the same timer so the reason for each move is visible.
- **Move vocabulary:** hold -> pull-back with a slight tilt (reveal the space) -> whip-pan (fast in-out ease, 0.45-0.6s) -> push-in on the subject -> whip to the next subject -> pull-out to an overview. Alternate fast and slow moves; never chain three whips.
- **Motion blur:** animate filter blur as a three-value keyframe, e.g. blur 0 -> 9-12px -> 0 with times [0, 0.4, 1], only on whip-pans. Keep pushes and pulls sharp.
- **Parallax:** move a background layer (grid, glow) at 10-20% of the camera translation so the space reads as deep.
- **Spawning objects:** new objects arrive from depth (translateZ 600-900 -> 0, small rotateY -> 0) a fixed stagger apart while the camera is pulling back, so arrival and reveal are one action.
- **Re-flow:** objects may move to a new arrangement (row -> grid) during a pull-out; that arrangement and the final pose must be exactly what the next scene opens on, so a 0.2-0.3s fade between scenes reads as a continuous camera rather than a cut.
- **Edits under the lens:** when the camera is pushed in on one object, that is the moment to change it -- a brief accent-colour flash, a layout re-flow, a chart re-plot, a chat instruction pill parented to the object in world space -- with a screen-space tag confirming the feature. One edit per punch-in.
- **Screen-space HUD:** counters, tags, and captions that must stay readable live outside the camera wrapper.
- Keep punch-in zoom modest (about 1.2-1.3x of the object's natural size) and the overview wide enough to show every object with breathing room; extreme rotateY (>15 deg) on a wide row distorts far objects.
- This pattern suits deck generation, dashboard tours, multi-screen app walkthroughs, and any "one thing became many" reveal. It replaces static stacks, fanned cards, and grids that simply appear.

### Animated SVG and procedural effects

Useful techniques:

- Stroke tracing for annotations, underscoring, paths, and flow.
- Dashed-offset movement for directional process lines.
- Droplet/spark trajectories with origin, travel, and disappearance.
- Ripples that expand from an actual point of contact.
- Steam paths with staggered lifetimes.
- Apertures, radial ticks, contour lines, and purposeful orbital motion.

Anchor effects to the depicted action. If a photograph moves, parent its overlays to the same coordinate system so a stream does not miss the cup. Simplify or remove an overlay that cannot stay aligned.

### Graphic transitions

Choose a small family and vary its application:

- Match cut on shape or position.
- Zoom-through or macro-to-wide change.
- Radial aperture.
- Masked split/unfold.
- Brief branded wipe.
- Hard cut timed to an impact.

Do not place the same diagonal wipe between every scene. Do not use `mode="wait"` and expose an empty frame. A dissolve may suit a quiet moment, but it must not be the entire editing system.

### Distinct finales

The finale is a conclusion, not another feature scene.

Strong options:

- Three short punch words -> oversized official wordmark -> concise takeaway.
- All objects resolve into one hero arrangement -> brand.
- Product fills the frame -> graphic match cut to the logo.
- Palette inversion and a clean, readable lockup.

Let the lockup breathe. Do not obscure it with a final burst of decorative particles. Give the outro an intentional transition back to the opening.

## 6b. Compound transitions

A cut with a single mechanic (one clip-path, one slide, one fade) reads as a slide change. Every scene boundary combines at least two mechanics and carries one physical element across the cut:

- **Mechanics to combine:** object scale-through the camera, diagonal or multi-panel color wipe, headline shear/blur-slice exit, clip-path polygon morph, 3D perspective flip (rotateX/rotateY with perspective), split-and-unfold, aperture that becomes a persistent ring.
- **Carrier:** a mug, a ring, a panel, or a word that is visibly the same object on both sides of the cut. Match its size, position, and rotation in the outgoing scene's exit and the incoming scene's initial state.
- **Overlap:** the incoming scene's first beat starts before the outgoing exit completes. Use `AnimatePresence mode="sync"` so both are mounted together.
- **Global camera:** a persistent wrapper around all scenes that subtly pushes in and rotates 0.5-2 deg per scene index keeps the frame alive through every cut.
- **Push-through (object scales through the lens) -- the recipe that works:** cap the scale at ~3.5x with a drift toward frame centre; keyframe opacity [1, 1, 0] and blur 0 -> 2 -> 14 px with times [0, 0.55, 1] so the object dissolves as it passes rather than filling the frame with a flat texture; exit the type on the same beat (numerals split up/down, callouts slide out) so the push carries the whole frame; fade the outgoing field ~0.3 s after the push starts, and give the incoming shot a matched settle -- open at 1.5-1.6x with 10-12 px blur and ease to 1.04 sharp over ~0.8 s -- so both halves read as one camera move. Never leave a drop-shadow or blur filter on the plane being scaled (see 11); put the shadow on a separate layer that fades before the push.

## 7. Assets and brand integrity

- Use supplied brand assets first. Obtain real logos from official sources; verify downloads are images rather than HTML. A `Brand assets` inventory from the platform step is ground truth: use those `attached_assets/` files (via the `@assets/...` import syntax) and the listed fonts and hex codes.
- Do not redraw or fabricate an existing company's logo. If a logo is unavailable, set the name plainly in a suitable typeface.
- Infer an extended palette from verified brand inputs when necessary; do not label inferred colors official.
- Treat "launch-video style" as a visual direction, not permission to invent a new product, release date, endorsement, performance claim, or price.
- Use generated images for conceptual product imagery, textures, and cutouts. Use transparent backgrounds for composited objects (`remove_background: true`). Include "no text, no words, no letters" in image prompts -- generated text is almost always wrong.
- **Standard product asset kit** (generate all three together at the start of a physical-product film): (1) hero cutout, three-quarter angle, transparent PNG, no brand text; (2) 16:9 macro of the signature material/detail, moody, shallow depth; (3) 16:9 lifestyle or in-use still. Inspect the results on a contact sheet before designing around them. Give the user a one-line path to swap in real photography ("drop a transparent hero PNG and two 16:9 stills here").
- A hero cutout PNG usually has padding; size its wrapper 1.3-1.5x the intended on-screen diameter so the object -- not the transparent box -- meets the 60-100% short-edge floor. Measure from a frame.
- **Logo on field:** check the real logo's colors against every field it sits on. A green wordmark on a green field is invisible; move the lockup to a cream/white or dark field rather than recoloring the logo.
- Match lighting direction, viewpoint, and material across assets.
- Download assets locally and use the exact returned path and extension.
- Do not require an arbitrary image count. One good object with excellent choreography can outperform three unrelated backgrounds.
- A slow zoom on a photograph is not, by itself, a dynamic scene.
- Do not disguise a still photograph as genuine moving footage. If actual continuous footage is needed, use the video-generation workflow and resolve its required quality/cost settings.
- Use existing icon libraries for ordinary icons. Custom vectors should communicate something the ordinary icon cannot.
- Before starting slow asset jobs, know where each asset will appear. Start independent jobs together, build layout while they run, and await files before consuming them.

## 8. Implementation architecture

Preserve the scaffold and its recording contract:

```text
src/App.tsx
src/components/video/VideoTemplate.tsx
src/components/video/sceneMeta.ts
src/components/video/video_scenes/Scene1.tsx ...
src/components/video/[focused shared layers].tsx
src/components/video/[film-specific styles].css
public/images/
public/audio/
```

- `VideoTemplate` owns one static `SCENE_DURATIONS` object and calls `useVideoPlayer`.
- Each scene exports a named component matching its filename.
- Use `VideoCanvas` with the persisted ratio. Use scaffold layout primitives where helpful.
- Custom absolute compositions are appropriate for motion graphics. They still need safe insets, containment, and ratio-aware dimensions.
- Design for the chosen canvas. Use %, viewport-relative units, and short-edge typography; do not shrink a landscape scene into a portrait frame.
- Place scenes in `AnimatePresence mode="sync"` or `"popLayout"` with unique keys and explicit exits.
- Mount scene-local timelines with their scene so they reset correctly on replay or scene jumps.
- Use `useSceneTimer` for phase changes so pause/resume follows the scene clock. Prefer declarative delays/keyframes when no state transition is needed.
- Counters, stopwatches, and odometers are also scene-clock driven: precompute a step table (e.g. every 20-40 ms) and spread it into the `useSceneTimer` array. Never start `setInterval`, `requestAnimationFrame`, or `performance.now()` loops from a scene -- they keep running while paused, drift on scene jumps, and make exports non-deterministic.
- Radial ticks (minute tracks, bezel graduations, register ticks): each tick is a transparent container of height 50% anchored at the top-centre of the dial with transform-origin bottom, rotated i x step; the visible tick is a short child at the top of that container. A container with height 100% or its own background renders as a full spoke across the dial.
- Do not call hooks conditionally.
- Keep deterministic particle positions and timings; do not call random generation on each render.
- Control layout-visible elements through animation rather than conditionally adding children to centered flex containers.
- Avoid competing libraries writing transforms to the same DOM node.
- Do not import React explicitly; the Vite setup's JSX transform does it.
- **Outlined type:** an outline class (`-webkit-text-stroke: ... currentColor; color: transparent`) is silently defeated by any inline `color` on the element, which fills the glyphs. Drive the stroke from a custom property (`-webkit-text-stroke: 0.25vmin var(--outline-color, currentColor); color: transparent !important`) and set `--outline-color` inline instead of `color`. Confirm from a frame -- filled vs. outlined is invisible in code review.

### Scene skeleton

```tsx
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';

const WORDS = ['MAKE.', 'SOMETHING.', 'MATTER.'];
const EASE = [0.22, 1, 0.36, 1] as const;

export function Scene3() {
  const [beat, setBeat] = useState(0);
  useSceneTimer([
    { time: 900, callback: () => setBeat(1) },
    { time: 1900, callback: () => setBeat(2) },
  ]);
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(120% at 50% 50%)' }}
      exit={{ scale: 1.15, opacity: 0 }}
      transition={{ duration: 0.65, ease: EASE }}
    >
      {/* Add subject-driven background/action here, not a generic gradient. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="sync">
          <motion.h1
            key={beat}
            className="absolute m-0 text-[12vmin] leading-none"
            initial={{ scale: 1.5, opacity: 0, filter: 'blur(10px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            exit={{ scale: 0.7, opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {WORDS[beat]}
          </motion.h1>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
```

This demonstrates a timed type beat, not a complete visual treatment. Do not copy it into every scene.

## 8b. Persistent layers: ownership and audit

Persistent layers (backgrounds, color panels, anchor logos) that live outside `AnimatePresence` and animate on `currentScene` are the main source of continuity -- and of regressions.

- One owner per element per scene. If a scene animates its own copy of an element (for example an opener that pops its own coffee aperture), the persistent copy of that element must be fully closed for that scene index (clip-path circle(0%), opacity 0, or scale 0). Two copies produce doubled shapes.
- Every persistent layer needs an explicit branch for every scene index. A fall-through default that shows the layer in the wrong scene undercuts the new scene's background.
- Use `initial={false}` on persistent layers so they do not replay an entrance on every loop.
- After any pass that touches `VideoTemplate`, grep each persistent layer's scene-0 branch and take one screenshot of the first frame. Broad rewrites tend to reopen layers that an earlier targeted fix closed.

Scaffold specifics worth knowing: `VideoText` takes a `scale` prop (not size/weight); the artifact tsconfig needs lib `["es2022", "dom", "dom.iterable"]`; do not edit `src/lib/video`.

## 8c. Verify subagent output from files and frames, never from its report

A design subagent's completion message describes what it intended, not necessarily what it wrote. Twice on one film a subagent reported "rebuilt Scene 2 around the hero photo" and "spec lines at 3.2vmin" while the file still held the previous CSS dial and the text rendered at ~1.5vmin. After every subagent pass: grep the touched scene files for the new imports/values, capture frames from the changed scenes, and only then report to the user. If the subagent's claim and the file disagree, fix it directly rather than sending another follow-up -- the third round rarely lands.

## 8d. Scaffold protection when anything else touches the artifact (learned on a Gap film)

A platform design subagent, handed the whole film, treated the video artifact as a fresh Vite project: it replaced `package.json`, `vite.config`, `tsconfig`, `main.tsx`, `index.css`, the protected `src/lib/video/hooks.ts` and `layout.tsx`, added postcss/tailwind configs, and overwrote `.replit-artifact/artifact.toml` -- which deleted the managed workflow -- then wrote scenes against primitives that do not exist. Its completion report described a finished film.

Prevention: prefer implementing directly (section 1). If assistance is used, scope it to asset generation and single scene files, and state that everything outside `src/components/video/`, `public/`, `index.html`, `src/index.css`, and `src/App.tsx` is read-only.

Recovery, in order: diff every protected file (`src/lib/video/*`, `src/main.tsx`, `vite.config.ts`, `tsconfig.json`, `scripts/`) against the pristine scaffold copy at `.local/skills/artifacts/artifacts/video-js/files/` and copy the scaffold version back over any that changed; delete stray config files it added (postcss/tailwind configs, a second `package.json`); confirm the managed workflow reappears after `artifact.toml` is restored through the validated artifact-configuration workflow (re-persist `videoAspectRatio` if it was lost); re-run `scripts/validate-recording.sh` and the typecheck; then rebuild only the scene files on the real scaffold. Never blanket-revert the artifact: scene files, `SCRIPT.md`, and generated assets are the deliverable and must survive.

## 9. Playback and export invariants

These are implementation requirements, not creative suggestions:

- Do not modify `src/lib/video/` to make a scene easier to build.
- Keep `useVideoPlayer({ durations: SCENE_DURATIONS })` in `VideoTemplate`. It owns scene advancement, looping, `window.startRecording?.()`, and `window.stopRecording?.()`.
- Do not replace those calls with a custom timer, remove them during cleanup, or stop advancement at the outro. Before you finish any turn that touched video code, re-read `VideoTemplate.tsx` and confirm the hook and both calls are intact, then run `bash scripts/validate-recording.sh`.
- Keep the aspect ratio consistent between artifact metadata and `VideoCanvas`.
- The in-artifact control bar (`VideoWithControls.tsx` + `useSceneControls.ts`) is built exactly as `references/scene-selectors.md` describes; it renders only inside an iframe so exports stay clean. Do not import from `src/lib/video/controls.tsx`, `workspaceControls.ts`, `playerBridge.ts`, or `playerActions.ts` -- they belong to a workspace feature that is off for this project.
- Use `${import.meta.env.BASE_URL}images/...` and the equivalent for audio/video. Bare `/images/...` URLs may escape the artifact path. This applies to `<video>`, `<img>`, `backgroundImage`, and CSS `url()` in inline styles.
- Reference uploaded assets through supported module imports (`import logo from "@assets/logo.png"`), not filesystem URLs. `attached_assets/` is not served as a static directory and Vite cannot serve `/src/...` paths.
- Update `og:title`, `og:description`, `twitter:title`, and `twitter:description` in `index.html`; never remove `og:image` / `twitter:image`, and keep `twitter:site` at `@replit` unless asked.
- Check the renderer's supported features before relying on WebGL, shaders, fonts, blend modes, or expensive filters. WebGL2 is not available in the recording environment.

## 10. Audio

- For a new film, provide one intentional instrumental bed unless the user requested silence or supplied the soundtrack. Follow `references/audio.md` for the generation call, prompting, output path, runtime matching, and playback wiring.
- Use the documented audio-generation tools and their policy/authorization requirements.
- Generate voiceover and sound effects only when requested.
- Pick rhythm to support the visual treatment. Avoid generic music unrelated to the edit.
- If the user supplies audio, choreograph major hits to it. Otherwise, do not claim beat synchronization unless you actually aligned it.
- Preserve an existing soundtrack during visual revisions unless it no longer fits or the user requests a change.
- Derive cumulative audio offsets from the canonical scene durations.
- Wire the mute toggle through the in-artifact control bar as `references/scene-selectors.md` and `references/audio.md` describe.
- Pause/resume audio with the scene clock. Seek on scene changes, not on every resume.
- Catch browser autoplay rejection. Do not present autoplay blocking as successful audible playback.
- Do not add independent audio looping; the video's loop boundary resets the track.
- If VO/SFX are requested, use one time-aligned composite track when needed for export parity.

### 10b. Runtime lock

Once a music bed exists, the total runtime is locked to its length. Re-pace by moving seconds between shots (shorten the opener, lengthen the product shot) and keep the sum constant. Only regenerate music when the total genuinely must change, then re-verify the per-scene seek table. Recompute `SCENE_START_SEC` from `SCENE_DURATIONS`; never hand-maintain both.

## 11. Performance and pause behavior

- Prefer transform and opacity animation; use masks and blur selectively.
- Keep heavy full-screen filters, giant noise layers, and simultaneously animated particle counts bounded.
- Never animate a plane that carries a CSS filter (drop-shadow, blur) past ~2x scale. A 1024 px cutout scaled 7x with drop-shadow stalled the compositor for a full second on the cut -- the transition read as a freeze. Move the shadow to its own layer, cap the push at ~3.5x, and add `will-change: transform, opacity, filter` to the moving plane only.
- A frame capture that takes noticeably longer than its neighbours (see 13) is the fastest way to find a shot that is too expensive to render; fix the shot, do not accept the stall as capture noise.
- Preload critical images/audio. Do not mount a hero that is still being generated.
- Test visible pause behavior for custom GSAP/canvas/video timelines. JavaScript state timers and external animation loops do not automatically pause just because a CSS animation does.
- Use scaffold pause state and cleanup for custom playback. Do not mutate protected playback code.
- A motion-rich composition needs visual hierarchy more than a high object count.
- If browser globals and animation types fail together, check that the artifact's TypeScript libraries include DOM and DOM.Iterable before changing motion code.

## 12. Revision playbook

Translate vague feedback into a structural change:

| Feedback | Change | Avoid |
| --- | --- | --- |
| "Too dry" | Animate the process; add timed actions, material change, purposeful type beats | Decorative particles over the same still |
| "Too slidey" | Center the hero; use aperture, scale, focus, masks, or a camera change | Slower horizontal slides |
| "Too repetitive" | Change composition, pacing, subject scale, and transition mechanism | Swapping the copy in the same wrapper |
| "More After Effects" | Layered compositing, matched transitions, mask reveals, camera depth, timed accents | Applying springs and blur everywhere |
| "Like a Twitter launch" | Immediate hook, concise claims, product-first sequence, fast contrast beats, memorable end card | Inventing a launch announcement |
| "More premium" | Reduce competing elements; improve material, timing, typography, and decisive framing | Making everything slow and empty |
| "Too slow" / "more fast paced" | Compress beat gaps (0.4-0.5 s), stiffen springs, move the handoff earlier, give freed seconds to the weakest shot | Shaving 10% off every duration |
| "This is weird" (screenshot) | Locate the exact frame: it is almost always a dead tail, a doubled persistent layer, or an object left at its pre-handoff position; fix the timing/ownership bug | Adding more effects around the odd frame |
| "Boring" (screenshot of a specific shot) | Rebuild that shot with a new field, hero at 60-100%, a new dominant mechanic, and >= 1 change per second | Speeding up the same composition |
| "More dynamic / more complex transitions" | Compound every cut, add a global camera, add never-stopping secondary systems (parallax, orbit rings, marquee band, light sweeps) | Random extra springs on existing elements |
| "Make it look like an expensive agency did it" | Audit every shot against the 4b floors first (hero 60-100%, type scale floor, beat density, no dead tail); then: fewer, larger elements per frame; one split or asymmetric composition; callouts arriving one at a time with a drawn rule; real materials (photo macro, grooves, metal gradients) instead of flat shapes; a restrained cream or black end card. Bring photography in if there is none. | Adding gradients, glows, or particles to the existing layout |
| "Make it look more like a [specific product]" | Apply 4c: list the object's signature features and build each one; swap schematic shapes for a photoreal asset where nothing needs to animate | Recoloring or resizing the schematic |
| "You should include some real photos" | Generate or import the standard product asset kit (7) and rebuild the product shot as a macro-to-hero reveal; put the lifestyle still under the opener's type with a heavy vignette and a punch-in or whip | A slow zoom on a photo added as a background |

When the user likes one part and rejects another, identify what worked and preserve it. Upgrade the criticized scene's choreography, not just its easing curve.

**Revision integrity:** a broad pass (whole-film motion audit, "polish everything") must not undo earlier targeted fixes. Before starting a broad pass, list the locked decisions (durations, opener timing, closed persistent layers, hero scales) and re-verify each one from the files afterward -- not from memory of having done it. If a film is being revised through a design subagent, state the locked decisions explicitly in every follow-up; subagents rewrite from their own last snapshot.

## 13. Finish with evidence, not extra ceremony

After a coherent build or revision:

- Check the requested changes and the shot-by-shot script against the actual scenes. Confirm every scripted shot, internal beat, and handoff exists; reconcile intentional deviations in the script.
- Run the artifact typecheck and `scripts/validate-recording.sh` when available.
- Confirm the recording hook and static duration object remain intact.
- Restart the managed workflow once after the change batch and inspect fresh logs.
- Inspect representative frames from the changed scenes, plus their transitions when motion is at issue. The workspace screenshot tool only captures the first scene; for later scenes drive a headless browser (recipe below), then tile the frames into one contact sheet. Sample 3-4 frames per changed shot including the last 15% of it. An opening-scene screenshot does not verify a revised outro -- but always take the first-frame screenshot too, as the regression check for persistent layers.
- **Frame-capture recipe that works (and what does not):** install `playwright-core` in a scratch directory and launch the system Chromium via `executablePath` (find it with `which chromium`). Navigate, wait for the first scene's section to exist, record the page's `performance.now()` as t0, then screenshot in a real-time loop and name each file with the in-page elapsed time. Do NOT use Chromium's `--virtual-time-budget` (Framer Motion does not advance under it, so frames show stale states) and do NOT launch several headless browsers in parallel -- that crashed the container and killed the dev workflow. Screenshots block the page's timers, so the film runs slow while you sample: treat absolute times as +/- 0.5 s and confirm scene position from the picture, not the filename. Run one full-loop scan at ~0.5 s steps and flag any frame whose grayscale standard deviation is below ~0.02 (`magick f.png -colorspace Gray -format '%[fx:standard_deviation]' info:`) -- every such frame is a dead field, a doubled layer, or a wipe tail, and each one needs a fix. Then sample the transitions at ~100 ms steps.
- Re-read `SCENE_DURATIONS` and every scene's `useSceneTimer` table after the pass and confirm the last timer in each scene fires before the scene ends and leaves no dead tail.
- Check final text holds, masks, safe-frame containment, assets, end-to-start continuity, and any changed pause/audio behavior.
- Use proportionate verification. A focused playback check is usually enough; do not launch a broad app-testing campaign for a visual edit.
- Present the updated artifact once. If a file was requested, deliver that file through the asset-presentation flow.
- Distinguish what was verified: a passing recording-wiring script is not proof that an MP4 export was rendered successfully. Do not claim an export, audio check, or full loop check you did not perform.

### Final creative check

- Does the hook become clear within the first second?
- Does the subject -- not just the decoration -- move or transform?
- Are there meaningful events after each entrance?
- Do adjacent scenes have different compositions?
- Is the product reveal more than an image sliding beside text?
- Is the ending distinct, readable, and intentional?
- Does each effect support the subject?
- Are the strongest moments still legible without sound?

If the answer is no, fix the specific shot. Do not add more ambient motion and call it done.
