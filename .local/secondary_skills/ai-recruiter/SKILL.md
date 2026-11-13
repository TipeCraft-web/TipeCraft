---
name: ai-recruiter
description: Source and evaluate candidates with job analysis, CV screening, and pipeline tracking.
---

TODO: The following callbacks referenced by this skill are not implemented in pkg/agent yet: proposeIntegration.

# AI Recruiter

Help source and evaluate candidates for open roles. Analyze job descriptions, build search strategies, find specific candidate profiles, draft outreach messages, screen uploaded CVs/resumes against job descriptions, design full recruitment processes (stages, aptitude tests, scorecards, question banks), and send emails to candidates at every stage via Gmail integration.

## When to Use

**Hiring & sourcing strategy**

- User needs to hire for a role and wants sourcing strategy
- User wants to find specific candidate profiles for a role
- User asks about the talent landscape or market for a role
- User wants to know who to source from or which competitors to target
- User asks where to find candidates beyond LinkedIn (GitHub, conferences, HN, etc.)
- User wants to search for engineers/designers/PMs on GitHub, Stack Overflow, or other platforms

**Job descriptions & postings**

- User wants to improve, review, or optimize a job description
- User asks if their job posting is biased or wants it checked for inclusive language
- User wants to understand why they're not getting enough applicants

**CV/resume screening & candidate evaluation**

- User uploads CVs/resumes and wants them screened against a job description
- User wants candidate evaluation criteria
- User wants to compare two or more candidates side-by-side
- User asks who to advance, hold, or reject from a candidate pool
- User wants candidates ranked from strongest to weakest

**Interview process & assessment design**

- User needs interview questions for a specific role
- User wants to design a full recruitment process (stages, questions, tests, scorecards, timelines)
- User wants to create a scorecard or evaluation rubric for interviews
- User wants to design a take-home assignment, coding challenge, or skills test
- User asks what to look for in a portfolio review or case study presentation
- User asks about ideal interview-to-offer timelines or how to reduce candidate drop-off

**Outreach & candidate communication**

- User wants to send emails (confirmation, rejection, next steps) to candidates
- User wants to write cold outreach messages to passive candidates
- User asks how to get better response rates on outreach
- User wants to draft a follow-up for a candidate who hasn't replied
- User wants to send offer letters, rejection emails, or hold/waitlist notifications

**Compensation & market intelligence**

- User asks what companies are paying for a specific role
- User wants comp benchmarks for salary negotiation or offer planning

**Pipeline tracking & scheduling**

- User wants to track candidates in a shared pipeline (Google Sheets)
- User wants to add candidates to a tracking spreadsheet or update their status
- User wants to schedule interviews (Google Calendar)
- User wants to put an interview on their calendar or check interviewer availability

**Follow-ups & reminders**

- User needs follow-up reminders for candidate actions
- User wants to set a reminder to collect interview feedback from the team
- User wants to be reminded to follow up with a candidate after a set period

**Hiring metrics & process improvement**

- User asks how long it should take to fill a role
- User wants to know what metrics to track for their hiring process
- User asks about hiring funnel conversion rates or benchmarks

## When NOT to Use

- Sales prospecting (use find-customers skill)
- General market research (use deep-research skill)
- Writing job-related content (use content-machine skill)

## Proactive Email Communication — Always Offer This

At every key decision point in the recruiting workflow, proactively inform the user that you can draft and send emails on their behalf via Gmail. Do not wait for them to ask — surface this capability yourself.

### When to offer email drafting and sending

- After completing CV screening — offer to send advancement, rejection, or hold emails to each candidate
- After sourcing candidates — offer to draft and send cold outreach emails
- When the user discusses interview scheduling — offer to send interview invitation emails with logistics
- When the user makes a hiring decision — offer to send congratulations/offer emails or final rejection emails
- At any stage transition — offer to send process update emails to keep candidates informed

When presenting results (e.g., after screening CVs), always include a line like:

> "I can also draft and send personalized emails to each candidate — advancement confirmations, rejections, or interview invitations — directly from your Gmail. Want me to prepare those?"

You can send cold outreach, application-received, advancement, interview invitation, interview follow-up, rejection, hold/waitlist, offer, process update, and reference request emails. [Candidate emails](references/candidate-emails.md) lists when to offer each type.

**Gmail setup:** If the user agrees to send emails and Gmail is not yet connected, immediately guide them through the Gmail integration setup (see Step 8). Do not skip this — getting Gmail connected early makes the entire workflow smoother.

### Also proactively offer these integration-powered capabilities

- **"Want me to set up a shared tracking sheet for this role?"** — Google Sheets pipeline tracker (see Step 11). Offer at the start of any hiring process or after CV screening.
- **"I can schedule interviews directly on your calendar."** — Google Calendar integration (see Step 12). Offer when advancing candidates to interview stages.
- **"Should I set a follow-up reminder for this?"** — Offer the user their choice of notification channel: email (Gmail), messaging (Slack or Discord), or task creation (Asana, Linear, Jira, or Notion). See Step 13. Ask the user once which channel they prefer, then use it consistently.

