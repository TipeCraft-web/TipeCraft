# Grab Object

Grab an object in the XR scene with IWER emulated controllers or hands. Use the
hand pinch workflow when the user names a hand or pinch. Use the controller
workflow otherwise.

Use the user's request to identify the target object and optional destination.
After you select the controller or hand workflow, do not use steps from the
other workflow.

## Calling the runtime tools

The operation names in this reference (for example `ecs_pause`, `xr_select`,
`scene_get_hierarchy`) are IWER runtime operations. In Replit Agent they are
exposed as MCP callbacks named `mcpIwsdkRuntime_<camelCaseOperation>`, so
`ecs_pause` is called as `mcpIwsdkRuntime_ecsPause` and `xr_select` as
`mcpIwsdkRuntime_xrSelect`. The active MCP catalog can add a collision suffix;
use the callback it lists for the matching operation. For `browser_screenshot`,
use the screenshot tool available in the current environment.

## Required Core

These steps always execute in order. A grab cannot succeed without them.

### Step 1: Enter XR

Check session status. If not in an active XR session, accept and enter.

```
xr_get_session_status → if not sessionActive → xr_accept_session
```

### Step 2: Locate the target

Find the object by name in the scene hierarchy. Use `scene_get_hierarchy` and match against the target in the user's request.

```
scene_get_hierarchy → find node matching the target name
```

If the object is not found, report the available named objects and stop.

### Step 3: Get its transform

Get the object's world position using its UUID from step 2.

```
scene_get_object_transform(uuid) → use positionRelativeToXROrigin
```

## Controller Grab Workflow

Use this workflow unless the user asks to use a hand or pinch.

### Step 4: Animate controller to target

Animate the controller to the object's position. Default to `"controller-right"` unless the user specified left.

```
xr_animate_to({
  device: "controller-right",
  position: { x, y, z },
  duration: 0.5,
})
```

### Step 5: Engage grip

OneHandGrabbable and TwoHandsGrabbable are proximity-based and use the **squeeze/grip button (index 1)**, not the trigger.

```
xr_set_gamepad_state({
  device: "controller-right",
  buttons: [{ index: 1, value: 1 }],
})
```

The object is now grabbed. If the user only asked to grab (not move), stop here.

## Controller-Only Optional Extensions

Use these steps only after the controller grab workflow. Do not use them for
hand or pinch requests.

### Step 6: Move to destination

If the user specified a destination position, animate the controller there. If no position was given but the user asked to "move" the object, animate it to in front of the headset.

To find "in front of headset," call `xr_get_transform({ "device": "headset" })`.
Rotate the local offset `(0, -0.2, -0.5)` by the headset rotation, then add it
to the headset position.

```
xr_animate_to({
  device: "controller-right",
  position: { x, y, z },
  duration: 0.5,
})
```

### Step 7: Release grip

Release the squeeze button to drop the object.

```
xr_set_gamepad_state({
  device: "controller-right",
  buttons: [{ index: 1, value: 0 }],
})
```

### Step 8: Return controller

Animate the controller back to its resting position so it's not overlapping the dropped object.

```
xr_animate_to({
  device: "controller-right",
  position: { x: 0.2, y: 1.4, z: -0.3 },
  duration: 0.5,
})
```

Default resting positions: right `(0.2, 1.4, -0.3)`, left `(-0.2, 1.4, -0.3)`.

### Step 9: Verify

Take a screenshot to confirm the result.

```
browser_screenshot
```

## Hand Pinch Workflow

Use this workflow when the user asks to grab with a hand or pinch. Do not use
the controller-only optional extensions above.

1. Select hand tracking with the `mcpIwsdkRuntime_xrSetInputMode` callback from
   the active MCP catalog.
2. Animate `hand-right` or `hand-left` to the target with
   `mcpIwsdkRuntime_xrAnimateTo`.
3. Set the hand pinch value to `1` with `mcpIwsdkRuntime_xrSetSelectValue`.
4. If the user asked only to grab, stop with the pinch held and capture a
   screenshot.
5. If the user asked to move the object, animate the same hand to the requested
   destination. If no destination is given, move the hand in front of the
   headset.
6. If the user asked to release or drop the object, set the hand pinch value to
   `0`. Otherwise, keep the pinch held.
7. Capture a screenshot to verify the requested result.

The active MCP catalog can add a collision suffix to callback names. Use the
callback listed for the matching IWER operation.

## Notes

- **Never use `xr_set_device_state` to move controllers** — it teleports instead of animating, which can break grab state.
- **Never use `xr_select` or trigger (button index 0) for grabs** — OneHandGrabbable/TwoHandsGrabbable respond to squeeze (button index 1).
- **DistanceGrabbable is different** — it uses ray-based selection, not proximity. This reference does not cover DistanceGrabbable.
- If the object lacks a name in the hierarchy, suggest adding `mesh.name = "MyObject"` in code before `createTransformEntity`.
