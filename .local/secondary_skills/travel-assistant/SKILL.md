---
name: travel-assistant
description: Plan trips, build itineraries, find flights and hotels, and estimate travel budgets.
---

# Travel Assistant

Build comprehensive travel planners tailored to the user's needs. This skill ensures the agent gathers all necessary information before building, chooses the right output format, and includes essential features from the start. It also covers practical travel knowledge — flights, entry requirements, pacing, and budgeting.

## When to Use

- Itinerary building, flight/accommodation strategy, budget estimation
- "What do I need to enter [country]?" — visa/vaccine/ETIAS checks
- Building interactive trip planning web apps

## When NOT to Use

- Booking (can't transact); travel insurance (insurance-optimizer)

## Reference Files

Read each file only when its condition applies:

- [Flights and accommodations](references/flights-and-hotels.md) — when searching for or presenting flights or hotels: option templates, which search tools to use, booking rules, and accommodation platforms.
- [Booking integrations](references/booking-integrations.md) — when a planner app needs live availability, prices, reviews, or booking deep links from travel platforms.
- [Planner app features](references/planner-app-features.md) — when building a web-based planner: AI recommendations, real-time data, transportation planning, packing lists, trip templates, multi-region logic, the feature checklist, design defaults, and PDF export.
- [Data model](references/data-model.md) — when defining venue, booking, or transport types in a planner app.
- [Budgeting](references/budget.md) — when estimating costs, adding budget tracking, or writing a budget summary.

## Step 1: Ask Output Format First

Before building anything, ask the user what format they want:

- **Interactive website** — Best for browsing, exploring options, and sharing with travel companions. Can include maps, filters, and selection tools.
- **PDF report** — Best for offline use, printing, and taking on the trip. Clean, formatted document.
- **Excel/spreadsheet** — Best for budget-focused planning, collaborative editing, and people who prefer tabular data.
- **Combination** — e.g., a website with PDF export (most common for serious trip planning).

## Step 2: Gather Trip Details

Collect these essentials before generating any content:

- **Where are you traveling from?** (origin city/airport — required for flight search)
- **Dates and duration** — When and how long (or flexible?)
- **Destinations / regions** — Specific cities, or open to suggestions?
- **Group size and composition** — Number of adults, children, babies, elderly. This directly affects activity recommendations, restaurant choices, and accessibility needs (stroller-friendly, wheelchair access, etc.)
- **Travel style** — Budget, mid-range, luxury, or mixed
- **Priorities** — Food-focused, adventure, culture, relaxation, nightlife, nature, family fun
- **Must-dos and must-avoids** — Any specific places, activities, or experiences they want or want to skip
- **Pace preference** — Packed schedule vs. slow and relaxed
- **Dietary needs** — Allergies, vegetarian, etc. (affects restaurant recommendations)

Do NOT search for flights without knowing the origin city — you will get it wrong.

## Step 3: Content Depth

Ask how detailed they want the plan:

- **High-level outline** — Day-by-day overview with main activities
- **Detailed recommendations** — Specific restaurants, activities, alternatives, prices, links, and booking info
- **Full concierge** — Everything above plus rain plans, backup options, and curated picks

## Entry Requirements — Check Before Anything Else

Getting this wrong ends the trip at the airport. webSearch every time — rules change.

| Check | Source | Notes |
|-------|--------|-------|
| Visa requirements | `travel.state.gov` (US citizens) or `[passport country] [destination] visa requirements` | |
| Schengen 90/180 (Europe) | `ec.europa.eu` calculator or `schengenvisainfo.com/visa-calculator` | 90 days in any rolling 180-day window. Does NOT reset on exit. Count days not months. Entry + exit days both count as full days. Schengen ≠ EU (UK, Ireland out; Switzerland, Norway in) |
| ETIAS (Europe) | `etias.com` | Pre-authorization now required even for visa-free travelers |
| Passport validity | — | Many countries require 6 months validity beyond your departure date. Check blank pages too (some need 2+) |
| Vaccines | `cdc.gov/travel` | Yellow fever is mandatory (with certificate) for some countries if arriving from an endemic zone |
| Onward ticket proof | — | Some countries (Thailand, Philippines, Indonesia, Costa Rica, Peru) won't let you board without proof you're leaving |
| Safety advisories | `travel.state.gov/content/travel/en/traveladvisories` | |

## Itinerary Pacing — The \#1 Mistake Is Overplanning

### Hard limits

- **Max 1 anchor activity per half-day.** One museum in the morning, one neighborhood in the afternoon. Hour-by-hour schedules fall apart by day 2.
- **Transit tax:** every change of location costs 30-60 min more than Google Maps says (finding the entrance, ticketing, getting lost once). Budget it.
- **Day 1 after a long-haul flight is dead.** Plan a walk and an early dinner, nothing with a timed entry.
- **3-night minimum per city** for multi-city trips. 2 nights = 1 real day. Fewer cities, done well, beats a checklist.
- **One unplanned afternoon per 3 days.** The best travel moments are unscheduled.
- **Cluster by geography** — plot everything on a map first, then group by neighborhood. Never cross the city twice in a day.

### Known closure patterns

- Europe: many museums closed Mondays (Louvre, Prado) or Tuesdays (Italy). Always verify.
- Japan: many restaurants/shops closed one weekday (often Mon or Wed). Golden Week (late Apr-early May) = everything packed.
- Middle East: Friday is the weekend day; expect closures.
- Siesta countries (Spain, Greece, parts of Italy): 2-5pm dead zone outside tourist cores.

## Step 4: Build with These Standards

### Flights and Hotels

Search with `webSearch` and present options with **direct links** to booking/search pages. Include at least 3 flight options when possible (cheapest, best schedule, best airline), and 3-5 accommodation options spanning the user's budget range, listed per city for multi-city trips. Before searching or presenting, read [flights-and-hotels.md](references/flights-and-hotels.md) for the queries, option templates, search tools, and booking rules.

### Day-by-Day Itinerary

Structure each day with anchor activities and restaurant recommendations with links:

```text
## Day X — [Neighborhood/Theme]
**Anchor (AM):** [Activity] — book ahead? y/n — ~$XX — nearest metro: [station]
**Lunch:** [Restaurant name](URL) — [cuisine, 1-line description] — ~$XX/person
**Anchor (PM):** [Activity]
**Dinner:** [Restaurant name](URL) — [cuisine, 1-line description] — ~$XX/person
**Alt dinner:** [Restaurant name](URL) — [backup option]
**Transit:** [A→B method, ~time, ~cost]
**If it rains / you're tired:** [one swap]
**Day est:** $XX
```

For restaurant links, search with `webSearch` for `"best [cuisine] restaurant [neighborhood] [city]"` or `"[city] [neighborhood] restaurants site:google.com/maps"`. Link to Google Maps, Yelp, or the restaurant's website.

### Always Include from the Start

1. **Links for every venue** — Every restaurant, activity, and accommodation must have:
   - A Google Maps link (`mapLink`)
   - A website URL (`websiteLink`) — use the venue's official site when possible
   - These should be in the data model from day one, not added later (see [data-model.md](references/data-model.md))
2. **PDF/Excel export** — If building a website, always include export functionality. Users will want to take their itinerary offline while traveling. Use `jspdf` for PDF generation on the client side.
3. **Booking and availability context** — The app should connect to travel platforms for live data where possible, and fall back to deep links when direct integration isn't available. Always check for new Replit integrations before falling back to deep links. Read [booking-integrations.md](references/booking-integrations.md) for target platforms, the integration priority order, deep-link formats, and the data to surface.
4. **Persistent state** — Selection state (which items the user picks) should survive page refresh. Use localStorage at minimum, or a lightweight backend for sharing.
5. **Mobile-first design** — Trip planners are most useful on phones while traveling. Design mobile-first with responsive breakpoints. Consider PWA features for offline access.
6. **Collaborative features** — For group trips, consider:
   - Shareable links
   - Voting/favoriting on options
   - Comments on activities
   - At minimum, make the plan easy to share (PDF export, copy link)

### Web App — Map + Itinerary

**Always build a web app** that combines two views the user can switch between:

1. **Map view** — all locations plotted on an interactive map with color-coded markers by type (airports, hotels, activities, restaurants). Each marker has a popup with name, time, and links. Connect same-day stops with route lines so the user can see the flow.
2. **Itinerary view** — a beautiful, card-based day-by-day layout. Each day is a card with the day number, neighborhood/theme, and a timeline of activities, meals, and transit. Include photos or icons for each stop, estimated costs, and direct links to book or learn more.

Use the **Nominatim API** (OpenStreetMap) for geocoding addresses to lat/lng — no API key required.

The user should be able to toggle between map and itinerary views. Clicking a day in the itinerary should highlight that day's markers on the map.

When building the app, read [planner-app-features.md](references/planner-app-features.md) for the rest of the feature set, design defaults, and PDF export rules.

### Costs and Budget

Estimate costs per day and per trip, and break them down by category. Read [budget.md](references/budget.md) for per-person estimation ranges, regional adjustments, costs to always add, budget tracking features, and the budget summary table.

## Useful Lookups (webSearch)

- `"[city] 3 day itinerary reddit"` — real traveler pacing, not SEO content
- `"rome2rio [city A] to [city B]"` — compares train/bus/flight/ferry with rough prices
- `"numbeo cost of living [city]"` — meal/taxi/beer price baselines
- `"seat61 [country]"` — train travel bible, especially Europe/Asia
- `"[attraction] skip the line"` — whether advance booking is actually necessary

## Common Pitfalls to Avoid

1. Don't hardcode venues without links — always include mapLink and websiteLink
2. Don't skip export functionality — users always want to take plans offline
3. Don't forget group composition affects recommendations — babies need stroller access, elderly need less walking
4. Don't build desktop-first — travelers use their phones
5. Don't lose selection state on refresh — persist with localStorage or backend
6. Don't try to build booking into the app — link to booking platforms instead
7. Don't ignore travel times — a day with 4 activities spread across a region may not be realistic
8. Don't recommend venues without checking seasonal availability — a summer beach activity shouldn't appear in a winter itinerary
9. Don't show prices only in local currency — international travelers need conversion
10. Don't treat multi-region trips as a flat list — segment by region with clear transfer days
11. Don't forget packing needs change with activities — hiking gear, swimming gear, and fine dining outfits are all different
12. Don't search for flights without knowing the origin city

## Limitations

- Can't see live prices/availability — user must verify before booking
- Visa rules change — always confirm on official government sites
- Can't book anything
