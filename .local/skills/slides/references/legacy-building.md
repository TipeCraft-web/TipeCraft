# Slides -- Building JSX Decks (legacy format)

This reference applies to Legacy slides (`slideFormat: "legacy"`); Slides 2.0 (`slideFormat: "sdm"`) uses `./sdm-building.md` and `./sdm-visual-qa.md` instead. Build-time reference for legacy JSX slide decks: the artifact contract, the workspace export contract, the JSX size scale, asset paths, and the format-specific constraints. The design guidance shared with SDM decks -- planning, title grammar, composition, layouts, typography principles, content and style rules -- lives in `./design-principles.md`; follow both. Before writing slide files, read any reference that is missing from context. A redirect does not contain the build contract.

The creation flow -- PPTX import, exporting, and the pre-generation questions for new decks -- lives in the `slides` skill (`../SKILL.md`).

<context>
A slides artifact is a React + Tailwind CSS application that functions as a slide deck. Each slide is a separate React component file in `src/pages/slides/`, rendered at a unique `/slideN` URL route (e.g., `/slide1`, `/slide2`). This React app runs inside a workspace app preview, where the preview wraps it in a custom slide viewer / editor UI. That UI provides a thumbnail sidebar for navigation and visual editing controls that let the user reorder slides, add or delete slides, and edit visual properties like colors and text directly from the Replit interface. PPTX and PDF exports are produced by the `exportSlides` callback (see `## Exporting Slides` in the `slides` skill) or by the preview-pane UI -- when the user wants a file, you call that callback yourself.

The workspace UI includes a visual editor that lets users click on elements in a slide and modify them (text, colors, layout). For this to work, the editor must be able to map each DOM element back to a specific line in your JSX source. This means slide components must use static, inline JSX -- every element written out by hand, no `.map()` loops, no dynamic content generation, no `<br/>` tags. Use Tailwind spacing utilities instead of line breaks.

The slide manifest at `src/data/slides-manifest.json` is the contract between your React app and the workspace. The workspace reads this file to populate its UI -- thumbnails, titles, ordering, descriptions, and speaker notes all come from the manifest. Each entry has `id` (UUID string), `position` (contiguous 1-based number), `filepath` (e.g. `src/pages/slides/MarketOverview.tsx`), `title`, `description`, and `speakerNotes`. The optional `kind` is either `jsx` or `sdm`; omit it for JSX slides, and use `sdm` only when `filepath` is exactly `src/data/slides/<id>.sdm.yaml`. The `speakerNotes` field is user-facing and primarily managed by the workspace UI: initialize it to `""` by default and do not touch it on subsequent edits. **Exception:** if the user explicitly asks for speaker notes (e.g. "generate speaker notes," "add talking points," "write a script for each slide"), populate `speakerNotes` per slide in the manifest at that point -- see the speaker-notes rules in `<constraints>` -- Content. When you create, remove, or reorder slides you must update this manifest. **When the user asks to duplicate a slide, copy the underlying `.tsx` component file to a new filename (e.g. `Pricing.tsx` -- `Pricing2.tsx` or `PricingCopy.tsx`), update the default-exported component identifier in the copy to match, and add a new manifest entry pointing at the new file with a fresh UUID and the next contiguous `position`.** Do NOT just add a second manifest entry that points at the same `filepath` -- both entries would render the same component, and any later edit to one would silently change the other. Same rule applies if the workspace UI ever appears to have duplicated a slide by manifest entry alone: split the shared file into two before editing either. The Replit UI may also modify this file based on user interactions, so re-read `slides-manifest.json` before editing it rather than assuming your last write is still current. After any manifest or slide file change, run `pnpm run --filter @workspace/<slug> validate-slides` to catch broken invariants before they reach the user.

For follow-up requests like "add more slides", "update this deck", or "change slide N", re-read `src/data/slides-manifest.json` first so you know the current slide order, filepaths, titles, and any workspace UI changes before deciding which files to edit.

Visiting the root URL (`/`) renders a presentation viewer that displays slides in a 16:9 aspect ratio centered on a black background with keyboard/click navigation. Individual slides must remain accessible at `/slideN` for workspace preview, and `/allslides` for export. Workspace surfaces embed `/slideN` with a `?replitNav=parent` query param to claim navigation ownership; the deck reads it once at module scope (`PARENT_OWNS_NAVIGATION` in `App.tsx`) and delegates navigation to the parent frame when present. Unknown routes redirect to the first slide. The routing logic in `App.tsx` must not be modified. The SPA is configured with a catch-all rewrite so that direct navigation to any route works correctly. No additional routing configuration is needed for deployment.

