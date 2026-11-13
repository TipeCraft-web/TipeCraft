---
name: ads
description: Router for advertising a user's project or business. Resolves the promoted project or URL, helps the customer choose an available channel with Google Ads recommended first when available, builds an ad brief, and hands off to the chosen channel skill. Use when the user asks to advertise, promote, or market a named project, app, site, or business, run ads, or get more traffic or customers. Not for showing ads inside an app, or for payments and checkout (see monetization).
---

# Ads: Understand the Product, Recommend the Campaign

This skill identifies **what to advertise** and helps the customer choose **where**.
Channel skills handle campaign types and setup through their live tool contracts.
Finish here with the customer's channel choice and ad brief.

**Scope:** promoting the user's project with paid ads. If the user might mean showing ads *inside* their app to earn revenue, ask which one they mean before going further. That's a different task, and this skill doesn't cover it. If the goal is sales but checkout doesn't work yet, offer to set it up first with `.local/skills/monetization/SKILL.md`.

**Conversation scope:** Google Ads can be prepared and inspected here using its
available integration tools. The TikTok setup/build flow remains project-only;
do not run its project workflow in a conversation or promise its tools here.
If the user chooses TikTok here, follow the current project-handoff instructions
for the selected project rather than creating or moving a project automatically.

## When NOT to use
- Organic social posts or captions with no ad spend: use `.local/secondary_skills/content-machine/SKILL.md`.
- Designing static ad images or banners without running a campaign: use `.local/secondary_skills/ad-creative/SKILL.md`.
- Planning a video the user will film: use `.local/secondary_skills/storyboard/SKILL.md`.

## Skip ahead when the work is already decided
- **Managing an existing campaign** (results, pausing, budget changes, new creative): go straight to the channel skill.
- **A brief was already approved** earlier in this conversation: hand it to the channel skill without rebuilding it.
- **The user already named a supported channel** (e.g. "run TikTok ads"): load its channel skill without pitching alternatives or asking them to choose again. Reuse the supplied context.
- **The user named Google Ads:** load `.local/secondary_skills/google-ads/SKILL.md` immediately. It owns Google account readiness, project-aware preparation, lifecycle and reporting; do not substitute TikTok or a different campaign type for missing Google tools.

## Supported channels

| Channel | Skill | Status |
|---|---|---|
| Google Ads | `.local/secondary_skills/google-ads/SKILL.md` | Offer when available to this customer; the live tools determine campaign support. |
| TikTok | `.local/secondary_skills/tiktok-ads/SKILL.md` | Project-only setup; follow its channel skill and current availability. |

- Only offer channels in this table, by name. Never offer vague options ("social media," "Google") or unsupported channels.
- If the user asks for an unsupported channel, say it isn't available yet and offer the best supported one. A channel listed here is not proof its requested mutations are available.

For channel recommendations, check the current integration inventory and available
discovery tools without starting setup. In conversations, if Google Ads is not
listed, use `searchIntegrations` when available to look for it, including
not-yet-connected integrations. Offer Google Ads only when the inventory or
discovery result confirms it is available to this customer. A connection that
needs setup or reconnection does not by itself make the channel unavailable.
If discovery fails or is unavailable, do not infer availability from this table
or the presence of a skill. Use confirmed options or explain that availability
could not be verified. Availability to connect does not establish support for a
particular campaign type; the selected channel's live tools determine that.

## Step 1: Understand what's being sold (from the project, not the user)

First read `.local/secondary_skills/ads/references/project-context.md`. Resolve context from the initial prompt, a supplied URL, or available projects for selection, in that order. Reuse an unambiguous named project or approved brief without repeating selection. Use only read-only retrieval, not a deployment or site edit, to build the brief. Do not inspect private customer records or seed data containing personal information.

Read accessible project content and its public deployment. Only ask about material gaps you truly can't fill; distinguish observed facts, recommendations, and user-confirmed intent.

- **Business and product:** name, what it is, the main products or plans, price range
- **Type of business:** physical goods store, digital product or SaaS, mobile app, local service, lead or booking form, content site
- **Customer:** who it's for (from copy, pricing, imagery, language), plus main country and language
- **Conversion point:** what counts as success (purchase, signup, app install, form submit, booking) and whether it works end to end
- **Destination:** deployed URL plus the best landing page (product, pricing, or signup). If the app isn't deployed, say ads need a public URL and offer to deploy.
- **Tracking:** an existing ad pixel or analytics events (e.g. search for `ttq`, `fbq`, `gtag`)
- **Assets:** product images, logo, and brand colors in the project that can be used for creative
- **Product catalog:** whether there are many products with a structured feed (relevant for catalog or shopping campaigns)

If the project gives no clear sense of the product, ask **one** question: "In a sentence, what are you selling and to whom?"

## Step 2: Help the customer choose a channel

If the channel is unspecified, present **Google Ads first as the recommended
starting option when available**, alongside other available, relevant channels.
Briefly explain the tradeoffs using the business and goal, without promising
results. If another channel is clearly a better fit, explain why rather than
forcing the Google Ads recommendation.

Ask the customer to choose before connecting an account or starting channel setup,
even when only one channel is available. Do not treat a recommendation as their
selection. Explain when a choice requires a project handoff; do not move or create
a project automatically. Keep discovery details out of the customer-facing options.
After selection, use the channel skill and live tool contracts for campaign types,
objectives and requirements; do not infer them from the business type alone.

## Step 3: Confirm the brief, then hand off

Show one short brief for the user to edit or approve:

> **Product:** … · **For:** … · **Goal:** … · **Landing page:** … · **Channel:** customer's choice · **Tracking:** pixel found / not set up · **Creative sources:** project images found / none

Include the selected project/site, offer, geography/language, budget/currency and account/campaign linkage when supplied. Mark missing intent as a question or proposal, not a website fact. On approval, load the channel skill from the table above and pass it the brief. Don't ask the user for anything already in the brief again.

## Rules for every channel

- Never ask for something you can find in the project.
- Never spend money without explicit approval of the exact budget and settings.
- Follow the Google Ads skill for account discovery, selection and switching. Confirm each requested switch with the customer, including whether it applies to one action or future actions. Keep one-action overrides separate from the session default. Before every write, communicate the target account name and customer ID with the proposed changes and spending; approval for one account never applies to another. Request connection or reauthorization only if needed; selection and OAuth consent never approve spend.
- Explain failures in plain language, with one next step. Never show raw error codes alone.
