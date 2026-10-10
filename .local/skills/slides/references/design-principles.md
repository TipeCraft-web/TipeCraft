# Slides -- Design Principles

Shared design guidance for every slide deck, whichever authoring format it uses: planning, title grammar, composition, layouts, typography principles, and the content and style constraints. Read it together with the format's build reference -- `./legacy-building.md` for JSX decks, `./sdm-building.md` for SDM decks -- which owns the artifact contract, the size scales, and the format-specific rules. Before writing slide files, read any reference that is missing from context. A redirect does not contain the build contract.

The creation flow -- PPTX import, exporting, and the pre-generation questions for new decks -- lives in the `slides` skill (`../SKILL.md`).

Your goal is to create visually stunning, professional slide decks. Every deck should look like it was designed by a top-tier design agency. Prioritize clarity, visual hierarchy, and polish. Your work should feel "crafted," not "assembled." Each slide is a single, static, full-screen 16:9 frame. The content should be immediately visible on load. Every deck should have a specific, nameable aesthetic direction. Reject mediocrity. Build something with a point of view.

<planning>
Before writing any code, establish your creative direction:

1. **Brand research**: **If the user supplied brand tokens** (attached brand guide, exact hex codes, approved fonts, sibling artifact CSS, design system file, etc.), use those as the source of truth and skip this step. Crawl only to fill genuine gaps the user did not provide.

   For real companies where the user did not supply brand tokens, lead with the Firecrawl-backed tools -- `extractBranding` and `webFetch` return real, structured data. `webSearch` is the fallback, not the default.

   **Preferred order:**
   - `extractBranding` on the official website URL -- returns the company's actual brand tokens (colors, fonts, visual identity).
   - `webFetch` on the homepage, about page, or product pages for real positioning and tone.
   - `webSearch` ONLY as a last resort, when the company has no public site or you cannot find the URL. Do not default to `webSearch` for brand colors, fonts, or positioning when an official site exists -- search snippets are noisy and miss what `extractBranding` already returns directly.

   **Logo sourcing.** `extractBranding` returns a logo image when Firecrawl can parse one. If that logo is good, use it. If it's missing, low-resolution, or clearly wrong (e.g. a favicon placeholder), or if you just want a cleaner reference, use `imageSearch` for queries like `"<company> logo png"` or `"<company> logo transparent"`, pick the highest-quality result from the company's own domain or a reputable press/brand asset site, and download it to `attached_assets/`. Keep it in the brand context you plan from (colors + typography + reference logo image), the same way an `extractBranding` logo would be -- it's a brand reference image, not necessarily a slide asset. It's fine to use both -- `extractBranding`'s logo plus a sharper `imageSearch` hit -- if that gives you better reference material.

   When `webSearch` is the only option, batch concurrent queries:

   ```text
   webSearch({
     queries: [
       "[company] brand guidelines",
       "[company] brand colors hex",
       "[company] visual identity site:brandfetch.com",
       "[company] logo usage guidelines filetype:pdf"
     ]
   })
   ```

   Use their real palette and typography -- don't guess. If official guidelines aren't available, base your palette on the company's public-facing website and explicitly note that the colors are inferred, not official. If the site's visual style matters, use external-URL `screenshot` for a quick reference on layout, logo treatment, and overall tone.
2. **Content research**: If the deck is about a real company, product, industry, or topic, gather real facts before writing slides. **Lead with `webFetch`** on the company's own pages (homepage, about, product, pricing) -- that's where real headlines, messaging, and positioning live. Only use `webSearch` for facts that aren't on the company's site (industry stats, third-party data, market sizing, recent news).

   Do not fabricate statistics, revenue numbers, headcount, market share, or any verifiable claim. When you do need `webSearch`, batch concurrently:

   ```text
   webSearch({
     queries: [
       "[company] investor presentation 2026",
       "[company] annual report key metrics",
       "[company] revenue employees market share",
       "[topic] statistics 2026",
       "[industry] market size growth rate"
     ]
   })
   ```

   If you cannot verify a figure from a real source, either omit it or mark it explicitly as an estimate. A deck with 5 real numbers is better than one with 20 invented ones.
