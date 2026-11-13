---
name: resume-maker
description: Build professional resumes with viewable HTML and downloadable PDF/DOCX export.
---

# Resume Maker

Build a resume as a React web page backed by a generation script that produces pixel-perfect PDF and DOCX files from a single data source. The web page reads spacing values from the same JSON so the HTML preview closely matches the generated documents.

## Before You Start Building — Gather Information First

**Do NOT start building the resume until you have enough information to write meaningful, specific content.** A resume with placeholder text or vague bullets is useless. You need real details to create something valuable.

If the user provides a complete resume or detailed background

Go ahead and start building immediately. You have what you need.

If the user asks to "make me a resume" without providing details

Before asking them to type everything out manually, **offer two fast-start options** to save them time:

"To save you time, you can get started in one of two ways:

- `**Upload your LinkedIn PDF**` — Go to your LinkedIn profile, click "More" → "Save to PDF", and upload that file here. I'll extract all your info automatically.
- **Copy-paste from LinkedIn** — Go to your LinkedIn profile page, select all the text (Ctrl/Cmd+A), copy it (Ctrl/Cmd+C), and paste it here. I'll parse through it and pull out your experience, education, and skills.

Or if you'd prefer, you can just tell me your details and we'll build it from scratch."

If the user uploads a LinkedIn PDF

Parse the PDF content to extract: name, headline, contact info, work experience (titles, companies, dates, descriptions), education, skills, certifications, and any other sections. LinkedIn PDFs follow a consistent format — use the structure to map content into the resume data model. After parsing, confirm what you extracted and ask if anything needs correction before building.

If the user pastes LinkedIn profile text

Parse the pasted text to extract the same fields. LinkedIn profile text typically follows this structure:

- Name and headline at the top
- "Experience" section with role titles, company names, date ranges, and descriptions

- "Education" section with degrees, schools, and dates
- "Skills" section with a list of skills

- Optional sections like "Certifications", "Publications", "Volunteer Experience"

Map each section into the resume data model. After parsing, confirm what you extracted and ask if anything needs correction.

If the user prefers to provide details manually

Ask clarifying questions before writing any code. Ask about:

- **Target role** — What job or type of role are they applying for? (This shapes the entire resume's framing)
- **Work experience** — For each role: job title, company name, dates, location, and what they accomplished (not just responsibilities — ask for specific achievements, numbers, outcomes)

- **Education** — Degree(s), school(s), graduation year(s), honors/GPA if notable
- **Skills** — Technical skills, tools, languages, frameworks, certifications

- **Contact info** — Full name, email, phone, LinkedIn, location, portfolio/website
- **Optional extras** — Publications, talks, awards, volunteer work, projects

How to ask

When offering the LinkedIn import options, lead with those first since they save the most time. Only fall back to manual questions if the user doesn't have LinkedIn or prefers to start fresh.

If going the manual route, don't dump all questions at once. Start with the most critical:

"No problem! Let's start with the basics:

- What's your full name and contact info (email, phone, LinkedIn, location)?
- What type of role are you targeting?

- Walk me through your work history — for each job, give me the title, company, dates, and your biggest accomplishments with specific numbers if possible."

Then follow up for education, skills, and anything else based on what they share. If they give vague bullets like "managed a team," push back and ask for specifics: "How large was the team? What did you deliver? Any measurable outcomes?"

Enhancing LinkedIn-imported content

Whether imported from PDF or pasted text, LinkedIn data often needs improvement for a strong resume:

- **Bullets are often weak** — LinkedIn descriptions tend to list responsibilities, not achievements. After importing, rewrite bullets to emphasize measurable outcomes and impact. Ask the user for specific numbers if the LinkedIn content is vague.
- **Skills may be bloated** — LinkedIn lets users add dozens of skills. Curate the list down to the most relevant ones for the target role.

- **Summary may be missing or generic** — LinkedIn summaries are often written in first person or as a pitch. Adapt it to resume conventions (third-person implied, concise, role-targeted).
- **Dates and locations may need cleanup** — LinkedIn sometimes uses inconsistent formats. Normalize them.

If the resume feels thin

If the user doesn't have enough experience to fill a page, ask about additional material: volunteer work, side projects, open-source contributions, certifications, coursework, publications, talks, or awards. Proactively suggest these categories — don't just leave the page half-empty.

If the user provides a job posting

Ask them for their background details, then tailor the resume to match the posting's keywords and requirements. Mirror the posting's language.

## Build Order — Files First, Website Last

Follow this exact order so the user gets fast, tangible results:

- **Write the generation script** (generate-resume-files.ts) with all resume content and run it to produce the PDF, DOCX, and resume-data.json
- **Present the PDF to the user in chat** — show the generated PDF file immediately so they can see their resume right away

- **Present the DOCX file to the user in chat** — make the DOCX available for download so they can grab it
- **Build the web app last** — set up the React artifact and API routes that serve the resume page and download endpoints

The user cares most about seeing their resume quickly. The PDF and DOCX are the primary deliverables — get those into the user's hands first. The web app is a nice-to-have that comes after. Do NOT spend time building the web app before the user has seen their PDF and downloaded their DOCX.

## Architecture

scripts/src/generate-resume-files.ts `← single source of truth for content + layout

└─ output/

`├─ resume-data.json ← consumed by the web frontend

`├─ <name>-resume.pdf ← downloadable PDF

`└─ <name>-resume.docx ← downloadable DOCX

artifacts/<name>/src/pages/resume.tsx `← React page, reads resume-data.json via API

artifacts/api-server/src/routes/download.ts ← serves PDF, DOCX, and JSON

Data flow

- generate-resume-files.ts holds all resume content in a getResumeData() function.
- The script renders the PDF with jsPDF, measures content height, and auto-adjusts spacing to fill exactly one US Letter page (612×792pt, 36pt margins).

- It writes the computed spacing values into resume-data.json alongside the content.
- The React page fetches resume-data.json at runtime and uses the spacing values (converted pt→px via 96/72) to render a matching HTML preview.

## Content Rules

- **Summary/blurb**: If you include a personal summary at the top, keep it to 2 sentences max. Long plaintext paragraphs waste prime real estate and recruiters skip them.
- **One page hard limit**: The resume MUST fit on exactly one US Letter page (612×792pt). The auto-fit algorithm handles this, but be mindful when writing content — more bullets doesn't mean better.

## Flag Guesses and Inferred Details

If you had to guess or infer any details — dates, job titles, specific contributions, metrics, technologies — you MUST tell the user what you made up. After presenting the first draft, explicitly list anything you weren't sure about and ask if they want to correct it. For example:

"I made a few assumptions I want to flag:

- I estimated your dates at Company X as 2021–2023 — are those right?
- I wrote that you 'reduced API latency by 40%' based on your mention of performance work — is that accurate, or should I adjust the number/framing?

- I guessed TypeScript and Python for your skills — anything to add or remove?"

Do NOT silently present fabricated details as fact. The user trusts you to be honest about what you know vs. what you inferred.

## Iteration and Changes

When the user requests changes (rewording bullets, adding/removing sections, reordering, etc.):

- Make the requested changes in generate-resume-files.ts
- **Re-run the generation script** to produce updated PDF, DOCX, and JSON

- **Verify the output still fits on one page** — if the changes pushed content past the page boundary, the auto-fit algorithm should handle it, but visually confirm. If content is getting clipped or the scale factor is too aggressive (text becoming unreadably small), trim lower-priority bullets or reduce spacing before delivering.
- **Re-present the updated PDF and DOCX** to the user in chat

Never deliver an updated resume without re-running the generation script. The PDF/DOCX must always reflect the latest content. Every iteration cycle ends with the user seeing a fresh PDF and having a fresh DOCX to download.

## Critical Unit Rules

DOCX (docx npm package)

The docx package uses two different unit systems — mixing them up causes 10× sizing bugs:

- **TextRun.size**`= **half-points**:`ptToHalfPt = pt * 2 (e.g., 11pt → 22)
- **Spacing, margins, page dimensions**=**twips**: ptToTwip = pt \* 20 (e.g., 36pt → 720)

Always define separate converter functions:

const ptToHalfPt = (pt: number) => Math.round(pt \* 2);

const ptToTwip = (pt: number) => Math.round(pt \* 20);

jsPDF baseline rule

doc.text(text, x, y) draws text with y as the **baseline** — the text body extends upward from y. When placing a horizontal rule after text:

- **Wrong**: y += 2 after drawing a rule — text overlaps the line
- **Right**: y += lineHeight after drawing a rule — full clearance before next text

doc.line(MARGIN, y, PAGE_W - MARGIN, y);

y += lineHeight; `// NOT y += 4`

Web CSS alignment

When using borderBottom as a section divider:

- Put the border directly on the element (e.g., h2) rather than a separate <div>
- Use paddingBottom to separate text from the line

- Use marginBottom with at least lineHeight to separate the line from content below

## One-Page Auto-Fit Algorithm

The generation script measures content height, then adjusts spacing to fill the target:

`1.` Render with BASE_SPACING → measure finalY

1. If finalY > TARGET_Y: shorten bullets until it fits
2. If finalY < TARGET_Y: distribute slack across sectionGap, roleGap, bulletGap, lineHeight

`4.` Re-render with adjusted spacing → write final files

Slack distribution weights: sectionGap: 3, roleGap: 2, bulletGap: 1, lineHeight: 0.5

## Code Skeletons

- Before writing `generate-resume-files.ts`, read [the generation script skeleton](references/generation-script.md) for the interfaces, page constants, base spacing, DOCX unit converters, PDF and DOCX renderers, and the auto-fit `main()` that writes the PDF, DOCX, and `resume-data.json`.
- Before building the web app, read [the web app skeletons](references/web-app.md) for the React resume page (pt→px spacing and section headers) and the API routes that serve the PDF, DOCX, and resume data.

## Common Pitfalls

| Problem | Cause | Fix |

|---|---|---|

| DOCX text is 10× too large | Used ptToTwip (×20) for TextRun.size | Use ptToHalfPt (×2) for font sizes |

| PDF text overlaps horizontal rule | Used y += 4 after doc.line() | Use y += lineHeight after any rule |

| Web section header line cuts through text | Border on a sibling `<div>`instead of the`<h2>`| Put borderBottom on the`<h2>` with paddingBottom |

| Downloads fail in Replit preview iframe | Proxy blocks file downloads in iframe | Use target="_blank" on download links, or present files directly |

| Web spacing doesn't match PDF | Hardcoded px values in CSS | Convert all pt values via PT_TO_PX = 96/72 |

## Dependencies

- jspdf — PDF generation
- docx — DOCX generation

- tsx — TypeScript script runner (dev dependency)