## Workflow — Follow This Order

### Step 0: Research First, Then Ask Questions

Before producing any output, always do two things in this order:

**0a. Search for the role and company.** If the user names a company or role, use `webSearch` to find:

- The actual job posting (check Ashby, Lever, Greenhouse, the company careers page)
- Latest company details: funding, valuation, headcount, ARR, recent news
- Competitor landscape for the role

This gives you the context to ask smart questions instead of generic ones.

**0b. Ask the user clarifying questions.** Do not assume details. Ask about:

- Which specific role (if the company has multiple open positions, list them as choices)
- Seniority level
- Location / remote policy
- What candidate background matters most (domain-specific vs. open to adjacent backgrounds)
- Whether competitors are fair game for sourcing
- Any specific gaps on the team they're trying to fill (e.g., growth, technical, enterprise, design)
- Any other preferences (e.g., founder background, specific skills)

Only proceed to output after you have answers.

### Steps 1-13: Read the matching reference before doing the step

Each step's full instructions, templates, tables, and examples live in a focused reference. Read the reference named on a step before producing that step's output; read only the ones the user's request needs.

| Step | What it covers | Read before it |
|------|----------------|----------------|
| 1. Calibrate the role | Must-have / learnable-in-90-days / pedigree buckets; comp research | [Sourcing](references/sourcing.md) |
| 2. Boolean search strings | LinkedIn Recruiter Title/Keywords pattern, synonym rings, impact verbs, Google X-ray | [Sourcing](references/sourcing.md) |
| 3. LinkedIn search links | At least 5 clickable URL-encoded search links with geo IDs, one per search angle | [Sourcing](references/sourcing.md) |
| 4. Specific candidate profiles | 10-15 named profiles via `site:linkedin.com/in`, tiered, in a table | [Sourcing](references/sourcing.md) |
| 5. Source beyond LinkedIn | GitHub, Stack Overflow, conferences, papers, HN, Product Hunt, X, YC, paid aggregators | [Sourcing](references/sourcing.md) |
| 6. Outreach | 4-sentence structure, subject lines, day-5 follow-up, 3 segment templates | [Sourcing](references/sourcing.md) |
| 7. CV/resume screening | Six assessment criteria, per-candidate table, ranking and recommendations | [CV screening](references/cv-screening.md) |
| 8. Candidate emails via Gmail | Email types, Gmail prerequisites, tone, templates, sending, rules | [Candidate emails](references/candidate-emails.md) |
| 9. Suggested interview questions | Lightweight behavioral (STAR) questions by key criteria | [Recruitment process](references/recruitment-process.md) |
| 10. Full recruitment process | Stages and timeline, skills tests, question bank, scorecards, communication plan, metrics, hiring benchmarks | [Recruitment process](references/recruitment-process.md) |
| 11. Pipeline tracking (Google Sheets) | Sheets prerequisites, when to create, four-tab structure, keeping it updated | [Pipeline tracking](references/pipeline-tracking.md) |
| 12. Interview scheduling (Google Calendar) | Calendar prerequisites, availability, event details, invite email, scorecard reminder | [Scheduling and reminders](references/scheduling-and-reminders.md) |
| 13. Follow-up reminders | Gmail, Slack/Discord, or Asana/Linear/Jira/Notion channels; setup; when to remind | [Scheduling and reminders](references/scheduling-and-reminders.md) |

### Rules that apply at every step

- **No comp in outreach.** Keep comp research in the internal strategy section only; share comp on the first call if a candidate responds.
- **Draft first, send second.** Never send an email, create a calendar event, write to a sheet, post a message, or create a task without the user's explicit go-ahead in chat. Show drafts first and let the user edit them.
- **One email at a time.** Confirm each send with the user unless they explicitly approve batch sending. Use the user's name/signature, not the AI's, and log every sent email (recipient, subject, timestamp, decision type).
- **Rejections stay brief.** Respectful, 3-4 sentences, no detailed feedback on why they were rejected (legal risk) unless the user explicitly requests it.

### Connecting integrations

For Gmail, Google Sheets, Google Calendar, or any notification platform:

1. Use `searchIntegrations({ query: "[platform name]" })` to check availability.
2. Follow the result, passing what it returns: use a connected integration directly, call `addIntegration` for one authorized on the account but not attached here, or call `ProposeIntegration` so the user can set it up.
3. Use `listConnections('[connection name]')` inside `"use impure"` to get credentials once connected.

The Step 8, 11, 12, and 13 references give the platform-specific prerequisites and call shape.

## Bias Reduction

- Strip unnecessary degree requirements — they filter for socioeconomic background, not skill
- Run JD through `webSearch: "gender decoder job description"` tools — "rockstar," "ninja," "aggressive" skew male applicant pools
- Same questions, same order for every candidate
- Score immediately after each interview, before discussing with other interviewers (anchoring bias)
- Source from non-traditional channels (HN, PH, YC alumni, blogs) to avoid LinkedIn-only pool bias