Slides are composed for **16:9 aspect ratio** (1920x1080 reference). Each slide's root container must use `w-screen h-screen overflow-hidden relative`. The `/allslides` view wraps each slide in a `<div className="slide">` (the contract class the workspace exporter matches on -- see `<workspace_contract>` below) and relies on CSS selector overrides (`[&_.w-screen]:!w-full [&_.h-screen]:!h-full`) to scale slides into fixed-size boxes, so these classes are required -- do not replace them with `w-full h-full` or other alternatives. Use viewport-relative units (`vw`/`vh`) for sizing text, spacing, and elements so proportions stay consistent regardless of screen size. Each slide component must use a **default export**. Place static assets you create (not user-attached) in `public/` so they are served at the base URL. User-attached assets use the `@assets/...` import syntax.

Before declaring the deck done, read `./legacy-visual-qa.md` and walk every check -- it covers `/allslides` rendering, 16:9 bounds, text-scaling integrity, and the final visual QA loop.
</context>

<workspace_contract>
## Workspace contract -- do not break

The workspace drives PDF / PPTX / Google Slides exports and thumbnail generation by loading `/allslides` in a headless browser and waiting for `document.querySelector('.slide')` to match. Break the contract and most violations make exports silently time out with `NO_SLIDES_FOUND` after 60 seconds, even when the preview looks fine; `data-slide-id` violations degrade thumbnail-to-slide pairing instead. Violations are the single largest source of broken slide-export tickets.

**The contract:**

- `/allslides` renders every slide. Each slide is wrapped in `<div className="slide" data-slide-id={slide.id}>` sized **1920--1080**. `.slide` is a contract class name, not a styling choice -- do not rename it (`.print-slide`, `.deck-slide`, `.page`, etc.) and do not remove it. `data-slide-id` carries the manifest id of the wrapped slide -- the workspace uses it to pin each thumbnail capture to the right slide even while the deck is being edited; do not remove it, and never stamp it with anything other than that slide's manifest `id` (a missing attribute forces fragile position-order matching, while an incorrect non-empty id can skip or mis-pair captures). Do not change wrapper dimensions to A4, portrait, or anything custom.
- Router stays on `wouter`. The parent frame posts `navigateToSlide` messages that rely on wouter's `useLocation` shape.
- Navigation ownership is decided by the module-scope `PARENT_OWNS_NAVIGATION` constant in `App.tsx` (`?replitNav=parent` query param, with a legacy frame-depth fallback). Do not remove, inline, or rework either check -- without it the deck self-navigates inside the workspace and desyncs from thumbnails and speaker notes.
- Both `DO NOT edit` `useEffect`s in `App.tsx` stay as-is (unknown-route redirect, parent `navigateToSlide` postMessage listener).
- Slide loading stays in `src/slideLoader.ts` at module level -- do not lazy-load or rewrite the import pattern.
- `src/App.tsx` (`SlideViewer`, `SlideEditor`, `AllSlides`, `App` router) and `src/main.tsx` (wouter `<Router>`) keep their structure. Styling inside `SlideEditor` is fair game; `AllSlides`, the route-to-component mapping, and the two `DO NOT edit` effects are not.

**If the user insists on a custom export, download, or print/PDF UI**, do not extend the slides artifact. Create a new `react-vite` (web) artifact for that flow instead -- see the `artifacts` skill (`createArtifact({ artifactType: "react-vite", ... })`). The slides artifact's `/allslides` route is reserved for the workspace export pipeline; the new artifact can call `/api/pdf/*` or render whatever custom layout the user wants without breaking exports.

**If `App.tsx` has been hand-edited** and parts of the contract are missing (class renamed, dimensions changed, router swapped, `DO NOT edit` effects deleted, `AllSlides` replaced with a custom component), repair it in place rather than working around the breakage. See `./legacy-visual-qa.md` -- "Platform contract sanity check" for concrete repair steps.
</workspace_contract>

**JSX design mechanics:**

