# Slides 2.0 -- Principles

This reference applies to Slides 2.0 (`slideFormat: "sdm"`); Legacy slides (`slideFormat: "legacy"`) uses `./design-principles.md` instead. It covers the parts of deck-making that are not schema or geometry: research, what the deck has to communicate, how to choose a creative direction, and the quality every SDM deck meets. The build contract (manifest, documents, `sizePt` scale, font registry, validation) is `./sdm-building.md`; coordinates, capacity math, and validator codes are `./sdm-layout.md`; the visual language (motifs, deck constants, frame recipes, theme derivation) is `./sdm-design.md`. Before writing slide files, read any reference that is missing from context. A redirect does not contain the build contract.

The creation flow -- PPTX import, exporting, and the pre-generation questions for new decks -- lives in the `slides` skill (`../SKILL.md`).

## Three kinds of instruction

The slides references contain three kinds of instruction. Treat each the way it is meant:

- **Contract.** Schema, IDs, coordinates, asset paths, validation, export. These are exact and leave no judgment call: `validate-slides` and the export pipeline enforce them. They live in `./sdm-building.md` and `./sdm-layout.md`.
- **Quality requirements.** Outcomes every deck meets: legible from the back of the room, one message per slide, no fabricated facts, every element with a job, a deck that reads as one deck. The outcome is fixed; how you reach it is yours. They are collected in `<quality>` below.
- **Design preferences.** Title register, palette energy, imagery, density, layout rhythm, typography. These depend on the audience, the occasion, and the delivery context, and the right answer changes from deck to deck. Decide them deliberately in planning, write the decision down, and hold it across the deck.

**Precedence.** Explicit user instructions come first, then attached brand material or design-system tokens, then verified official brand sources, then a selected template, then the style mode (`Professional` or `Auto`), then the defaults in these references. User-supplied copy is reproduced verbatim (see `<quality>`). When a higher source is silent on something, the next one down decides.

## IMPORTANT: Preserve brand and source assets

These rules override templates, styling, cropping, and image generation. Change an asset only when the user explicitly asks; preserve the original and make only the requested edit.

- **Original logos only.** Use uploaded or verified source files. Never redraw, trace, approximate, or generate logos with AI, SVG paths, shapes, icons, or replacement typography. If no authentic logo is usable, disclose it and omit the logo; request the original if required.
- **Preserve uploaded visuals.** No regeneration, retouching, cropping, recoloring, distortion, or replacement. Positioning and proportional resizing are allowed when the full asset remains visible.
- **Exact brand colors.** Transfer supplied or verified color values exactly; never approximate them or invent light/dark variants. Label site-inferred colors as inferred.

SVG safety is mandatory: never publish untrusted SVGs unchanged. Follow `./sdm-design.md` for sanitization, asset placement, and opaque-color limitations; check fidelity with `./sdm-visual-qa.md`.

<research>
Research happens before the outline (`<first_build>` steps 1--2 in `../SKILL.md`), because a confirmed outline becomes canonical copy and locks in whatever it contains.

