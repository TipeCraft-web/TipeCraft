# React Native on Meta Quest with Expo

Build React Native apps for Meta Quest / Horizon OS using Expo — the tooling Meta
recommends for React Native on Quest. This reference focuses on the **development
loop**: get your JS running on the headset and iterating with live reload, then
graduate to a full Quest development build when you need native Horizon features.

**Tools this workflow uses:** file reads plus the shell commands `npx`, `npm`,
`yarn`, `expo`, `metavr`, and `hzdb`. Everything below is plain shell — run it
however your coding agent runs commands.

A Quest RN app renders as a **2D panel** in Horizon OS. This is Android app
development, so the headset-setup, ADB, and device basics live in other skills —
this reference links to them instead of repeating them (see
[`hz-new-project-creation`](https://raw.githubusercontent.com/meta-quest/agentic-tools/main/skills/hz-new-project-creation/SKILL.md) for developer-mode
and dashboard setup, [`metavr-cli`](https://raw.githubusercontent.com/meta-quest/agentic-tools/main/skills/metavr-cli/SKILL.md) for device/ADB
commands, and [`portal`](https://raw.githubusercontent.com/meta-quest/agentic-tools/main/skills/portal/SKILL.md) for the Android build toolchain).

## Two ways to run on the headset

There are two runtimes, and picking the right one is the most important decision.
Both load a JS **bundle URL** from a Metro dev server and Fast-Refresh on save;
they differ in what native code is available.

| | **Expo Go** (fastest loop) | **Development build** (full control) |
|---|---|---|
| What it is | Prebuilt app from the Horizon Store | A dev client *you* build, with your native config |
| Install | One tap from the Store (link below) | `npx expo run:android --variant questDebug` |
| Loads a bundle URL | Yes | Yes |
| Live Fast Refresh | Yes | Yes |
| `expo-horizon-core` config (App ID, panel size) | ❌ not applied (prebuild-time) | ✅ applied |
| Horizon-forked native libs / custom native modules | ❌ | ✅ |
| Best for | Pure-JS + standard Expo module iteration | Real Quest apps: App ID, panel size, notifications, location, IAP |

**Rule of thumb:** start in **Expo Go** for the tightest UI/logic loop, then move
to a **development build** the moment you add `expo-horizon-core`, a Horizon-forked
library, or any custom native module. The dev build is *also* a dev client, so the
bundle-URL + Fast-Refresh loop is identical — you just rebuild native occasionally.

## Prerequisites

- **Headset in developer mode**, USB (or Wi-Fi) debugging on, and visible to
  `metavr device list`. Full walkthrough: [`hz-new-project-creation`](https://raw.githubusercontent.com/meta-quest/agentic-tools/main/skills/hz-new-project-creation/SKILL.md)
  and [`metavr-cli`](https://raw.githubusercontent.com/meta-quest/agentic-tools/main/skills/metavr-cli/SKILL.md).
- **Node.js 20+**, and the Expo CLI via `npx expo` (no global install needed).
- **metavr** for device/ADB/screenshots/logs: `npx -y metavr --version`.

Verify the device first:

```bash
metavr device list          # or: npx -y metavr device list
```

## Path A — Fast loop with Expo Go + a bundle URL

The quickest way to see your app on the headset. Nothing to build.

### 1. Install Expo Go on the headset

Open the Meta Horizon Store on the Quest (or the web store) and install **Expo Go**:

> https://www.meta.com/experiences/expo-go/25322546364000780/

You can also open that link in the Meta Horizon phone app or on the web and click
**Install** to push it to your headset.

### 2. Start the Metro dev server (bundle URL)

In your Expo project on your dev machine:

```bash
npx expo start                 # Metro on :8081; prints a QR + an exp:// bundle URL
# If the headset is on a different network / LAN is blocked:
npx expo start --tunnel        # bundle URL over the internet (exp://...exp.direct)
```

Metro prints a **bundle URL** like `exp://<LAN-IP>:8081` (LAN) or an
`exp://<id>.exp.direct` URL (tunnel). That URL is what Expo Go loads.

### 3. Open the bundle URL in Expo Go

Three ways, easiest first:

- **Deep-link it (no typing)** — routes straight to Expo Go:
  ```bash
  metavr adb shell am start -a android.intent.action.VIEW -d "exp://<LAN-IP>:8081"
  ```
- **Type it in Expo Go** — launch Expo Go on the headset, choose **Enter URL
  manually**, and type the `exp://…` URL with the controller keyboard.
- **Scan the QR** — if you have Expo Go / the camera handy.

### 4. Edit and watch it live

Save a file → **Fast Refresh** repaints the headset with no reload. Press `r` in
the Metro terminal (or use the in-app dev menu) for a full reload. This is the
"automatic updates / live display of changes" loop — the headset is just another
preview surface, like a browser tab for the web.

**Expo Go caveats** (details in [the development loop](expo-dev-loop.md)):

- **SDK must match.** Expo Go runs only projects whose Expo SDK matches the
  installed Expo Go. Upgrade the project to that SDK, then run
  `npx expo install --fix`, or install a matching Expo Go build.
- **Config-plugin settings don't apply.** `horizonAppId`, panel size, product
  flavors, etc. are prebuild-time and are ignored in Expo Go.
- **No Horizon-forked/custom native modules.** Use a development build (Path B).

## Path B — Full setup with expo-horizon-core (development build)

Use this for real Quest apps: it sets your Horizon App ID, panel size, and gives
you the Horizon-forked native libraries. The result is a **development build** — a
dev client you install once that then loads bundle URLs and Fast-Refreshes exactly
like Expo Go, but with your native config baked in.

### 1. Add and configure the development client

```bash
npx expo install expo-dev-client
npm install expo-horizon-core     # or: yarn add expo-horizon-core
```

Add the config plugin to `app.json` (or `app.config.js`/`.ts`):

```json
{
  "expo": {
    "plugins": [
      ["expo-horizon-core", {
        "horizonAppId": "DEMO_APP_ID",
        "defaultHeight": "640dp",
        "defaultWidth": "1024dp",
        "supportedDevices": "quest2|quest3|quest3s",
        "disableVrHeadtracking": false,
        "orientation": "default"
      }]
    ]
  }
}
```

Get a real `horizonAppId` from the developer dashboard
(https://developers.meta.com). Full option reference and gotchas:
[the Horizon Core setup](expo-horizon-core.md).

### 2. Prebuild and wire up product flavors

`expo-horizon-core` uses Android **product flavors** so one project builds for both
Quest and mobile:

Before using `--clean`, inspect `android/`, `ios/`, and `git status`. Use it only
when the native directories are absent or fully generated and all work is
committed. If the app contains hand-maintained native code, run
`npx expo prebuild` without `--clean` and review the native diff. Alternatively,
follow the project's existing native workflow.

```bash
npx expo prebuild --clean
```

Add build scripts to `package.json`:

```json
{
  "scripts": {
    "quest": "expo run:android --variant questDebug",
    "quest:release": "expo run:android --variant questRelease",
    "android": "expo run:android --variant mobileDebug",
    "android:release": "expo run:android --variant mobileRelease"
  }
}
```

### 3. Build, install, and run the dev client

With the headset connected:

```bash
yarn quest        # builds the questDebug dev client, installs it, starts Metro,
                  # and the app auto-connects to the bundle URL + Fast Refreshes
```

After the first build, JS edits Fast-Refresh with no rebuild. The dev client's
launcher screen also lets you **enter or scan a bundle URL** manually — the same
loop as Expo Go, for your custom client. Rebuild native only when native deps or
config change (see [the development loop](expo-dev-loop.md)).

### 4. Horizon-forked libraries

A few libraries need Quest-specific forks; guard platform-specific code with
`isHorizonDevice()` from `expo-horizon-core`. Covered in
[the Horizon libraries reference](expo-libraries.md):

- `expo-horizon-location` — location (Quest has no GPS; limited)
- `expo-horizon-notifications` — user notifications
- `expo-iap` — in-app purchases via the Meta Horizon Billing SDK

## Driving the loop with an agent

For an autonomous edit loop, use metavr as the feedback oracle (see
[`metavr-cli`](https://raw.githubusercontent.com/meta-quest/agentic-tools/main/skills/metavr-cli/SKILL.md) and [`hz-vr-debug`](https://raw.githubusercontent.com/meta-quest/agentic-tools/main/skills/hz-vr-debug/SKILL.md)):

```bash
metavr log --tag ReactNative        # Metro/JS logs + red-box errors
metavr capture screenshot -o screen.png
```

Compile errors surface in the Metro terminal and as an on-device red box; a
missing dependency shows up as a bundling `500`.

## Publishing

A questRelease build is a normal signed Android app (APK/AAB). Package it, then
submit to the Meta Horizon Store — see [`hz-store-submit`](https://raw.githubusercontent.com/meta-quest/agentic-tools/main/skills/hz-store-submit/SKILL.md)
for the end-to-end submission flow and `ovr-platform-util` upload. For
production over-the-air JS updates to installed builds, use **EAS Update** (out of
scope for the dev loop).

## Gotchas

- **Expo Go SDK mismatch** is the #1 failure — a confusing device-side error.
  Upgrade the `expo` package to the SDK in Expo Go and then run
  `npx expo install --fix`, or install the Expo Go build for the project's SDK.
- **Expected too much from Expo Go** — config-plugin settings and Horizon-forked
  native libs need a development build (Path B). If the panel size or App ID
  "doesn't take", you're in Expo Go.
- **LAN can't reach the headset** — use `npx expo start --tunnel`.
- **Fast Refresh loads but doesn't update** — the bundle can load while the HMR
  socket fails; confirm the URL scheme/host and see
  [the development loop](expo-dev-loop.md).
- **Wrong flavor** — `mobileDebug` installs a phone build that won't behave as a
  Quest panel; use `questDebug`/`questRelease` for the headset.
- **Package name is permanent** — set `com.company.app` before the first install;
  changing it later causes reinstalls/data loss.

## References

- [Development loop](expo-dev-loop.md) — bundle URLs (LAN vs tunnel),
  deep-linking, Fast Refresh, SDK matching, Expo Go vs dev-build capabilities, and
  troubleshooting.
- [Horizon Core setup](expo-horizon-core.md) —
  full config-plugin options, `expo prebuild`, product flavors, and build scripts.
- [Horizon libraries](expo-libraries.md) — the
  Horizon-forked libraries, `isHorizonDevice()`, and unsupported deps/permissions.

### External docs

- Getting started with React Native apps on Meta Horizon OS —
  https://developers.meta.com/horizon/documentation/android-apps/react-native-apps
- React Native for Meta Horizon OS (full reference) —
  https://oss.callstack.com/react-native-meta-horizon-os/docs/
- `expo-horizon-core` — https://www.npmjs.com/package/expo-horizon-core
- Expo development builds — https://docs.expo.dev/develop/development-builds/introduction/
