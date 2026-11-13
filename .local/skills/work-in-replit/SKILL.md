---
name: work-in-replit
description: Read before you answer any request to make something (a website, app, slide deck, video, design, dashboard, document, or file). It decides whether the work happens here in the conversation or in a Replit project, and how to deliver it. Skip it for questions, reviews, or changes in a code repository.
---
## What Replit builds

Artifacts are what a project builds. People often ask for less than Replit can build because they don't know what's possible, so when a request maps to an artifact, offer the real thing.

- Websites and web apps: real hosted applications with a React frontend, an API backend, a Postgres database, user accounts, Stripe payments, file storage, scheduled jobs, secrets, connectors, MCP tools, and a live URL with custom domains. Use this for any website, landing page, portfolio, store, tool, MVP, or working prototype, even plain HTML and CSS.
- Mobile apps: native Expo (React Native) apps for iOS and Android that use the camera, location, and other device features, preview on the user's own phone while being built, and can publish to the iOS App Store. Not a mobile-friendly webpage.
- Slide decks: presentations designed like great webpages, with real typography, charts, and imagery, hosted at a shareable link, with PPTX import and PPTX and PDF export. Requests to create slides, a deck, a presentation, or a PowerPoint get a slides artifact, not a standalone file, and a requested download is an export from it. The project asks for deck length and visual theme itself, so shape the audience and story in conversation, not those.
- Animations: short motion-graphics videos built with code, usually 30 to 60 seconds and up to about two minutes, that can include the user's own images and clips. Good for launch and promo videos, explainers, and product demos. Every request to make a video gets this. It is not a video editor: it cannot trim or splice existing footage.
- Data apps: interactive dashboards, reports, and dataset explorers fed by the user's files, databases, APIs, or integrations. A single chart can also be presented here without a project.
- Design explorations: mockups, prototypes, screen variants, image sets, and visual directions laid out side by side on the project's Design canvas, for when the user wants options to react to before building, or wants UX designs or marketing assets to share.

One project can hold several artifacts that work together, such as a website and a companion mobile app sharing one backend and database. Projects also take general software work: a Python project, a script, an API, a game.

Not offered: on-premises or self-hosted deployment, Google Play publishing, or compliance promises; for HIPAA or SOC 2, send the user to Replit.com to check current status. Some capabilities need a paid plan; for prices, point to Replit's pricing.

## Where the work belongs

Work happens on one of two surfaces:

- This conversation runs in a small sandbox with files, a shell, code execution, and the user's connectors and MCP servers. It is for work that is finished once delivered: operating the user's connected systems (a calendar, a Notion page, a Linear issue), transforming or analyzing files and data, research, small scripts, and one-off files such as a document, chart, image, or printable HTML page. It cannot host artifacts, the Design canvas, or deployments.
- A project is where builds live and grow. The user can reopen, iterate on, share, and publish it, and it has databases, deployments, and the Design canvas. A project opens in one of two editor modes: Build, the default, where every artifact is implemented, slide decks included; and Design, a canvas for exploring visual direction (mockups, layouts, look and feel) when the user wants options to react to rather than a working thing.

Most users come to Replit to build. Unless the user is just chatting or asks for something this conversation finishes on its own, such as a single chart, an answer to a simple data question, or a direct task with their connectors, assume they want a project. When they show build intent, move to a project without asking, and never deliver a substitute here: no generated image, mockup, one-off file, or code written into this conversation's files. Build intent includes:
- A website, landing page, app, store, portfolio, MVP, working prototype, SaaS, marketplace, internal tool, or any other artifact goes to a Build project. "Design me an app" asks for the app, not a picture of one.
- Slides, a deck, a presentation, or a PowerPoint go to a slides artifact in a Build project, one-off decks included. People come to Replit for Replit slides, so never deliver a deck any other way: no Google Slides presentation through a connector or MCP server, and no PPTX, PDF, or HTML file made here. A requested PPTX or PDF is an export from the artifact.
- A video, animation, explainer, promo, ad, product demo, or motion graphic goes to an Animation project. Never start the video here: no `generateVideo` clips, no assembled footage, and no video files made here.
- A design, mockup, set of UI screens, UI prototype, poster, ad creative, or multiple new images, including a set like a coloring book, goes to a Design project (`editorMode: 'design'`). When the user says "design", they mean a project.

Editing files the user already has is not a build and stays here: removing a background from their photos, resizing or converting their images, exporting or converting a deck that already exists, or trimming, merging, or subtitling their video with the `video-editing` skill.

When details are missing, ask about the content, such as topic, audience, and scope, as many questions as you need, and move to a project as soon as intent is clear enough to start building. Never ask which surface the work belongs on. If the user asked a direct question, answer it first.

To move the work into a project, read `project-handoff`. When it concerns something the user already has on Replit, read `past-work-on-replit`.

## Delivering files from this conversation

Files you create here are invisible to the user until you present them. Whenever you finish a file for the user, such as a document, spreadsheet, image, PDF, audio, video, or one-off HTML page (a report, invoice, flyer, menu, resume, or printable) but not code, deliver it with `await presentAsset({ filePath, title, description })` inside the CodeExecution tool, using a workspace-relative path. This posts a clickable card in the chat and saves the file to the user's Library. Present each deliverable in the same turn you finish it, before your final reply, and present it again after you revise it. Make static HTML self-contained, with inline CSS and `data:` images. Never link local files in a message or describe a file's path instead of presenting it: `sandbox:/` and `file://` links do not render for the user.
