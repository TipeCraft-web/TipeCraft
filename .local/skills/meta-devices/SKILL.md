---
name: meta-devices
description: Build apps for Meta Quest and Meta Ray-Ban Display. Use for Quest, Horizon OS, IWSDK or WebXR for Quest, Expo or React Native for Quest, Meta Ray-Ban Display, and apps that target both supported devices. Route Quest panel apps to Expo, immersive Quest apps to IWSDK, and Ray-Ban Display apps to web guidance. Ask which device only when the Meta target is unclear. Do not use for generic XR, non-Meta hardware, or non-display Ray-Ban companion apps.
---

# Meta Devices

Identify the target device, select one build path, read only that path's
references, build the app, and complete the final verification. This skill owns
the full workflow; the reference files are not separate skills.

## Scope

Activate for requests that identify supported Meta hardware:

- Meta Quest, Quest 3, Quest 3S, or a Meta headset
- Meta Ray-Ban Display glasses or their viewfinder display
- Horizon OS, Expo, or React Native in a Quest request
- IWSDK, immersive web, or WebXR in a Quest request
- One web app that explicitly targets Quest and Meta Ray-Ban Display

Do not activate for generic VR, XR, spatial, or WebXR requests without a Meta
destination. Do not activate when only Apple Vision Pro or another non-Meta
destination is named. Non-display Ray-Ban companion apps are outside this
skill's supported paths.

## Routing

Identify the requested destination before source devices or comparison devices.
Apply these rules in order:

1. If both Quest and Meta Ray-Ban Display are destinations, select the
   dual-device web path.
2. If Meta Ray-Ban Display or a viewfinder display is the destination, select
   the Ray-Ban Display web path.
3. If the destination is only "Ray-Ban," "Meta glasses," or "Meta smart
   glasses," ask whether it is Meta Ray-Ban Display with a viewfinder.
4. If Meta hardware is named without Quest or glasses, ask whether the target is
   Meta Quest or Meta Ray-Ban Display.
5. If Quest is the destination, ignore devices named only as source or
   comparison context, then use the Quest decision below.
6. Otherwise, do not activate this skill.

For Quest, use IWSDK/WebXR only when the user explicitly asks for an immersive,
WebXR, or clearly 3D experience. Explicit triggers include:

- WebXR, IWSDK, immersive web, immersive, 3D, or spatial
- a 3D world, scene, game, showroom, gallery, or walkthrough
- room-scale interaction, walking or looking around, or 360-degree immersive
  media

Every other Quest request defaults to a 2D React Native app with Expo. "Quest
app," "Quest VR app," and "VR shopping experience for Quest" do not by
themselves request a 3D experience.

Read [build paths](references/build-paths.md) only when the user asks for a
comparison or needs the constraints of each path explained.

## Preserve The Selection Across Project Handoff

In Home, finish routing before handing work to a project. Preserve these four
facts for the project agent:

- **Selected device:** Quest, Meta Ray-Ban Display, or both
- **Selected build path:** Quest Expo, Quest IWSDK/WebXR, Ray-Ban web, or
  dual-device web
- **Activation requirement:** the exact tag value, or "native Expo; no HTML
  activation tag"
- **Destination guidance:** the Meta Devices references the project agent must
  read before building

For `transitionToProject`, state these facts in the assistant response before
calling the callback. The callback has no `prompt` parameter because it moves
this conversation and its context into the project.

For `createNewProject`, copy the facts into `prompt`. The separate project agent
has not seen this conversation. Use this shape:

```text
Build the requested Meta app.
Selected device: <device>
Selected build path: <path>
Activation requirement: <exact value or native Expo exception>
Destination guidance: Read .local/skills/meta-devices/SKILL.md, then read <selected reference paths>. Treat this selection as final and do not ask the device or path questions again.
```

In a project, if the conversation context or project prompt contains an explicit
Meta Devices selection, consume it as final. Do not rerun vague routing or ask
the device question again. Read only the named references and continue building.

## Load The Selected Path

### Quest Expo

Read [Expo](references/quest/expo.md). Read its linked development-loop and
Horizon references only when the selected runtime needs them. Expo is a native
Android/Metro flow and does not generate an HTML document or activation tag.

### Quest IWSDK/WebXR

Read [WebXR](references/quest/webxr.md) and
[IWSDK planning](references/quest/webxr-planning.md). Then read only the
feature references needed for rays, grabbing, UI, physics, or debugging. Read
[device activation](references/device-activation.md) before generating HTML.

### Meta Ray-Ban Display

Read [create a Ray-Ban app](references/ray-ban/create-app.md). Load the UI,
sensor, storage, and performance references only when applicable. Read
[device activation](references/device-activation.md) before generating HTML.

The [simulator workflow](references/ray-ban/simulator.md) is invokable when the
user asks to simulate or preview the glasses experience. It is part of this
skill, not a discoverable skill. Before publishing an app that installed the
simulator, run the [publish workflow](references/ray-ban/publish.md).

### Dual-device Web

Read [device activation](references/device-activation.md),
[Quest WebXR](references/quest/webxr.md), and
[Ray-Ban app creation](references/ray-ban/create-app.md). Build one web app with
a 600x600, D-pad-safe Ray-Ban baseline and progressive Quest enhancements. Use
the combined activation value. Do not stop after the first device match.

## Device Loops

Read [device loops](references/device-loops.md) when running or explaining the
app on hardware. ADB applies to Quest, not Ray-Ban Display.

## Final Verification

Before completion:

1. Run the selected path's type, build, and behavior checks.
2. For every HTML path, build the app and verify the exact activation tag in
   both built output and HTML returned by the running or deployed app. A source
   check alone is insufficient.
3. For Ray-Ban Display, keep the MRBD compatibility tag, 600x600 layout, D-pad
   behavior, performance budget, and favicon requirements.
4. For Quest WebXR, test controller and hand interaction in an IWSDK runtime.
5. For Expo, test the Metro or development-client flow without adding HTML-only
   requirements.
6. If the Ray-Ban simulator is installed, verify that deployment excludes it.

## Routing Examples

**User:** "Build a music player for Quest"
**Route:** Quest Expo. No explicit immersive request.

**User:** "Build a WebXR scene for Quest with a spinning globe"
**Route:** Quest IWSDK/WebXR. WebXR is explicit.

**User:** "Build one web app for both Meta Quest and Meta Ray-Ban Display"
**Route:** Dual-device web. Load both web paths and use the combined activation
value.

**User:** "Build a Ray-Ban app"
**Route:** Ask whether the target is Meta Ray-Ban Display with a viewfinder.

**User:** "Port my Apple Vision Pro WebXR app to Quest 3"
**Route:** Quest IWSDK/WebXR. Quest is the destination; Vision Pro is the source.

**User:** "Build an Xbox 360 game-library app for Quest 3"
**Route:** Quest Expo. "360" is a product name, not immersive media.

**User:** "Build a spatial WebXR app for Apple Vision Pro"
**Route:** Do not activate. No supported Meta destination is named.
