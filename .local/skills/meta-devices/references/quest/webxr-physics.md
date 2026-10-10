# Meta Quest IWSDK Physics System Guide

This reference provides the workflow for implementing Havok-powered physics simulation in IWSDK applications. Physics is built on three ECS components (`PhysicsBody`, `PhysicsShape`, `PhysicsManipulation`) orchestrated by the `PhysicsSystem`.

## Enabling Physics

Enable physics in `World.create` with the `physics` feature flag:

```typescript
import { World, SessionMode } from '@iwsdk/core';

const world = await World.create(container, {
  xr: { sessionMode: SessionMode.ImmersiveVR },
  features: {
    physics: true,
    grabbing: true, // Required if physics objects should be grabbable
    locomotion: true, // Requires collision geometry in the scene
  },
  level: './glxf/Composition.glxf',
});
```

Setting `physics: true` automatically registers `PhysicsBody`, `PhysicsShape`, `PhysicsManipulation` components and the `PhysicsSystem` at priority `-2`.

**Only enable physics when needed.** If no objects require dynamic simulation, omit it to avoid overhead.

## Component References

Read [the component reference](webxr-physics/components.md) when configuring `PhysicsBody`, `PhysicsShape`, or `PhysicsManipulation`.
It contains the property defaults, state and shape choices, dimensions, and force lifecycle.

## Common Workflows

Read [the workflow examples](webxr-physics/workflows.md) for the physics behavior you are implementing:

- Dynamic objects, static colliders, or kinematic platforms.
- Grabbable physics objects or velocity-based game logic.
- Radial forces or a custom buoyancy system.

## Material Tuning Guide

Adjust `density`, `restitution`, and `friction` on `PhysicsShape` to simulate different materials:

Density is in **kg/m^3**. The value is passed to Havok unscaled, so use SI
values instead of the g/cm^3 figures common in material tables.

| Material    | Density (kg/m^3) | Restitution | Friction |
| ----------- | ---------------- | ----------- | -------- |
| Foam/Light  | 50               | 0.1         | 0.6      |
| Wood        | 600              | 0.3         | 0.5      |
| Ice         | 900              | 0.1         | 0.05     |
| Bouncy ball | 1000             | 0.95        | 0.5      |
| Rubber      | 1100             | 0.8         | 0.9      |
| Concrete    | 2400             | 0.1         | 0.7      |
| Metal/Steel | 7800             | 0.2         | 0.4      |

The default `density: 1.0` is nominal unit density, not a realistic material.
Choose one convention per scene: set SI density explicitly on every dynamic
body, especially when using `applyImpulse` or `applyForce`, or use relative
values consistently when only gravity and collisions affect the scene.

## System Priority Order

Physics runs in a carefully orchestrated sequence:

```
Priority -5: LocomotionSystem  (Player movement)
Priority -4: InputSystem       (Controller/hand input)
Priority -3: GrabSystem        (Grab interactions)
Priority -2: PhysicsSystem     (Physics simulation)
Priority -1: SceneUnderstanding (AR plane/mesh updates)
```

Register custom physics-related systems after the built-in PhysicsSystem (priority > -2) to read updated transforms:

```typescript
world.registerSystem(MyPhysicsLogicSystem, { priority: 5 });
```

## PhysicsSystem Configuration

The system accepts a `gravity` config (defaults to Earth gravity):

```typescript
import { PhysicsSystem } from '@iwsdk/core';

const physicsSystem = world.getSystem(PhysicsSystem);
physicsSystem.config.gravity.value = [0, -9.81, 0]; // Earth gravity (default)
physicsSystem.config.gravity.value = [0, -1.62, 0]; // Moon gravity
physicsSystem.config.gravity.value = [0, 0, 0]; // Zero gravity
```

## GLXF / Editor Configuration

Physics components can be configured declaratively in GLXF scene files (exported by Meta Spatial Editor):

```json
{
  "com.iwsdk.components.PhysicsShape": {
    "shape": { "alias": "Auto", "value": 6 },
    "dimensions": { "value": [0, 0, 0] },
    "density": { "value": 1.0 },
    "friction": { "value": 0.5 },
    "restitution": { "value": 0.0 }
  },
  "com.iwsdk.components.PhysicsBody": {
    "state": { "alias": "DYNAMIC", "value": 1 },
    "gravityFactor": { "value": 1.0 },
    "linearDamping": { "value": 0.0 },
    "angularDamping": { "value": 0.0 }
  }
}
```

**State enum values in GLXF:**

- `0` = STATIC
- `1` = DYNAMIC
- `2` = KINEMATIC

**Shape enum values in GLXF:**

- `0` = Sphere
- `1` = Box
- `2` = Cylinder
- `3` = Capsules
- `4` = ConvexHull
- `5` = TriMesh
- `6` = Auto

## Troubleshooting

**Objects fall through the floor:**

- Ensure the floor entity has both `PhysicsShape` and `PhysicsBody` with `state: PhysicsState.Static`
- Verify the shape type and dimensions match the visual geometry
- If the `Auto` or `ConvexHull` is selected for the PhysicsShape of static objects, try to change into `TriMesh`
- Check that `physics: true` is set in `World.create` features

**Objects don't move:**

- Confirm `state` is `PhysicsState.Dynamic` (not Static or Kinematic)
- Check `gravityFactor` is > 0
- Verify both `PhysicsShape` and `PhysicsBody` are added (both are required)

**Objects are too bouncy or slide too much:**

- Lower `restitution` to reduce bouncing (0 = no bounce)
- Increase `friction` to reduce sliding (0.8+ for grippy surfaces)

**Objects move too slowly or feel sluggish:**

- Reduce `linearDamping` (0 = no air resistance)
- Check `density` is not too high (high density = heavy = resists force)

**Poor frame rate with many physics objects:**

- Use simpler shape types (Sphere/Box instead of ConvexHull/TriMesh)
- Use `TriMesh` only for static objects
- Explicitly set shape types instead of `Auto` to avoid detection overhead
- Reduce the number of dynamic bodies; make non-essential objects static

**Grabbed object doesn't follow hand:**

- Ensure `grabbing: true` in features
- Verify the entity has `Interactable` and a grabbable component (`OneHandGrabbable`, `TwoHandsGrabbable`, or `DistanceGrabbable`)

**PhysicsManipulation has no effect:**

- The entity must have a `PhysicsBody` with an active engine body (`_engineBody != 0`)
- The component is auto-removed after one frame; re-add it for sustained effects
- Force values may need to be larger; they are scaled by frame delta time

## Performance Tips

1. **Use primitive shapes** (Sphere, Box, Cylinder) over ConvexHull/TriMesh whenever acceptable
2. **Use `PhysicsState.Static`** for all non-moving objects; static bodies have zero simulation cost
3. **Explicitly set shape types** in production; avoid `Auto` detection overhead
4. **Minimize dynamic body count** -- each dynamic body requires per-frame transform sync
5. **Use damping** to settle objects faster and reduce ongoing simulation work
6. **TriMesh is for static only** -- it is computationally expensive and should never be used on dynamic bodies

## Complete Example: Physics Playground

Read [the complete playground example](webxr-physics/playground.md) when combining a static floor, a grabbable ball, and a box with an initial impulse.