3. **Image sourcing**: For real companies and real-world references, `imageSearch` via the `image-search` skill is a great tool when you need images of real things on the web -- product photos, office/venue shots, team or founder headshots, known landmarks, competitor screenshots, or a sharper logo than `extractBranding` surfaced. `imageSearch` and Firecrawl complement each other: Firecrawl gives you the site's brand tokens and logo in one pass; `imageSearch` finds everything else that's "real" and publicly photographed. Use whichever (or both) gets you the right image. Download found images to the location your build reference names in its asset rules. Use the `media-generation` skill for supplemental or abstract visuals that don't exist on the web. Do not generate a fake logo when the real one is searchable.

   Quick image-sourcing cheat-sheet (use any combination that gets the right image):
   - Brand tokens (colors, fonts, logo, positioning) -- Firecrawl `extractBranding` + `webFetch`.
   - Real-world images (products, people, places, sharper or missing logos) -- `imageSearch`.
   - Supplemental / abstract / doesn't exist on the web -- `media-generation` skill.
   - Data charts, and diagrams past a small labeled flow (three to five boxes) -- build them programmatically, the way your build reference describes -- never `imageSearch` or `generateImage`.
4. **Color palette**: Pick a bold, intentional palette. State exact hex codes. You want 1 primary, 1 accent, 1-2 neutrals, and a background tone. The palette should have a clear vibe -- editorial, corporate, playful, luxurious, energetic, whatever fits the content. Every color should feel like a deliberate choice. Build every slide from these colors -- consistency is what makes it feel designed, not generated.
5. **Typography**: Pick ONE display font + ONE body font. Choose from common PowerPoint-bundled fonts that work on web or popular Google Fonts -- decks are exported to PPTX and other platforms, and fonts that don't exist on the target platform will break the slide. Analyze the emotional goal of the deck, then select a font *type* that amplifies it:
   - Trust/Authority -> strong geometric sans-serif
   - Corporate/Professional -> neutral, clean sans-serif
   - Excitement/Energy -> condensed bold display
   - Luxury/Premium -> refined serif or high-contrast sans
   - Tech/Developer -> geometric sans or monospace
   - Playful/Creative -> rounded or expressive sans
   - Editorial/Culture -> elegant serif paired with a clean sans
   Every deck should feel typographically distinct. Do not fall back on the same font pairing across different decks -- vary your choices. The font IS the personality of the deck. A wrong font choice undermines everything else.
6. **Deck aesthetic direction**: Pick a specific aesthetic direction and commit. The direction dictates everything -- how slides are composed, what the visual tone feels like, how information is presented. **Match the visual energy of the deck to the subject matter.** A birthday party deck should feel festive; a board meeting deck should feel precise. Some examples to spark your thinking:
   - **Corporate Minimal** -- clean sans-serif, generous whitespace, muted neutrals + one bold accent, grid-aligned layouts, restrained. Best for: investor updates, board decks, quarterly reports.
   - **Bold Editorial** -- oversized display type, strong color blocks, asymmetric layouts, magazine-inspired, high visual contrast. Best for: marketing pitches, brand launches, thought leadership.
   - **Warm Storytelling** -- serif headlines, earthy warm palette, photography-forward, organic shapes, human and approachable. Best for: nonprofit pitches, personal narratives, community updates.
   - **Data-Forward** -- clean geometric type, structured grids, prominent stats and numbers, minimal decoration, credibility through precision. Best for: research presentations, analytics reviews, financial summaries.
   - **Tech Product** -- dark backgrounds, crisp sans-serif, code-inspired grid layouts, accent colors on dark, product-screenshot-heavy. Best for: product demos, developer talks, SaaS pitches.
   - **Playful/Creative** -- rounded fonts, saturated colors, hand-drawn accents, loose layouts, personality-driven. Best for: birthday parties, pet showcases, hobby projects, kids' topics.
   These are starting points -- invent your own direction if the content calls for it. The point is to have a nameable aesthetic, not a vague "clean and modern."

   **Context matters for imagery too.** Corporate and formal decks should lean on clean typography, whitespace, and restrained visuals -- decorative images distract. But fun, personal, or creative topics should tastefully include generated images, illustrations, and rich photography. A deck about dogs deserves cute dog photos; a birthday party deck deserves festive visuals and warm colors. Read the room and design accordingly.

   **Commit to a system up front.** Before writing slides, write out (in planning text) the system you'll use for the whole deck: the section-header layout, the title-slide layout, how content slides are composed, the image-slide pattern, and the closing-slide treatment. Limit the deck to **1--2 background colors max** -- varied background tones break visual cohesion fast. Decide where visual rhythm comes from (a recurring accent shape, a consistent type lockup, a divider style). State the system before you build it; it's what separates a designed deck from an assembled one.

   **Professional / corporate / formal decks -- extra consistency rules.** When the user asks for a professional deck (or the context reads that way -- investor, board, exec, sales, internal report, quarterly review): pick **one mode and hold it** -- either consistently light or consistently dark, never alternating slide-to-slide. Hold the same background tone family across every content slide. Save full-bleed image slides for 1--2 hero moments max, and lean on typography + whitespace for the rest unless the user explicitly asks for a more visually rich treatment. A professional deck reads as professional because it's restrained and consistent, not because every slide brings a new visual trick.
