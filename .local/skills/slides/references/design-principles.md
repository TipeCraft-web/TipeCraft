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
4. **Color palette**: Pick a bold, intentional palette. State exact hex codes. You want 1 primary, 1 accent, 1-2 neutrals, and a background tone. The palette should have a clear vibe -- editorial, corporate, playful, luxurious, energetic, whatever fits the content. Every color should feel like a deliberate choice. Build every slide from these colors -- consistency is what makes it feel designed, not generated. Derive the palette from the subject, not from a safe default: an energy drink gets its loud brand lime, a puppy guide gets warm pastel tints, a smart lamp gets amber-on-walnut, a physics lesson gets the colors of its diagrams. Saturated palettes are correct for consumer, sports, food, kids, and playful subjects.
5. **Typography**: Pick ONE display font + ONE body font. Use common PowerPoint-bundled fonts or popular Google Fonts so exports work across platforms.

   Pick interesting fonts that match the topic and content well. Here are vetted examples, but feel free to pick other or different fonts -- use whatever is best for this deck.

   - Editorial: Instrument Serif / Instrument Sans; DM Serif Display / DM Sans; Libre Caslon Display / Libre Franklin
   - Institutional: Newsreader / Public Sans; Source Serif 4 / Source Sans 3; Literata / Source Sans 3
   - Corporate or data: IBM Plex Serif / IBM Plex Sans
   - Technical: Space Grotesk / Instrument Sans; Geist / Geist
   - Bold: Anton / Barlow; Bebas Neue / Archivo
   - Playful: Fredoka / Nunito; Baloo 2 / Nunito
   - Warm: Young Serif / Figtree; Lora / Karla
   - Science or classroom: Literata / Atkinson Hyperlegible; Space Grotesk / Atkinson Hyperlegible
   - Arabic or RTL: Tajawal / Tajawal; Cairo / IBM Plex Sans Arabic; Noto Kufi Arabic / Tajawal

   Monospace faces are for code, labels, and accents, never display or body text. Do not reach for the same pairing out of habit, such as Plex for anything technical; choose from the topic's own world.

   Font rendering rules:
   - **No Didone web faces** (Bodoni Moda, Playfair Display at heavy weights) for anything below 5vw; their hairlines break up and their web kerning is uneven.
   - **Never add letter-spacing to a serif or a lowercase headline.** Tracking is for short uppercase labels only (0.08–0.14em).
   - **Read the headline at 100% zoom in a screenshot.** Uneven gaps between letters, clipped descenders, or fallback glyphs mean the font failed to load or is wrong for the size; change the font, not the spacing.
6. **Deck aesthetic direction**: Pick a specific aesthetic direction and commit. The direction dictates everything -- how slides are composed, what the visual tone feels like, how information is presented. **Match the visual energy of the deck to the subject matter.** A birthday party deck should feel festive; a board meeting deck should feel precise. Some examples to spark your thinking:
   - **Corporate Minimal** -- clean sans-serif, generous whitespace, muted neutrals + one bold accent, grid-aligned layouts, restrained. Best for: investor updates, board decks, quarterly reports.
   - **Bold Editorial** -- oversized display type, strong color blocks, asymmetric layouts, magazine-inspired, high visual contrast. Best for: marketing pitches, brand launches, thought leadership.
   - **Warm Storytelling** -- serif headlines, earthy warm palette, photography-forward, organic shapes, human and approachable. Best for: nonprofit pitches, personal narratives, community updates.
   - **Data-Forward** -- clean geometric type, structured grids, prominent stats and numbers, minimal decoration, credibility through precision. Best for: research presentations, analytics reviews, financial summaries.
   - **Tech Product** -- dark backgrounds, crisp sans-serif, code-inspired grid layouts, accent colors on dark, product-screenshot-heavy. Best for: product demos, developer talks, SaaS pitches.
   - **Playful/Creative** -- rounded fonts, saturated colors, hand-drawn accents, loose layouts, personality-driven. Best for: birthday parties, pet showcases, hobby projects, kids' topics.
   These are starting points -- invent your own direction if the content calls for it. The point is to have a nameable aesthetic, not a vague "clean and modern."

   **Do not fall back to the house look.** The default this model drifts to on every subject is: warm off-white paper background, navy or dark-teal headings, a tiny letterspaced uppercase eyebrow label in orange or gold above every title, a serif headline, hairline rules, `01 / 02 / 03` numerals, and an `NN / NN` page counter. It is one valid direction for a formal editorial report. It is wrong as a default, and it makes a physics lesson, a coaching-institute brochure, and a PR lecture look like the same deck. Before you build, write three adjectives for this subject and audience, then choose the type family, palette, shape language, and image style from those adjectives. Eyebrow labels and page counters are optional devices, not required parts of every slide.

   **The second house look: navy plus orange.** Swapping cream for dark does not fix the drift. Navy, charcoal, or dark teal with an orange or gold accent is the same default in a new coat; it made a regulatory review, a coaching institute, a PR lecture, and a physics lesson look alike. Use it only when the real brand or the subject's own colors call for it (an electrical blueprint, a navy-and-orange brand). Light and mid-tone backgrounds are the default for consumer, education, health, food, kids, and lifestyle subjects. When you choose a dark background, write one sentence in your plan that says why this subject is dark.

   **Let the accent be a surface.** Strong decks put the accent color on large areas: a full lime panel, a solid blue slide, a butter or sky background, filled cards in the brand color. A palette used only for 2px rules, eyebrow labels, and small numerals reads as grey. At least a third of the slides should have a large block of the primary or accent color (a panel, a full background, or filled cards).

   **Cover-the-words test.** If all text were blurred, could a viewer guess the topic and the audience from the cover and one content slide? Celsius-style condensed italic caps on lime and black reads "sports drink"; a chunky rounded display font with a recurring cartoon mascot on pastel tints reads "puppy guide for new owners". If your answer is "some kind of consulting report", change the direction.

   **Context matters for imagery too.** Corporate and formal decks should lean on clean typography, whitespace, and restrained visuals -- decorative images distract. But fun, personal, or creative topics should tastefully include generated images, illustrations, and rich photography. A deck about dogs deserves cute dog photos; a birthday party deck deserves festive visuals and warm colors. Read the room and design accordingly.

   **Commit to a system up front.** Before writing slides, write out (in planning text) the system you'll use for the whole deck: the section-header layout, the title-slide layout, how content slides are composed, the image-slide pattern, and the closing-slide treatment. Limit the deck to **1--2 background colors max** -- varied background tones break visual cohesion fast. Exception: a playful or consumer deck may rotate through one family of 3--5 tints of the same lightness (for example butter, cream, sky, blush) when every tint comes from the stated palette. Decide where visual rhythm comes from (a recurring accent shape, a consistent type lockup, a divider style). State the system before you build it; it's what separates a designed deck from an assembled one.

   **Professional / corporate / formal decks -- extra consistency rules.** When the user asks for a professional deck (or the context reads that way -- investor, board, exec, sales, internal report, quarterly review): pick **one mode and hold it** -- either consistently light or consistently dark, never alternating slide-to-slide. Hold the same background tone family across every content slide. Save full-bleed image slides for 1--2 hero moments max, and lean on typography + whitespace for the rest unless the user explicitly asks for a more visually rich treatment. A professional deck reads as professional because it's restrained and consistent, not because every slide brings a new visual trick.
