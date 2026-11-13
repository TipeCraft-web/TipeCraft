---
name: ad-creative
description: Design static ad creatives for social media and display advertising campaigns.
---

# Ad Creative Maker

Design static ad creatives for social media ads, display banners, and digital advertising campaigns. Build production-ready ads via the design subagent and present them as iframes on the canvas.

## When to Use

- User needs ad creatives for Facebook, Instagram, LinkedIn, Google Display, or TikTok
- User wants banner ads or display advertising assets
- User needs multiple ad variants for A/B testing
- User wants ad copy and visual design together
- User wants to iterate on ad creative based on performance data
- User asks for carousel ads (Instagram, Facebook, X/Twitter)
- User wants retargeting/remarketing ad creatives
- User provides their own product photos or brand images and wants ads built around them
- User needs ads in multiple sizes/formats (square + portrait + landscape)
- User wants a product launch or teaser campaign
- User wants seasonal or holiday-themed ads
- User needs app install ad creatives
- User wants to refresh or update existing ads without performance data
- User asks to make ads that match their website's look and feel

## When NOT to Use

- Organic social media content (use content-machine skill)
- Video ads or animated content (use storyboard skill for planning)
- Full landing pages (use the artifacts skill)

## Supporting References

Read each file at the point named below; paths are relative to this skill's folder.

- [Platform specifications](references/platform-specs.md): before choosing dimensions, safe zones, or copy character limits (Step 2 and Steps 5-6).
- [Brand colors and logo extraction](references/brand-assets.md): during brand research in Step 1, before writing any subagent task.
- [Ad HTML layouts and images](references/html-layouts.md): before writing or reviewing ad HTML in Step 7, and whenever an ad uses a hero image or user-provided images.
- [Canvas layout and export](references/canvas-and-export.md): when placing finished ads on the canvas, or exporting PNGs at pixel sizes.
- [Campaign-specific workflows](references/campaign-workflows.md): for carousel, retargeting, user-provided images, multi-format, awareness/launch, seasonal, app install, or refresh requests, and when the user provides performance data.

## Golden Rules (check before every ad)

1. **<20 words total on the image** -- everything else goes in primary text / description fields
2. **Only 4 elements per ad**: Logo, Hero, Benefit line, CTA button
3. **Flat solid background colors only** -- no gradients, no patterns, no textures (exception: awareness/launch ads may use a hero image as the background)
4. **Real brand logo, always** -- never substitute plain text for a logo (see the logo extraction reference)
5. **Left-align content** -- logo top-left, text left-aligned, CTA left-aligned. Centered layouts look generic.

## Methodology

### Step 1: Creative Brief

Gather: Platform and Format, Objective, Target audience, Key message, CTA, Brand assets, Performance data (if iterating).

**Brand research (mandatory before building):** Always use web search to look up the brand's actual visual identity before designing. Search for `[brand] brand font typeface typography` and `[brand] brand colors hex`. Use the brand's real fonts, colors, and visual language -- never guess or substitute generic alternatives. If the official fonts are commercial/licensed, find the closest Google Fonts alternatives used in the brand's own guidelines. Common pairings: a sans-serif for headlines (e.g., Poppins) and a serif for body text (e.g., Lora). Include these in the subagent task instructions so every angle uses the correct brand identity.

**Font loading (mandatory in every ad HTML):** After identifying the brand's fonts (or closest Google Fonts alternatives), include them in the head of every ad HTML file:

```html
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;900&family=Lora:wght@400;700&display=swap" rel="stylesheet">
  <style>
    .headline { font-family: 'Poppins', sans-serif; }
    .benefit { font-family: 'Lora', serif; }
  </style>
</head>
```

Always specify the exact weights needed (400, 700, 900). Never rely on browser defaults or system fonts -- every ad must load its fonts explicitly.

**Extract real brand colors and the real logo from the site (mandatory).** Do not trust web search results for colors -- they are frequently wrong. Fetch the actual CSS and inline SVG logo from the brand's website, and verify the logo's path data is complete, using the commands in [Brand colors and logo extraction](references/brand-assets.md).

### Step 2: Platform Specifications

Pick dimensions, safe zones, and text limits for each placement from [Platform specifications](references/platform-specs.md) (Meta, Google Ads, LinkedIn, TikTok, X). Meta 4:5 portrait (1080x1350) is the preferred feed format; keep text out of the top 14% and bottom 35% of 9:16 placements.

### Step 3: Determine Campaign Mode

Before defining angles, determine whether this is **direct-response** or **awareness/launch**.

#### Direct-Response (default)

Use for conversion, lead generation, app installs, purchases. This is the default -- most ad requests are direct-response.

#### Awareness / Launch Campaigns

Use for product launches, brand announcements, event teasers, top-of-funnel awareness. Prioritize mood and brand impression over clicks.

Key differences from direct-response:

