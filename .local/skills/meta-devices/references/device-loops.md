## Getting it onto a device

Each path reaches hardware differently. The two Quest paths can use a headset in
developer mode through `metavr device list` or `adb devices`. The Ray-Ban path
does not use ADB.

| Path | How it reaches the device | Live reload |
| ---- | ------------------------- | ----------- |
| **Quest Expo** | Metro serves a bundle URL; open it in Expo Go or a dev client on the headset. Deep-link it with `metavr adb shell am start -a android.intent.action.VIEW -d "exp://<LAN-IP>:8081"`. If LAN is blocked, start Expo/Metro with `npx expo start --tunnel`, copy the tunnel URL that it prints, and pass that URL to the deep-link command's `-d` argument. | Fast Refresh on save |
| **Quest WebXR** | Deploy to a public HTTPS URL and open it in the Quest browser, **or** tether: `adb reverse tcp:5000 tcp:5000`, then open `http://localhost:5000` (a secure context, so XR launches). | Vite hot reload on save |
| **Ray-Ban Display** | Deploy to a public HTTPS URL. Open on the glasses by scanning a QR code, or share the link through the Meta AI companion app on the paired phone. | Redeploy |

**Tethering is the edit loop.** The laptop runs the dev server and the headset
points back at it over USB — `adb reverse` for WebXR, a Metro bundle URL for
RN/Expo. Deploying to a public URL is for sharing and for the final demo, not for
iteration.

**WebXR needs a secure context.** A raw `http://<LAN-IP>:5000` will not enter XR.
Use HTTPS, or `localhost` via `adb reverse` — browsers treat `localhost` as
trusted.

**No headset available?** Quest WebXR has a headless XR emulator driven from the
terminal: `npx iwsdk xr enter`, `npx iwsdk xr look-at`, `npx iwsdk xr select`,
`npx iwsdk scene hierarchy`, `npx iwsdk ecs find`. An agent can verify a whole
scene, including all four building blocks, with no device attached. Quest Expo
needs either a device or the Meta Spatial Simulator. Ray-Ban Display can use the
[browser simulator](ray-ban/simulator.md).
