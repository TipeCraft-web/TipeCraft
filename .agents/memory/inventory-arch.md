---
name: VoxelCraft Inventory Architecture
description: How inventory counts flow between Game.tsx (state) and Player.tsx (useFrame)
---

Player does NOT manage inventory state — Game.tsx owns it via `countsRef` (mutable ref for sync useFrame access) + `uiState.counts` (React state for rendering).

**Why:** Player's useFrame needs synchronous count reads (can't wait for React re-render). Game needs counts for crafting/inventory UI.

**Flow:**
- Player calls `onBlockBreak(type)` / `onBlockPlace(type)` callbacks → Game mutates `countsRef` + queues `setUiState`
- Player calls `canPlace(type)` → reads `countsRef.current` directly (synchronous)
- Crafting modifies `countsRef.current` then calls `setUiState` for new hotbar
- `externalHotbar` prop flows Game→Player; Player syncs via `useEffect` (only fires when ref changes, e.g. after craft)

**How to apply:** Always keep `countsRef.current` and `uiState.counts` in sync — mutate the ref first, then queue the state update.
