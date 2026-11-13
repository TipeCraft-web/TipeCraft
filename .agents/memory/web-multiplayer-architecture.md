---
name: Web multiplayer architecture
description: Durable decision for TipeCraft multiplayer connection and world simulation.
---

TipeCraft multiplayer uses six-digit join codes. The server mediates connection setup only; world simulation and gameplay state stay on players' devices and are exchanged peer-to-peer.

**Why:** The user explicitly wanted world simulation to stay off the app server and chose the six-digit signaling option.

**How to apply:** Keep world generation and gameplay simulation local. Use signaling only to establish peer connections; any future relay should transport packets without simulating or storing the world.
