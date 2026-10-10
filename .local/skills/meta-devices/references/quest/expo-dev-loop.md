# Dev Loop: Bundle URLs, Fast Refresh, and Troubleshooting

How to get a JS bundle onto the headset and iterate with live reload — for both
Expo Go and a development build.

## Contents

- [The bundle URL](#the-bundle-url)
- [LAN vs tunnel](#lan-vs-tunnel)
- [Opening the URL on the headset](#opening-the-url-on-the-headset)
- [Fast Refresh and reloads](#fast-refresh-and-reloads)
- [Expo Go SDK matching](#expo-go-sdk-matching)
- [Expo Go vs development build capabilities](#expo-go-vs-development-build-capabilities)
- [Troubleshooting](#troubleshooting)

## The bundle URL

`npx expo start` runs a **Metro** dev server (default port `8081`) that serves the
Expo **manifest**, the JS **bundle**, assets, and the Fast-Refresh WebSocket.

Expo Go uses an `exp://` URL:

- LAN: `exp://<LAN-IP>:8081`
- Tunnel: `exp://<id>.exp.direct`

A development build uses its app-specific scheme. Start Metro with
`npx expo start --dev-client` and use the URL that it prints:

```text
exp+my-app://expo-development-client/?url=http%3A%2F%2F192.168.1.2%3A8081
```

Do not open an `exp://` URL for a development build. Android routes that scheme
to Expo Go, which cannot load custom Horizon native modules.

## LAN vs tunnel

- **Same Wi-Fi (fastest):** run `npx expo start` for Expo Go or
  `npx expo start --dev-client` for a development build. The headset and dev
  machine must be on the same reachable network.
- **Different network / corporate Wi-Fi / client isolation:** add `--tunnel` to
  the command for the selected runtime. Use `npx expo start --tunnel` for Expo Go
  or `npx expo start --dev-client --tunnel` for a development build.
- Force a mode with `--host lan|tunnel|localhost`.

## Opening the URL on the headset

Easiest first:

1. **Deep-link Expo Go (no typing)** — fire a standard Android VIEW intent:
   ```bash
   metavr adb shell am start -a android.intent.action.VIEW -d "exp://<LAN-IP>:8081"
   # tunnel: -d "exp://<id>.exp.direct"
   ```
2. **Deep-link a development build** — start Metro with `--dev-client`, copy its
   complete app-specific URL, and pass that URL unchanged:
   ```bash
   metavr adb shell am start -a android.intent.action.VIEW -d "<printed-development-client-url>"
   ```
3. **Type it in the app** — use the URL printed for that runtime. Expo Go uses
   `exp://`; a development build uses `exp+<app-scheme>://`.
4. **Scan the QR** — from the Metro terminal, if convenient.

## Fast Refresh and reloads

- **Fast Refresh** — save a `.js`/`.ts`/`.tsx` file and Metro pushes the change;
  the headset repaints while keeping component state. This is the live loop.
- **Full reload** — press `r` in the Metro terminal, or open the on-device dev menu
  (shake gesture / long-press, or `metavr adb shell input keyevent 82` for the menu)
  and choose Reload.
- **Bundle status as an oracle** — `GET http://<host>:8081/index.bundle?platform=android`
  returns `200` when it compiles, or `500` with the exact file/line when it doesn't
  (useful for an agent loop). A missing dependency shows up here.

## Expo Go SDK matching

Expo Go ships a **fixed native runtime for one Expo SDK**. It will only load a
project whose Expo SDK matches. Symptoms of a mismatch are a confusing device-side
error on load.

- Upgrade the project to the SDK that the installed Expo Go supports. For
  example, run `npm install expo@^54.0.0`, then `npx expo install --fix` for SDK 54.
- Or install the Expo Go build that matches the project's current SDK.

`npx expo install --fix` only aligns dependencies with the SDK already declared
by the project. It does not upgrade the Expo SDK.

A development build has no such constraint — it embeds your project's exact SDK.

## Expo Go vs development build capabilities

| Capability | Expo Go | Development build |
|---|---|---|
| Standard Expo SDK modules | ✅ (those bundled in Expo Go) | ✅ |
| `expo-horizon-core` config (App ID, panel size, flavors) | ❌ prebuild-time | ✅ |
| Horizon-forked native libs (`expo-horizon-location`, …) | ❌ | ✅ |
| Custom native modules | ❌ | ✅ |
| Rebuild needed for native changes | n/a | Yes (JS changes still Fast-Refresh) |

Only rebuild the dev client (`yarn quest`) when native dependencies or config
change. Pure-JS changes never need a rebuild.

## Troubleshooting

- **Headset can't reach Metro** — LAN blocked or different network. Use
  `npx expo start --tunnel`.
- **Bundle loads but Fast Refresh doesn't land** — the HMR WebSocket (`/hot`) isn't
  connecting even though the bundle downloaded. Confirm that the machine's
  firewall allows `:8081` and that you opened the latest URL for the correct
  runtime. Expo Go uses `exp://`; a development build uses its app-specific
  `exp+<app-scheme>://` URL. Bundle loading ≠ Fast Refresh working.
- **`Cannot find module 'babel-preset-expo'`** — add it as an explicit dev
  dependency on newer SDKs: `npx expo install babel-preset-expo`.
- **App opens the wrong flavor** — `mobileDebug` won't behave as a Quest panel;
  install `questDebug`.
- **Screenshot is black** — VR compositors return black to `adb screencap`; use
  `metavr capture screenshot` or an in-headset recording for panels that composite.
- **Nothing in `metavr device list`** — re-check developer mode / USB debugging;
  try a data-capable cable or `metavr device connect <ip>`. See `metavr-cli`.