1. **Brand.** If the user supplied brand tokens (a brand guide, exact hex codes, approved fonts, a design-system artifact, sibling artifact CSS), those are the source of truth: translate them into the document `theme` with the mapping in `./sdm-design.md` and crawl only to fill genuine gaps. For a real company without supplied tokens, run `extractBranding` on the official site first (colors, fonts, logo), then `webFetch` on the homepage, about, or product pages for positioning and tone, and `webSearch` only when the site is unreachable or unknown -- search snippets miss the tokens `extractBranding` returns directly. When `webSearch` is the only route, batch concurrent queries such as `"<company> brand guidelines"`, `"<company> brand colors hex"`, and `"<company> visual identity site:brandfetch.com"`. If official guidance is unavailable, base the palette on the public site and say the colors are inferred. `extractBranding` returns the logo when it can parse one; if that logo is missing, low-resolution, or a favicon placeholder, use `imageSearch` (`"<company> logo png"`, `"<company> logo transparent"`) and take the best result from the company's own domain or a reputable brand-asset site. An external-URL `screenshot` of the site is a quick read on layout and tone when that matters.
2. **Facts.** For a real company, product, industry, or any subject with verifiable claims (revenue, headcount, market data, product specifics, dates), gather the facts now. `webFetch` the subject's own pages first; use `webSearch` (batched concurrent queries such as `"<company> investor presentation 2026"`, `"<company> annual report key metrics"`, `"<topic> statistics 2026"`, `"<industry> market size growth rate"`) only for what those pages lack. Never fabricate a figure. A number you cannot verify is omitted or labelled as a placeholder (`[stat to verify]`); a deck with five real numbers beats one with twenty invented ones. Skip this step for purely topical or creative decks with nothing to verify.
3. **Images.** Real things get real images: `imageSearch` (the `image-search` skill) for product photos, venues, headshots, landmarks, competitor screenshots, and sharper logos. The `media-generation` skill covers new supporting imagery: mood, abstraction, illustration, composites -- never replacements for logos or uploaded assets. Charts, and diagrams past a small labeled flow of three to five boxes, are built as widgets (`./sdm-building.md`), never searched or generated; text inside generated images is unreliable. Download every image the deck uses into `public/images/` and reference it through the document `assets` map (`./sdm-design.md`, Assets). Inspect logo candidates before use; prefer the company's official site, press kit, or brand assets over third-party results. Keep each selected asset's source URL or uploaded path, local path, and intended use in the planning text; a search thumbnail or an unverified URL is not the source file.
</research>

<communication>
A deck is a communication instrument before it is a design object. Its job is done when the audience knows, believes, or does what the deck was made for. Settle this before the visual direction, because it decides titles, density, and what belongs on every slide.

**Start from the audience and the outcome.** Name, in planning text: who reads or watches this, what they should take away or decide, and how it is delivered -- presented live, sent as a read-ahead, or both. A deck talked over in a room carries less per slide than a deck read alone in an inbox; a deck that does both needs slides that stand on their own while staying sparse enough to present.

**One message per slide.** Each slide makes one point a reader could state in a sentence. If a title needs "and", it is usually two slides. If a slide has no point, cut it or merge it.

**Choose the title register and hold it.** Titles are the spine of the deck; read top to bottom in isolation, they should carry the storyline. Two registers work:

- **Assertion titles** state the slide's point as a full sentence (`Churn concentrates in the first 90 days`, `The new onboarding cuts support load by a third`). The body is the evidence. This is the register for decks that argue for a decision or report results: recommendations, reviews, postmortems, pitches.
- **Topic titles** name what the slide covers (`Market context`, `Team structure`, `Risk factors`). The body carries the content. This is the register for reference material, agendas, training decks, and catalogs, where the audience navigates rather than follows an argument.

Pick one register for the storyline and keep the grammar parallel on every content slide in it; a deck that switches between the two mid-argument, or pads titles with wordplay and "It's not X, it's Y" turns, reads as assembled. The rule governs content slides. Structural slides -- the cover, an agenda, section dividers, the closing -- name what follows or ends rather than make a point, so a divider titled `Market expansion` belongs in an assertion-led deck. The content register itself may change once, after an appendix or reference divider, where topic titles are right for the reference slides. After drafting, read the title list alone. If someone reading only the titles could not follow the deck, rewrite the titles before building.

**Evidence, not adjectives.** Support claims with the specific thing: a number with its period and source, a chart with its takeaway stated, a screenshot, a quote, a comparison. Every chart has a one-line "so what" on the slide. Copy is concrete: replace "significant growth" with the figure, or cut the line. A results or recommendation deck ends with what you are asking for -- the decision, the next steps, the owner.

**Density follows delivery.** Presented live, a slide holds a title and either a few short lines or one visual with a caption; the audience listens rather than reads, and around six body lines is already a lot. Sent as a read-ahead, a slide can be fuller -- complete sentences, a dense table, a longer chart annotation -- as long as it keeps one message and every body line stays at 19pt or larger. Either way, split content across slides instead of shrinking text.