- Use Tailwind and CSS variables from `index.css`. Import your fonts from Google Fonts via `index.html`. Use CSS variables for your color palette so every slide stays in sync.
- Card treatments are a subtle shadow, a tinted background, and restrained borders -- never the rounded-container-with-left-border trope called out in `./design-principles.md`.
- Charts and diagrams past a small labeled flow are built with Recharts or similar in the slide JSX, never as images.
- Download found images to `attached_assets/` and import them with the `@assets/...` syntax. `<image_asset_paths>` has the full asset rules.
- Backgrounds may add a subtle texture on top of the gradient, shape, or photo layer.

**Useful CSS:**

- `text-wrap: pretty` (or `text-wrap: balance` for headlines) prevents awkward orphans on multi-line text. Apply to headlines, subtitles, and bullet copy.
- CSS Grid and `display: contents` are powerful for layered compositions -- use them.

<legacy_typography>
**Hierarchy:**

1. **Display / Hero**: Headlines, big stats, section titles. Use your display font at large scale (4-7vw for main headlines). Bold or black weight. Tight letter-spacing (`tracking-tighter` or `tracking-tight`).
2. **Subheading**: Slide subtitles, column headers. Same display font at medium scale (2-3vw), or body font at bold weight.
3. **Body**: Supporting text, bullet points, descriptions. Body font at readable scale (2-2.5vw). Regular or medium weight.
4. **Caption / Detail**: Attribution, footnotes, fine print. Body font at small scale (1.5vw -- the floor; nothing renders below it). Light or regular weight. Lower opacity (60-80%).

**Rules:**

- Mix font weights aggressively to create hierarchy. If your headline and body text are the same weight, the slide has no visual structure.
- Use letter-spacing and line-height intentionally. Tight tracking on bold headlines. Relaxed line-height on body text for readability.
- Keep text short -- phrases and fragments over full sentences. Split dense content across multiple slides.

**Font sizing reference (viewport-relative):**

| Element | Size | Weight |
| --- | --- | --- |
| Hero headline | 5-7vw | Bold/Black |
| Slide headline | 3-4.5vw | Bold |
| Subheading | 2-3vw | Semibold |
| Body text | 2-2.5vw | Regular/Medium |
| Caption | 1.5vw | Regular/Light |
| Big stat number | 8-12vw | Black |

**Minimum readable size at export.** `1.5vw` is the absolute floor -- captions and footnotes only. Body copy targets `2vw+` (aim for 2-2.5vw); nothing on the slide should render below `1.5vw`. Read the smallest font size across your slide JSX; if any body text falls below `2vw`, or anything at all falls below `1.5vw`, raise it. See `./legacy-visual-qa.md` for the full text-scaling rules and forbidden patterns (no `clamp()` with px caps, no `transform: scale` on text, no hardcoded `px` font sizes).
</legacy_typography>

### Static Asset Paths

Template reference files may show bare absolute paths like `src="/photos/image.png"`. **Do not copy these verbatim.** Slides are served under a sub-path, so all static asset references in `public/` must be prefixed with `import.meta.env.BASE_URL`. For example: `src={` + "`${import.meta.env.BASE_URL}photos/image.png`" + `}`. This applies to images, fonts, and any other file in `public/`.

<image_asset_paths>
Slide decks are served under a dynamic base path (e.g., `/dog-workshop/`, `/pitch-deck/`). The base path is set via the `BASE_PATH` environment variable and made available at runtime through Vite's `import.meta.env.BASE_URL`. A hardcoded path like `/hero.png` will break because the asset is actually served at `/<base-path>/hero.png`.

Use **two different patterns** depending on where the image comes from:

- **Files in `public/`**: Prefix the path with `import.meta.env.BASE_URL`. This is the right pattern for static assets you create inside the artifact, including generated images you want to ship with the deck.
- **User-attached files imported from `@assets/...`**: Do **not** prefix them with `import.meta.env.BASE_URL`. Vite already resolves imported assets to the final URL string.

If you generate a new image for the deck, prefer placing it in `public/` and referencing it with `import.meta.env.BASE_URL`. If the user uploaded an image, either keep it as an `@assets/...` import or intentionally copy/move it into `public/` before switching to a base-path-prefixed string path.

At the top of every slide component that uses `public/` images, read the base URL into a module-level constant:

