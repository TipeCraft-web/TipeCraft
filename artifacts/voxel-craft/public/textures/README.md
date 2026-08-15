# VoxelCraft texture pack

All editable textures live here:

- `blocks/` contains three PNGs per block: `GrassTop.png`, `GrassSide.png`, and `GrassDown.png` (same naming scheme for every block). Every block file is exactly **16×16 px**.
- `mobs/` contains one PNG per creature. Every mob file is exactly **64×64 px**.

The included pack uses a warm, matte Minecraft-inspired pixel-art style: crisp nearest-neighbour pixels, chunky 2×2 colour clusters, a restrained palette, gentle highlights, varied colour patches, and no artificial border drawn around each tile. `GrassSide` combines a jagged green cap with a brown dirt face; `GrassTop` and `GrassDown` are separate surfaces.

Keep the existing filenames when swapping an image so the game picks it up without code changes. Use nearest-neighbour scaling and transparent PNGs for glass-like details.