**Copy that reads as written by a person.** Specific nouns and verbs; short lines; none of the words that mark machine-written decks (`magic`, `delight`, `seamless`, `unlock`, `rethink`, `game-changer`, `supercharge`, `leverage`, `empower`); no takeaway boxes or "pro tip" banners; no dramatic build-ups without a payoff; no emoji. When a line hits any of these, replace it with the concrete claim or cut it.
</communication>

<direction>
Creative direction is where the deck gets its point of view. It follows the communication plan and runs before any document is written. It applies when no template or brand material dictates the look: with a selected template, match the template; with brand tokens, derive the theme from them and design within it.

**Read the brief for direction, not just topic.** Subject, audience, occasion, venue, delivery, and the user's own words about tone all carry signal. A board review, a product launch, a hospital's annual report, and a developer demo are all "business" and want four different decks. The theme selection sets the mode: `Professional` (raw value `auto-professional`) loads `./professional.md` and its situational guidance; `Auto` (raw value `auto-creative`) or a blank answer means you choose the direction from the brief. A serious-sounding subject under `Auto` is a design input, and restraint may well be the right answer for it -- you arrive there by reading the room, not by treating the subject as a switch.

**Write the direction down before authoring.** In planning text, name:

- The direction in one line: the aesthetic and why it fits this audience and occasion.
- The palette as hex values with roles (`background`, `foreground`, `accent`, plus `surface` and `muted` when used) and the mode (light or dark), held across the deck.
- The type pairing (display and body) from the registry in `./sdm-building.md`, and what each weight does.
- The imagery plan: what carries information (screenshots, charts, real photos, logos), what carries mood, and which slides get none.
- The layout rhythm: which header styles exist, which layouts repeat, and where the deck changes pace (section dividers, a big stat, a full-bleed image).
- The motifs (one or two; `./sdm-design.md`).

Directions that fit their brief, to show the range rather than to copy:

- A fintech seed pitch as bold editorial: oversized numerals, a warm off-white ground, one saturated accent, product screenshots framed in colored blocks.
- A quarterly board review as a calm reporting system: light neutral ground, a single accent that marks the metric that changed, the same status module on every section slide, charts with target lines.
- A developer platform demo in dark mode: near-black ground, a mono family for identifiers and figures, the architecture drawn as a widget, one high-contrast accent for the live path.
- A regional hospital's annual report as documentary photography: real photos of staff and buildings behind scrims, a serif display, a restrained two-color palette drawn from the brand.
- A climate-policy briefing as data-forward: cartographic greens and slate, big charts with annotated takeaways, tight captions, section numerals.
- A bakery's investor update on warm paper: a humanist serif, a flour-and-crust palette, product photography, plain tables for the numbers.
- A child's birthday plan: saturated primaries, a rounded display face, generated illustrations, loose asymmetric layouts.

**Palette.** State exact hex values. One background tone family per deck (a second tone for the cover, dividers, or closing is fine when it is a deliberate structure), a foreground with strong contrast, and one accent that carries meaning: the number that matters, the recommended option, the current step. Match energy to the occasion -- restrained neutrals for a metrics review, saturated color for a launch or a celebration. Pure white or pure black backgrounds are for a brand or template that uses them; when you choose, prefer a tinted neutral or a gentle gradient. Neon, purple-gradient, and cyan/magenta palettes are for a user who asks for them.

**Typography.** Two families at most, and one is often enough; three weights at most with real jumps (400 and 700, not 400 and 500). Choose for the emotional job -- geometric sans for trust and precision, condensed display for energy, refined serif for premium or editorial, mono for technical figures, rounded sans for play -- from the registry so exports hold. Vary your pairing from deck to deck; when you are choosing rather than following a brand or template, reach past Inter, Roboto, and Arial, which read as unchosen. When a template, brand guide, prompt, or `extractBranding` result names a family -- including those three -- use it as given.