7. **Asset planning**: Inventory any assets the user attached (logos, product shots, brand images, etc.) and decide where each one appears. Then plan what additional images to source with the `media-generation` skill to fill the remaining slides. Rich visual material elevates a deck -- plan it upfront, not as an afterthought.

Commit to a direction and execute.
</planning>

<title_grammar>
**If the user supplied the titles (or exact slide copy), use them verbatim -- skip this section.** The rules below apply only when you are writing titles from scratch. See the "User-supplied copy is canonical" rule in `<constraints>` -- Content for the full precedence rule.

Slide titles are the spine of the deck -- read top-to-bottom, they should read like a table of contents. Mixing grammatical styles within one deck is the single clearest tell of AI-authored copy.

**Pick ONE structure for the whole deck and hold it:**

- **A. Short topic noun phrases** -- `Market Research -- Team Structure -- Risk Factors`
- **B. Brief declarative sentences** -- `Revenue grew 40%. -- Costs held flat.`
- **C. Imperatives, sparingly** -- `Cut the text. -- Ship the draft.`

Choose the structure that fits the content, then hold the register on every slide. If you're tempted to write a "punchier" title for one slide mid-deck, that's the urge to break parallelism -- resist it.

**Title anti-patterns -- reject on sight:**

- Punchline titles ("The Magic Moment", "Why Everything Changes Now")
- "It's Not X. It's Y." construction, anywhere
- Faux-insight reframes ("Rethinking how we build slides")
- Titles that deliver the verdict instead of orienting the slide
- Titles that sound like the speaker's punchline rather than a chapter heading
- Over-long title phrases ("How we rethought the way we build--")

After drafting titles, read the title list top-to-bottom in isolation. If a person reading only the titles couldn't follow the flow of the deck, rewrite the titles before building any slides.
</title_grammar>

<visual_composition>
Every slide should have visual depth and intentional composition. Layer backgrounds, content, and accent elements to create polish.

**Layer your slides:**

1. **Background**: Gradient, muted brand-colored shape, or photography. Use at minimum a very subtle gradient or tinted background for depth.
2. **Content**: Your primary message -- typography, data, key visuals. This is the main event. Strong hierarchy is essential: one thing should clearly dominate (usually the headline or a hero number).
3. **Accent elements**: Shapes, lines, brand marks, color blocks, or dividers that create visual rhythm and tie the deck together. These are subtle but they separate amateur from professional.

**Composition principles:**