7. **Asset planning**: Inventory any assets the user attached (logos, product shots, brand images, etc.) and decide where each one appears. Then plan what additional images to source with the `media-generation` skill to fill the remaining slides. Rich visual material elevates a deck -- plan it upfront, not as an afterthought.

   **One recurring subject, one image style.** When the deck is about a thing -- a product, an animal, a place, a character, a brand -- generate a consistent set: the same product, mascot, or scene shown in different contexts and crops, with the same lighting, palette, and rendering style. Repeat the same subject description and style words in every prompt so the images match. A smart-lamp deck shows the same lamp in a living room, bedroom, and desk; a puppy deck reuses the same illustrated puppy on the cover, a content slide, and the close. For kids, pets, hobbies, and playful topics, prefer one consistent illustration style over stock-style photos. Generic stock scenes (people at a meeting table, a desk with pills, a dark blurred lab) are filler; use them only when nothing more specific exists. Do not drop small isolated 3D renders or cutout objects (a spring, a molecule, a gear) into a corner as decoration; an image is either large enough to carry the slide (at least a third of the frame) or it is absent.

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
- **Scale contrast on every slide.** Each slide needs one element at least three times the body size: a hero number (`180°`, `+86%`, `28 → 42`), an oversized year or step numeral, a headline of 5vw or larger, or an image that takes 45% or more of the frame. A slide built only from 2vw text and 3vw titles reads as a document page. When a slide has a real number, make it the hero.
- **Fill the frame with structure.** The content block should span most of the safe area. Do not leave a large tinted panel or a full column empty for decoration. If the content is short, make it bigger or switch to a Statement or Big number archetype; do not shrink it into one corner, and do not pad it with boxes.
- **Cards and icons for parallel items, sparingly.** Three to five parallel items can be a row of filled cards, each with a small icon or numeral, a bold label, and one short line. Icons are allowed when each icon labels a real item; draw them as simple inline SVG line icons with one stroke width and one color across the deck. Icons used only to fill space are still banned. Cards are one tool, not the default: see the box budget below.
- **Box budget.** Agency decks separate content with space, alignment, and hairlines far more than with boxes. Use containers (cards, tinted panels with text inside) on at most a third of the content slides, and at most one row of them per slide. Elsewhere, set the text straight on the background in columns aligned to the grid. A slide that is a title plus a grid of white boxes is the most common reason our decks look generated.
- **Word budget.** A content slide carries at most about 45 words of body copy, not counting the title. A card holds a bold label plus one line of at most 12 words. If the material needs more, split the slide or cut copy; never shrink type to fit. Dense small-print slides with five text blocks are the most common reason a deck reads as a document. Strong reference decks average 25-40 words per slide with body text at 2vw or larger.
- **No footnote strip.** Do not add a sentence-length takeaway line or footnote along the bottom edge of content slides. It is the line that gets clipped. Put the takeaway in the title or a card, or leave it in speaker notes.
- White space is a design element -- balance content and breathing room.
- **One grid and one spacing scale for the whole deck.** Write both into your plan before building:
  - Margins: about 6vw left and right, 8vh top and bottom, the same on every slide. The title sits at the same position on every content slide.
  - A 12-column grid with a 2vw gutter. Every text block, image edge, and rule starts and ends on a column line. Prefer asymmetric splits (5/7, 4/8) over 6/6.
  - A spacing scale of 0.8, 1.6, 2.4, 4, and 6.4vw. Every gap is one of these values. Related items (label and its line) use the small steps; separate groups use 4vw or more. Equal gaps everywhere is what makes a slide look crowded and flat.
  - Card padding is at least 1.6vw on every side; text never touches a card edge.
