---
name: tiktok-ads
description: Sets up a user's TikTok advertising account after the TikTok Ads MCP is connected (ad account, business info, payment, identity, pixel), following TikTok best practices, then creates and publishes a campaign for their project using mcpTikTokAds_* tools. Use when the user wants to advertise their project on TikTok, or mentions TikTok ads, TikTok campaigns, or their TikTok ad account.
---

# TikTok Ads: Account Setup to Published Campaign

Goal: get a campaign live for the user's project with as few questions as possible. Most inputs come from the project itself.

**Ask the user only for:** setup steps that need their TikTok login, the campaign objective, budget, and final go-live approval. Make the creative yourself unless they want to use their own.

**Keep the flow moving.** After each step finishes (account fixed, videos generated, assets uploaded), go straight to the next step in the same turn. Don't stop and wait for the user to ask you to continue.

## When NOT to use
- Designing static ad images or banners: use `.local/secondary_skills/ad-creative/SKILL.md`.
- Organic TikTok posts or captions with no ad spend: use `.local/secondary_skills/content-machine/SKILL.md`.
- Planning a video the user will film themselves: use `.local/secondary_skills/storyboard/SKILL.md`.
- Ads on other channels: not supported yet. Say so and offer TikTok.

## Before you start
- **The connection's skill file:** the TikTok Ads row in the integrations list has a `ref` with the path to its generated skill file. Read that exact path. Never build the path yourself (for example `.local/mcp_skills/tiktok_ads/SKILL.md`); the folder is named after the connection handle, so a guessed path will not exist. If the row has no `ref` yet, call the tools directly using `toolList` / `toolGet`.
- **Connection:** if `mcpTikTokAds_*` tools are callable, use them directly. Otherwise follow the curated MCP flow in `.local/skills/integrations/SKILL.md`: call `searchIntegrations({ mode: "list" })` once and keep only results whose `mcpProviderId` matches TikTok Ads. One matching `connection:<id>`: follow its status (`not_added` → `addIntegration`). Several: ask the user which account to use. None: call `ProposeIntegration` with the TikTok Ads `mcp:<provider>` id as the only candidate.
- **Ad brief:** if you were handed an approved ad brief (from `.local/secondary_skills/ads/SKILL.md`), use it and don't re-ask anything in it. Otherwise, build one from the project's code, content, and deployment (that skill's Step 1 has the full checklist):
  - **Product:** what's sold, main products, and price range
  - **Customer:** who it's for, plus main country and language
  - **Goal:** purchase, signup, app install, or lead
  - **Landing page:** the deployed URL and the best page to send people to. If the app isn't deployed, offer to deploy first; ads need a public URL.
  - **Tracking:** whether a TikTok Pixel is installed (search for `ttq` / `analytics.tiktok.com`)
  - **Creative sources:** product images and logo in the project

  Ask only about gaps you can't fill. Never ask for the project's name or URL.

## TikTok is the source of truth
TikTok changes its tools, specs, event names, and best practices often. This skill describes the flow; TikTok supplies the details.
- **Tools:** the connection loads about 40 core tools and finds the rest on demand. Use `mcpTikTokAds_toolList` to find the tool for a task, `mcpTikTokAds_toolGet` to read its inputs, and `mcpTikTokAds_toolExecute` to call a tool that isn't loaded. Don't rely on tool names from memory.
- **Guidance:** before relying on a number or name in this skill, read the matching page below if you can fetch web pages (`.local/skills/web-search/SKILL.md`). If you can't, use the fallback in parentheses.

| Topic | TikTok page |
|---|---|
| Account fields that can't be changed | [Required information to set up an ad account](https://ads.tiktok.com/resources/help/article/ad-account-information-faq?lang=en) |
| Payment | [Supported payment methods](https://ads.tiktok.com/resources/help/article/supported-payment-methods), [Create ad accounts in Business Center](https://ads.tiktok.com/resources/help/article/create-ad-accounts-in-business-center) |
| Pixel and events | [Set up and verify Pixel](https://ads.tiktok.com/resources/help/article/get-started-pixel?lang=en), [Updated standard events](https://ads.tiktok.com/help/article/how-to-adopt-tiktoks-updated-standard-events) |
| Smart+ creatives, budget, and edits | [Smart+ Web best practices](https://ads.tiktok.com/help/article/best-practices-for-smart-plus-web-campaigns?lang=en) |
| Video and ad text specs | [Ad format and functionality](https://ads.tiktok.com/resources/help/article/tiktok-ads-policy-ad-format-and-functionality) |
| Ad review | [Landing page checklist](https://ads.tiktok.com/resources/help/article/ad-review-checklist-landing-page?lang=en-US), [Common reasons ads fail review](https://ads.tiktok.com/help/article/common-reasons-ads-fail-review?lang=en) |
| Full tool library | [Available tools in the MCP server](https://business-api.tiktok.com/portal/docs/available-tools-in-tiktok-for-business-mcp-server/v1.3) |

## Ground rules
- **Check account readiness before collecting campaign inputs.** Don't let the user plan a campaign and then fail on setup at the last step.
- **Money needs explicit approval.** Never create an active campaign, raise a budget, or turn a campaign on without confirmation. Create paused when the schema allows it.
- **Don't guess parameters or IDs.** Run `toolGet` before the first call to any write tool. Only use IDs returned by read tools.
- **Do setup through the connection when you can.** If `toolList` has a tool for a setup step (creating a pixel, uploading media, Business Center accounts or billing), offer to do it there. Otherwise guide the user in TikTok Ads Manager with exact values to paste, then check again. Never restart the flow.
- **Advise, don't block.** Landing-page quality, missing pixel, placeholder products, or inactive checkout are reasons to warn and offer fixes, not reasons to stop. Say what TikTok's review or performance is likely to suffer, offer to fix it, and let the user decide. Stop only for the hard blockers listed in Step 4.
- **Translate errors.** Never show raw error codes alone. Say what happened, whether money was spent, and the one next step.

## Step 1: Sync with the MCP
1. `toolList`: see what this connection exposes, including on-demand tools.
2. With the read tools it lists, check which ad accounts the connection can access; each account's status, currency, time zone, and industry; the Business Center; identities; and pixels.

## Step 2: Account setup checklist (best practices)
Show the user a checklist with ✅/❌ for each item. Fix only the ❌ items, one at a time: through a connection tool if one exists, otherwise with Ads Manager steps and values to paste from the brief.

| Item | Ready when | Best practice / values to suggest |
|---|---|---|
| **Ad account** | The connection can access an ad account | If none: create one in Ads Manager (or in Business Center if the user has one), or reconnect TikTok with access to an existing one. Some fields can't be changed later (fallback: time zone, country/region, currency, and business name), so match them to where the business is based and bills. |
| **Business Center** | One exists (recommended, not required) | Recommended so the business, not one person, owns the ad account, pixel, and assets. Essential if several people or an agency manage ads. |
| **Business info** | Account status is active, not pending | Legal or brand name from the project. Website = the **real landing URL** (not a company name). Industry = the closest accurate match, since it affects ad review. Country from the brief. Complete verification if TikTok asks for it. |
| **Payment** | Account info shows no payment or contract issue | Add a payment method. A pending-contract status blocks campaigns; for accounts in a Business Center, add billing in the Business Center. Resolve it before planning. |
| **Identity** | An identity exists | Best: link the brand's TikTok account (allows Spark Ads and builds followers). Fallback: a custom identity using the project's name and logo. |
| **Pixel** | A pixel exists and is installed in the project | See Step 3. Needed for sales and conversion objectives. |

After each fix, re-run the matching check and update the checklist.

## Step 3: Tracking (TikTok Pixel)
- If the goal is sales, conversions, or leads, a pixel is required. For traffic, it's strongly recommended so later campaigns can optimize.
- **No pixel:** create one through the connection if `toolList` has a pixel tool. Otherwise the user creates it in Ads Manager (fallback: Tools → Events Manager → Connect Data Source → Web), then you find its ID.
- **Install it in the project yourself:** add the base code site-wide plus standard events where they happen, using the names on TikTok's standard events page (fallback: `ViewContent`, `AddToCart`, `InitiateCheckout`, and `Purchase` with `value` and `currency`; `Lead` for forms; `CompleteRegistration` for signups).
- For web campaigns, TikTok recommends its Events API alongside the Pixel. Offer it if the project has a backend.
- Deploy, then confirm events arrive (Events Manager test events) before choosing a conversion objective. If the pixel has no data yet, start with a Traffic objective while it collects data.

## Step 4: Landing page review (advice, not a gate)
Check the project and creative against TikTok's ad review pages (fallback list below). Report what you find as recommendations; don't put the campaign on hold for them.

**Hard blockers (the only reasons to stop):**
- No public landing URL. Offer to deploy first.
- The ad account can't run campaigns (payment, contract, or account status from Step 2).
- The product is in a category TikTok prohibits. If it might be restricted, warn before the user spends time on creative.

**Recommendations (warn, offer to fix, then continue):**
- The landing URL loads quickly on mobile and shows the product from the ad
- Prices and offers match the ad text
- Real products, not placeholders or examples, and a working checkout if the goal is sales
- A privacy policy page and contact information (offer to add them)
- The creative has no unauthorized third-party logos, including TikTok's

Show the findings in one short list, say which ones are likely to get the ad rejected in review, and ask once: fix them first, or continue and create the campaign paused now. If the user continues, proceed to Step 5 without asking again. If the destination is weak, suggest a Traffic objective in Step 6.

## Step 5: Creative
1. **Find existing videos** with the creative and identity-video tools.
2. **Lead with making them.** You already have the brief and the project's product images and logo, so recommend generating the videos yourself. Ask once (AskQuestion) with the recommended option first: generate new videos with AI (recommended), use existing videos (list them, or leave this option out if there are none), or upload their own (offer `storyboard` to plan the shoot).
3. **How many:** Smart+ works best with several creatives (fallback: at least 6). If the user has fewer, say so and suggest how to close the gap, for example AI clips with different hooks.
4. **To generate,** follow `.local/skills/media-generation/video-generation.md`. Ask only for quality (recommend High), confirm the number of clips and the cost before generating, and use these defaults:
   - **9:16, 8 seconds,** with a product image from the project as `imagePath`. Check length and ratio against TikTok's specs (fallback: 5–60 seconds; 9:16 for phone feeds, 16:9 only for landscape placements).
   - **Prompt:** a hook in the first second, the product centered, and no text in the frame. Vary the hook between clips. End the way it starts so TikTok's replay loops cleanly.
   - **Expectations:** each clip is 8 seconds and can loop to about 16. For a 20–30 second ad, offer a multi-scene video made with `.local/secondary_skills/content-machine/SKILL.md` instead.
   - **Longer ad:** loop the clip with FFmpeg, adding a short crossfade if the seam shows (Looping and Crossfade in `.local/secondary_skills/video-editing/operations.md`).
   - Show the videos to the user, then continue straight to upload.
5. **If generation fails,** don't silently substitute something else:
   1. Retry once with the same settings.
   2. If it fails again, read the error. A refusal often means the reference image shows a third-party brand or trademarked product, a person, or text; a timeout or service error usually means the provider is having trouble.
   3. Tell the user in one sentence what failed and whether it cost anything, then ask once (AskQuestion): try again, try a different image or prompt, make a simpler photo-animation video from the image instead (pan/zoom with FFmpeg), or upload their own video.
6. **Upload the assets yourself.** Don't send the user to Ads Manager to upload. Offer this upfront, before asking them to do anything manually:
   1. **Ask permission once:** say you'll put the videos (and any images) in the project's App Storage and give TikTok a temporary download link, that this may add small storage and transfer charges, and that it doesn't publish the app or turn on the campaign.
   2. **Store the file** in App Storage (see `.local/skills/object-storage/SKILL.md`) and create a short-lived signed download URL for it. Don't use the dev preview URL or a page URL; TikTok can't log in, so those return HTML instead of the file.
   3. **Check the link** before passing it to TikTok: fetch it without cookies and confirm it returns status 200 with `Content-Type: video/mp4` (or the image type), not an HTML page.
   4. **Upload by URL.** Use `toolGet` on the upload tool, then call it through `mcpTikTokAds_toolExecute`. For video this is `file_video_ad_upload` with `upload_type: "UPLOAD_BY_URL"`, the `advertiser_id`, and `video_url`; images have a matching image upload tool. Confirm the names with `toolList`.
   5. **Keep the IDs** TikTok returns (for example `video_id`) and use them when creating the ad. If an upload fails, translate the error and retry once.
   6. Only if no upload tool exists, give the user the files and exact Ads Manager steps, then find the uploads with step 1.
7. **Ad text:** 2–3 options from the brief, within TikTok's text limit (fallback: 100 characters).

## Step 6: Plan and publish
1. **Ask what to optimize for.** Use AskQuestion with the objectives this account can use (check the campaign tools' options with `toolGet`), marking your recommendation from the brief and saying why. Typical choices:
   - **Traffic:** more visits to the site. Best when there's no pixel data yet or the site isn't ready for sales.
   - **Website conversions / sales:** optimizes for buyers. Needs a working checkout and a pixel sending purchase events.
   - **Leads or signups:** for forms, waitlists, or account creation. Needs a pixel event for the signup.
   Don't silently pick the objective for the user.
2. Show one plan: the chosen objective, landing URL, creatives, ad text, location, broad audience, schedule, and **daily budget**. TikTok's Smart+ budget guidance assumes past cost per result, so for a new account suggest a modest amount above the schema minimum, explain the learning period (fallback: run at least 7 days), and state the total spend.
3. **Pre-launch check:** compare the creative count, budget, and run time with TikTok's best practices, and tell the user about any gap before publishing.
4. If the connection has a campaign review tool, check the campaign with it first.
5. **Create paused** with the Smart+ campaign tool. If Smart+ creation is blocked or missing, look in `toolList` for the standard campaign, ad group, and ad tools with Smart+ options, and try that path once, paused.
6. Verify the campaign, ad group, and ad. On approval, activate the campaign.
7. Report the campaign name and ID, status, budget, schedule, destination, and a **direct link to the campaign** in Ads Manager, not the Ads Manager home page. Use the campaign URL from the create or read response if there is one; otherwise build the link from the advertiser ID (`aadvid`) and campaign ID.

## When creation fails
- First run `mcpTikTokAds_tiktokAdsDiagnosisAgent` on the error.
- **`NOT_AVAILABLE` + `LIFTSTUDY_GATE`** ("…lift study experiment… wait 3-4 months"): TikTok is blocking this advertiser from that tool for now. Nothing was created or charged. Don't retry the same tool; try the standard path from Step 6 once if you haven't.
- **Permission errors:** reconnect TikTok with ad account access.
- **Validation errors:** fix using `toolGet` and retry once.
- **Fallback for any blocker:** give the user a ready-to-paste campaign brief for Ads Manager so their work isn't lost.

## After launch (best practices)
- **Edits and budget:** follow TikTok's Smart+ guidance (fallback: no major edits for the first 7 days; change bids by at most 15% every 2 days; raise the budget by at most 30% when the campaign spends 90% or more of it). Every change needs the user's approval.
- **Ad review:** check review status through the connection. If an ad is rejected, explain why in plain words and offer to fix it, or appeal if a tool allows it.
- **Results:** summarize spend, clicks, conversions, and cost per result from TikTok's reporting tool.
- **Fresh creative:** add new videos every few weeks to avoid ad fatigue.

## TikTok's own AI skills (optional)
TikTok's [Agentic Hub](https://ads.tiktok.com/apps_and_agents/agentic-hub) lists AI skills from TikTok and its partners that run on the same MCP server. These TikTok-built ones fit this flow best:
- `content-service-newbie-advertisers-diagnosis-skill`: checks creative count, budget, and bid setup for new advertisers.
- `account-specific-diagnosis-copilot`: finds what changed when an account or campaign is blocked.
- `tt4b-creative-engine`: ranks winning creatives once a campaign has results.

Users download these skills from the Agentic Hub with their TikTok login and add them to their project; you can't install them for the user. If one is installed in the project, use it for its task. Some are built for TikTok's all-tools MCP mode, so call any tool they name that isn't loaded through `toolExecute`. If none is installed, mention the relevant one when it fits, but don't depend on it.
