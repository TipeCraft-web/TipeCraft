---
name: Pixel Art Texture Atlas
description: How the 8×8 pixel block texture atlas works in World.tsx
---

Atlas is 128×128px (16 cols × 16 rows, 8px per tile). Block type value = tile index (bt % 16 = col, floor(bt/16) = row).

UV formula: `[col/16, 1-(row+1)/16, 1/16, 1/16]` — note the Y-flip since canvas is top-down but UV is bottom-up.

In World.tsx, vertex colors are set to `(lightFactor, lightFactor, lightFactor)` — grayscale only. The actual block color comes from the texture atlas. MeshLambertMaterial multiplies vertexColors × texture, giving correct face shading on top of pixel art.

**Why:** Separating lighting (vertex) from color (texture) lets the atlas encode any pixel pattern per block without needing per-vertex color baking.

**How to apply:** Always use `magFilter: NearestFilter, minFilter: NearestFilter` on the atlas texture to keep the pixelated look sharp. Atlas is built once and cached in `_atlas` singleton.
