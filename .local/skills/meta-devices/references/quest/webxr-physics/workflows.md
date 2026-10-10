# Physics Workflows

## Common Workflows

### Creating a Dynamic Physics Object

```typescript
import {
  Mesh,
  SphereGeometry,
  MeshStandardMaterial,
  Color,
  FrontSide,
  PhysicsShape,
  PhysicsShapeType,
  PhysicsBody,
  PhysicsState,
  PhysicsManipulation,
} from '@iwsdk/core';

// 1. Create Three.js mesh
const ball = new Mesh(
  new SphereGeometry(0.2),
  new MeshStandardMaterial({ color: new Color(0xff4444), side: FrontSide }),
);
ball.position.set(0, 2, -1);

// 2. Wrap as ECS entity
const entity = world.createTransformEntity(ball);

// 3. Add physics components
entity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Sphere,
  dimensions: [0.2],
  restitution: 0.6, // Bouncy
});
entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });

// 4. Optional: apply initial impulse
entity.addComponent(PhysicsManipulation, { force: [5, 2, 0] });
```

### Creating a Static Environment Collider

For walls, floors, and fixed scenery that block dynamic objects but never move:

```typescript
// Ground plane
const ground = new Mesh(
  new BoxGeometry(10, 0.1, 10),
  new MeshStandardMaterial({ color: 0x888888 }),
);
ground.position.set(0, -0.05, 0);

const groundEntity = world.createTransformEntity(ground);
groundEntity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Box,
  dimensions: [10, 0.1, 10],
  friction: 0.8,
});
groundEntity.addComponent(PhysicsBody, { state: PhysicsState.Static });
```

For complex static geometry (GLTF environments), use `TriMesh` for exact collision:

```typescript
envEntity.addComponent(PhysicsShape, { shape: PhysicsShapeType.TriMesh });
envEntity.addComponent(PhysicsBody, { state: PhysicsState.Static });
```

### Creating a Kinematic Moving Platform

Kinematic bodies are moved by code and push dynamic objects:

```typescript
// Setup
const platform = new Mesh(
  new BoxGeometry(3, 0.2, 3),
  new MeshStandardMaterial({ color: 0x4488ff }),
);

const platformEntity = world.createTransformEntity(platform);
platformEntity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Box,
  dimensions: [3, 0.2, 3],
});
platformEntity.addComponent(PhysicsBody, { state: PhysicsState.Kinematic });

// In a system's update loop, move it:
update(delta, time) {
  for (const entity of this.queries.platforms.entities) {
    entity.object3D.position.y = 1 + Math.sin(time) * 2;
  }
}
```

### Making an Object Grabbable with Physics

Combine grab components with physics for throwable objects:

```typescript
import { Interactable, OneHandGrabbable, DistanceGrabbable } from '@iwsdk/core';

// Physics components
entity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });

// Grab components
entity.addComponent(Interactable);
entity.addComponent(OneHandGrabbable);

// Optional: allow grabbing from a distance
entity.addComponent(DistanceGrabbable, {
  rotate: true,
  translate: true,
});
```

When grabbed, the `PhysicsSystem` automatically detects the `Pressed` component and overrides physics with `HP_Body_SetTargetQTransform`, making the object follow the hand. On release, the object resumes dynamic simulation with natural velocity for realistic throwing.

### Reading Velocity for Game Logic

```typescript
const velocity = entity.getVectorView(PhysicsBody, '_linearVelocity');
const speed = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2);

if (speed > 5.0) {
  // High-speed impact logic
}
```

### Explosion Pattern (Radial Force)

Apply outward force to all nearby physics objects:

```typescript
const explosionPos = bomb.object3D.position;
const radius = 5.0;
const force = 50.0;

for (const target of this.queries.physicsObjects.entities) {
  const dist = target.object3D.position.distanceTo(explosionPos);
  if (dist < radius && dist > 0) {
    const direction = target.object3D.position
      .clone()
      .sub(explosionPos)
      .normalize();
    const strength = force * (1 - dist / radius);
    target.addComponent(PhysicsManipulation, {
      force: direction.multiplyScalar(strength).toArray(),
    });
  }
}
```

## Custom Physics System Pattern

Create domain-specific components that interact with the physics system:

```typescript
import {
  createComponent,
  createSystem,
  Types,
  PhysicsBody,
  PhysicsManipulation,
} from '@iwsdk/core';

// 1. Define custom component
export const Buoyancy = createComponent('Buoyancy', {
  waterLevel: { type: Types.Float32, default: 0.0 },
  buoyancyForce: { type: Types.Float32, default: 15.0 },
});

// 2. Create system that applies physics forces
export class BuoyancySystem extends createSystem({
  floaters: { required: [Buoyancy, PhysicsBody] },
}) {
  update(delta) {
    for (const entity of this.queries.floaters.entities) {
      const waterLevel = entity.getValue(Buoyancy, 'waterLevel');
      const force = entity.getValue(Buoyancy, 'buoyancyForce');
      const y = entity.object3D.position.y;

      if (y < waterLevel) {
        const submersion = Math.min(1, (waterLevel - y) / 0.5);
        if (!entity.hasComponent(PhysicsManipulation)) {
          entity.addComponent(PhysicsManipulation, {
            force: [0, force * submersion, 0],
          });
        }
      }
    }
  }
}

// 3. Register with world
world.registerComponent(Buoyancy);
world.registerSystem(BuoyancySystem, { priority: 5 });
```
