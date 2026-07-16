---
name: Mobile Touch Fix Patterns
description: How to make UI elements reliably tappable on mobile inside R3F canvas
---

Three layers of protection needed for mobile UI inside a full-screen R3F canvas:

1. **`data-no-look="1"`** on modal root div → TouchControls skips look-handling for touches inside.
2. **`data-touch-btn="1"`** on individual buttons → TouchControls joystick also skips these.
3. **`onTouchStart={e => { e.stopPropagation(); e.preventDefault(); doAction(); }}`** on each interactive element → eliminates 300ms tap delay and prevents canvas from capturing the touch.

**Why:** R3F canvas captures all pointer events. Without onTouchStart+preventDefault, onClick fires after 300ms delay (or not at all) on mobile because the browser treats the touch as a potential scroll/pan gesture first.

**How to apply:** Any overlay modal needs data-no-look on root; any button inside it needs data-touch-btn + onTouchStart handler. Both are required — data-no-look alone doesn't make clicks fast.