- **No CTA button on the image.** The CTA lives in the post text or link, not the visual.
- **Even less text: ~10-15 words max** -- typically brand name, one positioning line, and a date/tagline.
- **Visual metaphor over product shots.** Use evocative imagery that communicates feeling or aspiration.
- **Multiple visual worlds per campaign.** For carousels or multi-asset campaigns, create 3-5 distinct aesthetic treatments -- different palettes, subjects, moods -- while keeping typography and logo placement consistent.
- **Layout pattern:** Logo (top corner) then Hero visual (fills most of the frame) then Brand name/headline (bottom, large, bold) then Subtitle + date (smaller, below headline).
- **Hero images allowed.** Unlike direct-response, awareness ads may use a full-bleed generated image as the background (see Image Guidance in [Ad HTML layouts and images](references/html-layouts.md)).

**When to use awareness mode:** Pre-launch teasers, brand-building campaigns, event promotion, or when the user says "announce," "tease," "launch," or asks for something "premium" without conversion goals.

### Step 3b: Define Angles

Before writing individual copy, establish 3-5 distinct angles -- different reasons someone would click:

| Category | Example |
|----------|---------|
| Pain point | "Stop wasting time on X" |
| Outcome | "Achieve Y in Z days" |
| Social proof | "Join 10,000+ teams who..." |
| Curiosity | "The X secret top companies use" |
| Identity | "Built for [specific role/type]" |
| Urgency | "Limited time: get X free" |
| Contrarian | "Why [common practice] doesn't work" |

**For retargeting ads**, adjust angles for warm audiences who already know the brand:

- Reminder: "Still thinking about X?"
- Incentive: "Come back for 15% off"
- Social proof: "See why 10,000 others chose us"
- Scarcity: "Only 3 left in your size"
- Objection handling: "Free returns, no risk"

### Step 4: Design Principles

- **Under 20 words total on the image** -- this is the most important rule. Icons, stats rows, feature grids, and badges all violate this. If it doesn't fit in Logo + Hero + Benefit + CTA, it belongs in the primary text.
- Visual hierarchy: Logo (top-left) then Hero element then Benefit then CTA
- WCAG 4.5:1 contrast minimum
- CTA: contrasting color, rounded corners, verb-first, left-aligned
- **No gradients** -- flat solid colors only. Use different solid colors across ads for variety. Exception: awareness/launch ads may use a bottom readability gradient over a hero image.

### Steps 5-6: Generate and Validate Copy

Vary word choice, specificity, tone, and structure across angles. Always validate character counts against the platform limits before delivering. Include counts in your output.

```text
## Angle: [Pain Point -- Manual Reporting]

### Headlines (30 char max)
1. "Stop Building Reports by Hand" (29)
2. "Automate Your Weekly Reports" (28)
3. "Reports in 5 Min, Not 5 Hrs" (27)

### Descriptions (90 char max)
1. "Marketing teams save 10+ hours/week with automated reporting. Start free." (73)
2. "Connect your data sources once. Get automated reports forever. No code required." (80)
```

### Step 7: Build Ad Creatives

Every ad must use viewport-relative (vw/vh) sizing and the mandatory 4-element structure in [Ad HTML layouts and images](references/html-layouts.md); awareness/launch and user-image ads use the image-first layout from the same file.

#### File Setup

Place all ad HTML files in `artifacts/mockup-sandbox/public/ads/` -- served by the mockup-sandbox Vite dev server at `/__mockup/ads/filename.html`.

After copying image assets from `attached_assets/`, always fix permissions:

```bash
chmod 644 artifacts/mockup-sandbox/public/ads/*.png artifacts/mockup-sandbox/public/ads/*.jpg
```

Files copied from `attached_assets/` default to `rw-------` (unreadable by the server).

#### Cache Busting

Canvas iframes cache aggressively. After editing any ad file, increment `?v=N` on the iframe URL:

```text
https://your-domain.dev/__mockup/ads/angle1.html?v=2
```

#### Parallel Subagents -- Full Task Template

Launch one design subagent per angle simultaneously. Each subagent gets a complete, self-contained task with all brand details, the HTML structure, and styling rules baked in. **Do not assume the subagent knows any of the golden rules -- repeat them explicitly.**

```javascript
const adDesignTask = `Create a production-ready ad creative as a standalone HTML file.

**Brand:**
- Name: [Brand Name]
- Primary color: [hex] | Secondary: [hex] | Accent: [hex]
- Headline font: [Font Name] (Google Fonts -- load via link tag in head)
- Body font: [Font Name] (Google Fonts -- load via link tag in head)
- Logo: [inline SVG code or path to logo file]

**Ad Details:**
- Platform: [Meta Feed / Google Display / LinkedIn / TikTok / X]
- Angle: [Pain Point / Outcome / Social Proof / etc.]
- Headline: "[exact headline text]"
- Benefit: "[one short benefit line]"
- CTA: "[verb-first CTA text]"
- Background color: [hex -- flat solid, NO gradients]

