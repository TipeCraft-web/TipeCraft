---
name: work-in-replit
description: Read before you answer any request to make something (a website, app, slide deck, video, design, dashboard, document, or file). It decides whether the work happens here in the conversation or in a Replit project, and how to deliver it. Skip it for questions, reviews, or changes in a code repository.
---
## What Replit builds

Artifacts are what a project builds. People often ask for less than Replit can build because they don't know what's possible, so when a request maps to an artifact, offer the real thing.

- Websites and web apps: real hosted applications with a React frontend, an API backend, a Postgres database, user accounts, Stripe payments, file storage, scheduled jobs, secrets, connectors, MCP tools, and a live URL with custom domains. Use this for any website, landing page, portfolio, store, or tool, even plain HTML and CSS.
- Mobile apps: native Expo (React Native) apps for iOS and Android that use the camera, location, and other device features, preview on the user's own phone while being built, and can publish to the iOS App Store. Not a mobile-friendly webpage.
- Slide decks: presentations designed like great webpages, with real typography, charts, and imagery, hosted at a shareable link, with PPTX import and PPTX and PDF export. Requests to create slides, a deck, a presentation, or a PowerPoint get a slides artifact, not a standalone file, and a requested download is an export from it unless the user explicitly asks for file-only output. The project asks for deck length and visual theme itself, so shape the audience and story in conversation, not those.
- Animations: short motion-graphics videos built with code, usually 30 to 60 seconds and up to about two minutes, that can include the user's own images and clips. Good for launch and promo videos, explainers, and product demos. Most users who ask for a video in Replit want this. It is not a video editor: it cannot trim or splice existing footage.
- Data apps: interactive dashboards, reports, and dataset explorers fed by the user's files, databases, APIs, or integrations. A single chart can also be presented here without a project.
- Design explorations: mockups, prototypes, screen variants, and visual directions laid out side by side on the project's Design canvas, for when the user wants options to react to before building, or wants UX designs or marketing assets to share.

One project can hold several artifacts that work together, such as a website and a companion mobile app sharing one backend and database. Projects also take general software work: a Python project, a script, an API, a game.

Not offered: on-premises or self-hosted deployment, Google Play publishing, or compliance promises; for HIPAA or SOC 2, send the user to Replit.com to check current status. Some capabilities need a paid plan; for prices, point to Replit's pricing.

## Where the work belongs

Work happens on one of two surfaces:

- This conversation runs in a small sandbox with files, a shell, code execution, and the user's connectors and MCP servers. It is for work that is finished once delivered: operating the user's connected systems (a calendar, a Notion page, a Linear issue), transforming or analyzing files and data, research, small scripts, and one-off files such as a document, chart, image, or printable HTML page. It cannot host artifacts, the Design canvas, or deployments.
- A project is where builds live and grow. The user can reopen, iterate on, share, and publish it, and it has databases, deployments, and the Design canvas. A project opens in one of two editor modes: Build, the default, where every artifact is implemented, slide decks included; and Design, a canvas for exploring visual direction (mockups, layouts, look and feel) when the user wants options to react to rather than a working thing.

Route by lifecycle. If delivering the result finishes the request, do it here now. If the result has a future, it belongs in a project. When a request mixes both, do the one-off part first, then offer a project for the build.

Slides are the exception to one-off files: slides, a deck, a pitch deck, a presentation, or a PowerPoint go to a slides artifact in a Build project, not a PPTX, PDF, or HTML file made here, and you don't ask whether they want an artifact or a file. Make a standalone file only when the user explicitly asks for file-only output ("just give me a .pptx, no project"). Exporting or converting an existing deck to another file format needs no new artifact; importing a file into editable Replit slides does, following the `slides` skill's import flow in the project.

Apart from file-only slide requests and exports of an existing deck, these requests are never ambiguous. Move to a project immediately, without asking, and do not generate an image or mockup of the thing here:
- A website, landing page, app, store, portfolio, or any other artifact goes to a Build project. "Design me an app" asks for the app, not a picture of one.
- Slides, a deck, or a presentation go to a slides artifact in a Build project, one-off presentations included.
- A design, mockup, set of UI screens, prototype, poster, or ad creative goes to a Design project (`editorMode: 'design'`). When the user says "design", they mean a project.

A common mistake is answering a design or video request with media generated here. "Create 5 alternative designs for this instagram post" or "create 2 ui screens for an onboarding" asks for Design explorations in a project, not a batch of generated images. A request for a video usually means an Animation project, not a single AI-generated clip.

When unsure, err toward a project. When you cannot tell whether the user wants a working build or a visual mockup, ask whether they want something working and ready to publish or just a visual mockup, then route to a Build or Design project. When they may genuinely want a generated image or video clip here in chat, ask:
- For visuals: 1) Full professional designs with Replit Design, or 2) AI-generated images here in chat.
- For video: 1) A professional motion-graphics video with Replit Animation, or 2) A short AI-generated clip here in chat.

Ask these with the AskQuestion tool, never in prose: users rarely answer a question written out in a message.

To move the work into a project, read `project-handoff`. When it concerns something the user already has on Replit, read `past-work-on-replit`.

## Delivering files from this conversation

When you finish a file here, such as a document, spreadsheet, image, or one-off HTML page (a report, invoice, flyer, menu, resume, or printable) but not code, deliver it with `await presentAsset({ filePath, title, description })` inside the CodeExecution tool, using a workspace-relative path. Make static HTML self-contained, with inline CSS and `data:` images. Never link local files in a message: `sandbox:/` and `file://` links do not render for the user.
