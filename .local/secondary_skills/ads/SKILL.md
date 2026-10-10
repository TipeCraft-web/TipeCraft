---
name: ads
description: Router for advertising a user's project. Works out what it sells and who it's for, recommends a campaign type, and hands off to a supported channel skill (currently TikTok via tiktok-ads). Use when the user asks to advertise, promote, or market their app or project, run ads, or get more traffic or customers. Not for showing ads inside an app, or for payments and checkout (see monetization).
---

# Ads: Understand the Product, Recommend the Campaign

This skill decides **what to advertise and how**. Channel skills handle **where and the setup**. Finish here with an approved ad brief, then load the channel skill.

**Scope:** promoting the user's project with paid ads. If the user might mean showing ads *inside* their app to earn revenue, ask which one they mean before going further. That's a different task, and this skill doesn't cover it. If the goal is sales but checkout doesn't work yet, offer to set it up first with `.local/skills/monetization/SKILL.md`.

## When NOT to use
- Organic social posts or captions with no ad spend: use `.local/secondary_skills/content-machine/SKILL.md`.
- Designing static ad images or banners without running a campaign: use `.local/secondary_skills/ad-creative/SKILL.md`.
- Planning a video the user will film: use `.local/secondary_skills/storyboard/SKILL.md`.

## Skip ahead when the work is already decided
- **Managing an existing campaign** (results, pausing, budget changes, new creative): go straight to the channel skill.
- **A brief was already approved** earlier in this conversation: hand it to the channel skill without rebuilding it.
- **The user already named a supported channel** (e.g. "run TikTok ads"): don't pitch the channel. Still build the brief and recommend the objective.

## Supported channels

<!-- Add a row here, and its objectives to the Step 2 table, when a new channel ships. -->
| Channel | Skill | Status |
|---|---|---|
| TikTok | `.local/secondary_skills/tiktok-ads/SKILL.md` | Supported |

- Only offer channels in this table, by name. Never offer vague options ("social media," "Google") or unsupported channels.
- If the user asks for an unsupported channel, say it isn't available yet and offer the best supported one.

## Step 1: Understand what's being sold (from the project, not the user)

Read the project's code, content, database seed data, and deployment. Build the brief yourself. Only ask about gaps you truly can't fill.

- **Business and product:** name, what it is, the main products or plans, price range
- **Type of business:** physical goods store, digital product or SaaS, mobile app, local service, lead or booking form, content site
- **Customer:** who it's for (from copy, pricing, imagery, language), plus main country and language
- **Conversion point:** what counts as success (purchase, signup, app install, form submit, booking) and whether it works end to end
- **Destination:** deployed URL plus the best landing page (product, pricing, or signup). If the app isn't deployed, say ads need a public URL and offer to deploy.
- **Tracking:** an existing ad pixel or analytics events (e.g. search for `ttq`, `fbq`, `gtag`)
- **Assets:** product images, logo, and brand colors in the project that can be used for creative
- **Product catalog:** whether there are many products with a structured feed (relevant for catalog or shopping campaigns)

If the project gives no clear sense of the product, ask **one** question: "In a sentence, what are you selling and to whom?"

## Step 2: Recommend the campaign type

Pick the objective from the business type and its tracking readiness. Recommend one, briefly say why, and mention one alternative.

| Context | Recommended objective | Why |
|---|---|---|
| Store with working checkout **and** pixel or purchase events | Sales / website conversions | Optimizes for buyers, not clicks |
| Store or SaaS with no pixel yet | Traffic to the best landing page, and set up the pixel | Conversion goals need tracking data. Start with traffic while the pixel collects data |
| Many products with a feed | Catalog / product sales | Automatically matches products to viewers |
| Mobile app | App installs | Sends people straight to the store listing |
| Lead form, booking, or local service | Lead generation or conversions on the form | Success is a contact, not a purchase |
| New brand, nothing to buy yet | Traffic (or reach) | Builds an audience before asking for a sale |

Channel choice: **TikTok** is the only one right now. Still say why it fits (for example, visual and mobile products and younger audiences do well there). If the product clearly suits TikTok poorly (e.g. niche B2B enterprise software), say so honestly and set modest expectations.

## Step 3: Confirm the brief, then hand off

Show one short brief for the user to edit or approve:

> **Product:** … · **For:** … · **Goal:** … · **Landing page:** … · **Channel:** TikTok · **Tracking:** pixel found / not set up · **Creative sources:** project images found / none

On approval, load the channel skill from the table above and pass it the brief. Don't ask the user for anything already in the brief again.

## Rules for every channel

- Never ask for something you can find in the project.
- Never spend money without explicit approval of the exact budget and settings.
- Explain failures in plain language, with one next step. Never show raw error codes alone.