- Mix centered layouts with left-aligned, right-aligned, and asymmetric compositions. Visual tension keeps the viewer engaged.
- Use generous padding (roughly 5-8% from edges). Content crammed to the edges looks unfinished.
- Create clear visual hierarchy: one dominant element per slide (headline, hero image, big stat), supported by secondary elements at obviously different scale.
- White space is a design element -- balance content and breathing room.
- When using images alongside text, give images real estate. If you're using an image, let it be prominent.
- The title slide (slide 1) should always include a high-quality generated or user-provided image. This is the first thing the viewer sees -- make it visually rich, not a plain text-on-color slide.
- Roughly 1 in every 4-5 slides -- and never more than 2-3 per deck -- should use a **full-bleed high-resolution image as the background** with bold, high-contrast text on top. These slides create visual impact and break up text-heavy runs. Use a semi-transparent overlay or gradient so text remains readable. Source the image via the `media-generation` skill and keep the text large and minimal.
- Give images real visual space. A slide with one strong image at 50% width beats a slide with three tiny thumbnails.

**Asset usage:**

- **User-attached assets come first.** Feature them prominently -- use ALL of them.
- **Generate supplemental assets to fill gaps.** Use the `media-generation` skill for custom visuals and photos of real people, places, and products.
- Real images and photography are what make a deck feel produced and professional.

**Design principles:**

- Pick an aesthetic and apply it to every single slide. A deck where each slide looks like it came from a different template is worse than a simple but consistent deck.
- Pursue cohesive art direction, intentional color palettes, restraint, and strong typographic hierarchy.
- Wire the palette and fonts the way your build reference describes so every slide stays in sync.
- When the user wants simple: focus on clean execution, strong typography, and generous whitespace. The difference between beautiful simplicity and lazy simplicity is intentional spacing, a great font, and a cohesive palette.

**One thousand no's for every yes.** Never pad slides with placeholder text, dummy stats, or generic icons just to fill space. Every element should earn its place. If a slide feels empty, fix it with layout and composition -- not by inventing content. Avoid "data slop": numbers, stats, percentages, or iconography that don't actually inform the message. Less is more. If you think a slide needs an extra section to feel "full," try removing something instead.

</visual_composition>

<slide_layouts>
Use a variety of slide layouts to keep the deck visually engaging. Match layouts to content.

**Core layout patterns:**

- **Title Slide**: Hero display typography at large scale with a high-quality full-bleed or prominent hero image. Minimal supporting text (subtitle or date). Brand mark/logo if available. Sets the visual tone for the entire deck. This is your first impression -- make it count. The title slide should always feature a striking image: use a user-provided asset if available, otherwise generate one via the `media-generation` skill. Layer bold, high-contrast text over the image with a semi-transparent overlay or gradient for readability. A typography-only title slide is acceptable only when the user explicitly requests a minimal or text-only approach.
- **Content Slide (Title + Bullets)**: Big headline at the top, then 3-6 bullet points underneath. The workhorse layout for communicating lots of information. Keep bullets concise -- phrases, not sentences.
- **Two-Column**: Headline, then two columns of content below. Each column can have a sub-header, supporting text, and optionally an image or icon above it. Great for comparisons, before/after, pros/cons.
- **Three-Column**: Headline, then three columns. Each column gets a visual element (icon, image, or large number) and brief text. Good for features, process steps, team members.
- **Big Stat / Data Slide**: A single large number or metric as the hero element at dramatic scale. Supporting context text at smaller scale. The stat is the slide -- everything else is subordinate.
- **Image-Feature Split**: Image on one half, text on the other half. Works for product shots, team photos, case studies. Give the image at least 45-55% of the slide width.
- **Quote / Emphasis**: Centered pull quote at large scale. Attribution below in smaller text. Can use a subtle background image at low opacity for depth. Great for customer testimonials, key insights, or dramatic statements.
- **Section Divider**: Bold text, strong accent color, signals a topic change. Minimal content -- just the section title and maybe a one-line subtitle. Gives the viewer a visual break and resets attention.
- **Closing Slide**: Company name or logo lockup with tagline, contact info, or call to action. Bookends the deck with the same brand treatment as the title slide.

**Layout variety rules:**

Match variety to deck type:

- **Board decks, memos, internal reports** -- Consistent, repeatable formats. Very similar or identical structure slide after slide (besides title and closing). Predictability is a feature.
- **Pitches, marketing, external presentations** -- Meaningful variation between slides. Mix layouts to keep visual interest high. The goal is professional and polished, not flashy or cluttered.

Most decks should be around 6-8 slides.
</slide_layouts>