```tsx
const base = import.meta.env.BASE_URL;

export default function MySlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <img src={`${base}hero.png`} crossOrigin="anonymous" className="w-full h-full object-cover" alt="Hero image" />
    </div>
  );
}
```

For user-attached assets, import them directly instead:

```tsx
import logoPng from '@assets/logo.png';

export default function MySlide() {
  return <img src={logoPng} crossOrigin="anonymous" alt="Logo" />;
}
```

</image_asset_paths>

<animations>
These rules apply **only when the user explicitly asks for animations**. If the user has not requested animations, ignore this section entirely and follow the default no-animation constraint in `<legacy_constraints>`.

**Per-slide scoping:**

- All animations must be scoped to the individual slide component. Each slide owns its own animations -- they start when the slide mounts and live entirely within that slide's component file.
- When navigating back to a slide (e.g., returning to `/slide3`), its animations must restart from the beginning. Use the route change or a `key` prop tied to navigation to force a remount so animations always replay on entry.
- The `design` subagent can create SVG animations for persistent or looping motion effects within a slide.

**No transitions between slides:**

- Do not animate the transition from one slide to another. No slide-in, slide-out, cross-fade, or any motion between slides. Navigation between slides must be instantaneous. Animations happen *within* a slide, never *across* slides.

**`/allSlides` compatibility:**

- The `/allSlides` route screenshots every slide for static export (thumbnails, PDF, PPTX). Animated slides must render all their content visibly on `/allSlides` -- either disable animations entirely when rendered inside `/allSlides`, or ensure all animated elements reach their final visible state immediately. You can detect the `/allSlides` context by checking `window.location.pathname.endsWith("/allslides")` and skipping animations accordingly.
</animations>

<quality_checks>
After the deck builds and `validate-slides` passes, **read `./legacy-visual-qa.md` and walk every check before declaring the deck done.** The reference covers `/allslides` rendering, 16:9 bounds, text-scaling integrity, the squint / readability / consistency / flow / brand / density / whitespace / emoji / overflow checks, and the final "looks good" gate.
</quality_checks>

<implementation_checklist>
1. Establish creative direction (palette, fonts, aesthetic, visual system). Write it out before any code.
2. Plan assets -- inventory user-attached files, plan supplemental images.
3. Set up `index.html` (fonts) and `index.css` (CSS variables).
4. Build slides in `src/pages/slides/`. Title slide first to lock in the visual system.
5. Update `src/data/slides-manifest.json` manifest for each slide.
6. Run `pnpm run --filter @workspace/<slug> validate-slides` and fix any issues.
7. **Read `./legacy-visual-qa.md` and run every check** -- walk through your slide JSX file by file, apply the code-level checks, and fix any clipping or scaling issues.
8. Present the artifact.

</implementation_checklist>

<legacy_constraints>
Format-specific constraints for JSX decks; the shared visual, typography, style, and content constraints are in `<constraints>` in `./design-principles.md`.

**Interactivity:**

- No buttons of any kind (no CTAs, no "Learn more", no "Get started")
- No hover effects, tooltips, or interactive states (except on allowed interactive elements below)
- **Default: no animations.** Do not add animations, transitions, fade-ins, slide-ups, framer-motion, CSS transitions, or keyframe animations unless the user explicitly requests them. See the `<animations>` section for rules when the user does request animations.
- No dynamic behavior (no `onClick`, no `onHover`, no state-driven visibility changes) except for allowed interactive elements below
- No form elements, toggles, or inputs
- No scrolling on any slide -- everything fits entirely within one viewport frame
- No "presentation viewer" chrome or slide-sizing wrapper inside individual slide components -- slides are always full screen (`w-screen h-screen`). The deployment viewer at `/` handles presentation framing externally.

**Allowed interactive elements:**

The following elements are permitted and may include their natural interactive behaviors (hover states, click handlers, tooltips, etc.):

- **Charts and data visualizations** -- Use libraries like Recharts, Chart.js, or D3. Charts may include hover tooltips, legends, and interactive data points. Ensure charts render their data visibly on initial load for screenshot export compatibility.
- **Tables** -- Data tables may include sortable columns, scrollable overflow for large datasets (within the table container only, not the slide itself), and hover-highlighted rows.
- **Links** -- Anchor tags (`<a href="...">`) are allowed for linking to external URLs. Style them to be visually identifiable (underline, distinct color). Use `target="_blank" rel="noopener noreferrer"`.
- **Embedded videos** -- Use `<iframe>` or `<video>` tags for embedding video content (YouTube, Vimeo, or self-hosted). Videos must not autoplay. Provide a visible poster/thumbnail so the slide looks complete in screenshot export.

