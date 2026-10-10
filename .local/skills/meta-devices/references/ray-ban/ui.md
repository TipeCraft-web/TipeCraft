# UI Rules for Meta Ray-Ban Display Glasses Web Apps

Build UI **however you like** — any framework, any component library, any styling
approach, JS or TypeScript. This reference does not prescribe a UI implementation. It
defines the **display rules** every screen and component must obey to work on the
glasses. Follow these; the rest is your call.

> Applies whenever you add or change UI — a new screen, a button, a list, a form,
> whatever. The glasses hardware and D-pad input model are the only constraints.

## The rules (non-negotiable)

**Viewport**
- Fixed **600 × 600**. All content fits inside; no horizontal scroll, no reliance
  on the browser window size.

**Additive display — color**
- The display is additive: `#000000` emits no light and is **fully transparent**
  (the real world shows through). Use it for the page background.
- **Never** put `#000000` on a UI surface that needs to be seen. Cards, headers,
  nav bars, buttons, modals use **dark grays** (`#0a0a0f`–`#1a1a2e`) so they read
  as opaque on the see-through canvas.
- Text and icons are **light** (`#ffffff` / `#e8e8e8`). Body-text contrast ≥ 4.5:1.
- Never use color as the only signal — pair it with an icon, shape, or label.

**Input — D-pad only (no touch, mouse, or keyboard)**
- Every interactive element must be **focusable** and reachable by D-pad. Focus
  moves with **arrow keys and wraps around** (last → first, first → last).
- **Enter/tap activates** the focused element; **Escape/back** goes to the previous
  screen.
- Show a **clearly visible focus state** — focus *is* the cursor. (The reference
  scaffold uses a cyan ring: `box-shadow: 0 0 20px rgba(0, 212, 255, 0.4)`.)
- **Focused elements scroll into view automatically.**
- Keep navigation shallow — **≤ 3 steps** to reach any action.

**Sizing & legibility**
- Minimum **14dp** text for interactive elements; tap/focus targets **≥ 44dp**.
- All text should survive up to 200% scaling without breaking layout.

**Scrolling**
- Scrollable containers use `overflow-y: auto` with a constrained `max-height` —
  don't let content overflow the 600 × 600 frame.

**Performance**
- Prefer CSS transitions (150–300ms) over JS animation; cap animation at ~30fps and
  animate `transform`/`opacity` only. No continuous animations/timers while idle —
  start work on demand, stop it when the screen isn't visible.
- Stop any timers, sensors, or connections when leaving a screen.

## How to apply

1. **Ask** what to add, where (which screen or a new one), and what happens on activation.
2. **Build it in your stack**, satisfying every rule above.
3. **Verify** against the checklist below.

If you're extending the reference vanilla [app scaffold](create-app.md),
its conventions make this automatic: mark interactive elements `class="focusable"`
(add `tabindex="0"` if not a `<button>`), give them a `data-action="..."` handled in
`handleAppAction()`, and make each screen a `<div class="screen">` with a unique `id`
(auto-registered by `collectScreens()`). In another framework, reproduce the same
*behavior* — focusable, D-pad-navigable, additive-safe.

## Verify

- [ ] Fits within 600 × 600; no horizontal scroll
- [ ] Page background `#000000`; UI surfaces use dark grays (visible, not transparent)
- [ ] Text is light and readable; contrast ≥ 4.5:1; color isn't the only signal
- [ ] Every interactive element is focusable and reachable by D-pad (arrows wrap)
- [ ] Visible focus state; Enter activates; Escape goes back
- [ ] Focused elements scroll into view; scroll containers use `overflow-y: auto` + `max-height`
- [ ] Text ≥ 14dp, targets ≥ 44dp; ≤ 3 steps to any action
- [ ] No idle animation; motion capped ~30fps, transform/opacity only; resources stopped on screen exit

## Related references

- [App creation](create-app.md) — scaffold a new app with D-pad navigation
- [Storage](storage.md) — persist settings and state
- [Sensors](sensors.md) — motion, orientation, and GPS
- [Performance](performance.md) — keep animation and payload within budget