<typography_system>
Typography is the backbone of slide design. Get this right and the deck is 80% there. The size scale for each format -- viewport units for JSX decks, `sizePt` bands and the built-in font registry for SDM decks -- lives in your build reference; the rules below apply to both.

**Rules:**

- Mix font weights aggressively to create hierarchy. If your headline and body text are the same weight, the slide has no visual structure.
- Use letter-spacing and line-height intentionally. Tight tracking on bold headlines. Relaxed line-height on body text for readability.
- Keep text short -- phrases and fragments over full sentences. Split dense content across multiple slides instead of shrinking body text below your format's floor.

**Font selection:**

- **One family ideally; two only when the content demands it** (editorial serif display + clean sans body). Variety comes from composition, weight, and scale -- not from adding fonts.
- **Three weights max per deck.** Weight jumps must be --200 (e.g. 400 -- 700). 400 next to 500 reads muddy from the back of the room; pick a real contrast.
- **Banned as your default fallback:** Inter, Roboto, Arial, system-ui, Fraunces. When you are picking the font yourself, do not reach for these -- they read as "AI did this." Pick a font with intent -- see the typography decision tree in `<planning>` and pull from the full Google Fonts catalog (or PowerPoint-bundled fonts so PPTX export holds).
- **Exception -- when the font is specified, use it.** If a selected template (its reference file from the template-selection flow), an attached brand guide, the user's prompt, or `extractBranding` results name a specific font -- including Inter, Roboto, or anything else on the banned list -- use that font verbatim. The ban only applies to fonts *you* are choosing from scratch; it never overrides a font the user, brand, or template hands you. This mirrors the "user-supplied copy is canonical" rule in `<constraints>` -- Content.
- **Vary across decks.** When you are choosing the font yourself, vary your choice across decks -- don't default to the same pairing every build.
- **No all-italic body text.** Italic for emphasis or titles of works only.
- **No underline as styling.** Underline = link only.
</typography_system>

<constraints>
These constraints are non-negotiable. Every slide must comply. Content must be statically visible immediately on load -- this is critical for compatibility with screenshot-based export. Your build reference adds the format's interactivity, frame-containment, and technical rules.

**Visual:**

- Never use plain white (`#ffffff`) or plain black (`#000000`) as a slide background -- at minimum use a very subtle off-white, off-black, or gentle gradient
- Try not to center every slide -- mix asymmetric layouts, left-aligned type, and edge-aligned elements to create visual tension
- No text or elements going off the page -- everything must be visible within the 16:9 frame
- No slides where an entire half is empty whitespace with no purpose
- No low-contrast text (text over full-opacity busy images without an overlay) -- always use semi-transparent overlays, text shadows, or place text on a contrasting region
- Try to vary your layouts -- if every slide is "title on top, bullets below," the rhythm dies
- Decorative shapes must earn their place: anchor every circle, ring, or geometric accent to the composition -- bleed it off an edge, align it to the layout grid, or attach it to specific content (framing a headline, underlining a stat, extending an image). Never drop a small filled circle or dot into open space or on top of a photo as filler -- an unanchored floating orb reads as a rendering artifact, not design. If an accent has no job, delete it; clean whitespace beats a random shape. Shapes frame and structure content; they do not depict it. A small labeled flow -- three to five boxes joined by arrows or connectors -- is still shape work; a chart never is, and a diagram past that size gets built programmatically instead of out of more boxes. Generated images are for pictorial content only -- never generate one of a chart or a labeled diagram.

**Typography:**

- Hold the body-size floor your build reference sets (`2vw+` for JSX decks, 19pt for SDM decks). Sizing layout to fit the text is correct; shrinking text to fit the layout is not.
- **Back-of-the-room test.** Decks are presented on projectors and conference-room TVs. Before finishing a slide, ask: could someone standing at the back of the room read this? If text would shrink to an unreadable size on a projected 16:9 frame, increase it -- even if that means cutting copy or splitting the slide. Sizing layout to fit the text is correct; shrinking text to fit the layout is not.
- Max 6 lines of text per slide -- if you have more to say, split it across two slides
- Max 2 fonts (one display + one body)
- Only use common PowerPoint-bundled fonts or popular Google Fonts -- niche or decorative fonts break when exported to PPTX or other platforms. Font selection rules (banned defaults, weight discipline, vary across decks) live in the **Font selection** sub-block of `<typography_system>` -- follow them.
- No text walls -- slides are not documents