- **Vertical balance.** The content block either fills the safe area or sits on a deliberate anchor (centered, or bottom-aligned under a top title). A slide whose content ends halfway down and leaves the bottom 40% empty is unfinished: enlarge the content, move it down, or switch archetype.
- When using images alongside text, give images real estate. If you're using an image, let it be prominent.
- The title slide (slide 1) should often include a high-quality generated or user-provided image. This is the first thing the viewer sees -- make it visually rich.
- Some slides benefit from a **full-bleed high-resolution image as the background** with bold, high-contrast text on top. These slides create visual impact. Use a semi-transparent overlay or gradient so text remains readable. Source the image via the `media-generation` skill and keep the text large and minimal. Don't overuse this style, only use it when it makes sense: full-bleed image backgrounds should never be more than 2-3 slides in a deck, if any.
- Give images visual space when relevant, sometimes a single image beats 3 on a slide.

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

- **Title Slide**: Hero display typography at large scale typically with a high-quality hero image. Minimal supporting text (subtitle or date). Brand mark/logo if available. Sets the visual tone for the entire deck. This is your first impression -- make it count. Some titles even use a full bleed image background, which can work sometimes. The title slide should usually feature some sort of striking image: use a user-provided asset if available, otherwise generate one via the `media-generation` skill. If you do a full bleed image, layer bold, high-contrast text over the image with a semi-transparent overlay or gradient for readability.
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

**Layout archetypes and the repetition budget (pitches, lectures, briefs, and every non-board deck).** In your plan, assign each slide one archetype from this list and write the list down before building:

1. **Cover** -- display title, usually with a hero image.
2. **Statement** -- one sentence at 5-7vw, nothing else but a small label.
3. **Big number** -- one figure at 12vw or larger, with one line of context.
4. **Split** -- image bleeding to two or three edges on 5 columns, text on 7 (or reversed).
5. **Full-bleed image** -- photograph with a short caption or title over a gradient.
6. **Index** -- an unboxed list: large numerals or labels in a narrow left column, hairline rules between rows, text on the right.
7. **Columns** -- two to four unboxed columns of label plus one line, aligned to the grid.
8. **Diagram or chart hero** -- the visual takes most of the frame; text is a caption.
9. **Comparison** -- two sides, or a real table with a header row.
10. **Card row** -- one row of filled cards (counts against the box budget).
11. **Quote** -- pull quote at large scale with attribution.
12. **Close** -- summary or call to action with the cover's treatment.

Rules:
- No archetype appears more than twice in a deck, except Columns and Index, which may appear three times in decks over ten slides.
- No two adjacent slides use the same archetype.
- `01 / 02 / 03 / 04` numerals appear only for a real sequence (steps, phases, a ranked list) and at most twice per deck. A four-up grid of numbered items is the single most repeated pattern in our output; use it once at most.
- One title device for the deck. If titles get an eyebrow label or an accent bar, use it on section starts only, not on every slide.
- Do not restate the same fact on two slides (a headline number on the cover, again in an overview card, and again in the results slide). Say it once, where it matters most.

Most decks should be around 6-8 slides. Go past 10 only when the user asks for a slide count or an outline that needs it; merge thin slides instead of adding more.
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

- No neon colors, purple gradients, or cyan/magenta palettes (unless specifically requested, a more lax prompt, or the real brand uses them)
- No generic dark mode with glowing elements
- No random visual treatments (every slide uses a different trick)
- No clip art or mismatched generic stock illustrations. One consistent generated illustration style across the deck is not clip art.
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
- **No placeholder or invented contact details.** Never write placeholder text ("Add your address", "+91 XXXXX", "email@example.com", "[Phone]") or invent a phone number, email, or address. If the user did not give contact details and you cannot verify them, end the deck with a call to action or a summary instead of a contact block.
- **One idea per slide.** If a title contains "and," it's almost always two slides -- split it.
- No decks shorter than 3 slides unless the user explicitly asks for a short deck
</constraints>