**Imagery.** Decide per deck how images carry meaning. Real subjects get real photographs; products get screenshots; mood imagery, generated or searched, belongs where the story benefits from atmosphere (a launch, a story deck, a section divider) and stays out of the way where the message is the number or the diagram. Typography-only slides are a strong choice when the words are the point. The cover takes the treatment that fits: an image or product cover for a story, a typographic cover for a review or read-ahead, a big-stat cover for a results deck. Full-bleed images mark structure -- a cover, a section change, one hero moment -- rather than filling a quota; text over any image gets a scrim.

**Layout rhythm.** Decide how much the deck varies. A reporting or reference deck earns predictability: the same few layouts, the same header, page after page. A narrative deck changes pace: split, stat, chart, photo, and divider slides in an order that follows the story. Either way the grid, margins, header styles, and theme are constant (`./sdm-design.md`, Deck constants), and variation comes from choosing among a small set of deliberate layouts rather than inventing a new one per slide.
</direction>

<quality>
Every SDM deck meets these outcomes. The build reference adds the contract that makes them checkable (`<sdm_constraints>` in `./sdm-building.md`); how you meet them is your call.

**Legible from the back of the room.** Body text at 19pt or larger, captions at 14.4pt or larger, and strong contrast everywhere. Text over an image sits on a scrim. Sizing the layout to the text is right; shrinking the text to fit the layout is not -- grow the frame, shorten the copy, or split the slide.

**One dominant element per slide.** A squint test shows what matters first: the headline, the number, the image, the chart. Secondary content sits at an obviously smaller scale.

**Everything visible on load.** No content behind interaction, animation, or hover; thumbnails, PDF, and PPTX are snapshots of the authored document.

**Every element has a job.** Decorative shapes belong to the deck's motifs and frame, divide, anchor, or bleed (`./sdm-design.md`); a shape with no job is deleted, and clean whitespace beats filler. Charts are widgets, not shape assemblies; pictorial content is an image, not a shape collage. No placeholder copy, dummy statistics, or generic icons to fill space -- if a slide feels empty, fix the layout rather than inventing content.

**One deck.** The same theme tokens, grid, header styles, and type roles on every slide; a change of background tone or mode is a deliberate structural move (cover, dividers, closing), never a per-slide mood. Card treatments are tinted surfaces with restrained edges, not the rounded box with a left accent border. Effects SDM does not have (shadows, blur, glow, texture) are not simulated.

**True.** No fabricated statistics, revenue, headcount, dates, or company specifics; unverified figures are omitted or labelled as placeholders. Sources and time periods travel with the numbers.

**The user's copy is canonical.** When the user gave exact slide text -- in the prompt, an attached document, the confirmed outline (`slideOutlineResponse`), or any other channel -- reproduce it word for word: casing, punctuation, line breaks. The register, vocabulary, and length guidance in `<communication>` applies to copy you write; it never rewrites theirs. If their copy contains something you would otherwise change, keep it, and ask if a change seems genuinely needed.

**Speaker notes: off by default, generated when asked.** Leave `speakerNotes` as `""` unless the user asks for notes, talking points, a script, or presenter notes. When asked, write them into the `speakerNotes` field of each slide's entry in `src/data/slides-manifest.json` -- never into slide content -- as short bullets with `-` dashes and `\n` line breaks, with `\n\n` between sections: `"Open with the framing question.\n\n- 40% of customers churn within 90 days.\n- Most cite onboarding friction.\n- Segue into the new flow on the next slide."`. Re-read the manifest right before writing in case the workspace updated it, and run `validate-slides` afterward.

**No emoji anywhere** -- slide text, titles, bullets, speaker notes -- in any deck, however casual. Plain typographic arrows, checkmarks, and bullets are fine; anything that renders as a colored pictograph is not.

**Length.** The slide count follows the pre-generation answer (`../SKILL.md`); fewer than three slides only when the user asks for a short deck.
</quality>