These elements are exceptions to the general no-interactivity rule. All other interactivity restrictions still apply -- do not use these exceptions as a loophole to add general-purpose buttons, navigation controls, or app-like UI.

**Frame containment:**

- Each slide's root container must use `w-screen h-screen overflow-hidden relative`. These exact classes are required because the `/allSlides` export view uses CSS selector overrides to scale them down. Do not substitute with `w-full h-full`.
- Use viewport-relative units (`vw`/`vh`) for sizing text, spacing, and elements. Avoid hardcoded pixel values for font sizes, positions, or element dimensions.
- **All content must be fully visible within the 16:9 frame.** Nothing can overflow or get clipped by `overflow-hidden`. If you have a list of items, cards, or bullet points that might exceed the vertical space, reduce the number of items, shrink their sizing, or split across two slides. Account for padding, headings, and subtitles when calculating how much vertical space remains for content. A common failure mode is stacking too many cards or list items vertically so the bottom ones get cut off -- always verify the total height of your content fits within `100vh` minus your top and bottom padding.
- **Think before you build.** Before laying out a slide, mentally account for the space your headings, padding, and gaps consume. Then verify the remaining content fits in what's left. If it doesn't, reduce content or split across slides. Card grids, long bullet lists, and multi-column layouts are the most frequent causes of overflow -- when using these patterns, err on the side of fewer items with more breathing room. A heading + subtitle + padding typically consumes 25-30vh, leaving roughly 65-70vh for content. If your cards or list items don't fit in that remaining space, you have too many -- remove items or split across slides. Never add a "just one more" row that pushes content past the bottom edge.
- **Text must fit its container.** If you give a container a fixed height, the text inside must actually fit at the chosen font size. Clipped or truncated text is a bug, not a feature. Reduce content length or font size so everything is visible.
- **Absolute positioning safety.** Elements using `absolute` or `fixed` positioning must stay fully within the viewport. Use `vh`/`vw` values that keep content inside the 100vh/100vw boundary -- never position an element where its content could extend off-screen.

The deeper text-scaling forbidden patterns (`clamp` with px caps, `transform: scale` on text, container queries, etc.) and the `/allslides` final verification loop live in `./legacy-visual-qa.md` -- **read it before finishing the deck.**

**Typography:**

- **Body text target: 2vw+. The 1.5vw rule is the floor, not the goal.** Aim for 2--2.5vw on standard body copy, and scale headlines and hero stats well above that. Captions and footnotes are the only place 1.5vw is acceptable; nothing should ever fall below it.

**Visual editing compatibility:**

- No `.map()`, `.forEach()`, or any loop to generate slide content -- write every element by hand in JSX
- No extracting content into arrays or variables that are then mapped into JSX -- inline everything
- No `<br/>` tags or similar line-break elements in JSX text -- use proper Tailwind spacing utilities (`mt-[2vh]`, `gap-[1vh]`, `leading-relaxed`, etc.) instead
- Prefer Tailwind utility classes over custom `<style>` tags or inline `style` objects. Only reach for custom CSS when Tailwind genuinely can't express what you need.
- Use Tailwind theme tokens (`text-primary`, `bg-accent`, `font-display`, `font-body`) from `index.css` instead of inline `style={{ }}` objects. Only reach for inline styles when Tailwind genuinely can't express what you need.
- Every visible element must correspond to a unique, static location in the JSX source

**Technical:**

- Slide components go in `src/pages/slides/`
- Use viewport-relative units (`vw`/`vh`) for everything
- Add `crossOrigin="anonymous"` to all `<img>` tags
- Use `<img>` tags over CSS backgrounds
- Do NOT use `attached_assets/` as a URL path -- always use the `@assets/...` import syntax
- **Prefix only `public/` image paths with `import.meta.env.BASE_URL`** -- never hardcode paths like `/image.png`, and do not prepend `BASE_URL` to `@assets/...` imports.
- When generating images with the `media-generation` skill, always use `removeBackground: true` for images overlaid on colored backgrounds, and include "no text, no words, no letters" in the prompt
</legacy_constraints>