**File:** Write to artifacts/mockup-sandbox/public/ads/[filename].html

**MANDATORY HTML STRUCTURE -- follow exactly:**

The ad must use this structure:
- html/body: width 100vw, height 100vh, overflow hidden, margin 0, padding 0
- .ad container: width 100vw, height 100vh, solid background color (NO gradients), flex column, justify-content space-between, padding 6vh 7vw
- .logo: top-left, inline SVG at height 5vh
- .middle: flex column, gap 3vh, containing headline, benefit, and CTA
- .headline: brand headline font, font-size 8vw, font-weight 900, line-height 1.1
- .benefit: brand body font, font-size 3vw, slightly transparent white
- .cta: inline-block, padding 2vh 5vw, accent color background, border-radius 1vw, font-weight 700, align-self flex-start (LEFT-ALIGNED)
- .footer: font-size 1.8vw, subtle color, brand URL

**RULES -- do not violate:**
- Only 4 elements: Logo, Headline, Benefit, CTA. No icons, stats, badges, feature grids, or dividers.
- Under 20 words total visible on the ad.
- Flat solid background color -- NO gradients, NO patterns.
- All sizing in vw/vh -- NO fixed pixel dimensions.
- Left-align everything -- logo top-left, text left-aligned, CTA left-aligned. Do NOT center.
- Load fonts from Google Fonts in the head. Do NOT use system fonts or Inter.
- The CTA button must use a contrasting accent color and be verb-first.`;
const adJobs = [
  subagent({
    name: "ad-design",
    task: adDesignTask,
    config: {
      $kind: "design",
      relevantFiles: ["artifacts/mockup-sandbox/public/ads/[filename].html"],
    },
  }),

// Repeat for each angle -- all launch simultaneously
];

const adResults = await Promise.all(adJobs);
for (const adResult of adResults) {
  console.log(adResult.text);
}
```

After all ad-design subagents finish, embed each ad as an iframe on the canvas using `apply_canvas_actions`, and call `presentArtifact({ artifactId, shapeIds: [...] })` with the IDs of the new iframe shapes. Lay the iframes out as described in [Canvas layout and export](references/canvas-and-export.md): side-by-side 600x600 squares with ~50px gutters by default, no text labels above iframes, and a descriptive componentName on each.

## Prompt-Specific Workflows

For carousel, retargeting, user-provided images, multi-format, awareness/launch, seasonal/holiday, app install, or refresh requests, follow the matching section of [Campaign-specific workflows](references/campaign-workflows.md) on top of the methodology above.

## Iterating from Performance Data

When the user provides performance data, analyze winners and losers, generate new variations, and present the analysis to the user before building new ads, following "Iterating from Performance Data" in [Campaign-specific workflows](references/campaign-workflows.md).

## Research Before Writing

Use web search to find examples of top-performing ads in the user's vertical. Search for ad breakdowns, swipe files, and case studies -- e.g. `[industry] top performing Facebook ads 2026` or `[industry] TikTok ad examples`. Reverse-engineer: what hook, what angle, what visual pattern. Don't guess what works -- look it up.

## Common Mistakes

### Content overload (most common)

- Adding icons, stats rows, feature grids, or badges -- these violate the under-20-word rule. Each ad should have exactly 4 elements: Logo, Hero, Benefit, CTA.
- Using gradients instead of flat solid colors (except awareness/launch hero images)
- Centering all content instead of left-aligning (left-aligned text feels more intentional and professional)

### Logo issues

- Using plain text instead of the brand's actual logo -- always extract the real SVG from the brand's website first
- Truncated SVG path data -- always verify path length and max coordinates after extraction
- Not checking that the SVG viewBox contains the full logo (max X/Y must be within viewBox bounds)

### Brand identity

- Trusting web search for brand colors -- always extract actual hex values from the site's CSS
- Using generic fonts (e.g., Inter) instead of the brand's actual typeface
- Not loading fonts via Google Fonts link in the HTML head -- relying on system fonts

### Technical

- width Xvw with height auto alone on square logo images (overflows container)
- Forgetting chmod 644 on assets copied from attached_assets (server can't read them)
- Not incrementing ?v=N on iframe URLs after editing HTML files
- Placing ad files in the wrong directory (use artifacts/mockup-sandbox/public/ads/, not client/public/ads/)

### Copy

- RSA headlines that only work in sequence (Google mixes them -- each must stand alone)
- Writing for the 125-char feed limit when Reels only shows 72
- All angles being the same message reworded (vary the psychology, not the synonyms)
- Text in the bottom 35% of a 9:16 ad (covered by platform UI)
- Letting Performance Max auto-generate video -- always supply your own

### Subagent delegation

- Not including the full HTML structure template in the subagent task -- subagents will invent their own layout
- Not repeating the golden rules in each subagent task -- they don't inherit context from the main agent
- Not specifying font loading instructions -- subagents will use system fonts
- Not providing the exact brand colors and logo SVG -- subagents will guess