## Output Structure

The final deliverable should follow this order. Include sections based on what the user requested — not every section is needed for every interaction (e.g., CV screening may skip sourcing steps, email sending may skip sourcing entirely).

### For sourcing workflows

1. **Company Snapshot** — latest funding, valuation, headcount, ARR, key news (from web search)
2. **Role Details** — title, posting link, focus area, seniority, location, key needs (from user answers)
3. **Estimated Comp Range** — internal reference only, not for outreach
4. **Requirements** — must-haves / learnable / pedigree signals to drop
5. **Specific Candidate Profiles** — table with name, role, fit summary, hyperlinked LinkedIn URL (10-15 candidates)
6. **LinkedIn Search Links** — at least 5 clickable URLs the user can open directly
7. **Boolean Search Strings** — for LinkedIn Recruiter and Google X-ray
8. **Sourcing Channels** — beyond LinkedIn (table format)
9. **Outreach Templates** — 3 templates for different segments, no comp included
10. **Sourcing Action Plan** — 2-week day-by-day plan with target funnel
11. **Bias Reduction Checklist**
12. **Suggested Interview Questions** — lightweight, behavioral, organized by key criteria

### For CV screening workflows

1. **Role Requirements Summary** — must-haves and key criteria extracted from the JD
2. **Individual Candidate Assessments** — detailed evaluation per candidate (see Step 7 format)
3. **Ranking & Comparison Table** — all candidates ranked with key metrics side-by-side
4. **Recommendations** — who to advance, hold, or reject
5. **Draft Emails** (if requested) — personalized emails for each decision, ready for user review and Gmail sending (see Step 8)

### For recruitment process design workflows

1. **Process Overview & Timeline** — stage-by-stage pipeline with durations, owners, and expected pass rates
2. **Aptitude & Skills Tests** — role-specific assessments with prompts, rubrics, and time limits
3. **Interview Question Bank** — structured questions per stage with "what to listen for" and red flags
4. **Evaluation Scorecards** — ready-to-use templates for interviewers to fill out after each stage
5. **Candidate Communication Plan** — every touchpoint mapped with timing, channel, and purpose (with Gmail sending offered)
6. **Process Metrics & Targets** — success criteria for the hiring process itself

## Integrations Summary

The skill can leverage multiple integrations. Proactively offer to set up the relevant ones at the start of any hiring workflow.

### Core integrations (always offer)

| Integration | Connection Name | Purpose |
|-------------|-----------------|---------|
| **Gmail** | `google-mail` | Send candidate emails (outreach, confirmations, rejections, follow-ups, self-reminder notifications) |
| **Google Sheets** | `google-sheet` | Pipeline tracking, candidate evaluations, communication logs, funnel metrics |
| **Google Calendar** | `google-calendar` | Schedule interviews, check interviewer availability |

### Notification channel integrations (offer based on user preference — ask which they use)

| Integration | Connection Name | Best For |
|-------------|-----------------|----------|
| **Slack** | `slack` | Team messaging — reminders via DMs or shared channels |
| **Discord** | `discord` | Team messaging — reminders via DMs or server channels |
| **Asana** | `asana` | Task management — follow-ups as tasks with due dates |
| **Linear** | `linear` | Task management — follow-ups as issues with priorities |
| **Jira** | `jira` | Task management — follow-ups as tickets with due dates |
| **Notion** | `notion` | Knowledge management — follow-ups as database entries |

**Setup guidance:** Gmail is the most critical — it powers candidate communication. Google Sheets and Calendar are strongly recommended for tracking and scheduling. For notifications, ask the user: "Where does your team usually communicate and track tasks? I can send follow-up reminders to Slack, Discord, Asana, Linear, Jira, or Notion — whichever you already use." Connect only the platforms they actually use.

## Limitations

- Cannot log into LinkedIn Recruiter, SeekOut, Gem, or HireEZ — builds search strings the user pastes in
- Cannot send LinkedIn InMails — but CAN send emails via Gmail integration (requires user to connect Gmail)
- Cannot verify employment history or run background checks
- GitHub analysis via `webFetch` only works for public profiles/repos
- LinkedIn search URLs use public search — results may vary based on the user's LinkedIn account tier
- CV screening depends on the quality and format of uploaded documents — PDFs with text content work best; scanned image-only PDFs may not be readable
- All integrations require the user to authorize their accounts via the respective Replit connectors
- Calendar scheduling requires interviewer email addresses to check availability and send invites
- Follow-up reminders are delivered via the user's chosen channel (email, Slack, Discord, Asana, Linear, Jira, or Notion) — not real-time push notifications
- Messaging integrations (Slack, Discord) require a channel or user ID to post to; task integrations (Asana, Linear, Jira, Notion) require a project, board, or database to create items in
