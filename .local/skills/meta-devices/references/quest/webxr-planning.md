# Meta Quest IWSDK Planner

Use this reference before you add or change a Meta Quest IWSDK feature. Read the
relevant section of [the IWSDK API guide](iwsdk-api.md) before you write code.

## Planning Workflow

1. Identify the target session mode: browser, VR, or AR.
2. Select only the features the experience uses.
3. Confirm each selected feature has its required scene setup.
4. Define components, queries, systems, inputs, assets, and cleanup behavior.
5. Define the validation steps for browser and XR modes.

## Architecture Rules

- Use ECS queries instead of storing entity arrays or entity references.
- Subscribe to query lifecycle changes. Do not poll for state changes.
- Use signals for shared reactive state. In frame updates, use `peek()`.
- Use `World.create` and `createTransformEntity` for scene entities.
- Import Three.js classes from `@iwsdk/core`, not `three`.
- Use `AssetManifest` and `AssetManager`, not raw loaders.
- Allocate temporary vectors and other values in `init`, not `update`.
- Add cleanup functions for every subscription.
- Use `entity.dispose()` when the entity owns GPU-backed resources.

## Feature Prerequisites

| Feature | Required setup |
| --- | --- |
| Locomotion | `LocomotionEnvironment` or physics collision geometry |
| Physics | `PhysicsBody` and `PhysicsShape` on participating entities |
| Grabbing | A grabbable component on an interactive entity |
| Scene understanding | An AR session mode |
| Environment raycast | AR hit-test support |
| Spatial UI | Compiled UIKitML configuration |

## Performance

- Target 72 to 90 FPS, with 11 to 14 milliseconds per frame.
- Do not allocate, create subscriptions, or use reactive `.value` reads in `update`.
- Use query filters to limit per-frame work.
- Use worker-backed physics and locomotion for scenes that need them.

## Follow-Up Skills

- [Grabbing](webxr-grab.md) for proximity grabs and hand pinch.
- [Rays](webxr-ray.md) for controller-ray interactions and distance grabs.
- [UI](webxr-ui.md) for UIKitML and panel work.
- [Physics](webxr-physics.md) for physical objects and collisions.
- [Debugging](webxr-debug.md) for frame-by-frame runtime investigation.
