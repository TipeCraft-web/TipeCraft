# tokens.json schema (DTCG)

The design-system artifact's `tokens.json` is the single source of truth.
`build-tokens.mjs` reads it and generates the component-library web theme
(`src/index.css`, as `H S% L%` channels) and the portable hex object
(`src/generated/tokens.tsx`).
Edit `tokens.json` only — never the generated files. The build **throws** if any
role is missing, so every role below must have a value in both light and dark.

## The core palette comes first

Every design system leads with a small core palette. Ours is **`primary`,
`secondary`, `accent`** — always present, always named exactly these, and shown
first (in that order) in the preview. The remaining roles below are supporting.
Do not rename or substitute the core (no `brand`, `main`, `highlight`, etc.) —
consumers and the component-library theme depend on the exact names.

## Naming consistency

Use the role names in this document verbatim. When extracting from an existing
source, **map** the source's colors onto these roles — never invent new role
names or drop the standard ones. If the source has a color with no obvious role,
map it to the closest supporting role (or a `chart*` slot), rather than adding a
bespoke key the theme can't consume. Every role here exists in both `light` and
`dark`; keep the key sets identical across the two.

## Colors — 32 roles, in BOTH `color.light` and `color.dark`

Authored as hex (`{ "$value": "#rrggbb" }`, optional `$description`). The core
three (`primary`, `secondary`, `accent`) are marked below.

| role | what it drives |
| --- | --- |
| `background` / `foreground` | page background / default text |
| `card` / `cardForeground` | card surface / text on it |
| `popover` / `popoverForeground` | popover surface / text on it |
| `primary` / `primaryForeground` | primary brand color (buttons, links) / text on it |
| `secondary` / `secondaryForeground` | secondary surface / text on it |
| `muted` / `mutedForeground` | muted surface / muted text |
| `accent` / `accentForeground` | accent surface / text on it |
| `destructive` / `destructiveForeground` | danger color / text on it |
| `border` | default border |
| `input` | input border |
| `ring` | focus ring |
| `chart1`–`chart5` | data-viz series colors |
| `sidebar` / `sidebarForeground` | sidebar surface / text |
| `sidebarBorder` | sidebar border |
| `sidebarPrimary` / `sidebarPrimaryForeground` | sidebar active / text |
| `sidebarAccent` / `sidebarAccentForeground` | sidebar hover / text |
| `sidebarRing` | sidebar focus ring |

Rules:

- **Both modes complete.** Light and dark must contain the same keys — every role
  in the table above. Derive the dark counterpart from the light value (and
  vice-versa) — don't leave gaps.
- **Foregrounds must contrast.** Each `*Foreground` must be legible on its
  paired surface (aim WCAG AA). The favicon generator also picks black/white by
  luminance, so a sane `primary` matters.
- **Charts harmonize.** `chart1`–`chart5` should be distinguishable and on-brand,
  not random.

## Typography — `typography.fontFamily`

Each is a font-stack array ending in a generic family:

```json
"sans":  { "$value": ["Inter", "sans-serif"] },
"serif": { "$value": ["Georgia", "serif"] },
"mono":  { "$value": ["Menlo", "monospace"] }
```

`sans` is the UI/body face. Make sure the preview `index.html` loads whatever
families you pick (Google Fonts link or self-hosted `@font-face`).

## Radius & spacing

```json
"radius":  { "base": { "$value": "0.5rem" } },   // sm/md/lg/xl derive from this
"spacing": { "base": { "$value": "0.25rem" } }   // base step the theme multiplies
```

## Aliases

DTCG `{a.b.c}` references resolve via the generator, so you can alias one role to
another (e.g. `"ring": { "$value": "{color.light.primary}" }`). The default
template uses literal hex; aliases are optional.