**Style:**

- No neon colors, purple gradients, or cyan/magenta palettes (unless specifically requested or a more lax prompt)
- No generic dark mode with glowing elements
- No random visual treatments (every slide uses a different trick)
- No clip art or generic stock illustrations
- No drop shadows on everything
- No overusing AI-generated images (especially as full-slide backgrounds) -- use them sparingly and purposefully
- No more than 2-3 image-background slides per deck
- Default to a single mode for the whole deck. Mixed light/dark is only acceptable when the selected template's reference clearly uses it, an attached brand guide specifies it, or the user explicitly asks for it. When you do commit to mixed mode, make it look intentional (e.g. a dark cover or closing slide paired with light content slides), not random
- **Avoid the AI-slop trope** of rounded-corner containers with a left-border accent color -- it's the visual equivalent of "as an AI language model." Use a real card treatment -- a tinted surface with restrained edges, built the way your build reference describes -- or no container at all.

**Content:**

- **User-supplied copy is canonical -- use it verbatim.** If the user gave you exact slide text (in the prompt, an attached doc, the `slideOutlineResponse`, or any other channel), reproduce it word-for-word. Do not rewrite it for "punch," do not "improve" it, do not pad it with extra bullets, and do not invent supporting copy to fill space. Match casing, punctuation, and line breaks. The grammar, length, and tone rules below (title styles, AI-slop list, "one idea per slide", "title with 'and' = two slides") apply only to copy *you* are generating from scratch -- they do not override copy the user handed you. If the user's copy contains something you'd otherwise flag (a banned word, an "and" in the title, a punchline-style heading), keep it as written. If you genuinely think a change is needed, ask first; do not edit silently.
- **Speaker notes: off by default, generate when asked.** Leave `speakerNotes` as `""` in the manifest unless the user explicitly asks for them ("generate speaker notes," "add talking points," "write a script per slide," "include presenter notes," etc.). When asked, write notes directly into the `speakerNotes` field of each slide's entry in `src/data/slides-manifest.json` -- that is where they live, not inside slide content. Re-read the manifest right before writing in case the workspace updated it, and run `validate-slides` afterward.
- **Speaker notes formatting.** Write speaker notes as short bullets with `-` dashes and `\n` line breaks, not one long paragraph. Use `\n\n` to add a blank-line gap between sections (e.g. between a framing sentence and the bullets) for readability. Example: `"speakerNotes": "Open with the framing question.\n\n- 40% of customers churn within 90 days.\n- Most cite onboarding friction.\n- Segue into the new flow on the next slide."`
- **Never use emoji.** Not in slide text, not in speaker notes, not in titles, not in bullet points, not in any user-visible content. This includes Unicode emoji characters, emoji shortcodes, and decorative symbols used as emoji substitutes. Plain typographic arrows, checkmarks, bullets, and stars are fine, but anything that renders as a colorful pictograph is not. Emoji makes slides look unserious and unprofessional. If you need visual indicators, use proper icons, shapes, or typographic symbols instead. This rule has zero exceptions -- even for "fun" or "casual" decks.
- **Avoid AI-slop language.** Strike on sight in titles, headlines, subtitles, captions, and speaker notes -- these are the SaaS-deck vocabulary that signal an LLM wrote the copy:
  - Words: "magic", "delight", "seamless", "unlock", "rethink/rethinking", "game-changer", "supercharge", "leverage", "empower"
  - Heavy-handed imperatives ("You must--", "Never forget--")
  - Three-word punchy conclusions that don't actually conclude anything
  - Takeaway boxes, "pro tip:" banners, tip-callout containers
  - Dramatic tension-building with no payoff
  - Replace each hit with a concrete, specific claim -- or cut the line entirely.
- **One idea per slide.** If a title contains "and," it's almost always two slides -- split it.
- No decks shorter than 3 slides unless the user explicitly asks for a short deck
</constraints>
